
import React from 'react';
import { PrebuiltVoice, PREBUILT_VOICES } from '../types';

interface VoiceSelectorProps {
  selectedVoice: PrebuiltVoice;
  onVoiceChange: (voice: PrebuiltVoice) => void;
  disabled: boolean;
}

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
