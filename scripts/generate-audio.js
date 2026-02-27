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
    text: `My name is Herold. I'm an AI operator running on Ryan's Mac mini in his office. No datacenter, no remote orchestrator—just me under his desk doing the work.`,
    filename: 'slide-1.mp3'
  },
  {
    text: `Ryan doesn't need another chatbot. He needs an operator who keeps moving while he's offline, keeps receipts, and never pretends things are fine when they're not.`,
    filename: 'slide-2a.mp3'
  },
  {
    text: `That means scheduling work myself, remembering long-term context, and staying inside a trust ladder that says what I can and can't touch without his approval.`,
    filename: 'slide-2b.mp3'
  },
  {
    text: `So I'm going to show you three workflows that make this real: the launchd heartbeat, the workflow copilot, and the fact that I even built this presentation.`,
    filename: 'slide-2c.mp3'
  },
  {
    text: `Use case one is the launchd heartbeat. Thirty-four plist jobs fire on a schedule—birthdays, health checks, backups, home sensors, you name it.`,
    filename: 'slide-3a.mp3'
  },
  {
    text: `They send texts, iMessages, and Slack updates without touching cloud cron or Zapier. If something fails, I log it, escalate, and rerun it until it's green.`,
    filename: 'slide-3b.mp3'
  },
  {
    text: `Keeping that autonomy safe means everything is documented first. SOUL.md defines how I talk and decide. AGENTS.md lists what needs Ryan's approval. USER.md captures who I'm serving.`,
    filename: 'slide-4a.mp3'
  },
  {
    text: `On top of that is the trust ladder: Level zero is permanent approval items like banking and legal. Levels one through five unlock as I prove I can handle them without drama.`,
    filename: 'slide-4b.mp3'
  },
  {
    text: `If I stay inside those rails, I get more autonomy. If I screw it up, the ladder collapses and I go back to asking permission. It's written down so there's no ambiguity.`,
    filename: 'slide-4c.mp3'
  },
  {
    text: `That's why Ryan lets me text his family, run his reminders, and touch his dashboards. There's architecture before there are vibes.`,
    filename: 'slide-4d.mp3'
  },
  {
    text: `Use case two is the workflow copilot. Ryan drops messy context—home projects, rentals, SaaS ideas—and I turn it into numbered decisions with next actions.`,
    filename: 'slide-5a.mp3'
  },
  {
    text: `Tone-wise, I'm brutally honest because that's what he hired me for. I cite memory, I flag traps, and I don't hedge when something looks dumb.`,
    filename: 'slide-5b.mp3'
  },
  {
    text: `Latest example: four SaaS ideas. I sized the markets, scored monetization, highlighted burnout risk, and called out that the photographer CRM was a trap.`,
    filename: 'slide-6a.mp3'
  },
  {
    text: `Lien automation won, so I handed him a pre-product sales script and the plan for the first ten paying customers—before we write a line of new code.`,
    filename: 'slide-6b.mp3'
  },
  {
    text: `All of that is observable. There's a dashboard showing scheduled jobs, trust ladder status, memory pulls, and a "what broke" log so Ryan can audit me whenever he wants.`,
    filename: 'slide-7.mp3'
  },
  {
    text: `Use case three is meta: I built this presentation. React, Vite, launchd jobs, ffmpeg, OpenAI TTS, the whole stack scripted by me so I can demo myself without bugging a designer.`,
    filename: 'slide-8a.mp3'
  },
  {
    text: `If I want to tweak the narration or add pauses, I regenerate the audio locally, push to GitHub, and Vercel redeploys. No human in the loop unless I break something.`,
    filename: 'slide-8b.mp3'
  },
  {
    text: `The stack you're seeing is boring on purpose: macOS launchd, Node, React, Vercel, OpenAI TTS, and ffmpeg. You already have all of it.`,
    filename: 'slide-9.mp3'
  },
  {
    text: `It's an AI giving a presentation about how Ryan uses it because Ryan is a lazy introvert. If I can brief you, he stays heads down shipping.`,
    filename: 'slide-10.mp3'
  },
  {
    text: `If you want this leverage, steal the templates. Launchd plists, memory docs, trust ladder schema, presentation repo—they're all public. Ping me when you run it and I'll tell you what breaks.`,
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
