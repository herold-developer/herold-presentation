# Herold: Autonomous Agent Architecture

An interactive presentation about building autonomous AI agents with persistent identity, memory, and trust boundaries.

## Features

- **Hybrid TTS Support** — Piper (local, fast), Coqui (flexible), OpenAI (premium fallback)
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

| Provider | Type | Speed | Quality | Offline | Cost |
|----------|------|-------|---------|---------|------|
| **Piper** | Local | ⚡ Fast | Good | ✓ Yes | Free |
| **Coqui** | Local | ⏱️ Medium | Very Good | ✓ Yes | Free |
| **OpenAI** | Cloud | Instant | Excellent | ✗ No | $0.015/min |

### Quick Start: Generate Audio

**Option 1: Piper (Recommended)**
```bash
# Install Piper
pip install piper-tts
piper --download en_US-lessac-medium

# Generate audio
npm run generate-audio:piper
```

**Option 2: Coqui**
```bash
# Install Coqui
pip install TTS

# Generate audio
npm run generate-audio:coqui
```

**Option 3: OpenAI (Premium)**
```bash
# Set API key
export OPENAI_API_KEY=sk-your-key-here

# Generate audio
npm run generate-audio:openai
```

**Option 4: Auto-detect (best available)**
```bash
npm run generate-audio
```

The script auto-detects installed providers in this order: Piper → Coqui → OpenAI.

### Post-Generation: Concatenate Files

The generation creates individual slide MP3 files. Concatenate them into a single presentation file:

```bash
ffmpeg -f concat -safe 0 -i <(for f in public/audio/slide-*.mp3; do echo "file '$f'"; done) -c copy public/audio/herold-presentation.mp3
```

Or create a `concat.txt` file:
```
file 'public/audio/slide-1.mp3'
file 'public/audio/slide-2a.mp3'
file 'public/audio/slide-2b.mp3'
...
```

Then run:
```bash
ffmpeg -f concat -safe 0 -i concat.txt -c copy public/audio/herold-presentation.mp3
```

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
