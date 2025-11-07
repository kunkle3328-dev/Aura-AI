

export type Speaker = 'user' | 'model';

export interface Citation {
  uri: string;
  title: string;
}

export interface TranscriptEntry {
  speaker: Speaker;
  text: string;
  id: string;
  citations?: Citation[];
}

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error' | 'closed';

export interface InterimTranscript {
    user: string;
    model: string;
}

// The core voices supported by the gemini-2.5-flash-native-audio-preview-09-2025 model.
export type PrebuiltVoice = 
  | 'Puck'
  | 'Charon'
  | 'Kore'
  | 'Fenrir'
  | 'Zephyr';

export const PREBUILT_VOICES: PrebuiltVoice[] = [
  'Puck', 
  'Charon', 
  'Kore', 
  'Fenrir', 
  'Zephyr',
];

export type Theme = 
  | 'theme-aura-dark' 
  | 'theme-neon-matrix' 
  | 'theme-arctic-light' 
  | 'theme-solar-flare' 
  | 'theme-cosmic-lilac'
  | 'theme-quantum-glow'
  | 'theme-crystal-clear'
  | 'theme-midnight-sun'
  | 'theme-emerald-depth'
  | 'theme-supernova'
  | 'theme-aetherium-wave'
  | 'theme-neuro-circuit';

export interface ThemeOption {
  id: Theme;
  name: string;
  colors: string[];
}

export const THEMES: ThemeOption[] = [
  { id: 'theme-aura-dark', name: 'Aura Dark', colors: ['#2563eb', '#374151', '#60a5fa'] },
  { id: 'theme-neon-matrix', name: 'Neon Matrix', colors: ['#1a472a', '#0b1d12', '#39ff14'] },
  { id: 'theme-arctic-light', name: 'Arctic Light', colors: ['#0891b2', '#e5e7eb', '#0891b2'] },
  { id: 'theme-solar-flare', name: 'Solar Flare', colors: ['#f97316', '#44403c', '#fcd34d'] },
  { id: 'theme-cosmic-lilac', name: 'Cosmic Lilac', colors: ['#7c3aed', '#4338ca', '#c4b5fd'] },
  { id: 'theme-quantum-glow', name: 'Quantum Glow', colors: ['#00f6ff', 'rgba(28, 52, 70, 0.4)', '#82a0b9'] },
  { id: 'theme-crystal-clear', name: 'Crystal Clear', colors: ['#374151', 'rgba(255, 255, 255, 0.4)', '#6b7280'] },
  { id: 'theme-midnight-sun', name: 'Midnight Sun', colors: ['#ff4500', 'rgba(40, 40, 40, 0.4)', '#a1a1aa'] },
  { id: 'theme-emerald-depth', name: 'Emerald Depth', colors: ['#32cd32', 'rgba(4, 38, 20, 0.4)', '#74a88b'] },
  { id: 'theme-supernova', name: 'Supernova', colors: ['#ff00ff', 'rgba(76, 52, 148, 0.4)', '#b0a5f0'] },
  { id: 'theme-aetherium-wave', name: 'Aetherium Wave', colors: ['#5eead4', 'rgba(49, 46, 129, 0.3)', '#818cf8'] },
  { id: 'theme-neuro-circuit', name: 'Neuro-Circuit', colors: ['#FF0D0D', '#010108', '#006EFF'] },
];

// Defines the possible expressive states of the AI avatar.
export type ModelExpression = 'neutral' | 'positive' | 'inquisitive' | 'empathetic' | 'celebratory';