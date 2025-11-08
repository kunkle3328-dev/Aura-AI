import React, { useEffect, useRef } from 'react';
import { ModelExpression, AvatarState, AvatarStyle, AvatarTexture } from '../types';
/**
 * Interface for the props of the AuraAvatar component.
 */
interface AuraAvatarProps {
  /** The current state of the avatar (e.g., 'idle', 'speaking', 'listening'). */
  state: AvatarState;
  /** The current expression of the model (e.g., 'neutral', 'celebratory'). */
  expression: ModelExpression;
  /** The audio stream to use for lip-syncing when the avatar is speaking. */
  speakingStream?: MediaStream | null;
  /** The overall style of the avatar. */
  form: AvatarStyle;
  /** The texture to apply to the avatar. */
  texture: AvatarTexture;
}
/**
 * A 2D CSS-based animated avatar that represents the Aura AI.
 * It changes its appearance based on the application's state and can visualize
 * audio output through pupil dilation.
 *
 * @param {AuraAvatarProps} props The props for the component.
 * @returns {React.ReactElement} The rendered AuraAvatar component.
 */
export const AuraAvatar: React.FC<AuraAvatarProps> = ({ state, expression, speakingStream, form, texture }) => {
  /** Reference to the pupil DOM element for animation. */
  const pupilRef = useRef<HTMLDivElement>(null);
  /** Reference to the Web Audio API AudioContext. */
  const audioContextRef = useRef<AudioContext | null>(null);
  /** Reference to the Web Audio API AnalyserNode. */
  const analyserRef = useRef<AnalyserNode | null>(null);
  /** Reference to the audio source node. */
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  /** Reference to the requestAnimationFrame ID for cleanup. */
  const animationFrameId = useRef<number | null>(null);
  
  useEffect(() => {
    const pupilElement = pupilRef.current;
    /**
     * Cleans up all audio-related resources.
     * Stops the animation frame loop, disconnects audio nodes, and closes the audio context.
     */
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
      /**
       * The animation loop that updates the pupil scale based on audio frequency data.
       */
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