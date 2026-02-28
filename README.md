# Herold: Autonomous Agent Architecture

An interactive presentation about building autonomous AI agents with persistent identity, memory, and trust boundaries.

## Features

- **Hybrid TTS Support** — Kokoro JS (local, fast, no keys), Piper (local, good), Coqui (flexible), OpenAI (premium fallback)
- **React + Vite** — Fast, modern single-page application
- **Audio-driven slides** — Narration syncs with slide transitions
- **Dual navigation** — Step through slides manually or follow the narration timeline with elapsed / total runtime
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

# Generate audio (see Audio Generation section below)
export OPENAI_API_KEY=sk-your-key-here
npm run generate-audio

# Start dev server (opens at http://localhost:3000)
npm run dev
```

**Note:** Audio files must be generated before running the presentation. They are not stored in git.

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

**Recommended: OpenAI (Best quality, premium voice)**

Audio files are generated locally — they are **not stored in git**. Generate them on your machine; the script reads `src/data/slides.js`, renders narration per slide, enforces a 3:00 runtime, and writes both `public/audio/herold-presentation.mp3` and `public/data/slide-timings.json` (used for perfect slide sync):

```bash
# Set your OpenAI API key (never commit this)
export OPENAI_API_KEY=sk-your-key-here

# Generate all audio
npm run generate-audio -- --tts-provider openai

# Audio files will be created in public/audio/
```

**Alternative providers** (local, no API key needed):

Piper (good quality):
```bash
pip install piper-tts
piper --download en_US-lessac-medium
npm run generate-audio -- --tts-provider piper
```

Coqui (very good quality):
```bash
pip install TTS
npm run generate-audio -- --tts-provider coqui
```

Kokoro JS (fast, no API keys):
```bash
npm install kokoro-js
node scripts/download-kokoro-models.js
npm run generate-audio -- --tts-provider kokoro
```

**Auto-detect** (uses best available):
```bash
npm run generate-audio
```

The script auto-detects installed providers in this order: Kokoro → Piper → Coqui → OpenAI.

### Post-Generation: Concatenate Files

`npm run generate-audio` now writes the stitched narration automatically, applies any needed time-stretch so the final runtime is exactly 3 minutes, and emits `public/data/slide-timings.json` for the React app. No manual `ffmpeg` step is required.

If you want to re-concatenate manually, you can still run your own `ffmpeg -f concat ...` command inside `public/audio`, but it's optional.

### Editing the Slides + Script

All slide copy, bullet points, and narration live in `src/data/slides.js`. Updating that file keeps the UI, narration text, and audio generation script in lockstep. After changing the script, rerun `npm run generate-audio` so the MP3 and `slide-timings.json` stay in sync.

## Security & API Keys

**NEVER commit API keys to git.** Use environment variables:

```bash
# Safe: set in shell, never saved to file
export OPENAI_API_KEY=sk-your-key-here
npm run generate-audio

# Also safe: create .env.local (which is in .gitignore)
echo "OPENAI_API_KEY=sk-your-key-here" > .env.local
npm run generate-audio
```

The `.env` and `.env.local` files are in `.gitignore` — they will never be committed.

Audio files (`public/audio/*.mp3`) are also in `.gitignore` and should be generated locally by each user or deployment.

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
