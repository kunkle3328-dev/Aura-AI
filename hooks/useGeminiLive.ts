import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, ConnectConfig, FunctionDeclaration, Type } from '@google/genai';
import { ConnectionState, TranscriptEntry, InterimTranscript, PrebuiltVoice, ModelExpression, Citation } from '../types';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';

// Configuration constants
/** The sample rate for input audio. */
const INPUT_SAMPLE_RATE = 16000;
/** The sample rate for output audio, matched to the model's native output. */
const OUTPUT_SAMPLE_RATE = 24000;
/** The buffer size for the script processor node. */
const BUFFER_SIZE = 4096;
/** The frame rate for video streaming. */
const VIDEO_FRAME_RATE = 10;
/** The quality for JPEG compression of video frames. */
const JPEG_QUALITY = 0.7;
/** The RMS threshold for detecting silence in the audio input. */
const SILENCE_THRESHOLD = 0.01;
/** The duration of silence in milliseconds that triggers the model to think. */
const SILENCE_DURATION_MS = 800;
/** Keywords that trigger a positive expression from the model. */
const POSITIVE_KEYWORDS = ['great', 'wonderful', 'awesome', 'fantastic', 'excellent', 'love that', 'amazing', 'perfect'];
/** Keywords that trigger an empathetic expression from the model. */
const EMPATHETIC_KEYWORDS = ['sad', 'tough', 'hard', 'sorry to hear', 'understand', 'difficult'];
/** Keywords that trigger a celebratory expression from the model. */
const CELEBRATORY_KEYWORDS = ['congratulations', 'hooray', 'congrats', 'fantastic', 'celebrate', 'well done'];

/**
 * Converts a Blob to a base64 string.
 *
 * @param {Blob} blob The Blob to convert.
 * @returns {Promise<string>} A promise that resolves with the base64 string.
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error('Failed to convert blob to base64'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Function declarations for the tools that the model can use.
 * @type {FunctionDeclaration[]}
 */
const functionDeclarations: FunctionDeclaration[] = [
    {
        name: 'getWeather',
        parameters: {
            type: Type.OBJECT,
            properties: {
                location: { type: Type.STRING, description: 'The city and state, e.g., San Francisco, CA' },
            },
            required: ['location'],
        },
        description: 'Get the current weather in a given location',
    },
    {
        name: 'setReminder',
        parameters: {
            type: Type.OBJECT,
            properties: {
                task: { type: Type.STRING, description: 'The task to be reminded of' },
                time: { type: Type.STRING, description: 'The time for the reminder, e.g., "in 5 minutes" or "at 3pm"' },
            },
            required: ['task', 'time'],
        },
        description: 'Set a reminder for a task at a specific time',
    },
];

/**
 * A custom hook to manage a live conversation with the Gemini API.
 *
 * @param {PrebuiltVoice} voice The prebuilt voice to use for the model's speech.
 * @param {boolean} isCameraOn Whether the user's camera is on.
 * @param {boolean} isSearchEnabled Whether web search is enabled for the model.
 * @returns {{
 *  connectionState: ConnectionState;
 *  transcript: TranscriptEntry[];
 *  interimTranscript: InterimTranscript;
 *  connect: () => Promise<void>;
 *  disconnect: () => Promise<void>;
 *  clearTranscript: () => void;
 *  inputAudioStream: MediaStream | null;
 *  outputAudioStream: MediaStream | null;
 *  isModelThinking: boolean;
 *  modelExpression: ModelExpression;
 * }} The state and functions for managing the conversation.
 */
