import React, { useEffect, useRef } from 'react';
import { TranscriptEntry, InterimTranscript, Speaker, ConnectionState, ModelExpression, Citation, AvatarState, AvatarStyle, AvatarTexture, AvatarShape } from '../types';
import { UserIcon, LinkIcon } from './icons';
import { Visualizer } from './Visualizer';
import { AuraAvatar } from './AuraAvatar';
import { TalkingAvatar } from './TalkingAvatar';
/**
 * Interface for the avatar settings.
 */
interface AvatarSettings {
  /** The style of the avatar. */
  style: AvatarStyle;
  /** The texture of the avatar's iris. */
  texture: AvatarTexture;
  /** The 3D shape of the avatar. */
  shape: AvatarShape;
  /** The 3D color of the avatar. */
  color: string;
}
/**
 * Interface for the props of the ConversationView component.
 */
interface ConversationViewProps {
  /** The transcript of the conversation. */
  transcript: TranscriptEntry[];
  /** The interim transcript, which contains the current user and model speech. */
  interimTranscript: InterimTranscript;
  /** The user's audio stream. */
  stream: MediaStream | null;
  /** The model's audio stream. */
  outputAudioStream: MediaStream | null;
  /** The current state of the connection. */
  connectionState: ConnectionState;
  /** Whether the model is currently thinking. */
  isModelThinking: boolean;
  /** Whether the user's camera is on. */
  isCameraOn: boolean;
  /** Whether the model is currently speaking. */
  isModelSpeaking: boolean;
  /** The current state of the avatar. */
  avatarState: AvatarState;
  /** The current expression of the avatar. */
  avatarExpression: ModelExpression;
  /** The settings for the avatar's appearance. */
  avatarSettings: AvatarSettings;
}
/**
 * A component that displays a single message in the conversation.
 *
 * @param {object} props The props for the component.
 * @param {Speaker} props.speaker The speaker of the message ('user' or 'model').
 * @param {string} props.text The text of the message.
 * @param {boolean} [props.isInterim=false] Whether the message is interim.
 * @param {boolean} [props.isSpeaking=false] Whether the speaker is currently speaking.
 * @param {MediaStream|null} [props.outputAudioStream] The model's audio stream.
 * @param {ModelExpression} [props.expression='neutral'] The expression of the model.
 * @param {Citation[]} [props.citations] Any citations for the message.
 * @param {AvatarSettings} props.avatarSettings The settings for the avatar's appearance.
 * @returns {React.ReactElement|null} The rendered message bubble or null if there is no text.
 */
