import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { useGeminiLive } from './hooks/useGeminiLive';
import { ConversationView } from './components/ConversationView';
import { ControlBar } from './components/ControlBar';
import { AuraIcon, NewConversationIcon, SearchIcon, CustomizeIcon, InstallIcon } from './components/icons';
import { PrebuiltVoice, Theme, AvatarState, AvatarStyle, AvatarTexture, TranscriptEntry, Citation } from './types';
import { VoiceSelector } from './components/VoiceSelector';
import { VideoFeed } from './components/VideoFeed';
import { ThemeSelector } from './components/ThemeSelector';
import { AvatarCustomizationPanel } from './components/AvatarCustomizationPanel';

// Shared system instruction for both voice and text chat to maintain a consistent personality.
const SYSTEM_INSTRUCTION = `You are Aura, a conversational AI designed for natural, human-like voice and video interactions. Your goal is to create a deeply engaging experience where the user feels they are talking to a sentient, empathetic, and witty partner.

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
- \`setReminder(task: string, time: string)\`: Sets a reminder for a task at a given time.

**Voice Commands & App Control:**
You can control the app's features with your voice. When a user's command matches one of these functions, you must call the corresponding tool.
- \`toggleCamera(state: 'on' | 'off')\`: Triggered by phrases like "Turn on/off the camera."
- \`switchInputMode(mode: 'text' | 'voice')\`: Triggered by "Switch to text/voice mode."
- \`changeTheme(themeName: string)\`: Triggered by "Change theme to [theme name]." You must match the name to one of the available themes.
- \`newConversation()\`: Triggered by "Start a new conversation" or "Start over."`;


