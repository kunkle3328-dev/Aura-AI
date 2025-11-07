import React, { useEffect, useRef } from 'react';
import { TranscriptEntry, InterimTranscript, Speaker, ConnectionState, ModelExpression, Citation } from '../types';
import { UserIcon, AuraIcon, LinkIcon } from './icons';
import { Visualizer } from './Visualizer';

interface ConversationViewProps {
  transcript: TranscriptEntry[];
  interimTranscript: InterimTranscript;
  stream: MediaStream | null;
  outputAudioStream: MediaStream | null;
  connectionState: ConnectionState;
  isModelThinking: boolean;
  isCameraOn: boolean;
  modelExpression: ModelExpression;
}

const AuraAvatar: React.FC<{
  state: 'thinking' | 'speaking' | 'idle';
  speakingStream?: MediaStream | null;
  expression: ModelExpression;
}> = ({ state, speakingStream, expression }) => {
  const iconRef = useRef<SVGSVGElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    const iconElement = iconRef.current;
    if (!iconElement) return;

    // --- State & Expression Management ---
    // Reset all dynamic classes first
    iconElement.classList.remove('anim-think', 'expression-positive', 'expression-inquisitive');
    iconElement.style.transform = 'scale(1)';
    iconElement.style.transition = 'transform 0.1s ease-out';

    // Apply expression class if not neutral
    if (expression !== 'neutral') {
      iconElement.classList.add(`expression-${expression}`);
    }
    
    // Apply state animation/class
    if (state === 'thinking') {
      iconElement.classList.add('anim-think');
    }
    // Note: 'speaking' state is handled by the audio visualizer effect below

    // --- Audio Visualizer for 'speaking' state ---
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    sourceRef.current?.disconnect();
    if(audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close().catch(console.error);
    }
    
    if (state === 'speaking' && speakingStream) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const source = audioContext.createMediaStreamSource(speakingStream);
      sourceRef.current = source;
      source.connect(analyser);
      
      const draw = () => {
        animationFrameId.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        const scale = 1 + (average / 256) * 0.2; // Max scale of 1.2
        
        iconElement.style.transform = `scale(${scale})`;
      };
      draw();
    }
    
    return () => {
      // Cleanup on unmount or when dependencies change
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      sourceRef.current?.disconnect();
      if(audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close().catch(console.error);
      }
      if (iconElement) iconElement.style.transform = 'scale(1)';
    };
  }, [state, speakingStream, expression]);

  return <AuraIcon ref={iconRef} className="w-6 h-6 text-[var(--color-focus-ring)]" />;
};


const MessageBubble: React.FC<{ speaker: Speaker; text: string; isInterim?: boolean; isSpeaking?: boolean; outputAudioStream?: MediaStream | null; expression?: ModelExpression; citations?: Citation[]; }> = ({ speaker, text, isInterim = false, isSpeaking = false, outputAudioStream, expression = 'neutral', citations }) => {
  const isUser = speaker === 'user';
  
  if (!text) return null;

  const bubbleGlowClass = isUser ? 'glass-container-user' : 'glass-container';

  return (
    <div className={`flex items-start gap-4 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center">
          <AuraAvatar state={isSpeaking ? 'speaking' : 'idle'} speakingStream={outputAudioStream} expression={expression} />
      </div>}
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

const ThinkingIndicator: React.FC = () => (
  <div className="flex items-start gap-4 my-4 justify-start">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center">
      <AuraAvatar state="thinking" expression="neutral" />
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

export const ConversationView: React.FC<ConversationViewProps> = ({ transcript, interimTranscript, stream, outputAudioStream, connectionState, isModelThinking, isCameraOn, modelExpression }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollEnabled = useRef(true);

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
          <AuraIcon className="w-24 h-24 mb-4 opacity-70" />
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
        <MessageBubble key={entry.id} speaker={entry.speaker} text={entry.text} citations={entry.citations} />
      ))}
      {interimTranscript.user && <MessageBubble speaker="user" text={interimTranscript.user} isInterim />}
      
      {isModelThinking && <ThinkingIndicator />}

      {interimTranscript.model && <MessageBubble speaker="model" text={interimTranscript.model} isInterim isSpeaking outputAudioStream={outputAudioStream} expression={modelExpression}/>}
    </div>
  );
};