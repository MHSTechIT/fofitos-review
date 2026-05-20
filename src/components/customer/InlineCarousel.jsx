import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sb } from '../../lib/supabase'
import zomatoImg from '../../assets/zomato.png'
import swiggyImg from '../../assets/swiggy.png'


/* slot = 30% on mobile, 14% on desktop (full-width wrapper) */
const SLOT = (w) => w >= 900 ? w * 0.14 : w * 0.30

function VegBadge({ isVeg }) {
  const color = isVeg ? '#2D9E45' : '#8B1A1A'
  return (
    <div style={{
      width: 14, height: 14, border: `2px solid ${color}`, borderRadius: 3,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, background: 'rgba(255,255,255,0.15)', verticalAlign: 'middle',
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
    </div>
  )
}

function starStr(r) {
  let s = ''
  for (let i = 1; i <= 5; i++) s += i <= Math.floor(r) ? '★' : (i - 0.5 <= r ? '⭑' : '☆')
  return s
}

export default function InlineCarousel({ cat, skipAnimation = false, initialProducts = [], initialProductId = null }) {
  const findIdx = (prods) => {
    if (!initialProductId || !prods.length) return 0
    const i = prods.findIndex(p => p.id === initialProductId)
    return i >= 0 ? i : 0
  }

  const [products,    setProducts]    = useState(initialProducts)
  const [loading,     setLoading]     = useState(initialProducts.length === 0)
  const [activeIdx,   setActiveIdx]   = useState(() => findIdx(initialProducts))
  const [dragX,       setDragX]       = useState(0)
  const [snapping,    setSnapping]    = useState(false)
  const [nameKey,     setNameKey]     = useState(0)
  const [exiting,     setExiting]     = useState(false)
  const [containerW,  setContainerW]  = useState(window.innerWidth)
  const [hintVisible, setHintVisible] = useState(false)
  const [bouncing,    setBouncing]    = useState(false)
  const [bounceKey,   setBounceKey]   = useState(0)
  const [entryDone,   setEntryDone]   = useState(skipAnimation)

  const dragging     = useRef(false)
  const hasMoved     = useRef(false)
  const tapIdx       = useRef(null)
  const startX       = useRef(0)
  const startY       = useRef(0)
  const liveX        = useRef(0)
  const liveY        = useRef(0)
  const axisLock     = useRef(null)
  const snapTimer    = useRef(null)
  const navTimer     = useRef(null)
  const hintTimer    = useRef(null)
  const bounceTimer  = useRef(null)
  const entryTimer   = useRef(null)
  const wrapRef      = useRef(null)
  const moveRef      = useRef(null)
  const nav          = useNavigate()

  useEffect(() => {
    setActiveIdx(findIdx(initialProducts))
    setDragX(0); setExiting(false); setNameKey(0)
    setHintVisible(false); setBouncing(false)
    setEntryDone(skipAnimation)
    clearTimeout(hintTimer.current); clearTimeout(bounceTimer.current); clearTimeout(entryTimer.current)

    if (initialProducts.length === 0) setLoading(true)

    // Mark entry animation done after sheet-up completes
    entryTimer.current = setTimeout(() => setEntryDone(true), 480)

    // After 2 s of inactivity: show hint + bounce the panel twice
    hintTimer.current = setTimeout(() => {
      setHintVisible(true)
      setBounceKey(k => k + 1)
      setBouncing(true)
      bounceTimer.current = setTimeout(() => setBouncing(false), 1500)
    }, 2000)

    sb.from('products')
      .select('id, name, img, price, tagline, rating, reviews, tags, is_veg')
      .eq('cat', cat.id)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        const prods = data || []
        setProducts(prods)
        setActiveIdx(findIdx(prods))
        setLoading(false)
        prods.forEach(p => { if (p.img) { const i = new Image(); i.src = p.img } })
      })
    return () => {
      clearTimeout(snapTimer.current); clearTimeout(navTimer.current)
      clearTimeout(hintTimer.current); clearTimeout(bounceTimer.current); clearTimeout(entryTimer.current)
    }
  }, [cat.id])

  moveRef.current = handleMove

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const h = e => { e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY) }
    el.addEventListener('touchmove', h, { passive: false })
    return () => el.removeEventListener('touchmove', h)
  }, [])

  /* Track actual wrapper width so slot spacing is correct at any size */
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setContainerW(el.offsetWidth))
    ro.observe(el)
    setContainerW(el.offsetWidth)
    return () => ro.disconnect()
  }, [])

  const slotW = SLOT(containerW)

  function dragStart(x, y) {
    if (exiting) return
    // Dismiss swipe-up hint on any interaction
    setHintVisible(false)
    clearTimeout(hintTimer.current)
    dragging.current = true; hasMoved.current = false; axisLock.current = null
    // tapIdx is set by onPointerDown on images (fires before this) — don't reset it here
    startX.current = x; startY.current = y; liveX.current = 0; liveY.current = 0
    setSnapping(false); clearTimeout(snapTimer.current)
  }

  function handleMove(x, y) {
    if (!dragging.current) return
    const dx = x - startX.current, dy = y - startY.current
    if (!axisLock.current && (Math.abs(dx) > 6 || Math.abs(dy) > 6))
      axisLock.current = Math.abs(dy) > Math.abs(dx) ? 'v' : 'h'
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) hasMoved.current = true
    liveX.current = dx; liveY.current = dy
    if (axisLock.current === 'h') {
      let rx = dx
      if ((rx > 0 && activeIdx === 0) || (rx < 0 && activeIdx === products.length - 1)) rx *= 0.12
      rx = Math.max(-slotW * 1.1, Math.min(slotW * 1.1, rx))
      setDragX(rx)
    }
  }

  function dragEnd() {
    if (!dragging.current) return
    dragging.current = false
    const ti = tapIdx.current; tapIdx.current = null   // consume tap before any early return
    if (axisLock.current === 'v' && liveY.current < -50) { goToDetail(); return }
    if (!hasMoved.current) {
      setDragX(0)
      if (ti !== null) { if (ti === activeIdx) goToDetail(); else snapTo(ti) }
      return
    }
    if (axisLock.current === 'v') { setDragX(0); return }
    const dx = liveX.current, th = slotW * 0.22
    if      (dx < -th && activeIdx < products.length - 1) snapTo(activeIdx + 1)
    else if (dx >  th && activeIdx > 0)                   snapTo(activeIdx - 1)
    else bounce()
  }

  function restartHint() {
    setHintVisible(false)
    clearTimeout(hintTimer.current)
    clearTimeout(bounceTimer.current)
    hintTimer.current = setTimeout(() => {
      setHintVisible(true)
      setBounceKey(k => k + 1)
      setBouncing(true)
      bounceTimer.current = setTimeout(() => setBouncing(false), 1500)
    }, 2000)
  }

  function bounce() {
    setSnapping(true); setDragX(0); liveX.current = 0
    snapTimer.current = setTimeout(() => {
      setSnapping(false)
      restartHint()   // user swiped but stayed on same product → re-show hint
    }, 300)
  }

  function snapTo(i) {
    const target = -(i - activeIdx) * slotW
    setSnapping(true); setDragX(target); liveX.current = target
    snapTimer.current = setTimeout(() => {
      setSnapping(false); setActiveIdx(i); setNameKey(k => k + 1)
      setDragX(0); liveX.current = 0
      restartHint()   // new product selected → re-show hint after 2 s
    }, 300)
  }

  function goToDetail() {
    if (exiting || !products[activeIdx]) return
    setExiting(true)
    const p = products[activeIdx]
    // Preload the product image immediately so DetailPage renders it from cache
    if (p.img) { const preload = new Image(); preload.src = p.img }
    const tStart = Date.now()
    sb.from('products').select('*').eq('id', p.id).single()
      .then(({ data: full }) => {
        // Also preload full-res image if different
        if (full?.img && full.img !== p.img) { const preload = new Image(); preload.src = full.img }
        const wait = Math.max(0, 700 - (Date.now() - tStart))
        navTimer.current = setTimeout(() =>
          nav(`/product/${p.id}`, { state: { fromCarousel: true, product: full || p, cat, products } }), wait)
      })
      .catch(() => {
        navTimer.current = setTimeout(() =>
          nav(`/product/${p.id}`, { state: { fromCarousel: true, product: p, cat, products } }), 700)
      })
  }

  /* ── image style ── */
  function imgStyle(i) {
    const offset    = i - activeIdx
    const visualPos = offset * slotW + dragX
    const dist      = Math.abs(visualPos) / slotW
    const d         = Math.min(dist, 1.0)
    const isActive  = dist < 0.15
    const size      = isActive ? 185 : 118
    const topOff    = isActive ? 7 : 41    // center of burger lands on card top edge
    const snap      = 'transform 0.3s cubic-bezier(0.22,1,0.36,1)'
    return {
      position: 'absolute',
      width: size, height: size,
      top: topOff, left: '50%',
      objectFit: 'contain',
      userSelect: 'none', WebkitUserSelect: 'none',
      pointerEvents: 'auto', cursor: 'pointer',
      transform: `translateX(calc(-50% + ${visualPos}px)) scale(${(isActive ? 1 : Math.max(0.65, 1 - 0.35 * d)).toFixed(3)})`,
      filter: isActive
        ? `drop-shadow(0 18px 36px rgba(0,0,0,0.38))`
        : `blur(${Math.min(2.5, 2.5 * d).toFixed(1)}px) drop-shadow(0 8px 18px rgba(0,0,0,0.2))`,
      opacity: isActive ? 1 : Math.max(0.6, 1 - 0.4 * d),
      zIndex: isActive ? 5 : 3,
      transition: snapping ? snap : 'none',
      willChange: 'transform',
    }
  }

  const active = products[activeIdx]

  /* Layout constants */
  const CARD_H    = 230          // height of purple card
  const OVERFLOW  = 100          // outer wrapper extra height above card
  // card top is OVERFLOW px from outer-wrapper top
  // active burger (185px): center at card top → topOff = OVERFLOW - 185/2 = 7
  // side burger (118px):   center at card top → topOff = OVERFLOW - 118/2 = 41

  return (
    <>
      <style>{`
        /* ── Outer: fixed centering shell — never animated ── */
        .carousel-outer {
          position: fixed; bottom: 28px; left: 0; right: 0;
          z-index: 101; display: flex; justify-content: center;
          pointer-events: none;
        }
        /* ── Inner: animates sheetUp, captures pointer events ── */
        .carousel-inner {
          width: 100%; pointer-events: auto; touch-action: none;
          position: relative;
        }
        @media (min-width: 900px) {
          .carousel-outer { bottom: 40px; }
          .carousel-inner { width: 100%; max-width: 680px; }
        }
      `}</style>

      {/* ── OUTER positioning shell (never animated) ── */}
      <div className="carousel-outer">

      {/* ── INNER: event handler + size wrapper (never remounted) ── */}
      <div
        ref={wrapRef}
        className="carousel-inner"
        style={{
          height: CARD_H + OVERFLOW,
          opacity: exiting ? 0 : 1,
          transition: exiting ? 'opacity 0.08s' : 'none',
        }}
        onTouchStart={e => dragStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={dragEnd}
        onMouseDown={e => dragStart(e.clientX, e.clientY)}
        onMouseMove={e => { if (dragging.current) handleMove(e.clientX, e.clientY) }}
        onMouseUp={dragEnd}
        onMouseLeave={dragEnd}
      >
      {/* ── ANIMATED wrapper — remounts on each bounce via key, restarting the CSS animation ── */}
      <div
        key={bouncing ? bounceKey : 'base'}
        style={{
          position: 'absolute', inset: 0,
          animation: exiting       ? 'none'
                   : bouncing      ? 'panelBounce 1.4s cubic-bezier(0.22,1,0.36,1)'
                   : entryDone     ? 'none'
                   : skipAnimation ? 'none'
                   : 'sheetUp 0.42s cubic-bezier(0.22,1,0.36,1) both',
          willChange: 'transform',
        }}
      >
        {/* ── PURPLE CARD — full rounded corners, sits at bottom ── */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 14, right: 14,
          height: CARD_H,
          background: 'linear-gradient(135deg,#5B21B6 0%,#7C3AED 100%)',
          borderRadius: 22,
          boxShadow: '0 -4px 40px rgba(0,0,0,0.28)',
          overflow: 'hidden',
          zIndex: 2,
        }}>
          {/* Glow blobs */}
          <div style={{position:'absolute',top:-30,right:-20,width:150,height:150,borderRadius:'50%',background:'rgba(167,139,250,0.22)',filter:'blur(36px)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',bottom:-25,left:-15,width:110,height:110,borderRadius:'50%',background:'rgba(91,33,182,0.28)',filter:'blur(26px)',pointerEvents:'none'}}/>
        </div>

        {/* ── Product images — on top of card, overflow above ── */}
        {!loading && products.map((p, i) => {
          const dist = Math.abs((i - activeIdx) * slotW + dragX) / slotW
          if (dist > 1.6) return null
          return (
            <img key={p.id} src={p.img} alt={p.name} draggable={false}
              onPointerDown={() => { tapIdx.current = i }}
              onTouchStart={e => { e.stopPropagation(); tapIdx.current = i; dragStart(e.touches[0].clientX, e.touches[0].clientY) }}
              style={imgStyle(i)}
            />
          )
        })}

        {/* ── Text content inside card ── */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 14, right: 14,
          height: CARD_H,
          padding: '96px 20px 16px',
          zIndex: 6,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          {loading ? (
            <div style={{color:'rgba(255,255,255,0.4)',fontSize:'0.85rem'}}>Loading…</div>
          ) : (
            <div key={nameKey} style={{animation:'nameFade 0.3s ease both', overflow:'hidden'}}>
              {/* Name — dynamic font size based on name length */}
              {active && (() => {
                const len = (active.name || '').length
                const fs = len > 32 ? 'clamp(0.78rem,3vw,0.95rem)'
                         : len > 24 ? 'clamp(0.88rem,3.6vw,1.1rem)'
                         : len > 16 ? 'clamp(1rem,4vw,1.28rem)'
                         : 'clamp(1.1rem,4.5vw,1.45rem)'
                const words = (active.name || '').split(' ')
                const last  = words.pop()
                return (
                  <div
                    onClick={() => goToDetail()}
                    style={{fontSize:fs, fontWeight:800, color:'#fff', lineHeight:1.25, marginBottom:3,
                      pointerEvents:'auto', cursor:'pointer',
                      display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}
                  >
                    {words.length > 0 && words.join(' ') + ' '}
                    <span style={{ whiteSpace: 'nowrap' }}>
                      {last}
                      <span style={{display:'inline-flex',alignItems:'center',marginLeft:6,verticalAlign:'middle',position:'relative',top:'-1px'}}>
                        <VegBadge isVeg={active.is_veg !== false} />
                      </span>
                    </span>
                  </div>
                )
              })()}
              {/* Tagline — also clickable */}
              {active?.tagline && (
                <div
                  onClick={() => goToDetail()}
                  style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.7)',lineHeight:1.35,marginBottom:6,
                    pointerEvents:'auto', cursor:'pointer',
                    display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical', overflow:'hidden'}}
                >
                  {active.tagline}
                </div>
              )}
              {/* Stars */}
              <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:7}}>
                <span style={{color:'#FBBF24',fontSize:'0.78rem',letterSpacing:1}}>{starStr(active?.rating||0)}</span>
                <span style={{fontWeight:700,color:'#fff',fontSize:'0.76rem'}}>{active?.rating}</span>
                <span style={{color:'rgba(255,255,255,0.5)',fontSize:'0.68rem'}}>({active?.reviews} reviews)</span>
              </div>
              {/* Tags */}
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {(active?.tags||[]).map(t=>(
                  <span key={t} style={{
                    fontSize:'0.58rem',fontWeight:800,letterSpacing:'1px',textTransform:'uppercase',
                    color:'rgba(255,255,255,0.95)',border:'1.5px solid rgba(255,255,255,0.45)',
                    borderRadius:50,padding:'3px 10px',background:'rgba(255,255,255,0.1)',
                  }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>{/* ── /animated wrapper ── */}
      </div>{/* ── /carousel-inner ── */}
      </div>{/* ── /carousel-outer ── */}

      {/* ══ TRANSITION OVERLAY — shared-element transition to detail page ══ */}
      {exiting && active && (() => {
        const isDesktop = window.innerWidth >= 900
        return (
          <>
            {/* Background: dark overlay → page background (all screen sizes) */}
            <div style={{
              position:'fixed', inset:0, zIndex:199, pointerEvents:'none',
              animation:'transitionBg 0.68s ease forwards',
            }}/>

            {/* Mobile only: burger + card rise animations */}
            {!isDesktop && (
              <>
                {/* Burger rises from carousel position → detail page position */}
                <div style={{
                  position:'fixed', top:80, left:'50%',
                  zIndex:211, pointerEvents:'none',
                  animation:'burgerRise 0.52s cubic-bezier(0.22,1,0.36,1) forwards',
                  willChange: 'transform',
                }}>
                  <img src={active.img} alt={active.name} style={{
                    width:185, height:185, objectFit:'contain', display:'block',
                    filter:'drop-shadow(0 16px 36px rgba(0,0,0,0.35))',
                  }}/>
                </div>

                {/* Purple card rises from carousel position → detail page position */}
                <div style={{
                  position:'fixed', top:185, left:16, right:16,
                  zIndex:209, pointerEvents:'none',
                  animation:'cardRise 0.52s cubic-bezier(0.22,1,0.36,1) forwards',
                  background:'linear-gradient(135deg,#5B21B6 0%,#7C3AED 100%)',
                  borderRadius:22, padding:'90px 20px 24px', overflow:'hidden',
                  willChange: 'transform',
                }}>
                  <div style={{position:'absolute',top:-30,right:-20,width:130,height:130,borderRadius:'50%',background:'rgba(167,139,250,0.25)',filter:'blur(35px)',pointerEvents:'none'}}/>
                  <div style={{position:'absolute',bottom:-20,left:-10,width:100,height:100,borderRadius:'50%',background:'rgba(91,33,182,0.35)',filter:'blur(25px)',pointerEvents:'none'}}/>
                  <div style={{position:'relative',zIndex:2}}>
                    <div style={{fontSize:'clamp(1.25rem,5vw,1.6rem)',fontWeight:800,color:'#fff',lineHeight:1.2,marginBottom:6}}>{active.name}</div>
                    {active.tagline && <div style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.7)',lineHeight:1.45,marginBottom:12}}>{active.tagline}</div>}
                    <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:14}}>
                      <span style={{color:'#FBBF24',fontSize:'0.82rem',letterSpacing:1}}>{starStr(active.rating||0)}</span>
                      <span style={{fontWeight:700,color:'#fff',fontSize:'0.8rem'}}>{active.rating}</span>
                      <span style={{color:'rgba(255,255,255,0.55)',fontSize:'0.73rem'}}>({active.reviews} reviews)</span>
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                      {(active.tags||[]).map(t=>(
                        <span key={t} style={{fontSize:'0.62rem',fontWeight:800,letterSpacing:'1px',textTransform:'uppercase',color:'rgba(255,255,255,0.95)',border:'1.5px solid rgba(255,255,255,0.5)',borderRadius:50,padding:'4px 12px',background:'rgba(255,255,255,0.1)'}}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Desktop only: product image fades + scales into left-column position */}
            {isDesktop && (
              <div style={{
                position:'fixed', top:'50%', left:'25%',
                zIndex:211, pointerEvents:'none',
                transform:'translate(-50%,-50%)',
                animation:'desktopImgReveal 0.55s cubic-bezier(0.22,1,0.36,1) forwards',
                willChange: 'transform, opacity',
              }}>
                <img src={active.img} alt={active.name} style={{
                  width:240, height:240, objectFit:'contain', display:'block',
                  filter:'drop-shadow(0 20px 48px rgba(0,0,0,0.32))',
                }}/>
              </div>
            )}
          </>
        )
      })()}

      {/* ── Swipe-up hint overlay ── */}
      {hintVisible && !exiting && !loading && (
        <div style={{
          position: 'fixed',
          bottom: 28 + CARD_H + OVERFLOW + 18,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 110,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          animation: 'hintAppear 0.5s ease both',
        }}>
          {/* Upward arrow */}
          <div style={{ animation: 'arrowFloat 0.9s ease-in-out infinite' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 18V6M12 6l-6 6M12 6l6 6" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* Label */}
          <span style={{
            marginTop: 4,
            fontSize: '0.6rem',
            fontWeight: 800,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.9)',
            textShadow: '0 2px 10px rgba(0,0,0,0.55)',
          }}>
            Swipe Up
          </span>
        </div>
      )}

      <style>{`
        @keyframes sheetUp          { from { transform:translateY(100%); } to { transform:translateY(0); } }
        @keyframes nameFade         { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:translateY(0); } }
        @keyframes transitionBg     { 0% { background:rgba(0,0,0,0.52); } 100% { background:#F2EFF8; } }
        @keyframes burgerRise       { from { transform:translateX(-50%) translateY(calc(100vh - 431px)); } to { transform:translateX(-50%) translateY(0); } }
        @keyframes cardRise         { from { transform:translateY(calc(100vh - 443px)); } to { transform:translateY(0); } }
        @keyframes contentSlideUp   { from { opacity:0; transform:translateY(80px); } to { opacity:1; transform:translateY(0); } }
        @keyframes desktopImgReveal { from { opacity:0; transform:translate(-50%,-50%) scale(0.75) translateY(80px); } to { opacity:1; transform:translate(-50%,-50%) scale(1) translateY(0); } }

        /* ── Swipe-up hint ── */
        @keyframes hintAppear {
          from { opacity:0; transform:translateX(-50%) translateY(10px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
        @keyframes arrowFloat {
          0%,100% { transform:translateY(0); }
          50%     { transform:translateY(-7px); }
        }

        /* ── Panel bounce — 2 jumps ── */
        @keyframes panelBounce {
          0%   { transform:translateY(0); }
          15%  { transform:translateY(-22px); }
          30%  { transform:translateY(0); }
          45%  { transform:translateY(-14px); }
          60%  { transform:translateY(0); }
          100% { transform:translateY(0); }
        }
      `}</style>
    </>
  )
}
