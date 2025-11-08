
import React from 'react';
import { PrebuiltVoice, PREBUILT_VOICES } from '../types';
/**
 * Interface for the props of the VoiceSelector component.
 */
interface VoiceSelectorProps {
  /** The currently selected voice. */
  selectedVoice: PrebuiltVoice;
  /** Callback function to be called when a new voice is selected. */
  onVoiceChange: (voice: PrebuiltVoice) => void;
  /** Whether the voice selector is disabled. */
  disabled: boolean;
}
/**
 * A component that allows the user to select a prebuilt voice for the model's speech.
 *
 * @param {VoiceSelectorProps} props The props for the component.
 * @returns {React.ReactElement} The rendered voice selector.
 */
export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onVoiceChange, disabled }) => {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="voice-select" className="text-sm font-medium text-[var(--color-text-secondary)]">
        Voice:
      </label>
      <select
        id="voice-select"
        value={selectedVoice}
        onChange={(e) => onVoiceChange(e.target.value as PrebuiltVoice)}
        disabled={disabled}
        className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-lg focus:ring-[var(--color-focus-ring)] focus:border-[var(--color-accent)] block w-full p-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {PREBUILT_VOICES.map((voice) => (
          <option key={voice} value={voice}>
            {voice}
          </option>
        ))}
      </select>
    </div>
  );
};
