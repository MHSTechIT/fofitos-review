import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { sb } from '../../lib/supabase'
import Footer from './Footer'
import Header from './Header'

/* Convert a Google Drive share/view URL → embed (preview) URL */
function driveEmbed(url) {
  try {
    const u = new URL(url)
    if (u.hostname.includes('drive.google.com')) {
      // /file/d/FILE_ID/view  or  /file/d/FILE_ID/edit
      const m = u.pathname.match(/\/file\/d\/([^/]+)/)
      if (m) return `https://drive.google.com/file/d/${m[1]}/preview`
      // ?id=FILE_ID format
      const id = u.searchParams.get('id')
      if (id) return `https://drive.google.com/file/d/${id}/preview`
    }
  } catch {}
  return url
}

function isDrive(url) {
  return url && url.includes('drive.google.com')
}

function youtubeEmbed(url) {
  const params = 'autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&fs=0&disablekb=1&enablejsapi=1&loop=1'
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace(/^\//, '')
      return `https://www.youtube.com/embed/${id}?${params}&playlist=${id}`
    }
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v') || u.pathname.match(/\/embed\/([^/?]+)/)?.[1]
      if (id) return `https://www.youtube.com/embed/${id}?${params}&playlist=${id}`
    }
  } catch {}
  return null
}

function isYouTube(url) {
  return url && (url.includes('youtube.com') || url.includes('youtu.be'))
}

