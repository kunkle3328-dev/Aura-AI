import React from 'react';
/**
 * Renders a microphone icon.
 *
 * @param {React.SVGProps<SVGSVGElement>} props The SVG props.
 * @returns {React.ReactElement} The rendered icon.
 */
export const MicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
  </svg>
);
/**
 * Renders a stop icon.
 *
 * @param {React.SVGProps<SVGSVGElement>} props The SVG props.
 * @returns {React.ReactElement} The rendered icon.
 */
export const StopIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);
/**
 * Renders a user icon.
 *
 * @param {React.SVGProps<SVGSVGElement>} props The SVG props.
 * @returns {React.ReactElement} The rendered icon.
 */
export const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
/**
 * Renders the Aura AI logo icon.
 *
 * @param {React.SVGProps<SVGSVGElement>} props The SVG props.
 * @returns {React.ReactElement} The rendered icon.
 */
export const AuraIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <circle cx="12" cy="12" r="10" opacity="0.2"/>
        <circle cx="12" cy="12" r="6" />
        <path d="M12 7l-3 6h6z" fill="hsla(0,0%,100%,0.8)"/>
    </svg>
);
/**
 * Renders a camera icon.
 *
 * @param {React.SVGProps<SVGSVGElement>} props The SVG props.
 * @returns {React.ReactElement} The rendered icon.
 */
export const CameraIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
);
/**
 * Renders a camera-off icon.
 *
 * @param {React.SVGProps<SVGSVGElement>} props The SVG props.
 * @returns {React.ReactElement} The rendered icon.
 */
export const CameraOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="1" y1="1" x2="23" y2="23"></line>
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"></path>
    </svg>
);
/**
 * Renders a palette icon for theme selection.
 *
 * @param {React.SVGProps<SVGSVGElement>} props The SVG props.
 * @returns {React.ReactElement} The rendered icon.
 */
export const PaletteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2.69l.34.34a2 2 0 0 0 2.83 0l.34-.34a8 8 0 0 1 11.31 0l.34.34a2 2 0 0 0 0 2.83l-.34.34a8 8 0 0 1 0 11.31l-.34.34a2 2 0 0 0 0 2.83l.34.34a8 8 0 0 1-11.31 0l-.34-.34a2 2 0 0 0-2.83 0l-.34.34a8 8 0 0 1-11.31 0l-.34-.34a2 2 0 0 0 0-2.83l.34-.34a8 8 0 0 1 0-11.31l.34-.34a2 2 0 0 0 0-2.83l-.34-.34a8 8 0 0 1 11.31 0z"></path>
      <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"></path>
      <path d="m4.93 4.93 2.12 2.12"></path>
      <path d="m16.95 4.93-2.12 2.12"></path>
      <path d="m4.93 16.95 2.12-2.12"></path>
      <path d="m16.95 16.95-2.12-2.12"></path>
    </svg>
);
/**
 * Renders a search icon.
 *
 * @param {React.SVGProps<SVGSVGElement>} props The SVG props.
 * @returns {React.ReactElement} The rendered icon.
 */
export const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);
/**
 * Renders a link icon.
 *
 * @param {React.SVGProps<SVGSVGElement>} props The SVG props.
 * @returns {React.ReactElement} The rendered icon.
 */
export const LinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
);
/**
 * Renders a checkmark icon.
 *
 * @param {React.SVGProps<SVGSVGElement>} props The SVG props.
 * @returns {React.ReactElement} The rendered icon.
 */
export const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);
/**
 * Renders a new conversation icon.
 *
 * @param {React.SVGProps<SVGSVGElement>} props The SVG props.
 * @returns {React.ReactElement} The rendered icon.
 */
export const NewConversationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="16"></line>
      <line x1="8" y1="12" x2="16" y2="12"></line>
    </svg>
  );
/**
 * Renders a customize icon.
 *
 * @param {React.SVGProps<SVGSVGElement>} props The SVG props.
 * @returns {React.ReactElement} The rendered icon.
 */
export const CustomizeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m12 1-1.2 3.6-3.8.4 2.9 2.7-.7 3.8L12 10l3.4 2.5-.7-3.8 2.9-2.7-3.8-.4z"/>
        <path d="M5 22v-2"/>
        <path d="M9 22v-4"/>
        <path d="M15 22v-4"/>
        <path d="M19 22v-2"/>
    </svg>
);