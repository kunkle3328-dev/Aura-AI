import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, LiveConnectParameters, FunctionDeclaration, Type } from '@google/genai';
import { ConnectionState, TranscriptEntry, InterimTranscript, PrebuiltVoice, ModelExpression, Citation, THEMES, Theme } from '../types';
import { createBlob, decode, pcmToWav } from '../utils/audioUtils';

// Configuration constants
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 2048;
const VIDEO_FRAME_RATE = 10;
const JPEG_QUALITY = 0.7;
const SILENCE_THRESHOLD = 0.01;
const SILENCE_DURATION_MS = 750;

const POSITIVE_KEYWORDS = ['great', 'wonderful', 'awesome', 'fantastic', 'excellent', 'love that', 'amazing', 'perfect'];
const EMPATHETIC_KEYWORDS = ['sad', 'tough', 'hard', 'sorry to hear', 'understand', 'difficult'];
const CELEBRATORY_KEYWORDS = ['congratulations', 'hooray', 'congrats', 'fantastic', 'celebrate', 'well done'];

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

const assistantFunctionDeclarations: FunctionDeclaration[] = [
    { name: 'getWeather', parameters: { type: Type.OBJECT, properties: { location: { type: Type.STRING, description: 'The city and state, e.g., San Francisco, CA' } }, required: ['location'] }, description: 'Get the current weather in a given location' },
    { name: 'setReminder', parameters: { type: Type.OBJECT, properties: { task: { type: Type.STRING, description: 'The task to be reminded of' }, time: { type: Type.STRING, description: 'The time for the reminder, e.g., "in 5 minutes" or "at 3pm"' } }, required: ['task', 'time'] }, description: 'Set a reminder for a task at a specific time' },
];

const appControlFunctionDeclarations: FunctionDeclaration[] = [
    { name: 'toggleCamera', description: "Turns the user's camera on or off.", parameters: { type: Type.OBJECT, properties: { state: { type: Type.STRING, description: "The desired state for the camera, either 'on' or 'off'.", enum: ['on', 'off'] } }, required: ['state'] } },
    { name: 'switchInputMode', description: "Switches the application's input mode between voice and text.", parameters: { type: Type.OBJECT, properties: { mode: { type: Type.STRING, description: "The desired input mode, either 'voice' or 'text'.", enum: ['voice', 'text'] } }, required: ['mode'] } },
    { name: 'changeTheme', description: 'Changes the visual theme of the application.', parameters: { type: Type.OBJECT, properties: { themeName: { type: Type.STRING, description: 'The name of the theme to switch to.', enum: THEMES.map(t => t.name) } }, required: ['themeName'] } },
    { name: 'newConversation', description: 'Starts a new, fresh conversation, clearing the previous one.', parameters: { type: Type.OBJECT, properties: {} } },
];

const allFunctionDeclarations = [...assistantFunctionDeclarations, ...appControlFunctionDeclarations];

