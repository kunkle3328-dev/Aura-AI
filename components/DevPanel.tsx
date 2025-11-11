
import React, { useState, useEffect } from "react";
import { DevConsoleCore } from "../utils/devConsole";

export default function DevPanel() {
  const [config, setConfig] = useState(DevConsoleCore.getConfig());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = DevConsoleCore.subscribe(setConfig);
    return unsub;
  }, []);

  const models: { [key: string]: string } = {
    deep: "gemini-2.5-pro",
    fast: "gemini-2.5-flash",
    creative: "gemini-2.5-flash"
  };

  const updateConfig = (key: string, value: any) => {
    switch (key) {
      case "tone":
        DevConsoleCore.handleCommand(`/set_tone ${value}`);
        break;
      case "model":
        DevConsoleCore.handleCommand(`/set_model ${value}`);
        break;
      case "persona":
        DevConsoleCore.handleCommand(`/persona ${value}`);
        break;
      case "voice":
        DevConsoleCore.handleCommand(`/toggle_voice`);
        break;
      default:
        break;
    }
  };
  
  const getModelAlias = (modelValue: string) => {
      return Object.keys(models).find(key => models[key] === modelValue) || 'deep';
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded-full bg-[var(--color-accent)] text-[var(--color-text-inverted)] font-semibold shadow-lg hover:opacity-90 transition-opacity"
        style={{ textShadow: 'none', boxShadow: 'var(--color-accent-glow-shadow)' }}
        aria-label="Toggle developer panel"
        aria-expanded={open}
      >
        ⚙️ Dev Panel
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-50 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] p-4 rounded-2xl shadow-2xl backdrop-blur-[var(--container-backdrop-blur)] border border-[var(--color-accent)] w-72 glass-container">
          <h3 className="text-lg font-semibold mb-3 text-[var(--color-accent)]">Aura AI Dev Controls</h3>

          <label className="block text-sm mb-1 text-[var(--color-text-secondary)]">Tone</label>
          <select
            value={config.tone}
            onChange={(e) => updateConfig("tone", e.target.value)}
            className="w-full mb-3 p-2 rounded bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:outline-none"
          >
            <option>calm</option>
            <option>assertive</option>
            <option>neutral</option>
            <option>friendly</option>
            <option>analytical</option>
          </select>

          <label className="block text-sm mb-1 text-[var(--color-text-secondary)]">Model (Text Chat)</label>
          <select
            value={getModelAlias(config.model)}
            onChange={(e) => updateConfig("model", e.target.value)}
            className="w-full mb-3 p-2 rounded bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:outline-none"
          >
            <option value="deep">Deep (Pro)</option>
            <option value="fast">Fast (Flash)</option>
            <option value="creative">Creative (Flash)</option>
          </select>

          <label className="block text-sm mb-1 text-[var(--color-text-secondary)]">Persona</label>
          <input
            type="text"
            value={config.persona}
            onChange={(e) => updateConfig("persona", e.target.value)}
            className="w-full mb-3 p-2 rounded bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:outline-none"
          />

          <label className="flex items-center mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.voiceEnabled}
              onChange={() => updateConfig("voice", null)}
              className="mr-2 w-4 h-4 rounded text-[var(--color-accent)] bg-[var(--color-bg-tertiary)] border-[var(--color-border)] focus:ring-[var(--color-focus-ring)]"
            />
            Voice Enabled
          </label>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => DevConsoleCore.handleCommand("/status", (msg) => alert(msg))}
              className="flex-1 py-2 bg-[var(--color-button-secondary-bg)] hover:bg-[var(--color-button-secondary-hover-bg)] rounded transition-colors"
            >
              Status
            </button>
            <button
              onClick={() => DevConsoleCore.handleCommand("/clear_memory", (msg) => alert(msg))}
              className="flex-1 py-2 bg-[var(--color-button-danger-bg)] hover:bg-[var(--color-button-danger-hover-bg)] rounded transition-colors"
            >
              Clear Memory
            </button>
          </div>
        </div>
      )}
    </>
  );
}
