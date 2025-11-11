import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { useGeminiLive } from './hooks/useGeminiLive';
import { ConversationView } from './components/ConversationView';
import { ControlBar } from './components/ControlBar';
import { AuraIcon, NewConversationIcon, SearchIcon } from './components/icons';
import { PrebuiltVoice, Theme, AvatarState, TranscriptEntry, Citation } from './types';
import { VoiceSelector } from './components/VoiceSelector';
import { VideoFeed } from './components/VideoFeed';
import { ThemeSelector } from './components/ThemeSelector';
import { DevConsoleCore } from './utils/devConsole';
import DevPanel from './components/DevPanel';

const BASE_SYSTEM_INSTRUCTION = `You are Aura...`; // (Content unchanged)

const getSystemInstruction = (config: any) => {
    const personaInstruction = `Your current persona is '${config.persona}'. You must embody this persona.`;
    const toneInstruction = `You must adopt a '${config.tone}' tone for all your responses.`;
    return [personaInstruction, toneInstruction, BASE_SYSTEM_INSTRUCTION].join('\n\n');
};

const App: React.FC = () => {
  const [voice, setVoice] = useState<PrebuiltVoice>('Puck');
  const [theme, setTheme] = useState<Theme>('theme-aetherium-wave');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [devConfig, setDevConfig] = useState(DevConsoleCore.getConfig());
  const inputMode = devConfig.voiceEnabled ? 'voice' : 'text';
  const [textInputValue, setTextInputValue] = useState('');
  const [textTranscript, setTextTranscript] = useState<TranscriptEntry[]>([]);
  const [textChat, setTextChat] = useState<Chat | null>(null);
  const [isTextModelThinking, setIsTextModelThinking] = useState(false);

  // --- New Audio Playback State ---
  const ttsAudioRef = useRef<HTMLAudioElement>(null);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);

  useEffect(() => {
    const unsubscribe = DevConsoleCore.subscribe(setDevConfig);
    return unsubscribe;
  }, []);

  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(theme);
  }, [theme]);

  const {
    connectionState,
    transcript,
    interimTranscript,
    connect,
    disconnect,
    clearTranscript,
    inputAudioStream,
    isModelThinking,
    modelExpression,
    audioQueue,
    dequeueAudio,
  } = useGeminiLive(
    voice, isCameraOn, isSearchEnabled, inputMode,
    handleToggleCamera, handleToggleInputMode, setTheme, handleNewConversation,
    cameraFacingMode, getSystemInstruction(devConfig)
  );

  // --- Robust Audio Queue Playback Logic ---
  useEffect(() => {
    const audioEl = ttsAudioRef.current;
    if (!audioEl) return;

    const processQueue = () => {
      if (audioEl.paused && audioQueue.length > 0) {
        const nextUrl = audioQueue[0];
        audioEl.src = nextUrl;
        audioEl.play().catch(e => {
          console.error("Audio playback failed:", e);
          // If play fails, dequeue the bad URL and the effect will try again.
          dequeueAudio();
        });
      }
    };
    processQueue();
  }, [audioQueue, dequeueAudio]);

  const handleAudioEnded = useCallback(() => {
    dequeueAudio();
  }, [dequeueAudio]);
  
  function handleToggleCamera() {
    if (connectionState === 'idle' || connectionState === 'closed' || connectionState === 'error') {
      setIsCameraOn(prev => !prev);
    }
  }

  function handleToggleCameraFacingMode() {
    if (connectionState === 'idle' || connectionState === 'closed' || connectionState === 'error') {
        setCameraFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    }
  }
  
  function handleNewConversation() {
    if (inputMode === 'voice') {
      if (connectionState === 'connected' || connectionState === 'connecting') disconnect();
      clearTranscript();
    } else {
      setTextTranscript([]);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const newChat = ai.chats.create({
        model: devConfig.model,
        config: { systemInstruction: getSystemInstruction(devConfig), tools: isSearchEnabled ? [{googleSearch: {}}] : undefined },
      });
      setTextChat(newChat);
    }
  }
  
  function handleToggleInputMode() {
    DevConsoleCore.handleCommand('/toggle_voice');
  }

  useEffect(() => {
      if (inputMode === 'text') {
          if (connectionState === 'connected' || connectionState === 'connecting') disconnect();
          clearTranscript();
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
          const newChat = ai.chats.create({
              model: devConfig.model,
              config: { systemInstruction: getSystemInstruction(devConfig), tools: isSearchEnabled ? [{googleSearch: {}}] : undefined },
          });
          setTextChat(newChat);
      } else {
          setTextChat(null);
          setTextTranscript([]);
          setIsTextModelThinking(false);
      }
  }, [inputMode, devConfig.model, devConfig.tone, devConfig.persona, isSearchEnabled, connectionState, disconnect, clearTranscript]);

  const handleToggleSearch = () => {
    if (connectionState === 'idle' || connectionState === 'closed' || connectionState === 'error') {
      setIsSearchEnabled(prev => !prev);
    }
  };
  
  const handleSendTextMessage = async () => {
    if (!textInputValue.trim() || !textChat || isTextModelThinking) return;
    const currentText = textInputValue;
    setTextInputValue('');
    const wasCommand = DevConsoleCore.handleCommand(currentText, (response) => {
        setTextTranscript(prev => [...prev, { speaker: 'model', text: response, id: `system-response-${Date.now()}` }]);
    });
    if (wasCommand) return;
    setTextTranscript(prev => [...prev, { speaker: 'user', text: currentText, id: `user-${Date.now()}` }]);
    setIsTextModelThinking(true);
    try {
        const response = await textChat.sendMessage({ message: currentText });
        const citations: Citation[] = [];
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          for (const chunk of response.candidates[0].groundingMetadata.groundingChunks) {
            if (chunk.web) citations.push({ uri: chunk.web.uri, title: chunk.web.title });
          }
        }
        setTextTranscript(prev => [...prev, { speaker: 'model', text: response.text, id: `model-${Date.now()}`, citations: citations.length > 0 ? citations : undefined }]);
    } catch (error) {
        console.error("Text chat error:", error);
        setTextTranscript(prev => [...prev, { speaker: 'model', text: 'Sorry, I encountered an error. Please try again.', id: `model-error-${Date.now()}` }]);
    } finally {
        setIsTextModelThinking(false);
    }
  };

  const isVoiceConversationIdle = (connectionState === 'idle' || connectionState === 'closed' || connectionState === 'error') && transcript.length === 0 && interimTranscript.user === '' && interimTranscript.model === '';
  const isTextConversationIdle = textTranscript.length === 0;
  const isNewConversationDisabled = inputMode === 'voice' ? isVoiceConversationIdle : isTextConversationIdle;
  const isUserSpeaking = interimTranscript.user.trim().length > 0;
  
  let avatarState: AvatarState = 'idle';
  if (inputMode === 'voice') {
    if (isModelThinking) avatarState = 'thinking';
    else if (isUserSpeaking) avatarState = 'listening';
    else if (isTtsPlaying) avatarState = 'speaking';
  } else {
    if (isTextModelThinking) avatarState = 'thinking';
  }
  
  const currentTranscript = inputMode === 'voice' ? transcript : textTranscript;
  const currentInterimTranscript = inputMode === 'voice' ? interimTranscript : { user: '', model: '' };
  const currentIsModelThinking = inputMode === 'voice' ? isModelThinking : isTextModelThinking;

  return (
    <div className="flex flex-col h-screen bg-cover bg-center bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] overflow-hidden">
      <header className="relative z-30 p-4 border-b flex items-center justify-between bg-[var(--color-bg-secondary)] backdrop-blur-[var(--container-backdrop-blur)] border-[var(--color-border)] transition-colors glass-container">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8"><AuraIcon /></div>
          <h1 className="text-2xl font-bold text-[var(--color-text-strong)]">Aura AI</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={handleNewConversation} disabled={isNewConversationDisabled} className="p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] focus:ring-[var(--color-focus-ring)] disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" aria-label="Start new conversation"><NewConversationIcon className="w-6 h-6" /></button>
          <button onClick={handleToggleSearch} disabled={connectionState === 'connected' || connectionState === 'connecting' || inputMode === 'text'} className={`p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] focus:ring-[var(--color-focus-ring)] disabled:opacity-50 disabled:cursor-not-allowed ${isSearchEnabled ? 'bg-[var(--color-focus-ring)] text-[var(--color-text-inverted)] hover:opacity-90 shadow-[var(--color-accent-glow-shadow)]' : 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`} aria-label={isSearchEnabled ? 'Disable web search' : 'Enable web search'}><SearchIcon className="w-6 h-6" /></button>
          <VoiceSelector selectedVoice={voice} onVoiceChange={setVoice} disabled={connectionState === 'connected' || connectionState === 'connecting' || inputMode === 'text'} />
          <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4 relative min-h-0">
        <div className="w-full max-w-4xl h-full flex flex-col">
           {isCameraOn && connectionState === 'connected' && inputAudioStream && <VideoFeed stream={inputAudioStream} />}
          <ConversationView 
            transcript={currentTranscript} 
            interimTranscript={currentInterimTranscript} 
            stream={inputAudioStream}
            connectionState={connectionState}
            isCameraOn={isCameraOn}
            avatarState={avatarState}
            avatarExpression={modelExpression}
            audioRef={ttsAudioRef}
          />
        </div>
      </main>

      <footer className="w-full flex flex-col items-center justify-center p-4 bg-[var(--color-bg-secondary)] backdrop-blur-[var(--container-backdrop-blur)] border-t border-[var(--color-border)] transition-colors glass-container">
        <ControlBar
          connectionState={connectionState}
          onStart={connect}
          onStop={disconnect}
          isCameraOn={isCameraOn}
          onToggleCamera={handleToggleCamera}
          cameraFacingMode={cameraFacingMode}
          onToggleCameraFacingMode={handleToggleCameraFacingMode}
          inputMode={inputMode}
          onToggleInputMode={handleToggleInputMode}
          onSendText={handleSendTextMessage}
          textInputValue={textInputValue}
          onTextInputChange={setTextInputValue}
          isModelThinking={currentIsModelThinking}
        />
      </footer>
      <audio id="audio-primer" playsInline style={{ display: 'none' }}></audio>
      <audio 
        ref={ttsAudioRef} 
        onEnded={handleAudioEnded} 
        onPlay={() => setIsTtsPlaying(true)}
        onPause={() => setIsTtsPlaying(false)}
        style={{ display: 'none' }}
      ></audio>
      <DevPanel />
    </div>
  );
};

export default App;