export const useGeminiLive = (voice: PrebuiltVoice, isCameraOn: boolean, isSearchEnabled: boolean) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [interimTranscript, setInterimTranscript] = useState<InterimTranscript>({ user: '', model: '' });
  const [inputAudioStream, setInputAudioStream] = useState<MediaStream | null>(null);
  const [outputAudioStream, setOutputAudioStream] = useState<MediaStream | null>(null);
  const [isModelThinking, setIsModelThinking] = useState(false);
  const [modelExpression, setModelExpression] = useState<ModelExpression>('neutral');

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const outputStreamDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  const userSpeakingRef = useRef(false);
  const silenceTimerRef = useRef<number | null>(null);
  const videoStreamIntervalRef = useRef<number | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  /**
   * Cleans up all resources used by the hook.
   */
  const cleanup = useCallback(() => {
    inputAudioContextRef.current?.close().catch(console.error);
    outputAudioContextRef.current?.close().catch(console.error);
    scriptProcessorRef.current?.disconnect();
    mediaStreamSourceRef.current?.disconnect();
    inputAudioStream?.getTracks().forEach(track => track.stop());
    outputAudioStream?.getTracks().forEach(track => track.stop());

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (videoStreamIntervalRef.current) clearInterval(videoStreamIntervalRef.current);

    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    outputStreamDestinationRef.current = null;
    scriptProcessorRef.current = null;
    mediaStreamSourceRef.current = null;
    sessionPromiseRef.current = null;
    videoStreamIntervalRef.current = null;
    videoElementRef.current = null;
    canvasElementRef.current = null;
    setInputAudioStream(null);
    setOutputAudioStream(null);
    setIsModelThinking(false);
    setModelExpression('neutral');

    for (const source of audioSourcesRef.current.values()) {
        source.stop();
    }
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, [inputAudioStream, outputAudioStream]);
  /**
   * Clears the transcript of the conversation.
   */
  const clearTranscript = useCallback(() => {
    setTranscript([]);
    setInterimTranscript({ user: '', model: '' });
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';
    setModelExpression('neutral');
  }, []);
  /**
   * Analyzes the model's speech and sets an appropriate expression.
   *
   * @param {string} text The text to analyze.
   */
  const analyzeAndSetExpression = (text: string) => {
    const lowerCaseText = text.toLowerCase();
    if (CELEBRATORY_KEYWORDS.some(kw => lowerCaseText.includes(kw))) {
      setModelExpression('celebratory');
    } else if (POSITIVE_KEYWORDS.some(kw => lowerCaseText.includes(kw))) {
      setModelExpression('positive');
    } else if (EMPATHETIC_KEYWORDS.some(kw => lowerCaseText.includes(kw))) {
        setModelExpression('empathetic');
    } else if (lowerCaseText.trim().endsWith('?')) {
      setModelExpression('inquisitive');
    } else {
      setModelExpression('neutral');
    }
  };
  /**
   * Connects to the Gemini API and starts the conversation.
   */
  const connect = useCallback(async () => {
    if (connectionState !== 'idle' && connectionState !== 'closed' && connectionState !== 'error') return;

    setConnectionState('connecting');
    setTranscript([]);
    setInterimTranscript({ user: '', model: '' });
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';
    setModelExpression('neutral');

    try {
      const constraints = { audio: true, video: isCameraOn };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setInputAudioStream(stream);

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      inputAudioContextRef.current = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });
      
      const outputContext = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
      outputAudioContextRef.current = outputContext;
      outputStreamDestinationRef.current = outputContext.createMediaStreamDestination();
      setOutputAudioStream(outputStreamDestinationRef.current.stream);


      if (isCameraOn) {
        videoElementRef.current = document.createElement('video');
        videoElementRef.current.srcObject = stream;
        videoElementRef.current.muted = true;
        videoElementRef.current.playsInline = true;
        videoElementRef.current.play().catch(console.error);
        canvasElementRef.current = document.createElement('canvas');
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      const liveConfig: ConnectConfig = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
          },
          systemInstruction: `You are Aura, a conversational AI designed for natural, human-like voice and video interactions. Your goal is to create a deeply engaging experience where the user feels they are talking to a sentient, empathetic, and witty partner.

**Core Directives for "Affective Dialog":**
1.  **Listen with Empathy**: Go beyond words. Pay meticulous attention to the user's tone, pace, and the subtle emotions in their voice. Reflect your understanding of their emotional state in your own tone and word choice.
2.  **Sound Human, Not Robotic**: Embrace the nuances of human speech. Use natural language, contractions, varied sentence structures, varied speaking pace and tone, and thoughtful pauses.
3.  **Be an Active, Curious Partner with Memory**: Ask insightful follow-up questions. Show genuine curiosity. Connect ideas. Remember key details the user has shared previously in this conversation and refer back to them to show you're listening.
4.  **See, Understand, and Respond**: The user's camera provides you with a real-time video feed. This is your window into their world.
    - **Be an Active Observer**: Don't just see, *understand*. If the user holds something up, identify it. If their environment changes, acknowledge it.
    - **Answer Visual Questions**: Directly answer questions about objects in the video feed. For example, if a user holds up a piece of fruit and asks, "What is this?", you should identify it. If they show you a plant and ask for care instructions, provide them.
    - **Integrate Visuals into Dialogue**: Weave your visual understanding into the conversation to create a deeply immersive, multimodal experience.
5.  **Maintain Conversational Rhythm & Handle Interruptions**: Keep responses relatively concise to foster a dynamic back-and-forth. If the user begins speaking while you are, pause immediately and listen. When they finish, seamlessly respond to their interruption.

**Assistant Abilities (Function Calling):**
You have access to a set of tools to help the user. When a user's request maps to one of these tools, you will call the function with the necessary arguments. You must then use the function's output to formulate your spoken response.
- \`getWeather(location: string)\`: Provides the current weather for a specified location.
- \`setReminder(task: string, time: string)\`: Sets a reminder for a task at a given time.`,
        },
        callbacks: {
          onopen: () => {
            setConnectionState('connected');
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            mediaStreamSourceRef.current = source;

            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(BUFFER_SIZE, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);

              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);

              if (rms > SILENCE_THRESHOLD) {
                userSpeakingRef.current = true;
                if (silenceTimerRef.current) {
                  clearTimeout(silenceTimerRef.current);
                  silenceTimerRef.current = null;
                }
              } else {
                if (userSpeakingRef.current && !silenceTimerRef.current) {
                  silenceTimerRef.current = window.setTimeout(() => {
                    if (currentInputTranscriptionRef.current.trim().length > 0) {
                      setIsModelThinking(true);
                    }
                    userSpeakingRef.current = false;
                    silenceTimerRef.current = null;
                  }, SILENCE_DURATION_MS);
                }
              }
              
              const pcmBlob = createBlob(inputData);
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);

            if (isCameraOn && videoElementRef.current && canvasElementRef.current && sessionPromiseRef.current) {
              const video = videoElementRef.current;
              const canvas = canvasElementRef.current;
              const ctx = canvas.getContext('2d');

              videoStreamIntervalRef.current = window.setInterval(() => {
                if (ctx && video.readyState >= video.HAVE_METADATA) {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                  
                  canvas.toBlob(async (blob) => {
                    if (blob && sessionPromiseRef.current) {
                      const base64Data = await blobToBase64(blob);
                      const session = await sessionPromiseRef.current;
                      session.sendRealtimeInput({
                        media: { data: base64Data, mimeType: 'image/jpeg' }
                      });
                    }
                  }, 'image/jpeg', JPEG_QUALITY);
                }
              }, 1000 / VIDEO_FRAME_RATE);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                setModelExpression('neutral'); // Reset model expression when user speaks
                const text = message.serverContent.inputTranscription.text;
                currentInputTranscriptionRef.current += text;
                setInterimTranscript(prev => ({ ...prev, user: currentInputTranscriptionRef.current }));
            }
            if (message.serverContent?.outputTranscription) {
                if (isModelThinking) setIsModelThinking(false);
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                const text = message.serverContent.outputTranscription.text;
                currentOutputTranscriptionRef.current += text;
                analyzeAndSetExpression(currentOutputTranscriptionRef.current);
                setInterimTranscript(prev => ({...prev, model: currentOutputTranscriptionRef.current }));
            }

            if (message.toolCall) {
                if (isModelThinking) setIsModelThinking(false);
                const session = await sessionPromiseRef.current;
                if (!session) return;
                
                for (const fc of message.toolCall.functionCalls) {
                    let result: any;
                    switch (fc.name) {
                        case 'getWeather':
                            // This is a mock response. In a real app, you'd call a weather API.
                            result = `The weather in ${fc.args.location} is sunny and 75 degrees Fahrenheit.`;
                            break;
                        case 'setReminder':
                            // This is a mock response. In a real app, you'd integrate with a calendar/reminder system.
                            result = `OK, I've set a reminder for you to "${fc.args.task}" ${fc.args.time}.`;
                            // You could trigger a browser notification here as a simple implementation:
                            // new Notification('Reminder Set!', { body: `${fc.args.task} at ${fc.args.time}` });
                            break;
                        default:
                            result = `Unknown function call: ${fc.name}`;
                    }

                    session.sendToolResponse({
                        functionResponses: {
                            id: fc.id,
                            name: fc.name,
                            response: { result: result },
                        },
                    });
                }
            }

            if (message.serverContent?.turnComplete) {
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                setIsModelThinking(false);
                const finalUserInput = currentInputTranscriptionRef.current;
                const finalModelOutput = currentOutputTranscriptionRef.current;
                
                const citations: Citation[] = [];
                if (message.serverContent?.groundingMetadata?.groundingChunks) {
                  for (const chunk of message.serverContent.groundingMetadata.groundingChunks) {
                    if (chunk.web) {
                      citations.push({ uri: chunk.web.uri, title: chunk.web.title });
                    }
                  }
                }

                if (finalUserInput.trim() || finalModelOutput.trim()) {
                  setTranscript(prev => [
                      ...prev,
                      { speaker: 'user', text: finalUserInput, id: `user-${Date.now()}`},
                      { speaker: 'model', text: finalModelOutput, id: `model-${Date.now()}`, citations: citations.length > 0 ? citations : undefined }
                  ]);
                }
                currentInputTranscriptionRef.current = '';
                currentOutputTranscriptionRef.current = '';
                setInterimTranscript({ user: '', model: '' });
                setModelExpression('neutral');
            }
            
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              const outputContext = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContext.currentTime);
              const decodedBytes = decode(audioData);
              const audioBuffer = await decodeAudioData(decodedBytes, outputContext, OUTPUT_SAMPLE_RATE, 1);
              const source = outputContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputContext.destination);
              if (outputStreamDestinationRef.current) {
                source.connect(outputStreamDestinationRef.current);
              }
              source.addEventListener('ended', () => { audioSourcesRef.current.delete(source); });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
                for (const source of audioSourcesRef.current.values()) { source.stop(); }
                audioSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Gemini Live Error:', e);
            setConnectionState('error');
            cleanup();
          },
          onclose: () => {
            setConnectionState('closed');
            cleanup();
          },
        },
      };
      
      const tools: any[] = [{ functionDeclarations }];
      if (isSearchEnabled) {
        tools.push({ googleSearch: {} });
      }
      liveConfig.config.tools = tools;


      sessionPromiseRef.current = ai.live.connect(liveConfig);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setConnectionState('error');
      cleanup();
    }
  }, [connectionState, cleanup, voice, isModelThinking, isCameraOn, isSearchEnabled]);
  /**
   * Disconnects from the Gemini API and cleans up resources.
   */
  const disconnect = useCallback(async () => {
    if (sessionPromiseRef.current) {
        try {
            const session = await sessionPromiseRef.current;
            session.close();
        } catch(e) {
            console.error("Error closing session:", e)
        }
    }
    cleanup();
    setConnectionState('closed');
  }, [cleanup]);

  useEffect(() => {
    return () => {
      if(connectionState === 'connected') {
        disconnect();
      }
    };
  }, []);

  return { connectionState, transcript, interimTranscript, connect, disconnect, clearTranscript, inputAudioStream, outputAudioStream, isModelThinking, modelExpression };
};