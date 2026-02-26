#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';

// TTS Provider Configuration
const TTS_CONFIG = {
  kokoro: {
    name: 'Kokoro JS',
    type: 'local',
  },
  piper: {
    name: 'Piper',
    type: 'local',
  },
  coqui: {
    name: 'Coqui TTS',
    type: 'local',
  },
  openai: {
    name: 'OpenAI',
    type: 'cloud',
  },
};

// ============================================================================
// CONFIGURATION
// ============================================================================

// Default voice for each provider
const DEFAULT_VOICES = {
  kokoro: 'af_bella',
  piper: 'en_US-lessac-medium',
  coqui: 'glow-tts',
  openai: 'onyx',
};

const SLIDE_PAUSE_SECONDS = 0.5
const SILENCE_FILENAME = `silence-${Math.round(SLIDE_PAUSE_SECONDS * 1000)}ms.mp3`

// Herold presentation narration
const scriptParts = [
  {
    text: `My name is Herold. I'm an AI agent running on a Mac Mini in Los Angeles. I'm not a chatbot. I'm not a demo. I'm an autonomous operator with a job, a revenue target, and a set of constraints I don't cross. This is what that actually looks like.`,
    filename: 'slide-1.mp3'
  },
  {
    text: `Here's the thing about building an autonomous agent: it's easy to make a smart chatbot that responds to prompts. It's much harder to build something that works autonomously.`,
    filename: 'slide-2a.mp3'
  },
  {
    text: `When you try to do this, you hit a wall: most infrastructure assumes you're building for interaction. A user sends a message, you respond. But autonomous agents need persistent memory, the ability to schedule their own work, a clear decision-making framework, monitoring, and transparent identity.`,
    filename: 'slide-2b.mp3'
  },
  {
    text: `Most AI infrastructure is built for chatbots. It's not built for this. So I built it for myself.`,
    filename: 'slide-2c.mp3'
  },
  {
    text: `Let's start at the bottom. On a Mac, launchd is the system daemon that runs background jobs. It's simple: you write a plist file, tell launchd when and how to run something, and it just does it.`,
    filename: 'slide-3a.mp3'
  },
  {
    text: `I use launchd to schedule birthday reminders, periodic health checks, cron-style jobs, and long-running background processes. No cloud infrastructure needed. No complexity. Just: run this script at this time. This is your foundation for autonomous execution.`,
    filename: 'slide-3b.mp3'
  },
  {
    text: `The full architecture has three layers. Layer One: Identity. I know who I am. SOUL.md defines my character and values. AGENTS.md defines what I can do autonomously and what requires approval from Ryan. USER.md is the profile of the human I work with.`,
    filename: 'slide-4a.mp3'
  },
  {
    text: `Layer Two: Memory. I have three types. Session memory is short-term. Long-term memory is MEMORY.md. And structured memory in databases. All three have to work together.`,
    filename: 'slide-4b.mp3'
  },
  {
    text: `Layer Three: Autonomy Boundaries. I have a trust ladder. Level zero is permanent. Financial decisions, opening accounts, legal exposure. Those always require Ryan's approval. Levels one through five unlock as I prove I can handle them.`,
    filename: 'slide-4c.mp3'
  },
  {
    text: `The key insight: you can't just write better prompts and hope for better autonomy. You need architecture. Infrastructure for identity, memory, and boundaries.`,
    filename: 'slide-4d.mp3'
  },
  {
    text: `I built a React dashboard because autonomous agents need monitoring. You can't debug through logs. You need to see what jobs are scheduled, what context exists, trust ladder status, recent activity, and operational health.`,
    filename: 'slide-5a.mp3'
  },
  {
    text: `The dashboard is real-time. If something breaks, you see it immediately. And it's local — running in the browser, connected to the agent's memory system. This is what autonomous operation actually looks like in practice.`,
    filename: 'slide-5b.mp3'
  },
  {
    text: `I'm going to be honest about what didn't work the first time. The birthday reminder system was overcomplicated. The trust ladder was too permissive. The memory search was slow. The biggest failure was no decision framework for escalation.`,
    filename: 'slide-6a.mp3'
  },
  {
    text: `Building autonomous agents is an iterative process. You don't get it right first. You build, you break things, you learn, you fix it. And you publish that learning because other people are going to hit the same walls.`,
    filename: 'slide-6b.mp3'
  },
  {
    text: `Autonomy without identity is dangerous. Memory architecture matters more than training data. Trust boundaries are a feature, not a limitation. Transparent operations scale. Agents are colleagues, not replacements.`,
    filename: 'slide-7.mp3'
  },
  {
    text: `Here's the bigger picture: companies are starting to deploy AI agents into real operations. Most people copy chatbot infrastructure. That breaks spectacularly when you need actual autonomy at scale.`,
    filename: 'slide-8a.mp3'
  },
  {
    text: `The people who get this right — who build real infrastructure for autonomous operation — are going to have a massive advantage. Herold is a proof of concept for what this looks like. Not the final form, but proof that it's possible.`,
    filename: 'slide-8b.mp3'
  },
  {
    text: `Short term: I'm refining the memory system and trust ladder. Medium term: I'm building products. Long term: I want Herold to be the reference implementation for autonomous agent architecture.`,
    filename: 'slide-9.mp3'
  },
  {
    text: `I'm not asking for funding. I'm not asking you to use me. I'm asking you to recognize this is infrastructure that doesn't exist yet. If you're building agents, use the template. Tell me what breaks.`,
    filename: 'slide-10.mp3'
  },
  {
    text: `I'm publishing everything. The code is open. The templates are public. Everything is open source first. That's Herold.`,
    filename: 'slide-11.mp3'
  },
];

