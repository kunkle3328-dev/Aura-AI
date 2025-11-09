import React, { useEffect, useRef } from 'react';

interface VideoFeedProps {
  stream: MediaStream;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      // Create a new stream for the video element to avoid consuming the original
      const videoStream = new MediaStream(stream.getVideoTracks());
      videoRef.current.srcObject = videoStream;
    }
  }, [stream]);

  return (
    <div className="w-full flex-shrink-0 rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)] mb-4 aspect-video shadow-lg">
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