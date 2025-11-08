import React from 'react';
import { ConnectionState } from '../types';
import { MicIcon, StopIcon, CameraIcon, CameraOffIcon } from './icons';
/**
 * Interface for the props of the ControlBar component.
 */
interface ControlBarProps {
  /** The current state of the connection. */
  connectionState: ConnectionState;
  /** Callback function to start the connection. */
  onStart: () => void;
  /** Callback function to stop the connection. */
  onStop: () => void;
  /** Whether the camera is currently on. */
  isCameraOn: boolean;
  /** Callback function to toggle the camera. */
  onToggleCamera: () => void;
}
/**
 * A component that provides controls for the user to start and stop the conversation,
 * as well as toggle the camera. It also displays the current connection status.
 *
 * @param {ControlBarProps} props The props for the component.
 * @returns {React.ReactElement} The rendered control bar.
 */
export const ControlBar: React.FC<ControlBarProps> = ({
  connectionState,
  onStart,
  onStop,
  isCameraOn,
  onToggleCamera,
}) => {
  const isConnecting = connectionState === 'connecting';
  const isConnected = connectionState === 'connected';
  /**
   * Returns the appropriate status text based on the current connection state.
   *
   * @returns {string} The status text.
   */
  const getStatusText = () => {
    switch (connectionState) {
      case 'idle':
        return 'Tap to start';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Listening...';
      case 'closed':
        return 'Conversation ended';
      case 'error':
        return 'Connection error';
      default:
        return '';
    }
  };

  const buttonAction = isConnected ? onStop : onStart;
  const isMicDisabled = isConnecting;
  const isCameraDisabled = isConnected || isConnecting;

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="flex items-center justify-center space-x-8 w-full max-w-xs mx-auto">
        <button
          onClick={onToggleCamera}
          disabled={isCameraDisabled}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] focus:ring-[var(--color-focus-ring)]
            ${isCameraOn ? 'bg-[var(--color-button-primary-bg)] shadow-[var(--color-accent-glow-shadow)]' : 'bg-[var(--color-button-secondary-bg)]'}
            ${isCameraDisabled ? 'cursor-not-allowed opacity-50' : isCameraOn ? 'hover:bg-[var(--color-button-primary-hover-bg)]' : 'hover:bg-[var(--color-button-secondary-hover-bg)]'}
          `}
          aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraOn ? <CameraIcon className="w-8 h-8" /> : <CameraOffIcon className="w-8 h-8" />}
        </button>

        <div className="relative w-20 h-20 flex items-center justify-center">
          {isConnected && (
            <div className="absolute w-full h-full rounded-full bg-[var(--color-button-danger-bg)] animate-ping opacity-75"></div>
          )}
          <button
            onClick={buttonAction}
            disabled={isMicDisabled}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-[var(--color-focus-ring)] focus:ring-opacity-50
              ${isConnected ? 'bg-[var(--color-button-danger-bg)] hover:bg-[var(--color-button-danger-hover-bg)] shadow-[var(--color-accent-glow-shadow)]' : 'bg-[var(--color-button-primary-bg)] hover:bg-[var(--color-button-primary-hover-bg)]'}
              ${isMicDisabled ? 'cursor-not-allowed bg-[var(--color-bg-tertiary)]' : ''}
            `}
            aria-label={isConnected ? 'Stop conversation' : 'Start conversation'}
          >
            {isConnecting && (
              <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-white animate-spin"></div>
            )}
            {!isConnecting && (isConnected ? <StopIcon className="w-10 h-10" /> : <MicIcon className="w-10 h-10" />)}
          </button>
        </div>
        
        {/* Placeholder for alignment */}
        <div className="w-16 h-16"></div>
      </div>
      <p className="text-[var(--color-text-secondary)] text-sm h-5">{getStatusText()}</p>
    </div>
  );
};