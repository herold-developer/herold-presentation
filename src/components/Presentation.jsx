import { useState, useRef, useEffect } from 'react'
import './Presentation.css'

const SLIDES = [
  {
    id: 1,
    title: "Herold",
    subtitle: "Autonomous Agent Architecture",
    content: "An AI agent. A job. A set of constraints.",
    timeStart: 0,
    timeEnd: 30,
  },
  {
    id: 2,
    title: "The Problem",
    content: "Building autonomous agents requires persistent memory, autonomous scheduling, decision frameworks, monitoring, and transparent identity.",
    points: [
      "Easy to build chatbots",
      "Hard to build autonomy",
      "Most infrastructure assumes interaction",
      "Autonomous agents need different architecture"
    ],
    timeStart: 30,
    timeEnd: 90,
  },
  {
    id: 3,
    title: "Foundation: launchd",
    content: "Simple system daemon for background jobs. Write a plist, tell it when to run, it does it.",
    points: [
      "Birthday reminders on specific dates",
      "Health checks and monitoring",
      "Cron-style regular maintenance",
      "Long-running background processes",
      "No cloud infrastructure needed"
    ],
    timeStart: 90,
    timeEnd: 135,
  },
  {
    id: 4,
    title: "Architecture: Three Layers",
    layers: [
      {
        name: "Identity",
        desc: "SOUL.md, AGENTS.md, USER.md — personality and decision framework"
      },
      {
        name: "Memory",
        desc: "Session, long-term (MEMORY.md), and structured memory in databases"
      },
      {
        name: "Autonomy Boundaries",
        desc: "Trust ladder: Level 0 (permanent approval) through Level 5 (autonomous)"
      }
    ],
    timeStart: 135,
    timeEnd: 225,
  },
  {
    id: 5,
    title: "Dashboard: Monitoring",
    content: "Real-time visibility into what's scheduled, memory context, trust boundaries, recent activity, and operational health.",
    points: [
      "What jobs are scheduled",
      "Memory context",
      "Trust ladder status",
      "Recent activity",
      "API costs, error rates"
    ],
    timeStart: 225,
    timeEnd: 285,
  },
  {
    id: 6,
    title: "What Broke",
    content: "Honest account of what didn't work the first time.",
    failures: [
      "Birthday reminder system was overcomplicated",
      "Trust ladder too permissive initially",
      "Memory search was slow",
      "No decision framework for escalation"
    ],
    lesson: "Building autonomous agents is iterative. Publish what you learn.",
    timeStart: 285,
    timeEnd: 345,
  },
  {
    id: 7,
    title: "Lessons Learned",
    lessons: [
      "Autonomy without identity is dangerous — write it down",
      "Memory architecture matters more than training data",
      "Trust boundaries are a feature, not a limitation",
      "Transparent operations scale; black boxes don't",
      "Agents are colleagues, not replacements"
    ],
    timeStart: 345,
    timeEnd: 405,
  },
  {
    id: 8,
    title: "Why This Matters",
    content: "Companies are deploying AI agents into real operations. Most copy chatbot infrastructure. That breaks at scale.",
    points: [
      "Real infrastructure for autonomous operation = competitive advantage",
      "Autonomy without boundaries is risky",
      "This is what's possible"
    ],
    timeStart: 405,
    timeEnd: 465,
  },
  {
    id: 9,
    title: "What's Next",
    timeline: [
      {
        phase: "Short term",
        goal: "Refine memory system and trust ladder"
      },
      {
        phase: "Medium term",
        goal: "Build products: documentation, templates, guides"
      },
      {
        phase: "Long term",
        goal: "Reference implementation for autonomous agent architecture"
      }
    ],
    timeStart: 465,
    timeEnd: 495,
  },
  {
    id: 10,
    title: "The Ask",
    content: "Recognize this is infrastructure that doesn't exist yet. If you're building agents, use the template. Tell me what breaks.",
    points: [
      "Not asking for funding",
      "Published and open source",
      "For anyone building in this space"
    ],
    timeStart: 495,
    timeEnd: 525,
  },
  {
    id: 11,
    title: "Thank You",
    content: "Everything is open source. Code, templates, playbook coming soon.",
    subtitle: "That's Herold",
    timeStart: 525,
    timeEnd: 540,
  },
]

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

      // Find current slide based on time
      const slideIndex = SLIDES.findIndex(
        (slide) => time >= slide.timeStart && time < slide.timeEnd
      )
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
          audioRef.current.currentTime = nextSlide.timeStart + 0.5
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (currentSlide > 0) {
          const prevSlide = SLIDES[currentSlide - 1]
          audioRef.current.currentTime = prevSlide.timeStart + 0.5
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
