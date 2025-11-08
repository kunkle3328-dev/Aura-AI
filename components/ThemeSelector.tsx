import React, { useState, useRef, useEffect } from 'react';
import { Theme, THEMES } from '../types';
import { PaletteIcon, CheckIcon } from './icons';
/**
 * Interface for the props of the ThemeSelector component.
 */
interface ThemeSelectorProps {
  /** The currently selected theme. */
  currentTheme: Theme;
  /** Callback function to be called when a new theme is selected. */
  onThemeChange: (theme: Theme) => void;
}
/**
 * A component that allows the user to select a theme for the application.
 *
 * @param {ThemeSelectorProps} props The props for the component.
 * @returns {React.ReactElement} The rendered theme selector.
 */
export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  /**
   * Effect hook to handle clicks outside the theme selector to close it.
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  /**
   * Handles the selection of a new theme.
   *
   * @param {Theme} themeId The ID of the selected theme.
   */
  const handleThemeSelect = (themeId: Theme) => {
    onThemeChange(themeId);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] focus:ring-[var(--color-focus-ring)]"
        aria-label="Select theme"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <PaletteIcon className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-xl z-20 backdrop-blur-[var(--container-backdrop-blur)] p-2">
          <div className="p-2 text-sm font-semibold text-[var(--color-text-strong)]">Select Theme</div>
          <div className="grid grid-cols-2 gap-2 p-2">
            {THEMES.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-secondary)] focus:ring-[var(--color-focus-ring)]
                    ${isSelected ? 'ring-2 ring-[var(--color-accent)]' : 'hover:bg-[var(--color-bg-tertiary)]'}
                  `}
                  aria-pressed={isSelected}
                >
                  <div className="relative w-16 h-10 rounded-md overflow-hidden border border-[var(--color-border)] flex pointer-events-none">
                    <div className="w-1/3 h-full" style={{ backgroundColor: theme.colors[0] }}></div>
                    <div className="w-1/3 h-full" style={{ backgroundColor: theme.colors[1] }}></div>
                    <div className="w-1/3 h-full" style={{ backgroundColor: theme.colors[2] }}></div>
                  </div>
                  <span className="mt-2 text-xs font-medium text-[var(--color-text-primary)] pointer-events-none">{theme.name}</span>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-[var(--color-accent)] rounded-full flex items-center justify-center text-[var(--color-text-inverted)] pointer-events-none">
                      <CheckIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};