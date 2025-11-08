import React, { useEffect, useRef } from 'react';
import { AvatarStyle, AVATAR_STYLES, AvatarTexture, AVATAR_TEXTURES, AvatarShape, AVATAR_SHAPES } from '../types';
import { CheckIcon } from './icons';
/**
 * Interface for the props of the AvatarCustomizationPanel component.
 */
interface AvatarCustomizationPanelProps {
  /** Whether the panel is open. */
  isOpen: boolean;
  /** Callback function to close the panel. */
  onClose: () => void;
  /** The current style of the avatar. */
  currentStyle: AvatarStyle;
  /** Callback function to change the avatar style. */
  onStyleChange: (style: AvatarStyle) => void;
  /** The current texture of the avatar's iris. */
  currentTexture: AvatarTexture;
  /** Callback function to change the avatar's iris texture. */
  onTextureChange: (texture: AvatarTexture) => void;
  /** The current 3D shape of the avatar. */
  currentShape: AvatarShape;
  /** Callback function to change the avatar's 3D shape. */
  onShapeChange: (shape: AvatarShape) => void;
  /** The current 3D color of the avatar. */
  currentColor: string;
  /** Callback function to change the avatar's 3D color. */
  onColorChange: (color: string) => void;
}
/**
 * A component that renders a section with a title for the customization panel.
 *
 * @param {{ title: string, children: React.ReactNode }} props The props for the component.
 * @returns {React.ReactElement} The rendered section.
 */
const CustomizationSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="px-2 text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">{title}</h3>
    <div className="mt-2 grid grid-cols-3 gap-2">
      {children}
    </div>
  </div>
);
/**
 * A panel that allows the user to customize the appearance of the avatar.
 * It provides options to change the avatar's style, texture, shape, and color.
 *
 * @param {AvatarCustomizationPanelProps} props The props for the component.
 * @returns {React.ReactElement | null} The rendered panel or null if it is not open.
 */
export const AvatarCustomizationPanel: React.FC<AvatarCustomizationPanelProps> = ({
  isOpen,
  onClose,
  currentStyle,
  onStyleChange,
  currentTexture,
  onTextureChange,
  currentShape,
  onShapeChange,
  currentColor,
  onColorChange,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  /**
   * Effect hook to handle clicks outside the panel to close it.
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={wrapperRef} className="absolute right-0 mt-2 w-72 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-xl z-20 backdrop-blur-[var(--container-backdrop-blur)] p-4">
      <div className="space-y-4">
        <CustomizationSection title="Core Form">
          {AVATAR_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => onStyleChange(style.id)}
              className={`p-2 rounded-lg text-center text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-secondary)] focus:ring-[var(--color-focus-ring)]
                ${currentStyle === style.id ? 'bg-[var(--color-accent)] text-[var(--color-text-inverted)]' : 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)]'}
              `}
            >
              {style.name}
            </button>
          ))}
        </CustomizationSection>

        <CustomizationSection title="Iris Texture">
          {AVATAR_TEXTURES.map((texture) => (
             <button
              key={texture.id}
              onClick={() => onTextureChange(texture.id)}
              className={`p-2 rounded-lg text-center text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-secondary)] focus:ring-[var(--color-focus-ring)]
                ${currentTexture === texture.id ? 'bg-[var(--color-accent)] text-[var(--color-text-inverted)]' : 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)]'}
              `}
            >
              {texture.name}
            </button>
          ))}
        </CustomizationSection>

        {currentStyle === 'talking' && (
          <>
            <CustomizationSection title="3D Shape">
              {AVATAR_SHAPES.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => onShapeChange(shape.id)}
                  className={`p-2 rounded-lg text-center text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-secondary)] focus:ring-[var(--color-focus-ring)]
                    ${currentShape === shape.id ? 'bg-[var(--color-accent)] text-[var(--color-text-inverted)]' : 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)]'}
                  `}
                >
                  {shape.name}
                </button>
              ))}
            </CustomizationSection>
            <CustomizationSection title="3D Color">
              <div className="col-span-3">
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="w-full h-10 p-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg cursor-pointer"
                />
              </div>
            </CustomizationSection>
          </>
        )}
      </div>
    </div>
  );
};