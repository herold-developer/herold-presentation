import { useState, useRef, useEffect, useCallback } from 'react'
import './Presentation.css'
import { slides } from '../data/slides'

const DEFAULT_TOTAL_SECONDS = 180

const formatTime = (seconds = 0) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const totalSeconds = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const buildFallbackTimeline = (totalSeconds) => {
  const perSlide = totalSeconds / slides.length
  return slides.map((slide, index) => ({
    id: slide.id,
    start: perSlide * index,
    end: perSlide * (index + 1),
    duration: perSlide,
  }))
}

export default function Presentation() {
  const audioRef = useRef(null)
  const rafRef = useRef(null)

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(DEFAULT_TOTAL_SECONDS)
  const [timeline, setTimeline] = useState(buildFallbackTimeline(DEFAULT_TOTAL_SECONDS))

  // Load real slide timings generated alongside the audio
  useEffect(() => {
    let cancelled = false

    const loadTimings = async () => {
      try {
        const response = await fetch('/data/slide-timings.json', { cache: 'no-cache' })
        if (!response.ok) {
          throw new Error(`Failed to load slide timings: ${response.status}`)
        }

        const data = await response.json()
        if (cancelled) return

        if (Array.isArray(data?.slides) && data.slides.length === slides.length) {
          setTimeline(data.slides)
          if (Number.isFinite(data.totalDuration)) {
            setDuration(data.totalDuration)
          }
        }
      } catch (error) {
        console.warn('[presentation] Using fallback slide timings', error.message)
        if (!cancelled) {
          setTimeline(buildFallbackTimeline(DEFAULT_TOTAL_SECONDS))
          setDuration(DEFAULT_TOTAL_SECONDS)
        }
      }
    }

    loadTimings()
    return () => {
      cancelled = true
    }
  }, [])

  const updateSlideFromTime = useCallback(
    (time) => {
      if (!timeline?.length) return
      const epsilon = 0.05
      const lastIndex = timeline.length - 1
      let nextIndex = lastIndex

      for (let i = 0; i < timeline.length; i++) {
        const window = timeline[i]
        if (time >= window.start - epsilon && time < window.end - (i === lastIndex ? -epsilon : epsilon)) {
          nextIndex = i
          break
        }
      }

      setCurrentSlide((prev) => (prev === nextIndex ? prev : nextIndex))
    },
    [timeline]
  )

  // Track audio time via RAF for smoother sync
  useEffect(() => {
    const tick = () => {
      if (!audioRef.current) return
      const time = audioRef.current.currentTime || 0
      setCurrentTime(time)
      if (isPlaying) {
        updateSlideFromTime(time)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, updateSlideFromTime])

  // Wire up audio events
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(duration)
      setCurrentSlide(slides.length - 1)
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [duration])

  const seekToSlide = useCallback(
    (index) => {
      if (!audioRef.current || !timeline?.[index]) {
        setCurrentSlide(index)
        return
      }

      const targetTime = timeline[index].start + 0.01
      audioRef.current.currentTime = Math.min(Math.max(targetTime, 0), duration)
      if (!isPlaying) {
        setCurrentTime(targetTime)
        updateSlideFromTime(targetTime)
      }
    },
    [duration, isPlaying, timeline, updateSlideFromTime]
  )

  const goToSlide = useCallback(
    (index) => {
      const clamped = Math.min(Math.max(index, 0), slides.length - 1)
      if (isPlaying) {
        seekToSlide(clamped)
      } else {
        setCurrentSlide(clamped)
      }
    },
    [isPlaying, seekToSlide]
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault()
        goToSlide(currentSlide + 1)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goToSlide(currentSlide - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSlide, goToSlide])

  const handleProgressClick = (event) => {
    if (!audioRef.current || !duration) return
    const rect = event.currentTarget.getBoundingClientRect()
    const percent = (event.clientX - rect.left) / rect.width
    const newTime = Math.min(Math.max(percent, 0), 1) * duration
    audioRef.current.currentTime = newTime
    if (!isPlaying) {
      setCurrentTime(newTime)
      updateSlideFromTime(newTime)
    }
  }

  const slide = slides[currentSlide]
  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="presentation">
      <audio
        ref={audioRef}
        src="/audio/herold-presentation.mp3"
        preload="auto"
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
          onClick={() => audioRef.current?.[isPlaying ? 'pause' : 'play']?.()}
          className="play-btn"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <div className="nav-buttons">
          <button
            className="nav-btn"
            onClick={() => goToSlide(currentSlide - 1)}
            disabled={currentSlide === 0}
          >
            ← Prev
          </button>
          <button
            className="nav-btn"
            onClick={() => goToSlide(currentSlide + 1)}
            disabled={currentSlide === slides.length - 1}
          >
            Next →
          </button>
        </div>

        <div className="progress-wrapper" onClick={handleProgressClick}>
          <div className="progress">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            {timeline?.map((window) => (
              <span
                key={window.id}
                className="progress-marker"
                style={{ left: duration ? `${(window.start / duration) * 100}%` : '0%' }}
              />
            ))}
          </div>
          <div className="time-labels">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="slide-counter">
          {currentSlide + 1} / {slides.length}
        </div>
      </div>

      <div className="footer">
        <p>
          <span>← → or Space to navigate</span> •{' '}
          <span>Total runtime: {formatTime(duration)}</span>
        </p>
      </div>
    </div>
  )
}
