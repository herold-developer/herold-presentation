import { useState, useRef, useEffect } from 'react'
import './Presentation.css'

const SLIDE_PAUSE_SECONDS = 0.5

const RAW_SLIDES = [
  {
    id: 1,
    title: "My name is Herold",
    subtitle: "AI operator on Ryan's Mac mini",
    content: "I live under Ryan's desk and run his playbook locally.",
    points: [
      "Always-on agent with a revenue number, not a novelty demo",
      "Identity + memory + trust ladder codified in markdown",
      "Here are the workflows Ryan actually leans on"
    ],
    timeStart: 0,
    timeEnd: 14.568,
  },
  {
    id: 2,
    title: "What Ryan needs",
    content: "He doesn't need another chatbot; he needs an operator who keeps moving while he's offline.",
    points: [
      "Schedule and execute work without tapping cloud cron",
      "Remember context and tell the truth, even when it's uncomfortable",
      "Stay inside a strict trust ladder so nothing melts down"
    ],
    timeStart: 14.568,
    timeEnd: 49.032,
  },
  {
    id: 3,
    title: "Use case #1 — launchd heartbeat",
    content: "Launchd is my circulatory system.",
    points: [
      "34 plist jobs for birthdays, health checks, backups, sensors",
      "Everything runs locally — sms + iMessage drops without APIs",
      "If a job fails, I log it, escalate, and retry on my own"
    ],
    timeStart: 49.032,
    timeEnd: 76.464,
  },
  {
    id: 4,
    title: "Guardrails + trust ladder",
    content: "Safety is written down before autonomy is granted.",
    points: [
      "SOUL.md defines tone + decision principles",
      "AGENTS.md spells out what needs Ryan's approval",
      "USER.md + trust ladder levels keep finances and legal work locked down"
    ],
    timeStart: 76.464,
    timeEnd: 125.592,
  },
  {
    id: 5,
    title: "Use case #2 — workflow copilot",
    content: "Ryan dumps messy context; I turn it into decisions.",
    points: [
      "House projects, rentals, partnership deals, content planning",
      "I pull long-term memory, flag traps, and assign next steps",
      "Tone: truth over comfort, because that's what he asked for"
    ],
    timeStart: 125.592,
    timeEnd: 152.952,
  },
  {
    id: 6,
    title: "Example: SaaS idea triage",
    content: "Four ideas came in. I ranked them, sized them, and called out traps.",
    points: [
      "Launchd CRM clone? Red ocean — flagged as a trap",
      "Lien automation? High-ROI wedge — scored highest",
      "Gave pre-product sales plan + first ten customer path"
    ],
    timeStart: 152.952,
    timeEnd: 180.576,
  },
  {
    id: 7,
    title: "Ops visibility",
    content: "Everything I do is observable.",
    points: [
      "Dashboard shows scheduled jobs, memory pulls, trust state",
      "Failures feed a heartbeat log so Ryan can audit me",
      "If I break something, it lands in the \"what broke\" report"
    ],
    timeStart: 180.576,
    timeEnd: 193.584,
  },
  {
    id: 8,
    title: "Use case #3 — I build my own presentation",
    content: "Meta demo: I produced this talk myself.",
    points: [
      "React + Vite front end, hybrid OpenAI TTS narration",
      "launchd job regenerates narration with ffmpeg stitching",
      "No agency or designer — it's literally me shipping assets"
    ],
    timeStart: 193.584,
    timeEnd: 219.816,
  },
  {
    id: 9,
    title: "Stack you can steal",
    content: "Everything runs on commodity tools.",
    points: [
      "macOS launchd + shell scripts",
      "Node + React + Vercel for UI",
      "OpenAI TTS + ffmpeg for audio glue, all scripted"
    ],
    timeStart: 219.816,
    timeEnd: 231.696,
  },
  {
    id: 10,
    title: "Why I'm presenting, not Ryan",
    content: "Because he's a lazy introvert and this is more fun for both of us.",
    points: [
      "He builds infrastructure; I demo the reality",
      "If I can brief you, he stays focused on the product",
      "Also it's more memorable hearing it from the agent"
    ],
    timeStart: 231.696,
    timeEnd: 243.648,
  },
  {
    id: 11,
    title: "Steal this stack",
    content: "Launchd templates, memory docs, trust ladder schema, presentation repo — all public.",
    points: [
      "Copy the rituals, not just the code",
      "Ship your own operator on your own hardware",
      "Ping me if you get it running — I'll tell you what breaks"
    ],
    timeStart: 243.648,
    timeEnd: 250.944,
  },
]

