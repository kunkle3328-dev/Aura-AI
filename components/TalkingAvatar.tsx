import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarShape } from '../types';

const Head = ({ audioStream, shape, color }: { audioStream: MediaStream | null, shape: AvatarShape, color: string }) => {
  const mouthRef = useRef<THREE.Mesh>(null!);
  const analyser = useRef<THREE.AudioAnalyser | null>(null);

  useEffect(() => {
    if (audioStream) {
      const audioContext = new THREE.AudioContext();
      const audio = new THREE.Audio(new THREE.AudioListener());
      const source = audioContext.createMediaStreamSource(audioStream);
      audio.setNodeSource(source as unknown as AudioBufferSourceNode);
      analyser.current = new THREE.AudioAnalyser(audio, 32);
    }
  }, [audioStream]);

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

interface TalkingAvatarProps {
  outputAudioStream: MediaStream | null;
  shape: AvatarShape;
  color: string;
}

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
