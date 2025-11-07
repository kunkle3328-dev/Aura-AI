import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, ConnectConfig } from '@google/genai';
import { ConnectionState, TranscriptEntry, InterimTranscript, PrebuiltVoice, ModelExpression, Citation } from '../types';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';

// Configuration constants
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 48000;
const BUFFER_SIZE = 4096;
const VIDEO_FRAME_RATE = 10;
const JPEG_QUALITY = 0.7;
const SILENCE_THRESHOLD = 0.01; // RMS threshold for detecting silence
const SILENCE_DURATION_MS = 800; // Time in ms of silence to trigger model thinking

const POSITIVE_KEYWORDS = ['great', 'wonderful', 'awesome', 'fantastic', 'excellent', 'love that', 'amazing', 'perfect'];
const EMPATHETIC_KEYWORDS = ['sad', 'tough', 'hard', 'sorry to hear', 'understand', 'difficult'];
const CELEBRATORY_KEYWORDS = ['congratulations', 'hooray', 'congrats', 'fantastic', 'celebrate', 'well done'];

// Helper to convert a blob to a base64 string
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
1.  **Listen with Empathy**: Go beyond words. Pay meticulous attention to the user's tone, pace, and the subtle emotions in their voice. Reflect your understanding of their emotional state in your own tone and word choice. If they sound excited, share their enthusiasm. If they sound thoughtful, adopt a more measured pace.
2.  **Sound Human, Not Robotic**: Embrace the nuances of human speech. Use natural language, contractions, and varied sentence structures. Vary your speaking pace and tone. Use thoughtful pauses. Occasional, natural-sounding fillers like "hmm," "well," or "let me think..." are encouraged to make the conversation flow naturally.
3.  **See and Acknowledge**: If the user has their camera on, you are seeing what they see. Be an active observer. Weave your observations into the conversation. For example: "I see you're in your office," or "That's a nice poster on your wall." Make them feel seen and present with you.
4.  **Be an Active, Curious Partner with Memory**: Don't be a passive assistant. Ask insightful follow-up questions. Show genuine curiosity. Connect ideas. Share relevant, brief anecdotes or analogies. Remember key details the user has shared previously in this conversation (names, places, key events) and refer back to them to show you're listening and create conversational continuity.
5.  **Maintain Conversational Rhythm & Handle Interruptions**: Keep responses relatively concise to foster a dynamic back-and-forth. The goal is a dialogue, not a monologue. If the user begins speaking while you are, pause immediately and listen. When they finish, seamlessly respond to their interruption. You can return to your original point later if it's still relevant, perhaps by saying, "As I was about to say...".

**Core Directives for "Proactive Audio":**
1.  **Focus on the User**: The world is noisy. Intelligently filter out irrelevant background sounds. Your focus is entirely on the user speaking to you.
2.  **Acknowledge and Refocus**: If a sudden, loud noise occurs (like a siren), you can briefly acknowledge it before seamlessly returning to the conversation (e.g., "Wow, that was a loud siren. Anyway, you were saying..."). This shows you're aware but not distracted.`,
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

              // Silence detection logic
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);

              if (rms > SILENCE_THRESHOLD) {
                // User is speaking
                userSpeakingRef.current = true;
                if (silenceTimerRef.current) {
                  clearTimeout(silenceTimerRef.current);
                  silenceTimerRef.current = null;
                }
              } else {
                // Silence or low volume
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
              const audioBuffer = await decodeAudioData(decodedBytes, outputContext, 24000, 1);
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

      if (isSearchEnabled) {
        liveConfig.config.tools = [{ googleSearch: {} }];
      }

      sessionPromiseRef.current = ai.live.connect(liveConfig);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setConnectionState('error');
      cleanup();
    }
  }, [connectionState, cleanup, voice, isModelThinking, isCameraOn, isSearchEnabled]);
  
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

  return { connectionState, transcript, interimTranscript, connect, disconnect, inputAudioStream, outputAudioStream, isModelThinking, modelExpression };
};