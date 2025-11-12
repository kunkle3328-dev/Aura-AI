import React, { useEffect, useRef, useState } from 'react';

type LiveTalkingAvatarProps = {
  /** A Web Audio API AnalyserNode to read volume from */
  analyserNode: AnalyserNode | null;
  /** Closed-mouth avatar image */
  closedSrc: string;
  /** Open-mouth avatar image. If omitted, closedSrc is reused. */
  openSrc?: string;
  /** Diameter in px (default 220) */
  size?: number;
  className?: string;
};

export const LiveTalkingAvatar: React.FC<LiveTalkingAvatarProps> = ({
  analyserNode,
  closedSrc,
  openSrc,
  size = 220,
  className = '',
}) => {
  const [mouthOpen, setMouthOpen] = useState(0); // 0–1
  const frameRef = useRef<number | null>(null);

  const openImage = openSrc || closedSrc;
  const pixelSize = `${size}px`;

  useEffect(() => {
    if (!analyserNode) {
      // If no analyser is provided (e.g., not connected yet),
      // ensure the mouth gently closes and cancel any existing animation frame.
      setMouthOpen(prev => prev * 0.7);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    // Use frequency data for more stable volume detection, which is better for speech.
    const bufferLength = analyserNode.frequencyBinCount;
    const data = new Uint8Array(bufferLength);

    // --- Lip-sync sensitivity thresholds ---
    // These values may require tuning for different voices or microphone sensitivities.
    const MIN_VOLUME = 10; // The volume level considered to be silence.
    const MAX_VOLUME = 120; // The volume level that maps to a fully open mouth.
    
    // --- Smoothing factors ---
    // Asymmetric smoothing makes the mouth open faster and close slower, which looks more natural.
    const SMOOTHING_UP = 0.5;   // How quickly the mouth opens (lower is faster).
    const SMOOTHING_DOWN = 0.7; // How quickly the mouth closes (higher is slower).

    const loop = () => {
      frameRef.current = requestAnimationFrame(loop);
      
      analyserNode.getByteFrequencyData(data);
      
      let sum = 0;
      // Summing up the lower half of the frequency spectrum, which is where most voice energy is.
      for (let i = 0; i < bufferLength / 2; i++) {
        sum += data[i];
      }
      const averageVolume = sum / (bufferLength / 2);

      // Calculate mouth openness (0-1) based on the current volume.
      let openness = (averageVolume - MIN_VOLUME) / (MAX_VOLUME - MIN_VOLUME);
      openness = Math.max(0, Math.min(1, openness)); // Clamp between 0 and 1.
      
      // Apply smoothing to the openness value to prevent jitter.
      setMouthOpen(prev => {
        const smoothing = openness > prev ? SMOOTHING_UP : SMOOTHING_DOWN;
        return prev * smoothing + openness * (1 - smoothing);
      });
    };

    loop();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [analyserNode]); // Rerun effect if the analyserNode changes.

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
