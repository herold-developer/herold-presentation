# Herold: Autonomous Agent Architecture

An interactive presentation about building autonomous AI agents with persistent identity, memory, and trust boundaries.

## Features

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

The presentation requires a narration audio file. Generate it with:

```bash
OPENAI_API_KEY=sk-... npm run generate-audio
```

This generates individual MP3 files for each slide in `public/audio/`. 

**Note:** Currently the app expects a single concatenated file at `public/audio/harold-presentation.mp3`. You can:
1. Concatenate the slide files using `ffmpeg`:
   ```bash
   ffmpeg -f concat -safe 0 -i <(for f in public/audio/slide-*.mp3; do echo "file '$f'"; done) -c copy public/audio/harold-presentation.mp3
   ```
2. Or modify the code to load individual files per slide

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
