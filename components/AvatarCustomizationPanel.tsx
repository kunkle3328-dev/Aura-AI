import React, { useEffect, useRef } from 'react';
import { AvatarStyle, AVATAR_STYLES, AvatarTexture, AVATAR_TEXTURES, AvatarShape, AVATAR_SHAPES } from '../types';
import { CheckIcon } from './icons';

interface AvatarCustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentStyle: AvatarStyle;
  onStyleChange: (style: AvatarStyle) => void;
  currentTexture: AvatarTexture;
  onTextureChange: (texture: AvatarTexture) => void;
  currentShape: AvatarShape;
  onShapeChange: (shape: AvatarShape) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
}

const CustomizationSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="px-2 text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">{title}</h3>
    <div className="mt-2 grid grid-cols-3 gap-2">
      {children}
    </div>
  </div>
);

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