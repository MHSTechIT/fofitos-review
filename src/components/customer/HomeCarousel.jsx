import { useEffect, useState, useRef } from 'react'

const INTERVAL_MS = 5000   // 5 s per slide
const TRANSITION  = 600    // crossfade in ms

/* ── helpers to detect video provider ── */
function isYouTube(url) { return url && (url.includes('youtube.com') || url.includes('youtu.be')) }
function isDrive(url)   { return url && url.includes('drive.google.com') }

function youtubeId(url) {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) return u.pathname.replace(/^\//, '')
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v') || u.pathname.match(/\/embed\/([^/?]+)/)?.[1]
    }
  } catch {}
  return null
}

function youtubeEmbed(url, autoplay) {
  const base = `autoplay=${autoplay ? 1 : 0}&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&fs=0&disablekb=1&loop=1&enablejsapi=1`
  const id = youtubeId(url)
  if (id) return `https://www.youtube.com/embed/${id}?${base}&playlist=${id}`
  return null
}
function youtubeThumb(url) {
  const id = youtubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

function driveEmbed(url, autoplay) {
  try {
    const u = new URL(url)
    const m = u.pathname.match(/\/file\/d\/([^/]+)/)
    const id = m ? m[1] : u.searchParams.get('id')
    if (id) return `https://drive.google.com/file/d/${id}/preview${autoplay ? '?autoplay=1' : ''}`
  } catch {}
  return null
}

/* ── Single slide that lazily renders the video iframe once "play" is tapped ── */
function VideoSlide({ url, autoplay }) {
  // When autoplay is true we render the iframe immediately.
  // When autoplay is false we show a thumbnail + play button; clicking play swaps to the iframe.
  const [playing, setPlaying] = useState(autoplay)
  const [muted,   setMuted]   = useState(true)
  const iframeRef = useRef(null)
  const videoRef  = useRef(null)

  // If admin toggles autoplay later, react to the new prop
  useEffect(() => { setPlaying(autoplay) }, [autoplay])

  function toggleMute() {
    const next = !muted
    setMuted(next)
    // For YouTube iframes, send postMessage command
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event:'command', func: next ? 'mute' : 'unMute', args: [] }),
        '*'
      )
    }
    // For native <video>
    if (videoRef.current) videoRef.current.muted = next
  }

  if (!playing) {
    // ── Thumbnail + play overlay ──
    const thumb = isYouTube(url) ? youtubeThumb(url) : null
    return (
      <div className="hc-thumb-wrap" onClick={() => setPlaying(true)}>
        {thumb ? (
          <img src={thumb} alt="" className="hc-img"/>
        ) : (
          // Non-YouTube source — show a dark placeholder
          <div className="hc-img" style={{ background:'#111' }}/>
        )}
        <button className="hc-play" aria-label="Play video" onClick={(e) => { e.stopPropagation(); setPlaying(true) }}>
          <svg viewBox="0 0 24 24" width="34" height="34" fill="#fff">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      </div>
    )
  }

  // ── Playing — render iframe/video with overlays that hide YouTube chrome ──
  let frame
  if (isYouTube(url)) {
    frame = (
      <iframe
        ref={iframeRef}
        src={youtubeEmbed(url, true)}
        className="hc-video"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        title="Promo video"
      />
    )
  } else if (isDrive(url)) {
    frame = (
      <iframe
        ref={iframeRef}
        src={driveEmbed(url, true)}
        className="hc-video"
        allow="autoplay"
        allowFullScreen
        title="Promo video"
      />
    )
  } else {
    frame = <video ref={videoRef} src={url} autoPlay muted={muted} loop playsInline className="hc-video"/>
  }

  return (
    <>
      {frame}

      {/* Click-blocker — stops YouTube hover overlay (prev/play/next) appearing */}
      <div className="hc-click-blocker"/>

      {/* Mute / unmute toggle */}
      <button
        onClick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        className="hc-mute"
      >
        {muted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M11 5L6 9H3v6h3l5 4V5z" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M16 9l5 6M21 9l-5 6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M11 5L6 9H3v6h3l5 4V5z" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M16 8a5 5 0 010 8M19 5a9 9 0 010 14" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </button>
    </>
  )
}

/**
 * Auto-sliding carousel for the home page.
 * Slides are merged from `images` (URLs) and `videos` ({url, autoplay} objects).
 *
 * - autoplay=true (or string entry for backward compat): video plays automatically
 * - autoplay=false: thumbnail + play button; clicking either plays the video
 */
export default function HomeCarousel({ images = [], videos = [] }) {
  // Normalise videos to {url, autoplay} shape
  const normVideos = videos
    .filter(Boolean)
    .map(v => typeof v === 'string' ? { url: v, autoplay: true } : { url: v?.url || '', autoplay: v?.autoplay !== false })
    .filter(v => v.url)

  const slides = [
    ...images.filter(Boolean).map(url => ({ kind: 'image', url })),
    ...normVideos.map(v => ({ kind: 'video', url: v.url, autoplay: v.autoplay })),
  ]

  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (slides.length < 2 || paused) return
    timerRef.current = setTimeout(() => {
      setActive(i => (i + 1) % slides.length)
    }, INTERVAL_MS)
    return () => clearTimeout(timerRef.current)
  }, [active, slides.length, paused])

  if (slides.length === 0) return null

  return (
    <div
      className="home-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={i}
          className={`hc-slide ${i === active ? 'is-active' : ''}`}
          style={{ transition: `opacity ${TRANSITION}ms ease` }}
        >
          {s.kind === 'image'
            ? <img src={s.url} alt="" className="hc-img"/>
            : <VideoSlide url={s.url} autoplay={s.autoplay}/>}
        </div>
      ))}

      {/* Dots indicator */}
      {slides.length > 1 && (
        <div className="hc-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className={`hc-dot ${i === active ? 'is-active' : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
