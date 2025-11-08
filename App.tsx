import React, { useState, useEffect } from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import { ConversationView } from './components/ConversationView';
import { ControlBar } from './components/ControlBar';
import { AuraIcon, NewConversationIcon, SearchIcon, CustomizeIcon } from './components/icons';
import { PrebuiltVoice, Theme, AvatarState, AvatarStyle, AvatarTexture } from './types';
import { VoiceSelector } from './components/VoiceSelector';
import { VideoFeed } from './components/VideoFeed';
import { ThemeSelector } from './components/ThemeSelector';
import { AvatarCustomizationPanel } from './components/AvatarCustomizationPanel';

const App: React.FC = () => {
  const [voice, setVoice] = useState<PrebuiltVoice>('Puck');
  const [theme, setTheme] = useState<Theme>('theme-neuro-circuit');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [isCustomizationPanelOpen, setIsCustomizationPanelOpen] = useState(false);

  // Avatar customization state
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>('talking');
  const [avatarTexture, setAvatarTexture] = useState<AvatarTexture>('nebula');


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

  const handleNewConversation = () => {
    if (connectionState === 'connected' || connectionState === 'connecting') {
      disconnect();
    }
    clearTranscript();
  };

  const isNewConversationDisabled =
    (connectionState === 'idle' || connectionState === 'closed' || connectionState === 'error') &&
    transcript.length === 0 &&
    interimTranscript.user === '' &&
    interimTranscript.model === '';

  // Determine the avatar's state for the placeholder screen
  const isUserSpeaking = interimTranscript.user.trim().length > 0;
  const isModelSpeaking = interimTranscript.model.trim().length > 0;
  
  let placeholderAvatarState: AvatarState = 'idle';
  if (isModelThinking) {
    placeholderAvatarState = 'thinking';
  } else if (isUserSpeaking) {
    placeholderAvatarState = 'listening';
  }
  
  const avatarSettings = {
    style: avatarStyle,
    texture: avatarTexture,
  };

  return (
    <div className="flex flex-col h-screen bg-cover bg-center bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] overflow-hidden">
      <header className="relative z-30 p-4 border-b flex items-center justify-between bg-[var(--color-bg-secondary)] backdrop-blur-[var(--container-backdrop-blur)] border-[var(--color-border)] transition-colors glass-container">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8"><AuraIcon /></div>
          <h1 className="text-2xl font-bold text-[var(--color-text-strong)]">Aura AI</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleNewConversation}
            disabled={isNewConversationDisabled}
            className="p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] focus:ring-[var(--color-focus-ring)] disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            aria-label="Start new conversation"
          >
            <NewConversationIcon className="w-6 h-6" />
          </button>
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
          <div className="relative">
            <button
              onClick={() => setIsCustomizationPanelOpen(prev => !prev)}
              className="p-2 rounded-full bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] focus:ring-[var(--color-focus-ring)]"
              aria-label="Customize avatar"
            >
              <CustomizeIcon className="w-6 h-6" />
            </button>
            <AvatarCustomizationPanel 
              isOpen={isCustomizationPanelOpen}
              onClose={() => setIsCustomizationPanelOpen(false)}
              currentStyle={avatarStyle}
              onStyleChange={setAvatarStyle}
              currentTexture={avatarTexture}
              onTextureChange={setAvatarTexture}
            />
          </div>
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
            isModelSpeaking={isModelSpeaking}
            avatarState={placeholderAvatarState}
            avatarExpression={modelExpression}
            avatarSettings={avatarSettings}
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
        />
      </footer>
    </div>
  );
};

export default App;