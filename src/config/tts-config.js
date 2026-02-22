/**
 * TTS Provider Configuration
 * 
 * Defines available voices and settings for each TTS provider.
 * Piper (local) is default, Coqui is secondary, OpenAI is premium fallback.
 */

export const TTS_PROVIDERS = {
  piper: {
    name: 'Piper',
    type: 'local',
    description: 'Fast local neural TTS - offline capable',
    available: false, // Set to true after installation
    voices: [
      // Some common Piper voices (install additional models as needed)
      { id: 'en_US-amy-medium', name: 'Amy (medium)', lang: 'en-US' },
      { id: 'en_US-arpa-x-low', name: 'Arpa (x-low)', lang: 'en-US' },
      { id: 'en_US-bryce-medium', name: 'Bryce (medium)', lang: 'en-US' },
      { id: 'en_US-danny-low', name: 'Danny (low)', lang: 'en-US' },
      { id: 'en_US-graham-medium', name: 'Graham (medium)', lang: 'en-US' },
      { id: 'en_US-hfc-female-medium', name: 'HFC Female (medium)', lang: 'en-US' },
      { id: 'en_US-jarvis-medium', name: 'Jarvis (medium)', lang: 'en-US' },
      { id: 'en_US-kristin-medium', name: 'Kristin (medium)', lang: 'en-US' },
      { id: 'en_US-lessac-medium', name: 'Lessac (medium)', lang: 'en-US' },
      { id: 'en_US-libritts-high', name: 'Libritts (high)', lang: 'en-US' },
      { id: 'en_US-ljspeech-high', name: 'LJ Speech (high)', lang: 'en-US' },
    ],
    defaultVoice: 'en_US-lessac-medium',
    speechRate: 1.0,
    installCommand: 'pip install piper-tts',
    downloadModels: 'piper --download en_US-lessac-medium',
  },

  coqui: {
    name: 'Coqui TTS',
    type: 'local',
    description: 'Flexible neural TTS with multiple models',
    available: false, // Set to true after installation
    voices: [
      { id: 'default', name: 'Default (Glow-TTS)', lang: 'en-US' },
      { id: 'glow-tts', name: 'Glow-TTS', lang: 'en-US' },
      { id: 'tacotron2', name: 'Tacotron2', lang: 'en-US' },
      { id: 'glow-tts-de', name: 'Glow-TTS (German)', lang: 'de-DE' },
    ],
    defaultVoice: 'glow-tts',
    speechRate: 1.0,
    installCommand: 'pip install TTS',
    modelDownload: 'python -m TTS.cli.manage --model glow-tts --action download',
  },

  openai: {
    name: 'OpenAI TTS',
    type: 'cloud',
    description: 'Premium cloud TTS with natural voices',
    available: true, // Always available if API key present
    voices: [
      { id: 'alloy', name: 'Alloy', lang: 'en-US' },
      { id: 'echo', name: 'Echo', lang: 'en-US' },
      { id: 'fable', name: 'Fable', lang: 'en-US' },
      { id: 'onyx', name: 'Onyx', lang: 'en-US' },
      { id: 'nova', name: 'Nova', lang: 'en-US' },
      { id: 'shimmer', name: 'Shimmer', lang: 'en-US' },
    ],
    defaultVoice: 'onyx',
    speechRate: 1.0,
    apiKeyEnv: 'OPENAI_API_KEY',
    requiresAuth: true,
  },
};

/**
 * Get available TTS providers
 * @returns {string[]} Array of provider names that are available
 */
export function getAvailableProviders() {
  return Object.keys(TTS_PROVIDERS).filter(
    key => TTS_PROVIDERS[key].available === true
  );
}

/**
 * Get voices for a specific provider
 * @param {string} provider - Provider name
 * @returns {Array} Array of voice objects
 */
export function getVoicesForProvider(provider) {
  const config = TTS_PROVIDERS[provider];
  return config ? config.voices : [];
}

/**
 * Get default voice for a provider
 * @param {string} provider - Provider name
 * @returns {string} Default voice ID
 */
export function getDefaultVoiceForProvider(provider) {
  const config = TTS_PROVIDERS[provider];
  return config ? config.defaultVoice : null;
}

export default TTS_PROVIDERS;