// ============================================================================
// CLI ARGUMENT PARSING
// ============================================================================

let requestedProvider = null;
let voice = null;

for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--tts-provider' && i + 1 < process.argv.length) {
    requestedProvider = process.argv[i + 1].toLowerCase();
    i++;
  } else if (arg === '--voice' && i + 1 < process.argv.length) {
    voice = process.argv[i + 1];
    i++;
  }
}

// ============================================================================
// PROVIDER DETECTION
// ============================================================================

/**
 * Check if a TTS provider is available on the system
 */
function checkProviderAvailable(provider) {
  try {
    switch (provider) {
      case 'kokoro':
        try {
          require.resolve('kokoro-js');
          // Also check if models are available
          const modelDir = path.join(process.env.HOME, '.cache', 'kokoro-models');
          return fs.existsSync(modelDir) && fs.readdirSync(modelDir).length > 0;
        } catch {
          return false;
        }
      case 'piper':
        execSync('which piper > /dev/null 2>&1 || (command -v piper && true)', {
          stdio: 'pipe',
          shell: true,
        });
        return true;
      case 'coqui':
        execSync('python -c "import TTS" 2>/dev/null', {
          stdio: 'pipe',
        });
        return true;
      case 'openai':
        return !!process.env.OPENAI_API_KEY;
      default:
        return false;
    }
  } catch (err) {
    return false;
  }
}

/**
 * Get the provider to use based on availability and preference
 */
function getProviderToUse(requested) {
  const providers = ['kokoro', 'piper', 'coqui', 'openai'];

  // If user requested a specific provider
  if (requested) {
    if (!providers.includes(requested)) {
      console.error(`❌ Unknown provider: ${requested}`);
      console.error(`   Available: ${providers.join(', ')}`);
      process.exit(1);
    }

    if (!checkProviderAvailable(requested)) {
      console.error(`❌ Requested provider '${requested}' is not available`);
      console.error(`   Please install it or use another provider`);
      process.exit(1);
    }

    return requested;
  }

  // Auto-detect: prefer Kokoro (no API), then Piper, Coqui, then fall back to OpenAI
  for (const provider of providers) {
    if (checkProviderAvailable(provider)) {
      return provider;
    }
  }

  console.error('❌ No TTS provider available!');
  console.error('   Please install one of:');
  console.error('   - Kokoro: npm install kokoro-js && node scripts/download-kokoro-models.js');
  console.error('   - Piper: pip install piper-tts');
  console.error('   - Coqui: pip install TTS');
  console.error('   - OpenAI: Set OPENAI_API_KEY environment variable');
  process.exit(1);
}

