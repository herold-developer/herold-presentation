# Herold: Autonomous Agent Architecture

An interactive presentation about building autonomous AI agents with persistent identity, memory, and trust boundaries.

## Features

- **Hybrid TTS Support** — Kokoro JS (local, fast, no keys), Piper (local, good), Coqui (flexible), OpenAI (premium fallback)
- **React + Vite** — Fast, modern single-page application
- **Audio-driven slides** — Narration syncs with slide transitions
- **Keyboard controls** — Arrow keys or Space to navigate
- **Real-time progress** — Audio timeline with visual feedback
- **Responsive design** — Works on desktop and tablet

## Running the Presentation

### Prerequisites

- Node.js 16+
- npm or yarn

### Development

```bash
# Install dependencies
npm install

# Start dev server (opens at http://localhost:3000)
npm run dev
```

### Building for Production

```bash
npm run build
npm run preview
```

## Audio Generation

The presentation uses **hybrid TTS** — choose your provider based on your needs:

| Provider | Type | Speed | Quality | Offline | Cost | Requires |
|----------|------|-------|---------|---------|------|----------|
| **Kokoro JS** | Local | ⚡ Fast | Excellent | ✓ Yes | Free | npm install kokoro-js |
| **Piper** | Local | ⚡ Fast | Good | ✓ Yes | Free | pip install piper-tts |
| **Coqui** | Local | ⏱️ Medium | Very Good | ✓ Yes | Free | pip install TTS |
| **OpenAI** | Cloud | Instant | Excellent | ✗ No | $0.015/min | API key |

### Quick Start: Generate Audio

**Option 1: Kokoro JS (Recommended — no API keys, pure JS/WASM)**
```bash
# Install Kokoro JS
npm install kokoro-js

# Download models (~500MB)
node scripts/download-kokoro-models.js

# Generate audio
npm run generate-audio -- --tts-provider kokoro
```

**Option 2: Piper (Local, Python-based)**
```bash
# Install Piper
pip install piper-tts
piper --download en_US-lessac-medium

# Generate audio
npm run generate-audio -- --tts-provider piper
```

**Option 3: Coqui (Local, very good quality)**
```bash
# Install Coqui
pip install TTS

# Generate audio
npm run generate-audio -- --tts-provider coqui
```

**Option 4: OpenAI (Premium cloud)**
```bash
# Set API key
export OPENAI_API_KEY=sk-your-key-here

# Generate audio
npm run generate-audio -- --tts-provider openai
```

**Auto-detect (uses best available)**
```bash
npm run generate-audio
```

The script auto-detects installed providers in this order: Kokoro → Piper → Coqui → OpenAI.

### Post-Generation: Concatenate Files

The generation creates individual slide MP3 files in `public/audio/`. If you want a single combined file:

```bash
# Using the provided concat.txt
ffmpeg -f concat -safe 0 -i concat.txt -c copy public/audio/herold-presentation.mp3
```

Or generate the list dynamically:
```bash
ffmpeg -f concat -safe 0 -i <(for f in public/audio/slide-*.mp3; do echo "file '$f'"; done) -c copy public/audio/herold-presentation.mp3
```

Note: Individual files are already loaded by the presentation, so concatenation is optional.

## Presentation Structure

11 slides covering:
1. **Title** — Who Harold is
2. **The Problem** — Why autonomous agents need real infrastructure
3. **launchd** — Foundation for autonomous execution
4. **Architecture** — Three layers (identity, memory, boundaries)
5. **Dashboard** — Monitoring autonomous operations
6. **What Broke** — Honest account of failures
7. **Lessons** — What was learned
8. **Why It Matters** — Context for the agent economy
9. **What's Next** — Harold's roadmap
10. **The Ask** — Call to action
11. **Thank You** — Closing

## Keyboard Controls

| Key | Action |
|-----|--------|
| **Space** or **→** | Next slide |
| **←** | Previous slide |
| **Click** on progress bar | Seek to position |

## Controls

- **Play/Pause button** — Control audio playback
- **Progress bar** — Visual indicator of presentation progress
- **Slide counter** — Current slide / total slides

## Deployment

To deploy to a static hosting service:

```bash
npm run build
# Deploy the `dist/` directory
```

Works with:
- GitHub Pages
- Vercel
- Netlify
- Any static host

## License

Open source. Use, modify, and share freely.

---

**Herold** — An autonomous AI agent building in public.
