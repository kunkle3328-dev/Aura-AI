import React, { useEffect, useRef } from 'react';
/**
 * Interface for the props of the VideoFeed component.
 */
interface VideoFeedProps {
  /** The MediaStream to display in the video feed. */
  stream: MediaStream;
}
/**
 * A component that displays a video feed from a MediaStream.
 *
 * @param {VideoFeedProps} props The props for the component.
 * @returns {React.ReactElement} The rendered video feed.
 */
export const VideoFeed: React.FC<VideoFeedProps> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  /**
   * Effect hook to set the video element's srcObject to the provided stream.
   */
  useEffect(() => {
    if (videoRef.current && stream) {
      // Create a new stream for the video element to avoid consuming the original
      const videoStream = new MediaStream(stream.getVideoTracks());
      videoRef.current.srcObject = videoStream;
    }
  }, [stream]);

  return (
    <div className="w-full rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)] mb-4 aspect-video shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
    </div>
  );
};