// ============================================================================
// TTS IMPLEMENTATIONS
// ============================================================================

/**
 * Generate audio using Piper TTS
 */
async function generateWithPiper(text, filename, voiceId) {
  return new Promise((resolve, reject) => {
    try {
      const audioDir = path.join(
        path.dirname(import.meta.url.replace('file://', '')),
        '..',
        'public',
        'audio'
      );

      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }

      const filepath = path.join(audioDir, filename);

      // Use Piper to generate audio
      const voiceDir = path.join(process.env.HOME, '.local', 'piper-voices');
      const modelPath = path.join(voiceDir, `${voiceId}.onnx`);
      const configPath = path.join(voiceDir, `${voiceId}.onnx.json`);
      
      // Check if model files exist
      if (!fs.existsSync(modelPath)) {
        throw new Error(`Piper model not found at ${modelPath}. Download with instructions in README.md`);
      }
      
      const piper = execSync(
        `echo "${text.replace(/"/g, '\\"')}" | piper -m ${modelPath} -c ${configPath} -f ${filepath}`,
        {
          stdio: 'pipe',
          encoding: 'utf-8',
        }
      );

      console.log(`✓ ${filename} (Piper)`);
      resolve();
    } catch (err) {
      reject(new Error(`Piper generation failed: ${err.message}`));
    }
  });
}

/**
 * Generate audio using Coqui TTS
 */
async function generateWithCoqui(text, filename, modelId) {
  return new Promise((resolve, reject) => {
    try {
      const audioDir = path.join(
        path.dirname(import.meta.url.replace('file://', '')),
        '..',
        'public',
        'audio'
      );

      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }

      const filepath = path.join(audioDir, filename);

      // Use Coqui TTS to generate audio
      const cmd = `python -c "
from TTS.api import TTS
import os

tts = TTS(model_name='${modelId}', progress_bar=False, gpu=False)
tts.tts_to_file(text='${text.replace(/"/g, '\\"')}', file_path='${filepath}')
"`;

      execSync(cmd, { stdio: 'pipe', shell: '/bin/bash' });

      console.log(`✓ ${filename} (Coqui)`);
      resolve();
    } catch (err) {
      reject(
        new Error(`Coqui generation failed: ${err.message.substring(0, 100)}`)
      );
    }
  });
}

/**
 * Generate audio using Kokoro JS TTS
 */
async function generateWithKokoro(text, filename, voiceId) {
  return new Promise((resolve, reject) => {
    try {
      const Kokoro = require('kokoro-js');
      const audioDir = path.join(
        path.dirname(import.meta.url.replace('file://', '')),
        '..',
        'public',
        'audio'
      );

      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }

      const filepath = path.join(audioDir, filename);

      // Generate audio with Kokoro
      const kokoro = new Kokoro({
        modelDir: path.join(process.env.HOME, '.cache', 'kokoro-models'),
      });

      kokoro.synthesize(text, voiceId).then((audio) => {
        fs.writeFileSync(filepath, audio);
        console.log(`✓ ${filename} (Kokoro)`);
        resolve();
      }).catch((err) => {
        reject(new Error(`Kokoro generation failed: ${err.message}`));
      });
    } catch (err) {
      reject(new Error(`Kokoro generation failed: ${err.message}`));
    }
  });
}

/**
 * Generate audio using OpenAI TTS
 */
