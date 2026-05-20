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
function VideoSlide({ url, autoplay, isActive, onFullscreenChange }) {
  // When autoplay is true we render the iframe immediately.
  // When autoplay is false we show a thumbnail + play button; clicking play swaps to the iframe.
  const [playing,    setPlaying]    = useState(autoplay)
  const [muted,      setMuted]      = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const iframeRef = useRef(null)
  const videoRef  = useRef(null)

  // Let the carousel pause auto-advance while a video is fullscreen
  useEffect(() => { onFullscreenChange?.(fullscreen) }, [fullscreen, onFullscreenChange])

  // Lock page scroll while fullscreen so the overlay covers the whole viewport
  useEffect(() => {
    if (!fullscreen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [fullscreen])

  // If admin toggles autoplay later, react to the new prop
  useEffect(() => { setPlaying(autoplay) }, [autoplay])

  // When this slide is no longer the active one, mute it so the previous
  // slide's audio goes silent as the carousel crossfades to the next.
  useEffect(() => {
    if (isActive) return
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event:'command', func:'mute', args:[] }), '*'
      )
    }
    if (videoRef.current) videoRef.current.muted = true
    setMuted(true)
  }, [isActive])

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

  // CSS-based fullscreen toggle — keeps our own overlays (click-blocker + buttons)
  // so YouTube's native chrome never shows. Press again to return to normal size.
  function toggleFullscreen() {
    setFullscreen(f => !f)
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
    <div className={`hc-vwrap${fullscreen ? ' is-fs' : ''}`}>
      {frame}

      {/* Click-blocker — stops YouTube hover overlay (prev/play/next) appearing */}
      <div className="hc-click-blocker"/>

      {/* Fullscreen toggle (top-left) — expand to fill screen / shrink back */}
      <button
        onClick={toggleFullscreen}
        aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        className="hc-fs"
      >
        {fullscreen ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M4 14v6h6M20 10V4h-6M4 20l7-7M20 4l-7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

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
    </div>
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
  // Normalise images to {url, link} shape (older rows stored bare strings)
  const normImages = images
    .filter(Boolean)
    .map(im => typeof im === 'string' ? { url: im, link: '' } : { url: im?.url || '', link: im?.link || '' })
    .filter(im => im.url)

  // Normalise videos to {url, autoplay} shape
  const normVideos = videos
    .filter(Boolean)
    .map(v => typeof v === 'string' ? { url: v, autoplay: true } : { url: v?.url || '', autoplay: v?.autoplay !== false })
    .filter(v => v.url)

  const slides = [
    ...normImages.map(im => ({ kind: 'image', url: im.url, link: im.link })),
    ...normVideos.map(v => ({ kind: 'video', url: v.url, autoplay: v.autoplay })),
  ]

  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [fsActive, setFsActive] = useState(false)   // a video is in fullscreen
  const timerRef = useRef(null)

  useEffect(() => {
    if (slides.length < 2 || paused || fsActive) return
    timerRef.current = setTimeout(() => {
      setActive(i => (i + 1) % slides.length)
    }, INTERVAL_MS)
    return () => clearTimeout(timerRef.current)
  }, [active, slides.length, paused, fsActive])

  if (slides.length === 0) return null

  const go = (delta) => setActive(i => (i + delta + slides.length) % slides.length)

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
            ? (s.link
                ? <a href={s.link} className="hc-imglink"><img src={s.url} alt="" className="hc-img"/></a>
                : <img src={s.url} alt="" className="hc-img"/>)
            : <VideoSlide url={s.url} autoplay={s.autoplay} isActive={i === active} onFullscreenChange={setFsActive}/>}
        </div>
      ))}

      {/* Manual swipe arrows */}
      {slides.length > 1 && (
        <>
          <button className="hc-arrow hc-arrow-left" aria-label="Previous slide" onClick={() => go(-1)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="hc-arrow hc-arrow-right" aria-label="Next slide" onClick={() => go(1)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
