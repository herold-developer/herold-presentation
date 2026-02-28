#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import https from 'https'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { slides } from '../src/data/slides.js'

const require = createRequire(import.meta.url)

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
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const TARGET_DURATION_SECONDS = 180

const DEFAULT_VOICES = {
  kokoro: 'af_bella',
  piper: 'en_US-lessac-medium',
  coqui: 'glow-tts',
  openai: 'onyx',
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '..')
const audioDir = path.join(projectRoot, 'public', 'audio')
const dataDir = path.join(projectRoot, 'public', 'data')

const narrationSegments = slides.flatMap((slide) => {
  if (!Array.isArray(slide.narration) || slide.narration.length === 0) {
    throw new Error(`Slide ${slide.id} is missing narration text`)
  }

  return slide.narration.map((text, index) => ({
    slideId: slide.id,
    text,
    filename: `slide-${String(slide.id).padStart(2, '0')}-${index + 1}.mp3`,
  }))
})

if (narrationSegments.length === 0) {
  throw new Error('No narration segments defined in slides data')
}

// ============================================================================
// HELPERS
// ============================================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function cleanAudioDir() {
  if (!fs.existsSync(audioDir)) return
  const keep = new Set(['.gitkeep'])
  for (const entry of fs.readdirSync(audioDir)) {
    if (keep.has(entry)) continue
    const filePath = path.join(audioDir, entry)
    if (fs.statSync(filePath).isDirectory()) continue
    if (entry.endsWith('.mp3') || entry === 'concat.txt') {
      fs.unlinkSync(filePath)
    }
  }
}

function getDurationSeconds(filePath) {
  try {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    const output = execSync(command, { encoding: 'utf-8' })
    const seconds = parseFloat(output.trim())
    if (!Number.isFinite(seconds)) {
      throw new Error('Invalid duration value')
    }
    return seconds
  } catch (error) {
    throw new Error(`Unable to read duration for ${filePath}. Install ffmpeg (ffprobe). ${error.message}`)
  }
}

function buildAtempoFilter(factor) {
  if (!Number.isFinite(factor) || factor <= 0) {
    throw new Error('Invalid tempo factor')
  }

  const filters = []
  let remaining = factor

  while (remaining > 2) {
    filters.push('atempo=2')
    remaining /= 2
  }

  while (remaining < 0.5) {
    filters.push('atempo=0.5')
    remaining /= 0.5
  }

  if (Math.abs(remaining - 1) > 0.001) {
    filters.push(`atempo=${remaining.toFixed(6)}`)
  }

  if (filters.length === 0) {
    filters.push('atempo=1')
  }

  return filters.join(',')
}

function writeSlideTimings(segmentMeta, durationScale) {
  let cursor = 0
  const slidesPayload = slides.map((slide) => {
    const segments = segmentMeta.filter((segment) => segment.slideId === slide.id)
    if (segments.length === 0) {
      throw new Error(`Missing audio segments for slide ${slide.id}`)
    }

    const slideDuration = segments.reduce((acc, segment) => acc + segment.duration, 0)
    const scaledDuration = slideDuration * durationScale
    const start = cursor
    const end = start + scaledDuration

    const payload = {
      id: slide.id,
      start: Number(start.toFixed(3)),
      end: Number(end.toFixed(3)),
      duration: Number(scaledDuration.toFixed(3)),
      segments: segments.map((segment) => ({
        filename: segment.filename,
        rawDuration: Number(segment.duration.toFixed(3)),
        duration: Number((segment.duration * durationScale).toFixed(3)),
      })),
    }

    cursor = end
    return payload
  })

  const data = {
    generatedAt: new Date().toISOString(),
    targetDuration: TARGET_DURATION_SECONDS,
    totalDuration: TARGET_DURATION_SECONDS,
    durationScale,
    slides: slidesPayload,
  }

  const filePath = path.join(dataDir, 'slide-timings.json')
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
}

// ============================================================================
// CLI ARGUMENTS
// ============================================================================

let requestedProvider = null
let voice = null

for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i]
  if (arg === '--tts-provider' && i + 1 < process.argv.length) {
    requestedProvider = process.argv[i + 1].toLowerCase()
    i++
  } else if (arg === '--voice' && i + 1 < process.argv.length) {
    voice = process.argv[i + 1]
    i++
  }
}

// ============================================================================
// PROVIDER DETECTION
// ============================================================================