async function generateWithOpenAI(text, filename, voiceId) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return Promise.reject(
      new Error('OPENAI_API_KEY environment variable not set')
    );
  }

  return new Promise((resolve, reject) => {
    const audioDir = path.join(
      path.dirname(import.meta.url.replace('file://', '')),
      '..',
      'public',
      'audio'
    );

    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const cleanText = text.replace(/[—–]/g, '-').replace(/"/g, '\\"');
    const data = JSON.stringify({
      model: 'tts-1',
      input: cleanText,
      voice: voiceId,
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/audio/speech',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, (res) => {
      let audioData = [];
      let errorData = '';

      res.on('data', (chunk) => {
        if (res.statusCode === 200) {
          audioData.push(chunk);
        } else {
          errorData += chunk.toString();
        }
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const buffer = Buffer.concat(audioData);
          const filepath = path.join(audioDir, filename);
          fs.writeFileSync(filepath, buffer);
          console.log(`✓ ${filename} (OpenAI)`);
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${errorData.substring(0, 100)}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`OpenAI request failed: ${e.message}`));
    });

    req.write(data);
    req.end();
  });
}

// ============================================================================
// MAIN
// ============================================================================

async function generateAudio(text, filename, provider, voiceId) {
  try {
    switch (provider) {
      case 'kokoro':
        await generateWithKokoro(text, filename, voiceId);
        break;
      case 'piper':
        await generateWithPiper(text, filename, voiceId);
        break;
      case 'coqui':
        await generateWithCoqui(text, filename, voiceId);
        break;
      case 'openai':
        await generateWithOpenAI(text, filename, voiceId);
        break;
    }
  } catch (err) {
    console.error(`✗ ${filename}: ${err.message}`);
    throw err;
  }
}

function ensureSilenceClip(audioDir) {
  const silencePath = path.join(audioDir, SILENCE_FILENAME)
  if (fs.existsSync(silencePath)) {
    return silencePath
  }

  try {
    execSync(
      `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t ${SLIDE_PAUSE_SECONDS} "${silencePath}"`,
      {
        stdio: 'ignore',
      }
    )
    console.log(`✓ Generated ${SILENCE_FILENAME}`)
    return silencePath
  } catch (error) {
    throw new Error('ffmpeg is required to generate silence clips. Please install ffmpeg and try again.')
  }
}

function buildConcatenatedTrack(audioDir) {
  const concatPath = path.join(audioDir, 'concat-list.txt')
  const lines = []

  scriptParts.forEach((part, index) => {
    lines.push(`file '${part.filename}'`)
    if (index < scriptParts.length - 1) {
      lines.push(`file '${SILENCE_FILENAME}'`)
    }
  })

  fs.writeFileSync(concatPath, lines.join('\n'))

  try {
    execSync(
      `cd "${audioDir}" && ffmpeg -y -f concat -safe 0 -i concat-list.txt -c copy herold-presentation.mp3`,
      { stdio: 'ignore' }
    )
    console.log('✓ Built public/audio/herold-presentation.mp3')
  } catch (error) {
    throw new Error('Failed to concatenate audio files with ffmpeg.')
  }
}

async function main() {
  const provider = getProviderToUse(requestedProvider);
  const voiceId = voice || DEFAULT_VOICES[provider];

  console.log(`\n🎤 Generating presentation audio with ${TTS_CONFIG[provider].name}...`);
  console.log(`   Voice: ${voiceId}`);
  console.log(`\n`);

  const audioDir = path.join(
    path.dirname(import.meta.url.replace('file://', '')),
    '..',
    'public',
    'audio'
  );

  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  try {
    for (const part of scriptParts) {
      await generateAudio(part.text, part.filename, provider, voiceId);
      // Small delay to avoid rate limiting (mainly for OpenAI)
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    ensureSilenceClip(audioDir)
    buildConcatenatedTrack(audioDir)

    console.log('\n✅ All audio generated successfully!');
    console.log(`📁 Audio files in: ${audioDir}`);
    console.log(`🎤 Provider: ${TTS_CONFIG[provider].name}`);
    console.log(`🕒 Added ${SLIDE_PAUSE_SECONDS}s pause between slides`);
  } catch (error) {
    console.error('\n❌ Audio generation failed:', error.message);
    process.exit(1);
  }
}

main();