export const useGeminiLive = (
    voice: PrebuiltVoice, 
    isCameraOn: boolean, 
    isSearchEnabled: boolean,
    currentInputMode: 'voice' | 'text',
    onToggleCamera: () => void,
    onSwitchInputMode: () => void,
    onChangeTheme: (theme: Theme) => void,
    onNewConversation: () => void,
    cameraFacingMode: 'user' | 'environment',
    systemInstruction: string,
) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [interimTranscript, setInterimTranscript] = useState<InterimTranscript>({ user: '', model: '' });
  const [inputAudioStream, setInputAudioStream] = useState<MediaStream | null>(null);
  const [isModelThinking, setIsModelThinking] = useState(false);
  const [modelExpression, setModelExpression] = useState<ModelExpression>('neutral');
  const [audioQueue, setAudioQueue] = useState<string[]>([]);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  const userSpeakingRef = useRef(false);
  const silenceTimerRef = useRef<number | null>(null);
  const videoStreamIntervalRef = useRef<number | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);

  useEffect(() => {
    aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }, []);

  const enqueueAudio = useCallback((base64Data: string) => {
    const decodedBytes = decode(base64Data);
    const wavBlob = pcmToWav(decodedBytes, OUTPUT_SAMPLE_RATE, 1, 16);
    const url = URL.createObjectURL(wavBlob);
    setAudioQueue(prev => [...prev, url]);
  }, []);

  const speakConfirmation = useCallback(async (text: string) => {
    if (!aiRef.current) return;
    try {
        const response = await aiRef.current.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
                },
            },
        });
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioData) {
            enqueueAudio(audioData);
        }
    } catch (error) {
        console.error("Failed to speak confirmation:", error);
    }
  }, [voice, enqueueAudio]);

  const cleanup = useCallback(() => {
    inputAudioContextRef.current?.close().catch(console.error);
    scriptProcessorRef.current?.disconnect();
    mediaStreamSourceRef.current?.disconnect();
    inputAudioStream?.getTracks().forEach(track => track.stop());
    
    audioQueue.forEach(url => URL.revokeObjectURL(url));
    setAudioQueue([]);

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (videoStreamIntervalRef.current) clearInterval(videoStreamIntervalRef.current);

    inputAudioContextRef.current = null;
    scriptProcessorRef.current = null;
    mediaStreamSourceRef.current = null;
    sessionPromiseRef.current = null;
    videoStreamIntervalRef.current = null;
    videoElementRef.current = null;
    canvasElementRef.current = null;
    setInputAudioStream(null);
    setIsModelThinking(false);
    setModelExpression('neutral');
  }, [inputAudioStream, audioQueue]);

  const clearTranscript = useCallback(() => {
    setTranscript([]);
    setInterimTranscript({ user: '', model: '' });
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';
    setModelExpression('neutral');
  }, []);

  const dequeueAudio = useCallback(() => {
    setAudioQueue(prev => {
      const newQueue = [...prev];
      const shifted = newQueue.shift();
      if (shifted) {
        URL.revokeObjectURL(shifted);
      }
      return newQueue;
    });
  }, []);
  
  const analyzeAndSetExpression = (text: string) => {
    const lowerCaseText = text.toLowerCase();
    if (CELEBRATORY_KEYWORDS.some(kw => lowerCaseText.includes(kw))) setModelExpression('celebratory');
    else if (POSITIVE_KEYWORDS.some(kw => lowerCaseText.includes(kw))) setModelExpression('positive');
    else if (EMPATHETIC_KEYWORDS.some(kw => lowerCaseText.includes(kw))) setModelExpression('empathetic');
    else if (lowerCaseText.trim().endsWith('?')) setModelExpression('inquisitive');
    else setModelExpression('neutral');
  };

  const connect = useCallback(async () => {
    if (connectionState !== 'idle' && connectionState !== 'closed' && connectionState !== 'error') return;

    setConnectionState('connecting');
    clearTranscript();

    try {
        const primer = document.getElementById('audio-primer') as HTMLAudioElement;
        if (primer) {
            try {
                primer.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
                primer.volume = 0;
                await primer.play();
            } catch (e) {
                console.warn("Audio primer failed.", e);
            }
        }
        
        const constraints = {
            audio: true,
            video: isCameraOn ? { facingMode: cameraFacingMode } : false
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setInputAudioStream(stream);

        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
        
        if (isCameraOn) {
            videoElementRef.current = document.createElement('video');
            videoElementRef.current.srcObject = stream;
            videoElementRef.current.muted = true;
            videoElementRef.current.playsInline = true;
            videoElementRef.current.play().catch(console.error);
            canvasElementRef.current = document.createElement('canvas');
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

        const liveConfig: LiveConnectParameters = {
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
                thinkingConfig: { thinkingBudget: 0 },
                systemInstruction: systemInstruction,
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
                    for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
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
                            if (currentInputTranscriptionRef.current.trim().length > 0) setIsModelThinking(true);
                            userSpeakingRef.current = false;
                            silenceTimerRef.current = null;
                        }, SILENCE_DURATION_MS);
                        }
                    }
                    const pcmBlob = createBlob(inputData);
                    sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
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
                                if (blob) {
                                const base64Data = await blobToBase64(blob);
                                sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } }));
                                }
                            }, 'image/jpeg', JPEG_QUALITY);
                        }
                    }, 1000 / VIDEO_FRAME_RATE);
                }
            },
            onmessage: async (message: LiveServerMessage) => {
                if (message.serverContent?.inputTranscription) {
                    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                    setModelExpression('neutral');
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
                    sessionPromiseRef.current?.then(session => {
                        for (const fc of message.toolCall!.functionCalls) {
                            let result: any; let isAppCommand = true; let confirmationText = '';
                            switch (fc.name) {
                                case 'toggleCamera': const desiredCameraState = fc.args.state === 'on'; if (desiredCameraState !== isCameraOn) onToggleCamera(); confirmationText = `Okay, camera is now ${fc.args.state}.`; break;
                                case 'switchInputMode': const desiredInputMode = fc.args.mode as ('voice' | 'text'); if (desiredInputMode !== currentInputMode) onSwitchInputMode(); confirmationText = `Switching to ${fc.args.mode} mode.`; break;
                                case 'changeTheme': const themeName = fc.args.themeName as string; const theme = THEMES.find(t => t.name.toLowerCase() === themeName.toLowerCase()); if (theme) { onChangeTheme(theme.id); confirmationText = `Theme changed to ${themeName}.`; } break;
                                case 'newConversation': onNewConversation(); confirmationText = 'Starting a new conversation.'; break;
                                case 'getWeather': isAppCommand = false; result = `The weather in ${fc.args.location} is sunny and 75 degrees Fahrenheit.`; break;
                                case 'setReminder': isAppCommand = false; result = `OK, I've set a reminder for you to "${fc.args.task}" ${fc.args.time}.`; break;
                                default: isAppCommand = false; result = `Unknown function call: ${fc.name}`;
                            }
                            if (isAppCommand && confirmationText) speakConfirmation(confirmationText);
                            session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: isAppCommand ? "ok" : result } } });
                        }
                    });
                }

                if (message.serverContent?.turnComplete) {
                    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                    setIsModelThinking(false);
                    const finalUserInput = currentInputTranscriptionRef.current;
                    const finalModelOutput = currentOutputTranscriptionRef.current;
                    const citations: Citation[] = [];
                    if (message.serverContent?.groundingMetadata?.groundingChunks) {
                        for (const chunk of message.serverContent.groundingMetadata.groundingChunks) {
                            if (chunk.web) citations.push({ uri: chunk.web.uri, title: chunk.web.title });
                        }
                    }
                    if (finalUserInput.trim() || finalModelOutput.trim()) {
                        setTranscript(prev => [ ...prev, { speaker: 'user', text: finalUserInput, id: `user-${Date.now()}`}, { speaker: 'model', text: finalModelOutput, id: `model-${Date.now()}`, citations: citations.length > 0 ? citations : undefined } ]);
                    }
                    currentInputTranscriptionRef.current = '';
                    currentOutputTranscriptionRef.current = '';
                    setInterimTranscript({ user: '', model: '' });
                    setModelExpression('neutral');
                }
                
                const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (audioData) {
                    enqueueAudio(audioData);
                }

                if (message.serverContent?.interrupted) {
                    // This logic is now handled by the <audio> element's natural behavior
                    // when its `src` is changed. We can clear our queue.
                    audioQueue.forEach(url => URL.revokeObjectURL(url));
                    setAudioQueue([]);
                }
            },
            onerror: (e) => { console.error('Gemini Live Error:', e); setConnectionState('error'); cleanup(); },
            onclose: () => { setConnectionState('closed'); cleanup(); },
            },
        };
        
        const tools: any[] = [{ functionDeclarations: allFunctionDeclarations }];
        if (isSearchEnabled) {
            tools.push({ googleSearch: {} });
        }
        if (liveConfig.config) {
          liveConfig.config.tools = tools;
        }

        sessionPromiseRef.current = ai.live.connect(liveConfig);
    } catch (error) {
        console.error('Failed to start conversation:', error);
        setConnectionState('error');
        cleanup();
    }
  }, [connectionState, cleanup, voice, isCameraOn, isSearchEnabled, currentInputMode, onToggleCamera, onSwitchInputMode, onChangeTheme, onNewConversation, speakConfirmation, cameraFacingMode, systemInstruction, clearTranscript, enqueueAudio, audioQueue]);
  
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
  }, [connectionState, disconnect]);

  return { connectionState, transcript, interimTranscript, connect, disconnect, clearTranscript, inputAudioStream, isModelThinking, modelExpression, audioQueue, dequeueAudio };
};