function checkProviderAvailable(provider) {
  try {
    switch (provider) {
      case 'kokoro': {
        try {
          require.resolve('kokoro-js')
          const modelDir = path.join(process.env.HOME || '', '.cache', 'kokoro-models')
          return fs.existsSync(modelDir) && fs.readdirSync(modelDir).length > 0
        } catch {
          return false
        }
      }
      case 'piper':
        execSync('which piper >/dev/null 2>&1 || (command -v piper >/dev/null 2>&1)', {
          stdio: 'pipe',
          shell: true,
        })
        return true
      case 'coqui':
        execSync('python -c "import TTS" 2>/dev/null', { stdio: 'pipe' })
        return true
      case 'openai':
        return !!process.env.OPENAI_API_KEY
      default:
        return false
    }
  } catch {
    return false
  }
}

function getProviderToUse(requested) {
  const providers = ['kokoro', 'piper', 'coqui', 'openai']

  if (requested) {
    if (!providers.includes(requested)) {
      console.error(`❌ Unknown provider: ${requested}`)
      console.error(`   Available: ${providers.join(', ')}`)
      process.exit(1)
    }

    if (!checkProviderAvailable(requested)) {
      console.error(`❌ Requested provider '${requested}' is not available`)
      process.exit(1)
    }

    return requested
  }

  for (const provider of providers) {
    if (checkProviderAvailable(provider)) {
      return provider
    }
  }

  console.error('❌ No TTS provider available!')
  console.error('   Install Kokoro, Piper, Coqui, or set OPENAI_API_KEY for OpenAI.')
  process.exit(1)
}

// ============================================================================
// TTS IMPLEMENTATIONS
// ============================================================================

async function generateWithPiper(text, filename, voiceId) {
  return new Promise((resolve, reject) => {
    try {
      ensureDir(audioDir)
      const filepath = path.join(audioDir, filename)
      const voiceDir = path.join(process.env.HOME || '', '.local', 'piper-voices')
      const modelPath = path.join(voiceDir, `${voiceId}.onnx`)
      const configPath = path.join(voiceDir, `${voiceId}.onnx.json`)

      if (!fs.existsSync(modelPath)) {
        throw new Error(`Piper model not found at ${modelPath}. Download per README instructions.`)
      }

      execSync(
        `echo "${text.replace(/"/g, '\\"')}" | piper -m ${modelPath} -c ${configPath} -f "${filepath}"`,
        {
          stdio: 'pipe',
          encoding: 'utf-8',
        }
      )

      console.log(`✓ ${filename} (Piper)`)
      resolve()
    } catch (err) {
      reject(new Error(`Piper generation failed: ${err.message}`))
    }
  })
}

async function generateWithCoqui(text, filename, modelId) {
  return new Promise((resolve, reject) => {
    try {
      ensureDir(audioDir)
      const filepath = path.join(audioDir, filename)
      const cmd = `python -c "\nfrom TTS.api import TTS\nimport os\n\ntts = TTS(model_name='${modelId}', progress_bar=False, gpu=False)\ntts.tts_to_file(text='${text.replace(/"/g, '\\"')}', file_path='${filepath}')\n"`
      execSync(cmd, { stdio: 'pipe', shell: '/bin/bash' })
      console.log(`✓ ${filename} (Coqui)`)
      resolve()
    } catch (err) {
      reject(new Error(`Coqui generation failed: ${err.message.substring(0, 120)}`))
    }
  })
}

async function generateWithKokoro(text, filename, voiceId) {
  return new Promise((resolve, reject) => {
    try {
      const Kokoro = require('kokoro-js')
      ensureDir(audioDir)
      const filepath = path.join(audioDir, filename)
      const kokoro = new Kokoro({
        modelDir: path.join(process.env.HOME || '', '.cache', 'kokoro-models'),
      })

      kokoro
        .synthesize(text, voiceId)
        .then((audio) => {
          fs.writeFileSync(filepath, audio)
          console.log(`✓ ${filename} (Kokoro)`)
          resolve()
        })
        .catch((err) => reject(new Error(`Kokoro generation failed: ${err.message}`)))
    } catch (err) {
      reject(new Error(`Kokoro generation failed: ${err.message}`))
    }
  })
}

