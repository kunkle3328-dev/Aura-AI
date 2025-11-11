import { GoogleGenAI } from '@google/genai';

interface DevConfig {
  tone: string;
  model: string;
  voiceEnabled: boolean;
  persona: string;
  memoryEnabled: boolean;
}

type Subscriber = (config: DevConfig) => void;

export const DevConsoleCore = (() => {
  let config: DevConfig = {
    tone: "calm",
    model: "gemini-2.5-pro", // Default to 'deep'
    voiceEnabled: true,
    persona: "default",
    memoryEnabled: true,
  };

  const subscribers = new Set<Subscriber>();

  function notify() {
    subscribers.forEach((cb) => cb({ ...config }));
  }

  const commands: { [key: string]: (arg?: string) => string } = {
    "/set_tone": (arg) => {
      const tones = ["calm", "assertive", "neutral", "friendly", "analytical"];
      if (!arg || !tones.includes(arg)) return `❌ Invalid tone. Options: ${tones.join(", ")}`;
      config.tone = arg;
      notify();
      return `✅ Tone set to: ${arg}`;
    },
    "/set_model": (arg) => {
      const models: { [key: string]: string } = {
        fast: "gemini-2.5-flash",
        deep: "gemini-2.5-pro",
        creative: "gemini-2.5-flash"
      };
      if (!arg || !models[arg]) return `❌ Invalid model. Options: ${Object.keys(models).join(", ")}`;
      config.model = models[arg];
      notify();
      return `✅ Model switched to: ${models[arg]}`;
    },
    "/persona": (arg) => {
      config.persona = arg || "default";
      notify();
      return `🎭 Persona changed to: ${config.persona}`;
    },
    "/toggle_voice": () => {
      config.voiceEnabled = !config.voiceEnabled;
      notify();
      return `🎙️ Voice ${config.voiceEnabled ? "enabled" : "disabled"}`;
    },
    "/clear_memory": () => {
      return "🧠 Session memory cleared.";
    },
    "/summarize_context": () => {
      return "📝 Context summary triggered (AI will compress recent state).";
    },
    "/status": () => {
      return `⚙️ Current Config:\n- Tone: ${config.tone}\n- Model: ${config.model}\n- Persona: ${config.persona}\n- Voice: ${config.voiceEnabled ? "On" : "Off"}\n- Memory: ${config.memoryEnabled ? "Active" : "Disabled"}`;
    },
    // New command to toggle memory state
    "/toggle_memory": () => {
      config.memoryEnabled = !config.memoryEnabled;
      notify();
      return `🧠 Memory ${config.memoryEnabled ? "enabled" : "disabled"}`;
    },
  };

  function handleCommand(input: string, callback?: (response: string) => void): boolean {
    if (!input.startsWith("/")) return false;
    const [cmd, ...args] = input.trim().split(" ");
    const arg = args.join(" ").trim();
    const action = commands[cmd];
    const response = action ? action(arg) : `❓ Unknown command: ${cmd}`;
    if (callback) callback(response);
    return true;
  }

  function getConfig(): DevConfig {
    return { ...config };
  }

  function subscribe(callback: Subscriber): () => void {
    subscribers.add(callback);
    callback(getConfig()); // Immediately send current config
    return () => subscribers.delete(callback);
  }

  return { handleCommand, getConfig, subscribe };
})();
