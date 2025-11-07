import React, { useEffect, useRef } from 'react';
import { ModelExpression, AvatarState, AvatarStyle, AvatarTexture } from '../types';

interface AuraAvatarProps {
  state: AvatarState;
  expression: ModelExpression;
  speakingStream?: MediaStream | null;
  form: AvatarStyle;
  texture: AvatarTexture;
}

export const AuraAvatar: React.FC<AuraAvatarProps> = ({ state, expression, speakingStream, form, texture }) => {
  const pupilRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameId = useRef<number | null>(null);
  
  useEffect(() => {
    const pupilElement = pupilRef.current;

    const cleanupAudio = () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      if(audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
      audioContextRef.current = null;
      sourceRef.current = null;
      analyserRef.current = null;
      if(pupilElement) {
        pupilElement.style.setProperty('--pupil-scale', '1');
      }
    };

    if (state === 'speaking' && speakingStream && speakingStream.getAudioTracks().length > 0) {
      cleanupAudio(); // Clean up previous instances

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      analyserRef.current.smoothingTimeConstant = 0.5;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(speakingStream);
      sourceRef.current.connect(analyserRef.current);
      
      const draw = () => {
        animationFrameId.current = requestAnimationFrame(draw);
        if (!analyserRef.current || !pupilElement) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        const scale = 1 + (average / 256) * 0.25; // Max scale of 1.25
        
        pupilElement.style.setProperty('--pupil-scale', scale.toFixed(2));
      };
      draw();
    } else {
        cleanupAudio();
    }
    
    return cleanupAudio;
  }, [state, speakingStream]);

  return (
    <div 
      className="aura-avatar-container w-full h-full"
      data-state={state}
      data-expression={expression}
      data-form={form}
      data-texture={texture}
    >
      <div className="aura-sphere">
        <div className="aura-eyelid aura-eyelid-top"></div>
        <div className="aura-eyelid aura-eyelid-bottom"></div>
        <div className="aura-sclera">
          <div className="aura-iris-container">
            <div className="aura-iris">
              <div ref={pupilRef} className="aura-pupil"></div>
            </div>
          </div>
        </div>
        {expression === 'celebratory' && (
           <svg className="absolute w-full h-full top-0 left-0 overflow-visible" fill="var(--color-accent-celebratory)">
            <circle className="sparkle" cx="20%" cy="20%" r="0" />
            <circle className="sparkle" cx="80%" cy="30%" r="0" />
            <circle className="sparkle" cx="50%" cy="85%" r="0" />
          </svg>
        )}
      </div>
    </div>
  );
};