async function generateWithOpenAI(text, filename, voiceId) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  if (!OPENAI_API_KEY) {
    return Promise.reject(new Error('OPENAI_API_KEY environment variable not set'))
  }

  return new Promise((resolve, reject) => {
    ensureDir(audioDir)
    const filepath = path.join(audioDir, filename)
    const cleanText = text.replace(/[—–]/g, '-').replace(/"/g, '\\"')
    const data = JSON.stringify({
      model: 'tts-1',
      input: cleanText,
      voice: voiceId,
    })

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/audio/speech',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }

    const req = https.request(options, (res) => {
      let audioData = []
      let errorData = ''

      res.on('data', (chunk) => {
        if (res.statusCode === 200) {
          audioData.push(chunk)
        } else {
          errorData += chunk.toString()
        }
      })

      res.on('end', () => {
        if (res.statusCode === 200) {
          const buffer = Buffer.concat(audioData)
          fs.writeFileSync(filepath, buffer)
          console.log(`✓ ${filename} (OpenAI)`)
          resolve()
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${errorData.substring(0, 200)}`))
        }
      })
    })

    req.on('error', (err) => reject(new Error(`OpenAI request failed: ${err.message}`)))
    req.write(data)
    req.end()
  })
}

async function generateAudio(text, filename, provider, voiceId) {
  switch (provider) {
    case 'kokoro':
      await generateWithKokoro(text, filename, voiceId)
      break
    case 'piper':
      await generateWithPiper(text, filename, voiceId)
      break
    case 'coqui':
      await generateWithCoqui(text, filename, voiceId)
      break
    case 'openai':
      await generateWithOpenAI(text, filename, voiceId)
      break
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  ensureDir(audioDir)
  ensureDir(dataDir)
  cleanAudioDir()

  const provider = getProviderToUse(requestedProvider)
  const voiceId = voice || DEFAULT_VOICES[provider]

  console.log(`\n🎤 Generating narration with ${TTS_CONFIG[provider].name}`)
  console.log(`   Voice: ${voiceId}`)
  console.log(`   Target runtime: ${TARGET_DURATION_SECONDS / 60} minutes\n`)

  const segmentMeta = []

  try {
    for (const segment of narrationSegments) {
      await generateAudio(segment.text, segment.filename, provider, voiceId)
      const duration = getDurationSeconds(path.join(audioDir, segment.filename))
      segmentMeta.push({ ...segment, duration })
      await new Promise((resolve) => setTimeout(resolve, 400))
    }

    const concatFilePath = path.join(audioDir, 'concat.txt')
    const concatData = segmentMeta.map((segment) => `file '${segment.filename}'`).join('\n')
    fs.writeFileSync(concatFilePath, `${concatData}\n`)

    const rawOutputName = 'herold-presentation.raw.mp3'
    const finalOutputName = 'herold-presentation.mp3'

    execSync(
      `cd "${audioDir}" && ffmpeg -y -f concat -safe 0 -i concat.txt -c copy ${rawOutputName}`,
      { stdio: 'ignore' }
    )

    const rawOutputPath = path.join(audioDir, rawOutputName)
    const finalOutputPath = path.join(audioDir, finalOutputName)
    const rawTotalDuration = getDurationSeconds(rawOutputPath)

    if (!Number.isFinite(rawTotalDuration) || rawTotalDuration <= 0) {
      throw new Error('Combined audio duration invalid')
    }

    const durationScale = TARGET_DURATION_SECONDS / rawTotalDuration
    const tempoFactor = rawTotalDuration / TARGET_DURATION_SECONDS
    const tempoFilter = buildAtempoFilter(tempoFactor)

    execSync(
      `ffmpeg -y -i "${rawOutputPath}" -vn -af "${tempoFilter}" -ar 44100 -b:a 192k -t ${TARGET_DURATION_SECONDS} "${finalOutputPath}"`,
      { stdio: 'ignore' }
    )

    fs.unlinkSync(rawOutputPath)

    writeSlideTimings(segmentMeta, durationScale)

    console.log('\n✅ Audio generation complete!')
    console.log(`   Segments: ${segmentMeta.length}`)
    console.log(`   Provider: ${TTS_CONFIG[provider].name}`)
    console.log(`   Voice: ${voiceId}`)
    console.log(`   Total duration: ${TARGET_DURATION_SECONDS} seconds (exact)\n`)
  } catch (error) {
    console.error('\n❌ Audio generation failed:', error.message)
    process.exit(1)
  }
}

main()
