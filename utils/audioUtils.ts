// The Gemini API expects an object with this structure for media blobs.
// The previous import of `Blob` from '@google/genai' is no longer valid.
export interface GeminiBlob {
  data: string;
  mimeType: string;
}

// Base64 decoding
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Converts raw PCM audio data into a WAV file format.
 * The HTML <audio> element cannot play raw PCM, so it needs a container like WAV.
 * @param pcmData The raw audio data (as Uint8Array).
 * @param sampleRate The sample rate of the audio.
 * @param numChannels The number of audio channels.
 * @param bitsPerSample The number of bits per sample (e.g., 16).
 * @returns A Blob representing the WAV file.
 */
export function pcmToWav(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: number): Blob {
  const format = 1; // PCM
  const subChunk1Size = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const subChunk2Size = pcmData.byteLength;
  const chunkSize = 36 + subChunk2Size;

  const buffer = new ArrayBuffer(44 + pcmData.byteLength);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, chunkSize, true);
  writeString(view, 8, 'WAVE');
  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, subChunk1Size, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, subChunk2Size, true);

  // Write PCM data
  new Uint8Array(buffer, 44).set(pcmData);

  return new Blob([view], { type: 'audio/wav' });
}


// Base64 encoding
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Create a GeminiBlob object for the Gemini API from raw audio data
export function createBlob(data: Float32Array): GeminiBlob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
}
