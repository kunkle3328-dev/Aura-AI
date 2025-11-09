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
  const containerRef = useRef<HTMLDivElement>(null);
  const pupilRef = useRef<HTMLDivElement>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const animationFrameId = useRef<number | null>(null);
  const currentPupilScale = useRef(1);
  const currentHeadBob = useRef(0);
  const currentHeadTilt = useRef(0);
  
  useEffect(() => {
    const setupAudio = () => {
      if (speakingStream && speakingStream.getAudioTracks().length > 0) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const context = new AudioContext();
        audioContextRef.current = context;
        
        const analyser = context.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.5;
        analyserRef.current = analyser;
        
        const source = context.createMediaStreamSource(speakingStream);
        source.connect(analyser);
        sourceRef.current = source;
      }
    };

    const cleanupAudio = () => {
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
      analyserRef.current = null;
      sourceRef.current = null;
      audioContextRef.current = null;
    };

    if (state === 'speaking') {
      setupAudio();
    }
    
    return cleanupAudio;
  }, [state, speakingStream]);

  useEffect(() => {
    const pupilElement = pupilRef.current;
    const containerElement = containerRef.current;
    
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      let targetPupilScale = 1;
      let targetHeadBob = 0;
      let targetHeadTilt = 0;

      if (state === 'speaking' && analyserRef.current) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        const normalizedVolume = average / 128;

        targetPupilScale = 1 + Math.min(normalizedVolume * 0.2, 0.2);
        targetHeadBob = Math.min(normalizedVolume * 1.5, 2.0);
        targetHeadTilt = Math.min(normalizedVolume * 1.0, 1.5);
      }
      
      currentPupilScale.current += (targetPupilScale - currentPupilScale.current) * 0.2;
      currentHeadBob.current += (targetHeadBob - currentHeadBob.current) * 0.2;
      currentHeadTilt.current += (targetHeadTilt - currentHeadTilt.current) * 0.2;
      
      if (pupilElement) {
        pupilElement.style.setProperty('--pupil-scale', currentPupilScale.current.toFixed(3));
      }

      if (containerElement) {
        const isAnimating = Math.abs(currentHeadBob.current) > 0.01 || Math.abs(currentHeadTilt.current) > 0.01;
        if (state === 'speaking' || isAnimating) {
          containerElement.style.transform = `translateY(-${currentHeadBob.current.toFixed(2)}px) rotate(${currentHeadTilt.current.toFixed(2)}deg)`;
        } else {
          containerElement.style.transform = ''; // Let CSS animation take over
        }
      }
    };

    animate();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (containerElement) containerElement.style.transform = '';
    };
  }, [state]);

  return (
    <div 
      ref={containerRef}
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