/* ── Floating mini video player (collapsible to side chevron, expandable to fullscreen) ── */
function FloatingVideo({ url, onExpandedChange }) {
  const [state, setState] = useState('mini')   // 'mini' | 'collapsed' | 'expanded'
  const [muted, setMuted] = useState(true)
  const wrapRef   = useRef(null)
  const iframeRef = useRef(null)
  const videoRef  = useRef(null)

  // Tell the parent page when we enter/leave the expanded side-panel state
  useEffect(() => {
    onExpandedChange?.(state === 'expanded')
  }, [state, onExpandedChange])

  function handleExpand() {
    const isDesktop = window.matchMedia('(min-width: 900px)').matches
    if (isDesktop) {
      // Desktop: toggle a tall right-side panel (full height, 9:16) instead of native fullscreen
      setState(s => (s === 'expanded' ? 'mini' : 'expanded'))
      return
    }
    // Mobile: keep native fullscreen toggle
    const el = wrapRef.current
    if (!el) return
    const inFs = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement
    if (inFs) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen
      if (exit) exit.call(document)
    } else {
      const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen
      if (req) req.call(el)
    }
  }

  function toggleMute() {
    const next = !muted
    setMuted(next)
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event:'command', func: next ? 'mute' : 'unMute', args: [] }),
        '*'
      )
    }
    if (videoRef.current) videoRef.current.muted = next
  }

  if (!url) return null

  if (state === 'collapsed') {
    return (
      <button
        onClick={() => setState('mini')}
        aria-label="Open video"
        style={{
          position:'fixed', right:0, top:'50%', transform:'translateY(-50%)',
          width:32, height:64, borderRadius:'12px 0 0 12px',
          border:'none', background:'rgba(91,33,182,0.92)', color:'#fff',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'-2px 4px 16px rgba(0,0,0,0.25)', zIndex:998,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    )
  }

  let embedSrc = null
  if (isDrive(url)) {
    const base = driveEmbed(url)
    embedSrc = base + (base.includes('?') ? '&' : '?') + 'autoplay=1'
  } else if (isYouTube(url)) {
    embedSrc = youtubeEmbed(url)
  }

  const isExpanded = state === 'expanded'
  const wrapStyle = isExpanded
    ? {
        // Desktop: tall right-side panel — inset rounded card, 9:16 ratio
        position:'fixed', right:16, top:16, bottom:16,
        height:'calc(100vh - 32px)', aspectRatio:'9/16',
        borderRadius:16, overflow:'hidden',
        background:'#000',
        boxShadow:'-8px 0 32px rgba(0,0,0,0.4)',
        zIndex:998,
      }
    : {
        position:'fixed', right:16, bottom:16,
        width:180, aspectRatio:'9/16',
        borderRadius:14, overflow:'hidden',
        background:'#000',
        boxShadow:'0 8px 28px rgba(0,0,0,0.35)',
        zIndex:998,
      }

  return (
    <div
      ref={wrapRef}
      className="fv-mini"
      style={wrapStyle}
    >
      {embedSrc ? (
        <iframe
          ref={iframeRef}
          src={embedSrc}
          style={{ width:'100%', height:'100%', border:'none', display:'block' }}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title="Category video"
        />
      ) : (
        <video
          ref={videoRef}
          src={url}
          autoPlay
          muted={muted}
          loop
          playsInline
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
        />
      )}

      {/* Bottom strip — covers YouTube's share / watch-later / logo overlay.
          Percentage-based so it scales between mini and expanded modes. */}
      <div style={{
        position:'absolute', left:0, right:0, bottom:0, height:'15%',
        background:'#000', pointerEvents:'none', zIndex:1,
      }}/>

      {/* Top strip — hides YouTube's title/channel overlay (avatar, channel name, title) */}
      <div style={{
        position:'absolute', left:0, right:0, top:0, height:'34%',
        background:'linear-gradient(180deg, rgba(0,0,0,1) 78%, rgba(0,0,0,0) 100%)',
        pointerEvents:'none', zIndex:1,
      }}/>

      {/* Center click-blocker — prevents YouTube's hover overlay (play/pause, prev/next) from appearing */}
      <div style={{
        position:'absolute', left:0, right:0, top:'34%', bottom:'15%',
        background:'transparent', zIndex:1,
      }}/>

      {/* Expand button (top-left) — desktop: toggle tall side panel; mobile: native fullscreen */}
      <button
        onClick={handleExpand}
        aria-label={isExpanded ? 'Shrink video' : 'Expand video'}
        style={{
          position:'absolute', top:8, left:8,
          width:30, height:30, borderRadius:8,
          border:'none', background:'rgba(0,0,0,0.55)', color:'#fff',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          backdropFilter:'blur(4px)', zIndex:2,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M4 14v6h6M20 10V4h-6M4 20l7-7M20 4l-7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Mute toggle (left of X) */}
      <button
        onClick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        style={{
          position:'absolute', top:8, right:46,
          width:30, height:30, borderRadius:'50%',
          border:'none', background:'rgba(0,0,0,0.55)', color:'#fff',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          backdropFilter:'blur(4px)', zIndex:2,
        }}
      >
        {muted ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M11 5L6 9H3v6h3l5 4V5z" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M16 9l5 6M21 9l-5 6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M11 5L6 9H3v6h3l5 4V5z" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M16 8a5 5 0 010 8M19 5a9 9 0 010 14" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </button>

      {/* Close (minimise) button (top-right) */}
      <button
        onClick={() => setState('collapsed')}
        aria-label="Minimise video"
        style={{
          position:'absolute', top:8, right:8,
          width:30, height:30, borderRadius:'50%',
          border:'none', background:'rgba(0,0,0,0.55)', color:'#fff',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          backdropFilter:'blur(4px)', zIndex:2,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

/* ── Single product card — image floats half above card, half inside ── */
const IMG = 140  // image diameter in px
const OVF = IMG / 2  // how many px the image extends above the white card

function ProdCard({ p, index, onClick }) {
  return (
    /* Outer transparent wrapper — provides the top space for the image overflow */
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        paddingTop: OVF,          // transparent top half-image zone
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        animation: `prodCardIn 0.35s ease ${index * 0.04}s both`,
        transition: 'transform 0.13s cubic-bezier(.4,0,.2,1)',
      }}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.94)'}
      onTouchEnd={e => e.currentTarget.style.transform = ''}
      onTouchCancel={e => e.currentTarget.style.transform = ''}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
      onMouseUp={e => e.currentTarget.style.transform = ''}
      onMouseLeave={e => e.currentTarget.style.transform = ''}
    >
      {/* ── Floating product image (top half transparent, bottom half over card) ── */}
      <img
        src={p.img}
        alt={p.name}
        draggable={false}
        style={{
          position: 'absolute',
          top: 0,
          left: `calc(50% - ${IMG / 2}px)`,
          width: IMG,
          height: IMG,
          objectFit: 'contain',
          display: 'block',
          zIndex: 2,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 6px 12px rgba(91,33,182,0.13))',
        }}
      />

      {/* ── Card ── */}
      <div style={{
        background: '#fff',
        borderRadius: 18,
        paddingTop: OVF + 6,
        paddingBottom: 12,
        paddingLeft: 6,
        paddingRight: 6,
        textAlign: 'center',
        boxShadow: '0 4px 18px rgba(91,33,182,0.10)',
        border: '1px solid rgba(91,33,182,0.07)',
        position: 'relative',
        zIndex: 1,
        minHeight: OVF + 52,
      }}>
        <div style={{
          fontSize: '0.82rem', fontWeight: 700,
          color: '#3D2C7A',
          lineHeight: 1.35,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          padding: '0 4px',
        }}>
          {p.name}
        </div>
      </div>
    </div>
  )
}

export default function CategoryPage() {
  const { catId } = useParams()
  const loc = useLocation()
  const nav = useNavigate()

  const [cat,      setCat]      = useState(loc.state?.cat || null)
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [videoExpanded, setVideoExpanded] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)

    // Fetch category data (in case video_url or description changed)
    sb.from('categories').select('*').eq('id', catId).single()
      .then(({ data }) => { if (data) setCat(data) })

    // Fetch products
    sb.from('products')
      .select('id, name, img, price, tagline, rating, reviews, tags, is_veg, sort_order')
      .eq('cat', catId)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        const prods = data || []
        setProducts(prods)
        setLoading(false)
        prods.forEach(p => { if (p.img) { const i = new Image(); i.src = p.img } })
      })
  }, [catId])

  return (
    <>
      <style>{`
        @keyframes prodCardIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pageSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* ── Video wrapper ── */
        .cat-video-wrap {
          margin: 14px 16px 0;
          border-radius: 18px;
          overflow: hidden;
          background: #000;
          aspect-ratio: 16/9;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18);
        }
        @media (min-width: 900px) {
          .cat-video-wrap { max-width: 680px; margin: 18px auto 0; }
        }
        /* ── Category title ── */
        .cat-title-wrap { padding: 12px 20px 4px; }
        @media (min-width: 900px) {
          .cat-title-wrap { max-width: 900px; margin: 0 auto; padding: 16px 48px 6px; }
        }
        /* ── Product grid ── */
        .prod-grid-wrap { padding: 16px 16px 130px; }
        .prod-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px 12px;
          align-items: start;
        }
        @media (min-width: 900px) {
          .prod-grid-wrap { max-width: 900px; margin: 0 auto; padding: 20px 48px 130px; }
          .prod-grid { grid-template-columns: repeat(4, 1fr); gap: 20px 16px; }
        }
      `}</style>

      {/* ── PAGE ── */}
      <div style={{
        minHeight: '100vh',
        background: '#EDEAF8',
        animation: 'pageSlideUp 0.32s ease both',
      }}>

        {/* ── Header — stays full width even when the video is expanded ── */}
        <Header showBack />

        {/* Content below the nav: shifts left when the video is expanded.
            Panel footprint = panel width (9:16 of height) + 16px inset + 16px gap. */}
        <div style={{
          paddingRight: videoExpanded ? 'calc((100vh - 32px) * 9 / 16 + 32px)' : '0px',
        }}>

        {/* ── Category name + desc ── */}
        <div className="cat-title-wrap">
          <div style={{
            fontSize: '1.25rem', fontWeight: 800, color: '#5B21B6',
            letterSpacing: '-0.3px', lineHeight: 1.2,
          }}>
            {cat?.name || ''}
          </div>
          {cat?.description && (
            <div style={{ fontSize: '0.74rem', color: '#9187B5', marginTop: 3 }}>
              {cat.description}
            </div>
          )}
        </div>

        {/* ── Product grid ── */}
        <div className="prod-grid-wrap" style={{ paddingBottom: 32 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9187B5', fontSize: '0.88rem' }}>
              Loading products…
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9187B5', fontSize: '0.88rem' }}>
              No products yet.
            </div>
          ) : (
            <div className="prod-grid">
              {products.map((p, i) => (
                <ProdCard
                  key={p.id}
                  p={p}
                  index={i}
                  onClick={() => nav(`/product/${p.id}`, { state: { product: p, cat, products } })}
                />
              ))}
            </div>
          )}
        </div>

        <Footer />
        </div>
      </div>

      {/* ── Floating mini video player (sibling of animated wrapper so position:fixed works) ── */}
      <FloatingVideo url={cat?.video_url} onExpandedChange={setVideoExpanded} />
    </>
  )
}
