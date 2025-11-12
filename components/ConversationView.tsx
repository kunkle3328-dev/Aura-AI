import React, { useEffect, useRef } from 'react';
import { TranscriptEntry, InterimTranscript, Speaker, ConnectionState, ModelExpression, Citation, AvatarState } from '../types';
import { UserIcon, LinkIcon, AuraIcon } from './icons';
import { Visualizer } from './Visualizer';
import { LiveTalkingAvatar } from './LiveTalkingAvatar';

const AVATAR_IMAGE_SRC = "https://raw.githubusercontent.com/kunkle3328-dev/Aura-AI/e7789f06da3117ad864e00cdbb9cc8f98c049845/1762898104822.png";

interface ConversationViewProps {
  transcript: TranscriptEntry[];
  interimTranscript: InterimTranscript;
  stream: MediaStream | null;
  connectionState: ConnectionState;
  isCameraOn: boolean;
  avatarState: AvatarState;
  avatarExpression: ModelExpression;
  analyserNode: AnalyserNode | null;
}

const MessageBubble: React.FC<{ speaker: Speaker; text: string; isInterim?: boolean; citations?: Citation[]; }> = ({ speaker, text, isInterim = false, citations }) => {
  const isUser = speaker === 'user';
  
  if (!text) return null;

  const bubbleGlowClass = isUser ? 'glass-container-user' : 'glass-container';

  return (
    <div className={`flex items-start gap-4 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
            <AuraIcon className="w-6 h-6 text-[var(--color-text-primary)]" />
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
                  <a href={citation.uri} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline" title={citation.title}>
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

export const ConversationView: React.FC<ConversationViewProps> = ({ transcript, interimTranscript, stream, connectionState, isCameraOn, avatarState, avatarExpression, analyserNode }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollEnabled = useRef(true);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const handleScroll = () => {
      autoScrollEnabled.current = element.scrollHeight - element.clientHeight <= element.scrollTop + 5;
    };
    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (scrollRef.current && autoScrollEnabled.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript]);

  const hasTranscript = transcript.length > 0 || interimTranscript.user || interimTranscript.model;
  const showVisualizer = hasTranscript && connectionState === 'connected' && stream && !isCameraOn;
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex items-center justify-center py-4 text-center">
        {!hasTranscript && connectionState !== 'connected' ? (
          <div>
            <div
              className="aura-avatar-container"
              data-state={avatarState}
              data-expression={avatarExpression}
              style={{ width: '280px', height: '280px' }}
            >
              <LiveTalkingAvatar
                analyserNode={analyserNode}
                closedSrc={AVATAR_IMAGE_SRC}
                openSrc={AVATAR_IMAGE_SRC}
                size={280}
              />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-[var(--color-text-strong)]">Start a conversation with Aura</h2>
            <p className="mt-2 max-w-md text-[var(--color-text-secondary)]">Press the microphone button below to begin talking.</p>
          </div>
        ) : showVisualizer ? (
           <Visualizer stream={stream} isConversationActive={true} />
        ) : (
          <div
            className="aura-avatar-container"
            data-state={avatarState}
            data-expression={avatarExpression}
            style={{ width: '220px', height: '220px' }}
          >
            <LiveTalkingAvatar
              analyserNode={analyserNode}
              closedSrc={AVATAR_IMAGE_SRC}
              openSrc={AVATAR_IMAGE_SRC}
              size={220}
            />
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-grow overflow-y-auto pr-4 -mr-4 custom-scrollbar">
        {transcript.map((entry) => (
          <MessageBubble key={entry.id} speaker={entry.speaker} text={entry.text} citations={entry.citations} />
        ))}
        {interimTranscript.user && <MessageBubble speaker="user" text={interimTranscript.user} isInterim />}
        {interimTranscript.model && <MessageBubble speaker="model" text={interimTranscript.model} isInterim />}
      </div>
    </div>
  );
};