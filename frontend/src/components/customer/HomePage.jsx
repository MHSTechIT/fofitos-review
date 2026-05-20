import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sb } from '../../lib/supabase'
import Footer from './Footer'
import Header from './Header'
import HomeCarousel from './HomeCarousel'

/* ── Floating image constants (same as CategoryPage) ── */
const IMG = 130
const OVF = IMG / 2

/* ── Single category card — floating image + glassy card ── */
function CatCard({ c, index, onExpand }) {
  const [phase, setPhase] = useState('idle')
  const pressTimer = useRef(null)
  const navTimer   = useRef(null)
  const touchUsed  = useRef(false)  // prevents duplicate mouse events after touch
  const moved      = useRef(false)  // true when finger slides = scroll, not a tap

  useEffect(() => () => {
    clearTimeout(pressTimer.current)
    clearTimeout(navTimer.current)
  }, [])

  function startPress(e) {
    if (e.type === 'touchstart') { touchUsed.current = true; moved.current = false }
    else if (touchUsed.current) return   // skip mousedown fired after touch
    clearTimeout(pressTimer.current)
    setPhase('pressing')
    pressTimer.current = setTimeout(() => setPhase('lifted'), 80)
  }
  function handleTouchMove() {
    if (moved.current) return
    moved.current = true          // finger is sliding → this is a scroll
    clearTimeout(pressTimer.current)
    clearTimeout(navTimer.current)
    setPhase('idle')              // reset visual immediately
  }
  function endPress(e) {
    if (e.type === 'mouseup' && touchUsed.current) { touchUsed.current = false; return }
    if (e.type === 'touchend') touchUsed.current = false  // removed e.preventDefault() — fixes console error
    clearTimeout(pressTimer.current)
    if (moved.current) { setPhase('idle'); return }  // was a scroll → do nothing
    if (phase === 'pressing' || phase === 'lifted') {
      setPhase('lifted')
      clearTimeout(navTimer.current)
      navTimer.current = setTimeout(() => { setPhase('idle'); onExpand(c) }, 160)
    }
  }
  function cancelPress() {
    clearTimeout(pressTimer.current)
    clearTimeout(navTimer.current)
    setPhase('idle')
  }

  const scale =
    phase === 'pressing' ? 'scale(0.95)'
    : phase === 'lifted'  ? 'scale(1.05) translateY(-6px)'
    : 'scale(1)'

  return (
    /* Entry animation wrapper — only handles fade-in, never re-animates */
    <div style={{
      animation: `catFadeIn 0.4s cubic-bezier(.22,1,.36,1) ${index * 0.06}s both`,
    }}>
    {/* Press/lift interaction wrapper */}
    <div
      style={{
        position: 'relative',
        paddingTop: OVF,
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        transform: scale,
        transition: phase === 'idle'
          ? 'transform 0.3s cubic-bezier(.4,0,.2,1)'
          : 'transform 0.14s cubic-bezier(.4,0,.2,1)',
        willChange: 'transform',
      }}
      onTouchStart={startPress}
      onTouchMove={handleTouchMove}
      onTouchEnd={endPress}
      onTouchCancel={cancelPress}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
    >
      {/* Floating category image */}
      <img
        src={c.img}
        alt={c.name}
        draggable={false}
        style={{
          position: 'absolute',
          top: 0, left: `calc(50% - ${IMG / 2}px)`,
          width: IMG, height: IMG,
          objectFit: 'contain',
          display: 'block',
          zIndex: 2,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 6px 12px rgba(91,33,182,0.13))',
        }}
      />

      {/* Glassy card */}
      <div style={{
        background: 'rgba(255,255,255,0.45)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 18,
        paddingTop: OVF + 8,
        paddingBottom: 14,
        paddingLeft: 8,
        paddingRight: 8,
        textAlign: 'center',
        boxShadow: phase === 'lifted'
          ? '0 20px 48px rgba(91,33,182,0.22), inset 0 1px 0 rgba(255,255,255,0.8)'
          : '0 4px 20px rgba(91,33,182,0.09), inset 0 1px 0 rgba(255,255,255,0.8)',
        border: phase === 'lifted'
          ? '1.5px solid rgba(124,58,237,0.35)'
          : '1px solid rgba(255,255,255,0.65)',
        position: 'relative',
        zIndex: 1,
        minHeight: OVF + 60,
        transition: 'box-shadow 0.2s, border 0.2s',
      }}>
        <div style={{
          fontSize: '0.85rem', fontWeight: 700,
          color: '#3D2C7A', lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          padding: '0 4px',
        }}>
          {c.name}
        </div>
        {c.description && (
          <div style={{
            fontSize: '0.63rem', color: '#9187B5',
            marginTop: 4, lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {c.description}
          </div>
        )}
      </div>
    </div>
    </div>
  )
}

/* ═══════════════════════════════════════════ */
export default function HomePage() {
  const nav = useNavigate()

  const [cats,    setCats]    = useState([])
  const [loading, setLoading] = useState(true)
  const [media,   setMedia]   = useState({ images: [], videos: [] })

  useEffect(() => {
    sb.from('categories').select('*').order('sort_order')
      .then(({ data }) => {
        // Only show categories that are switched ON in the admin
        setCats((data || []).filter(c => c.active !== false))
        setLoading(false)
      })
    // Fetch the single 'default' links row for the carousel media
    sb.from('links').select('media_images, media_videos').eq('id', 'default').maybeSingle()
      .then(({ data }) => {
        setMedia({
          images: Array.isArray(data?.media_images) ? data.media_images : [],
          videos: Array.isArray(data?.media_videos) ? data.media_videos : [],
        })
      })
  }, [])

  /* ── Merge grouped categories into one virtual card ── */
  const displayCats = (() => {
    const out = []
    const seen = new Set()
    for (const c of cats) {
      if (c.group_name) {
        if (seen.has(c.group_name)) continue
        seen.add(c.group_name)
        const siblings = cats.filter(x => x.group_name === c.group_name)
        out.push({
          id: `__group__${c.group_name}`,
          name: c.group_name,
          img: c.img,                                        // use first sub-cat image
          description: siblings.map(x => x.name).join(' · '),
          _isGroup: true,
          _groupName: c.group_name,
        })
      } else {
        out.push(c)
      }
    }
    return out
  })()

  function openCategory(cat) {
    if (cat._isGroup) {
      nav(`/group/${encodeURIComponent(cat._groupName)}`)
    } else {
      nav(`/category/${cat.id}`, { state: { cat } })
    }
  }

  return (
    <>
      <style>{`
        @keyframes fdIn    { from { opacity:0 } to { opacity:1 } }
        @keyframes catFadeIn {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#EDEAF8',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* ── Header ── */}
        <Header />

        {/* ── Auto-sliding promo carousel (images + videos from admin Media card) ── */}
        <HomeCarousel images={media.images} videos={media.videos} />

        {/* ── Category grid ── */}
        <div className="home-cats" style={{ paddingTop: 16 }}>
          <div className="cats-label">Browse Categories</div>
          {loading ? (
            <div className="loading">Loading menu…</div>
          ) : (
            <div className="cat-grid-new" style={{ alignItems: 'start' }}>
              {displayCats.map((c, i) => (
                <CatCard
                  key={c.id}
                  c={c}
                  index={i}
                  onExpand={openCategory}
                />
              ))}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  )
}
