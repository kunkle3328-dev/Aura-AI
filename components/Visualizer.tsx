import React, { useEffect, useRef } from 'react';
/**
 * Interface for the props of the Visualizer component.
 */
interface VisualizerProps {
  /** The MediaStream to visualize. */
  stream: MediaStream;
  /** Whether the conversation is currently active. */
  isConversationActive: boolean;
}
/**
 * A component that visualizes audio from a MediaStream.
 *
 * @param {VisualizerProps} props The props for the component.
 * @returns {React.ReactElement} The rendered visualizer.
 */
export const Visualizer: React.FC<VisualizerProps> = ({ stream, isConversationActive }) => {
  const visualizerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameId = useRef<number | null>(null);
  
  /**
   * Effect hook to set up the audio visualizer.
   */
  useEffect(() => {
    if (!stream) return;

    // FIX: Correctly handle vendor-prefixed webkitAudioContext for Safari to resolve TypeScript error.
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
    sourceRef.current.connect(analyserRef.current);
    /**
     * The animation loop that draws the visualizer.
     */
    const draw = () => {
      animationFrameId.current = requestAnimationFrame(draw);
      
      if (!analyserRef.current || !visualizerRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const scale = 1 + (average / 128) * 0.5;

      const innerCircle = visualizerRef.current.children[0] as HTMLDivElement;
      const outerCircle = visualizerRef.current.children[1] as HTMLDivElement;

      if(isConversationActive){
        innerCircle.style.transform = `scale(${scale})`;
        outerCircle.style.transform = `scale(${scale * 1.2})`;
        outerCircle.style.opacity = `${Math.max(0, (average / 128) - 0.2)}`;
      } else {
        innerCircle.style.transform = 'scale(1)';
        outerCircle.style.transform = 'scale(1)';
        outerCircle.style.opacity = '0';
      }
    };
    
    draw();
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      audioContextRef.current?.close().catch(console.error);
    };
  }, [stream, isConversationActive]);

  return (
    <div ref={visualizerRef} className="relative w-48 h-48 flex items-center justify-center">
      <div 
        className="visualizer-inner w-24 h-24 rounded-full transition-transform duration-100 ease-out"
        style={{ willChange: 'transform' }}
      ></div>
      <div 
        className="visualizer-outer absolute w-32 h-32 rounded-full transition-all duration-200 ease-out"
        style={{ willChange: 'transform, opacity' }}
      ></div>
    </div>
  );
};