const MessageBubble: React.FC<{ speaker: Speaker; text: string; isInterim?: boolean; isSpeaking?: boolean; outputAudioStream?: MediaStream | null; expression?: ModelExpression; citations?: Citation[]; avatarSettings: AvatarSettings; }> = ({ speaker, text, isInterim = false, isSpeaking = false, outputAudioStream, expression = 'neutral', citations, avatarSettings }) => {
  const isUser = speaker === 'user';
  
  if (!text) return null;

  const bubbleGlowClass = isUser ? 'glass-container-user' : 'glass-container';
  
  let avatarState: AvatarState = 'idle';
  if (isSpeaking) {
    avatarState = 'speaking';
  }

  return (
    <div className={`flex items-start gap-4 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10">
          {avatarSettings.style === 'talking' ? (
            <TalkingAvatar
              outputAudioStream={outputAudioStream}
              shape={avatarSettings.shape}
              color={avatarSettings.color}
            />
          ) : (
            <AuraAvatar
              state={avatarState}
              speakingStream={outputAudioStream}
              expression={expression}
              form={avatarSettings.style}
              texture={avatarSettings.texture}
            />
          )}
        </div>
      )}
      <div 
        className={`max-w-xl p-4 rounded-2xl transition-opacity backdrop-blur-[var(--container-backdrop-blur)] border-[var(--color-border)]
        border-b-[var(--container-border-width)] border-r-[var(--container-border-width)] ${bubbleGlowClass}
        ${
          isUser 
            ? 'bg-[var(--color-bubble-user-bg)] text-[var(--color-bubble-user-text)] rounded-br-none' 
            : 'bg-[var(--color-bubble-model-bg)] text-[var(--color-bubble-model-text)] rounded-bl-none'
        } ${isInterim ? 'opacity-70' : 'opacity-100'}`}
      >
        <p className="whitespace-pre-wrap">{text}</p>
        {citations && citations.length > 0 && !isInterim && (
          <div className="mt-4 pt-3 border-t border-[var(--color-border)] opacity-80">
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-2 text-[var(--color-text-secondary)] uppercase">
              <LinkIcon className="w-3.5 h-3.5" />
              Sources
            </h4>
            <ul className="space-y-1.5">
              {citations.map((citation, index) => (
                <li key={index} className="text-sm truncate">
                  <a
                    href={citation.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-accent)] hover:underline"
                    title={citation.title}
                  >
                    {citation.title || new URL(citation.uri).hostname}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
       {isUser && <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center"><UserIcon className="w-6 h-6 text-[var(--color-bubble-user-text)]" /></div>}
    </div>
  );
};
/**
 * A component that displays a thinking indicator while the model is processing.
 *
 * @param {object} props The props for the component.
 * @param {AvatarSettings} props.avatarSettings The settings for the avatar's appearance.
 * @returns {React.ReactElement} The rendered thinking indicator.
 */
const ThinkingIndicator: React.FC<{ avatarSettings: AvatarSettings }> = ({ avatarSettings }) => {
  return (
    <div className="flex items-start gap-4 my-4 justify-start">
      <div className="flex-shrink-0 w-10 h-10">
        {avatarSettings.style === 'talking' ? (
          <TalkingAvatar
            outputAudioStream={null}
            shape={avatarSettings.shape}
            color={avatarSettings.color}
          />
        ) : (
          <AuraAvatar
            state="thinking"
            expression="neutral"
            form={avatarSettings.style}
            texture={avatarSettings.texture}
          />
        )}
      </div>
      <div className="max-w-xl p-4 rounded-2xl bg-[var(--color-bubble-model-bg)] rounded-bl-none backdrop-blur-[var(--container-backdrop-blur)] border border-[var(--color-border)] glass-container">
        <div className="flex space-x-1.5 items-center h-[24px]">
          <span className="w-2 h-2 bg-[var(--color-text-secondary)] rounded-full animate-pulse [animation-delay:-0.3s]"></span>
          <span className="w-2 h-2 bg-[var(--color-text-secondary)] rounded-full animate-pulse [animation-delay:-0.15s]"></span>
          <span className="w-2 h-2 bg-[var(--color-text-secondary)] rounded-full animate-pulse"></span>
        </div>
      </div>
    </div>
  );
};
/**
 * A component that displays the conversation transcript, including interim results
 * and a placeholder screen when the conversation has not yet started.
 *
 * @param {ConversationViewProps} props The props for the component.
 * @returns {React.ReactElement} The rendered conversation view.
 */
export const ConversationView: React.FC<ConversationViewProps> = ({ transcript, interimTranscript, stream, outputAudioStream, connectionState, isModelThinking, isCameraOn, isModelSpeaking, avatarState, avatarExpression, avatarSettings }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollEnabled = useRef(true);
  /**
   * Effect hook to handle auto-scrolling of the conversation view.
   */
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      const atBottom = element.scrollHeight - element.clientHeight <= element.scrollTop + 5;
      autoScrollEnabled.current = atBottom;
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, []);
  /**
   * Effect hook to scroll to the bottom of the conversation view when new content is added.
   */
  useEffect(() => {
    if (scrollRef.current && autoScrollEnabled.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript, isModelThinking]);

  const hasTranscript = transcript.length > 0 || interimTranscript.user || interimTranscript.model;
  const showPlaceholder = !hasTranscript && (connectionState === 'idle' || connectionState === 'closed' || connectionState === 'error');
  const showVisualizer = !hasTranscript && connectionState === 'connected' && stream && !isCameraOn;
  
  return (
    <div ref={scrollRef} className="flex-grow overflow-y-auto pr-4 -mr-4 custom-scrollbar">
       {showPlaceholder && (
        <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-text-secondary)]">
          <div className="w-24 h-24 mb-4 opacity-90">
            {avatarSettings.style === 'talking' ? (
              <TalkingAvatar
                outputAudioStream={outputAudioStream}
                shape={avatarSettings.shape}
                color={avatarSettings.color}
              />
            ) : (
              <AuraAvatar
                state={avatarState}
                expression={avatarExpression}
                form={avatarSettings.style}
                texture={avatarSettings.texture}
              />
            )}
          </div>
          <h2 className="text-2xl font-semibold text-[var(--color-text-strong)]">Start a conversation with Aura</h2>
          <p className="mt-2 max-w-md">Press the microphone button below to begin talking.</p>
        </div>
      )}
      {showVisualizer && (
        <div className="flex flex-col items-center justify-center h-full">
            <Visualizer stream={stream} isConversationActive={true} />
        </div>
      )}
      {transcript.map((entry) => (
        <MessageBubble 
            key={entry.id} 
            speaker={entry.speaker} 
            text={entry.text} 
            citations={entry.citations} 
            expression="neutral"
            avatarSettings={avatarSettings}
        />
      ))}
      {interimTranscript.user && <MessageBubble speaker="user" text={interimTranscript.user} isInterim avatarSettings={avatarSettings} />}
      
      {isModelThinking && <ThinkingIndicator avatarSettings={avatarSettings} />}

      {interimTranscript.model && (
          <MessageBubble 
            speaker="model" 
            text={interimTranscript.model} 
            isInterim 
            isSpeaking={isModelSpeaking} 
            outputAudioStream={outputAudioStream} 
            expression={avatarExpression}
            avatarSettings={avatarSettings}
        />
      )}
    </div>
  );
};