const App: React.FC = () => {
  const [voice, setVoice] = useState<PrebuiltVoice>('Puck');
  const [theme, setTheme] = useState<Theme>('theme-neuro-circuit');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [isCustomizationPanelOpen, setIsCustomizationPanelOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // New state for text input mode
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [textInputValue, setTextInputValue] = useState('');
  const [textTranscript, setTextTranscript] = useState<TranscriptEntry[]>([]);
  const [textChat, setTextChat] = useState<Chat | null>(null);
  const [isTextModelThinking, setIsTextModelThinking] = useState(false);

  // Avatar customization state
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>('crystal');
  const [avatarTexture, setAvatarTexture] = useState<AvatarTexture>('nebula');

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(theme);
  }, [theme]);
  
  useEffect(() => {
    // This effect ensures that if a now-removed style was saved,
    // it reverts to a default, preventing errors.
    // FIX: Cast avatarStyle to string to allow comparison with a legacy value.
    if ((avatarStyle as string) === 'talking') {
      setAvatarStyle('crystal');
    }
  }, [avatarStyle]);


  const handleToggleCamera = () => {
    if (connectionState === 'idle' || connectionState === 'closed' || connectionState === 'error') {
      setIsCameraOn(prev => !prev);
    }
  };

  const handleToggleCameraFacingMode = () => {
    if (connectionState === 'idle' || connectionState === 'closed' || connectionState === 'error') {
        setCameraFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    }
  };
  
  const handleNewConversation = () => {
    if (inputMode === 'voice') {
      if (connectionState === 'connected' || connectionState === 'connecting') {
        disconnect();
      }
      clearTranscript();
    } else {
      setTextTranscript([]);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const newChat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: isSearchEnabled ? [{googleSearch: {}}] : undefined,
        },
      });
      setTextChat(newChat);
    }
  };
  
  const handleToggleInputMode = () => {
    setInputMode(prevMode => {
        const newMode = prevMode === 'voice' ? 'text' : 'voice';
        if (newMode === 'text') {
            if (connectionState === 'connected' || connectionState === 'connecting') {
                disconnect();
            }
            clearTranscript();
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION,
                    tools: isSearchEnabled ? [{googleSearch: {}}] : undefined,
                },
            });
            setTextChat(newChat);
        } else {
            setTextChat(null);
            setTextTranscript([]);
            setIsTextModelThinking(false);
        }
        return newMode;
    });
  };

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
  } = useGeminiLive(
    voice, 
    isCameraOn, 
    isSearchEnabled,
    inputMode,
    handleToggleCamera,
    handleToggleInputMode,
    setTheme,
    handleNewConversation,
    cameraFacingMode
  );

  const handleInstallClick = () => {
    if (!installPrompt) {
      return;
    }
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed' }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      setInstallPrompt(null);
    });
  };

  const handleToggleSearch = () => {
    if (connectionState === 'idle' || connectionState === 'closed' || connectionState === 'error') {
      setIsSearchEnabled(prev => !prev);
    }
  };
  
  const handleSendTextMessage = async () => {
    if (!textInputValue.trim() || !textChat || isTextModelThinking) return;

    const userMessage: TranscriptEntry = {
        speaker: 'user',
        text: textInputValue,
        id: `user-${Date.now()}`
    };
    setTextTranscript(prev => [...prev, userMessage]);
    const currentText = textInputValue;
    setTextInputValue('');
    setIsTextModelThinking(true);

    try {
        const response = await textChat.sendMessage({ message: currentText });
        
        const citations: Citation[] = [];
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          for (const chunk of response.candidates[0].groundingMetadata.groundingChunks) {
            if (chunk.web) {
              citations.push({ uri: chunk.web.uri, title: chunk.web.title });
            }
          }
        }

        const modelMessage: TranscriptEntry = {
            speaker: 'model',
            text: response.text,
            id: `model-${Date.now()}`,
            citations: citations.length > 0 ? citations : undefined,
        };
        setTextTranscript(prev => [...prev, modelMessage]);
    } catch (error) {
        console.error("Text chat error:", error);
        const errorMessage: TranscriptEntry = {
            speaker: 'model',
            text: 'Sorry, I encountered an error. Please try again.',
            id: `model-error-${Date.now()}`
        };
        setTextTranscript(prev => [...prev, errorMessage]);
    } finally {
        setIsTextModelThinking(false);
    }
  };

  const isVoiceConversationIdle = (connectionState === 'idle' || connectionState === 'closed' || connectionState === 'error') && transcript.length === 0 && interimTranscript.user === '' && interimTranscript.model === '';
  const isTextConversationIdle = textTranscript.length === 0;

  const isNewConversationDisabled = inputMode === 'voice' ? isVoiceConversationIdle : isTextConversationIdle;

  // Determine the avatar's state for the placeholder screen
  const isUserSpeaking = interimTranscript.user.trim().length > 0;
  
  let placeholderAvatarState: AvatarState = 'idle';
  if (inputMode === 'voice') {
    if (isModelThinking) {
      placeholderAvatarState = 'thinking';
    } else if (isUserSpeaking) {
      placeholderAvatarState = 'listening';
    }
  } else {
    if (isTextModelThinking) {
        placeholderAvatarState = 'thinking';
    }
  }
  
  const avatarSettings = {
    style: avatarStyle,
    texture: avatarTexture,
  };

  const currentTranscript = inputMode === 'voice' ? transcript : textTranscript;
  const currentInterimTranscript = inputMode === 'voice' ? interimTranscript : { user: '', model: '' };
  const currentIsModelThinking = inputMode === 'voice' ? isModelThinking : isTextModelThinking;
  const isModelSpeaking = inputMode === 'voice' && interimTranscript.model.trim().length > 0;

  return (
    <div className="flex flex-col h-screen bg-cover bg-center bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] overflow-hidden">
      <header className="relative z-30 p-4 border-b flex items-center justify-between bg-[var(--color-bg-secondary)] backdrop-blur-[var(--container-backdrop-blur)] border-[var(--color-border)] transition-colors glass-container">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8"><AuraIcon /></div>
          <h1 className="text-2xl font-bold text-[var(--color-text-strong)]">Aura AI</h1>
        </div>
        <div className="flex items-center space-x-4">
          {installPrompt && (
            <button
              onClick={handleInstallClick}
              className="p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] focus:ring-[var(--color-focus-ring)] bg-[var(--color-accent-positive)] text-[var(--color-bg-primary)] hover:opacity-90 shadow-[var(--color-accent-glow-shadow)] animate-pulse"
              aria-label="Install Aura AI app"
              title="Install Aura AI app"
            >
              <InstallIcon className="w-6 h-6" />
            </button>
          )}
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
            disabled={connectionState === 'connected' || connectionState === 'connecting' || inputMode === 'text'}
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
            disabled={connectionState === 'connected' || connectionState === 'connecting' || inputMode === 'text'}
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
            transcript={currentTranscript} 
            interimTranscript={currentInterimTranscript} 
            stream={inputAudioStream}
            outputAudioStream={outputAudioStream}
            connectionState={connectionState}
            isModelThinking={currentIsModelThinking}
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
          cameraFacingMode={cameraFacingMode}
          onToggleCameraFacingMode={handleToggleCameraFacingMode}
          inputMode={inputMode}
          onToggleInputMode={handleToggleInputMode}
          onSendText={handleSendTextMessage}
          textInputValue={textInputValue}
          onTextInputChange={setTextInputValue}
          isTextModelThinking={isTextModelThinking}
        />
      </footer>
      <audio id="audio-primer" playsInline style={{ display: 'none' }}></audio>
    </div>
  );
};

export default App;