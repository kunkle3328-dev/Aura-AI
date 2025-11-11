import React, { useEffect, useRef, useState } from 'react';

type LiveTalkingAvatarProps = {
  /** <audio> element that plays the AI voice */
  audioRef: React.RefObject<HTMLAudioElement>;
  /** Closed-mouth avatar image */
  closedSrc: string;
  /** Open-mouth avatar image. If omitted, closedSrc is reused. */
  openSrc?: string;
  /** Diameter in px (default 220) */
  size?: number;
  className?: string;
};

// This registry ensures that we only ever create one AudioContext and source
// for a given HTMLAudioElement. This is critical for preventing errors in
// React's StrictMode, where components may be mounted and unmounted for debugging.
const audioNodeRegistry = new WeakMap<HTMLAudioElement, {
  ctx: AudioContext;
  source: MediaElementAudioSourceNode;
  analyser: AnalyserNode;
}>();


export const LiveTalkingAvatar: React.FC<LiveTalkingAvatarProps> = ({
  audioRef,
  closedSrc,
  openSrc,
  size = 220,
  className = '',
}) => {
  const [mouthOpen, setMouthOpen] = useState(0); // 0–1
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frameRef = useRef<number | null>(null);

  const openImage = openSrc || closedSrc;
  const pixelSize = `${size}px`;

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    let nodes = audioNodeRegistry.get(audioEl);

    if (!nodes) {
        try {
            const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
            const ctx = new Ctor() as AudioContext;
            const source = ctx.createMediaElementSource(audioEl);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.05;
            source.connect(analyser);
            analyser.connect(ctx.destination);

            nodes = { ctx, source, analyser };
            audioNodeRegistry.set(audioEl, nodes);
            
            // Resume on first user gesture (mic tap, etc.)
            const resumeCtx = () => {
                if (ctx.state === 'suspended') {
                    ctx.resume().catch(console.warn);
                }
            };
            window.addEventListener('click', resumeCtx, { once: true });
            window.addEventListener('touchstart', resumeCtx, { once: true });

        } catch (e) {
            console.error('Error wiring audio to LiveTalkingAvatar:', e);
            return; // Exit if wiring fails
        }
    }
    
    analyserRef.current = nodes.analyser;

    // The cleanup should only cancel the animation frame, not destroy the
    // shared audio nodes, which are now tied to the audio element's lifecycle.
    return () => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
    };
  }, [audioRef]);

  useEffect(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.fftSize;
    const data = new Float32Array(bufferLength);

    const MIN_RMS = 0.003; // sensitivity
    const MAX_RMS = 0.05;

    const loop = () => {
      frameRef.current = requestAnimationFrame(loop);
      const audioEl = audioRef.current;
      if (!audioEl || audioEl.paused || audioEl.muted) {
        setMouthOpen(prev => prev * 0.7); // gently close when quiet
        return;
      }

      analyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = data[i];
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);

      let openness = (rms - MIN_RMS) / (MAX_RMS - MIN_RMS);
      if (openness < 0) openness = 0;
      if (openness > 1) openness = 1;

      // smooth to avoid jitter
      setMouthOpen(prev => prev * 0.5 + openness * 0.5);
    };

    loop();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [audioRef]);

  return (
    <div
      className={`relative mx-auto flex items-center justify-center ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      {/* Closed frame */}
      <img
        src={closedSrc}
        alt="AI Avatar"
        className="avatar-image"
        style={{ opacity: 1 - mouthOpen }}
      />
      {/* Open frame */}
      <img
        src={openImage}
        alt="AI Avatar speaking"
        className="avatar-image"
        style={{ opacity: mouthOpen }}
      />
    </div>
  );
};