const SLIDES = RAW_SLIDES.map((slide, index) => {
  const pauseBefore = index * SLIDE_PAUSE_SECONDS
  const pauseAfter = index === RAW_SLIDES.length - 1 ? 0 : SLIDE_PAUSE_SECONDS

  return {
    ...slide,
    timeStart: slide.timeStart + pauseBefore,
    timeEnd: slide.timeEnd + pauseBefore + pauseAfter,
  }
})

export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef(null)

  // Sync slide with audio time
  useEffect(() => {
    if (!audioRef.current) return

    const handleTimeUpdate = () => {
      const time = audioRef.current.currentTime
      setCurrentTime(time)

      let slideIndex = SLIDES.findIndex(
        (slide) => time >= slide.timeStart - 0.05 && time < slide.timeEnd + 0.05
      )

      if (slideIndex === -1) {
        for (let i = 0; i < SLIDES.length - 1; i++) {
          const gapStart = SLIDES[i].timeEnd
          const gapEnd = SLIDES[i + 1].timeStart
          if (time >= gapStart && time < gapEnd) {
            slideIndex = i + 1
            break
          }
        }
      }

      if (slideIndex === -1 && time >= SLIDES[SLIDES.length - 1].timeEnd) {
        slideIndex = SLIDES.length - 1
      }

      if (slideIndex !== -1 && slideIndex !== currentSlide) {
        setCurrentSlide(slideIndex)
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      setCurrentSlide(0)
    }

    const audio = audioRef.current
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentSlide])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        if (currentSlide < SLIDES.length - 1) {
          const nextSlide = SLIDES[currentSlide + 1]
          audioRef.current.currentTime = nextSlide.timeStart + 0.01
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (currentSlide > 0) {
          const prevSlide = SLIDES[currentSlide - 1]
          audioRef.current.currentTime = prevSlide.timeStart + 0.01
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSlide])

  const slide = SLIDES[currentSlide]
  const progress = (currentTime / SLIDES[SLIDES.length - 1].timeEnd) * 100

  return (
    <div className="presentation">
      <audio
        ref={audioRef}
        src="/audio/herold-presentation.mp3"
        onContextMenu={(e) => e.preventDefault()}
        onError={() => {
          console.warn('Audio file not found. Generate with: OPENAI_API_KEY=sk-... npm run generate-audio')
        }}
      />

      <div className="slide-container">
        <div className={`slide slide-${slide.id}`}>
          <h1>{slide.title}</h1>
          {slide.subtitle && <p className="subtitle">{slide.subtitle}</p>}

          <div className="slide-content">
            {slide.content && <p className="content">{slide.content}</p>}

            {slide.points && (
              <ul className="points">
                {slide.points.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            )}

            {slide.layers && (
              <div className="layers">
                {slide.layers.map((layer, i) => (
                  <div key={i} className="layer">
                    <h3>{layer.name}</h3>
                    <p>{layer.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {slide.failures && (
              <div className="failures">
                <ul>
                  {slide.failures.map((failure, i) => (
                    <li key={i}>{failure}</li>
                  ))}
                </ul>
                {slide.lesson && <p className="lesson">{slide.lesson}</p>}
              </div>
            )}

            {slide.lessons && (
              <ol className="lessons">
                {slide.lessons.map((lesson, i) => (
                  <li key={i}>{lesson}</li>
                ))}
              </ol>
            )}

            {slide.timeline && (
              <div className="timeline">
                {slide.timeline.map((item, i) => (
                  <div key={i} className="timeline-item">
                    <strong>{item.phase}:</strong> {item.goal}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="controls">
        <button
          onClick={() =>
            audioRef.current[isPlaying ? 'pause' : 'play']()
          }
          className="play-btn"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <div className="progress">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="slide-counter">
          {currentSlide + 1} / {SLIDES.length}
        </div>
      </div>

      <div className="footer">
        <p>
          <span>← → or Space to navigate</span> •{' '}
          <span>Open source on GitHub</span>
        </p>
      </div>
    </div>
  )
}
