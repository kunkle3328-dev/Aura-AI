import React, { useState, useEffect } from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import { ConversationView } from './components/ConversationView';
import { ControlBar } from './components/ControlBar';
import { AuraIcon, SearchIcon } from './components/icons';
import { PrebuiltVoice, Theme } from './types';
import { VoiceSelector } from './components/VoiceSelector';
import { VideoFeed } from './components/VideoFeed';
import { ThemeSelector } from './components/ThemeSelector';

const App: React.FC = () => {
  const [voice, setVoice] = useState<PrebuiltVoice>('Puck');
  const [theme, setTheme] = useState<Theme>('theme-neuro-circuit');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);

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
    inputAudioStream,
    outputAudioStream,
    isModelThinking,
    modelExpression,
  } = useGeminiLive(voice, isCameraOn, isSearchEnabled);

  const handleToggleCamera = () => {
    if (connectionState === 'idle' || connectionState === 'closed' || connectionState === 'error') {
      setIsCameraOn(prev => !prev);
    }
  };
  
  const handleToggleSearch = () => {
    if (connectionState === 'idle' || connectionState === 'closed' || connectionState === 'error') {
      setIsSearchEnabled(prev => !prev);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-cover bg-center bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] overflow-hidden">
      <header className="relative z-30 p-4 border-b flex items-center justify-between bg-[var(--color-bg-secondary)] backdrop-blur-[var(--container-backdrop-blur)] border-[var(--color-border)] transition-colors glass-container">
        <div className="flex items-center space-x-3">
          <AuraIcon className="w-8 h-8 text-[var(--color-focus-ring)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-strong)]">Aura AI</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleToggleSearch}
            disabled={connectionState === 'connected' || connectionState === 'connecting'}
            className={`p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] focus:ring-[var(--color-focus-ring)] disabled:opacity-50 disabled:cursor-not-allowed
              ${isSearchEnabled 
                ? 'bg-[var(--color-focus-ring)] text-[var(--color-text-inverted)] hover:opacity-90 shadow-[var(--color-accent-glow-shadow)]' 
                : 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            aria-label={isSearchEnabled ? 'Disable web search' : 'Enable web search'}
          >
            <SearchIcon className="w-6 h-6" />
          </button>
          <VoiceSelector
            selectedVoice={voice}
            onVoiceChange={setVoice}
            disabled={connectionState === 'connected' || connectionState === 'connecting'}
          />
          <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4 relative min-h-0">
        <div className="w-full max-w-4xl h-full flex flex-col">
           {isCameraOn && connectionState === 'connected' && inputAudioStream && (
            <VideoFeed stream={inputAudioStream} />
          )}
          <ConversationView 
            transcript={transcript} 
            interimTranscript={interimTranscript} 
            stream={inputAudioStream}
            outputAudioStream={outputAudioStream}
            connectionState={connectionState}
            isModelThinking={isModelThinking}
            isCameraOn={isCameraOn}
            modelExpression={modelExpression}
          />
        </div>
      </main>

      <footer className="w-full flex justify-center p-4 bg-[var(--color-bg-secondary)] backdrop-blur-[var(--container-backdrop-blur)] border-t border-[var(--color-border)] transition-colors glass-container">
        <ControlBar
          connectionState={connectionState}
          onStart={connect}
          onStop={disconnect}
          isCameraOn={isCameraOn}
          onToggleCamera={handleToggleCamera}
        />
      </footer>
    </div>
  );
};

export default App;