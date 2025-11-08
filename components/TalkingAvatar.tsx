import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarShape } from '../types';
/**
 * A component that renders the head of the 3D avatar.
 * It includes a mouth that moves in sync with the audio stream.
 *
 * @param {object} props The props for the component.
 * @param {MediaStream | null} props.audioStream The audio stream to sync the mouth movement with.
 * @param {AvatarShape} props.shape The shape of the head.
 * @param {string} props.color The color of the head.
 * @returns {React.ReactElement} The rendered head component.
 */
const Head = ({ audioStream, shape, color }: { audioStream: MediaStream | null, shape: AvatarShape, color: string }) => {
  const mouthRef = useRef<THREE.Mesh>(null!);
  const analyser = useRef<THREE.AudioAnalyser | null>(null);
  /**
   * Effect hook to set up the audio analyser.
   */
  useEffect(() => {
    if (audioStream) {
      const audioContext = new THREE.AudioContext();
      const audio = new THREE.Audio(new THREE.AudioListener());
      const source = audioContext.createMediaStreamSource(audioStream);
      audio.setNodeSource(source as unknown as AudioBufferSourceNode);
      analyser.current = new THREE.AudioAnalyser(audio, 32);
    }
  }, [audioStream]);
  /**
   * `useFrame` hook to update the mouth scale based on the audio frequency.
   */
  useFrame(() => {
    if (analyser.current) {
      const data = analyser.current.getAverageFrequency();
      const scale = 1 + data / 100;
      mouthRef.current.scale.y = scale;
    }
  });

  return (
    <group>
      <mesh>
        {shape === 'sphere' ? <sphereGeometry args={[1, 32, 32]} /> : <boxGeometry args={[1.5, 1.5, 1.5]} />}
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh ref={mouthRef} position={[0, -0.2, 0.9]}>
        <boxGeometry args={[0.3, 0.1, 0.1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    </group>
  );
};
/**
 * Interface for the props of the TalkingAvatar component.
 */
interface TalkingAvatarProps {
  /** The audio stream to use for lip-syncing. */
  outputAudioStream: MediaStream | null;
  /** The shape of the avatar's head. */
  shape: AvatarShape;
  /** The color of the avatar's head. */
  color: string;
}
/**
 * A 3D avatar that can talk, with mouth movements synced to an audio stream.
 *
 * @param {TalkingAvatarProps} props The props for the component.
 * @returns {React.ReactElement} The rendered 3D avatar.
 */
export const TalkingAvatar: React.FC<TalkingAvatarProps> = ({ outputAudioStream, shape, color }) => {
  return (
    <Canvas camera={{ position: [0, 0, 3] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Head audioStream={outputAudioStream} shape={shape} color={color} />
      <OrbitControls />
    </Canvas>
  );
};