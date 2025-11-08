
/**
 * Represents the speaker of a transcript entry, either 'user' or 'model'.
 * @typedef {'user' | 'model'} Speaker
 */
export type Speaker = 'user' | 'model';
/**
 * Represents a citation for a transcript entry.
 * @interface
 */
export interface Citation {
  /** The URI of the citation. */
  uri: string;
  /** The title of the citation. */
  title: string;
}
/**
 * Represents a single entry in the conversation transcript.
 * @interface
 */
export interface TranscriptEntry {
  /** The speaker of the entry. */
  speaker: Speaker;
  /** The text of the entry. */
  text: string;
  /** A unique identifier for the entry. */
  id: string;
  /** An optional array of citations for the entry. */
  citations?: Citation[];
}
/**
 * Represents the state of the connection to the Gemini API.
 * @typedef {'idle' | 'connecting' | 'connected' | 'error' | 'closed'} ConnectionState
 */
export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error' | 'closed';
/**
 * Represents the interim transcript, which contains the current user and model speech.
 * @interface
 */
export interface InterimTranscript {
    /** The interim transcript for the user. */
    user: string;
    /** The interim transcript for the model. */
    model: string;
}

/**
 * The core voices supported by the gemini-2.5-flash-native-audio-preview-09-2025 model.
 * @typedef {'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'} PrebuiltVoice
 */
export type PrebuiltVoice = 
  | 'Puck'
  | 'Charon'
  | 'Kore'
  | 'Fenrir'
  | 'Zephyr';
/**
 * An array of the available prebuilt voices.
 * @const {PrebuiltVoice[]}
 */
export const PREBUILT_VOICES: PrebuiltVoice[] = [
  'Puck', 
  'Charon', 
  'Kore', 
  'Fenrir', 
  'Zephyr',
];
/**
 * Represents the available themes for the application.
 * @typedef {'theme-aura-dark' | 'theme-neon-matrix' | 'theme-arctic-light' | 'theme-solar-flare' | 'theme-cosmic-lilac' | 'theme-quantum-glow' | 'theme-crystal-clear' | 'theme-midnight-sun' | 'theme-emerald-depth' | 'theme-supernova' | 'theme-aetherium-wave' | 'theme-neuro-circuit'} Theme
 */
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
/**
 * Represents a theme option.
 * @interface
 */
export interface ThemeOption {
  /** The ID of the theme. */
  id: Theme;
  /** The name of the theme. */
  name: string;
  /** An array of colors used in the theme. */
  colors: string[];
}
/**
 * An array of the available theme options.
 * @const {ThemeOption[]}
 */
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

/**
 * Defines the possible expressive states of the AI avatar.
 * @typedef {'neutral' | 'positive' | 'inquisitive' | 'empathetic' | 'celebratory'} ModelExpression
 */
export type ModelExpression = 'neutral' | 'positive' | 'inquisitive' | 'empathetic' | 'celebratory';

/**
 * Defines the possible animation states of the AI avatar.
 * @typedef {'idle' | 'listening' | 'thinking' | 'speaking'} AvatarState
 */
export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

// -- AVATAR CUSTOMIZATION --
/**
 * Represents the available styles for the avatar.
 * @typedef {'crystal' | 'orb' | 'circuit' | 'talking'} AvatarStyle
 */
export type AvatarStyle = 'crystal' | 'orb' | 'circuit' | 'talking';
/**
 * An array of the available avatar styles.
 * @const {{id: AvatarStyle, name: string}[]}
 */
export const AVATAR_STYLES: { id: AvatarStyle; name: string }[] = [
  { id: 'crystal', name: 'Crystal' },
  { id: 'orb', name: 'Orb' },
  { id: 'circuit', name: 'Circuit' },
  { id: 'talking', name: '3D Head' },
];
/**
 * Represents the available shapes for the 3D avatar.
 * @typedef {'sphere' | 'cube'} AvatarShape
 */
export type AvatarShape = 'sphere' | 'cube';
/**
 * An array of the available 3D avatar shapes.
 * @const {{id: AvatarShape, name: string}[]}
 */
export const AVATAR_SHAPES: { id: AvatarShape; name: string }[] = [
  { id: 'sphere', name: 'Sphere' },
  { id: 'cube', name: 'Cube' },
];
/**
 * Represents the available textures for the avatar's iris.
 * @typedef {'nebula' | 'matrix' | 'energy' | 'circuit' | 'glitch' | 'binary' | 'plasma'} AvatarTexture
 */
export type AvatarTexture = 'nebula' | 'matrix' | 'energy' | 'circuit' | 'glitch' | 'binary' | 'plasma';
/**
 * An array of the available avatar iris textures.
 * @const {{id: AvatarTexture, name: string}[]}
 */
export const AVATAR_TEXTURES: { id: AvatarTexture; name: string }[] = [
  { id: 'nebula', name: 'Nebula' },
  { id: 'matrix', name: 'Matrix' },
  { id: 'energy', name: 'Energy' },
  { id: 'circuit', name: 'Circuit' },
  { id: 'glitch', name: 'Glitch' },
  { id: 'binary', name: 'Binary' },
  { id: 'plasma', name: 'Plasma' },
];