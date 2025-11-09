
import React from 'react';
import { ConnectionState } from '../types';
import { MicIcon, StopIcon, CameraIcon, CameraOffIcon, KeyboardIcon, SendIcon, SwitchCameraIcon } from './icons';

interface ControlBarProps {
  connectionState: ConnectionState;
  onStart: () => void;
  onStop: () => void;
  isCameraOn: boolean;
  onToggleCamera: () => void;
  cameraFacingMode: 'user' | 'environment';
  onToggleCameraFacingMode: () => void;
  inputMode: 'voice' | 'text';
  onToggleInputMode: () => void;
  onSendText: () => void;
  textInputValue: string;
  onTextInputChange: (value: string) => void;
  isTextModelThinking: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  connectionState,
  onStart,
  onStop,
  isCameraOn,
  onToggleCamera,
  cameraFacingMode,
  onToggleCameraFacingMode,
  inputMode,
  onToggleInputMode,
  onSendText,
  textInputValue,
  onTextInputChange,
  isTextModelThinking,
}) => {
  const isConnecting = connectionState === 'connecting';
  const isConnected = connectionState === 'connected';

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (textInputValue.trim() && !isTextModelThinking) {
            onSendText();
        }
    }
  };

  const buttonAction = isConnected ? onStop : onStart;
  const isMicDisabled = isConnecting;
  const isCameraDisabled = isConnected || isConnecting;
  const isSwitchCameraDisabled = !isCameraOn || isConnected || isConnecting;


  return (
    <div className="flex flex-col items-center space-y-3 w-full">
      {inputMode === 'voice' ? (
        <>
          <div className="flex items-center justify-center w-full max-w-sm mx-auto">
             {/* Left Controls */}
            <div className="flex-1 flex justify-end items-center space-x-4 pr-4">
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

              <button
                onClick={onToggleCameraFacingMode}
                disabled={isSwitchCameraDisabled}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 bg-[var(--color-button-secondary-bg)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] focus:ring-[var(--color-focus-ring)]
                ${isSwitchCameraDisabled ? 'cursor-not-allowed opacity-0 scale-50' : 'hover:bg-[var(--color-button-secondary-hover-bg)] opacity-100 scale-100'}
                `}
                aria-label="Switch camera"
              >
                  <SwitchCameraIcon className="w-8 h-8" />
              </button>
            </div>

            {/* Center Mic Button */}
            <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
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
            
            {/* Right Controls */}
            <div className="flex-1 flex justify-start items-center pl-4">
              <button
                onClick={onToggleInputMode}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 bg-[var(--color-button-secondary-bg)] hover:bg-[var(--color-button-secondary-hover-bg)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] focus:ring-[var(--color-focus-ring)]"
                aria-label="Switch to text input"
              >
                <KeyboardIcon className="w-8 h-8" />
              </button>
            </div>

          </div>
          <p className="text-[var(--color-text-secondary)] text-sm h-5">{getStatusText()}</p>
        </>
      ) : (
        <>
          <div className="flex items-center justify-center gap-4 w-full max-w-2xl mx-auto">
            <button
                onClick={onToggleInputMode}
                className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200 bg-[var(--color-button-secondary-bg)] hover:bg-[var(--color-button-secondary-hover-bg)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] focus:ring-[var(--color-focus-ring)]"
                aria-label="Switch to voice input"
            >
                <MicIcon className="w-8 h-8" />
            </button>
            <div className="relative w-full">
              <input
                type="text"
                value={textInputValue}
                onChange={(e) => onTextInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isTextModelThinking}
                className="w-full h-16 p-4 pr-20 rounded-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:outline-none transition-colors disabled:opacity-50"
              />
              <button
                onClick={onSendText}
                disabled={!textInputValue.trim() || isTextModelThinking}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center bg-[var(--color-button-primary-bg)] hover:bg-[var(--color-button-primary-hover-bg)] disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-tertiary)] focus:ring-[var(--color-focus-ring)]"
                aria-label="Send message"
              >
                {isTextModelThinking ? (
                     <div className="w-6 h-6 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                    <SendIcon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm h-5">
              {isTextModelThinking ? 'Aura is thinking...' : 'Press Enter to send'}
          </p>
        </>
      )}
    </div>
  );
};
