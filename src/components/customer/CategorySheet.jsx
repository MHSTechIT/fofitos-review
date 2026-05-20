import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sb } from '../../lib/supabase'

const CAT_COLORS = {
  burgers:        { bg: '#F2E4D8', arch: '#5C2A10' },
  sandwiches:     { bg: '#FDF3E0', arch: '#7A5A10' },
  rice_bowls:     { bg: '#E4F2E8', arch: '#1A5C35' },
  healthy_bowls:  { bg: '#FDE8E0', arch: '#7A2210' },
  sauces:         { bg: '#EDE8F8', arch: '#3A1A8C' },
  wraps:          { bg: '#DFF2EE', arch: '#0D5245' },
  overnight_oats: { bg: '#F5F0E4', arch: '#5C3A10' },
  beverages:      { bg: '#FFE0EC', arch: '#8C1A3A' },
}
const FALLBACK = { bg: '#F0EDE6', arch: '#5B21B6' }

function getColors(p, catId) {
  if (p?.bg_color && p?.arch_color) return { bg: p.bg_color, arch: p.arch_color }
  return CAT_COLORS[catId] || FALLBACK
}

const SLOT = () => window.innerWidth * 0.65   // spacing between card centres

export default function CategorySheet({ cat, onClose }) {
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const [dragX, setDragX]         = useState(0)
  const [snapping, setSnapping]   = useState(false)
  const [infoVisible, setInfo]    = useState(true)

  const dragging     = useRef(false)
  const hasMoved     = useRef(false)
  const startX       = useRef(0)
  const liveX        = useRef(0)
  const timer        = useRef(null)
  const stageRef     = useRef(null)
  const dragMoveRef  = useRef(null)   // always points to latest dragMove
  const nav          = useNavigate()

  useEffect(() => {
    sb.from('products')
      .select('id, name, img, price, bg_color, arch_color')
      .eq('cat', cat.id)
      .then(({ data }) => { setProducts(data || []); setLoading(false) })
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = ''; clearTimeout(timer.current) }
  }, [cat.id])

  // Keep ref in sync with latest dragMove on every render
  dragMoveRef.current = dragMove

  // Attach touchmove ONCE with passive:false — uses ref so closure is never stale
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const handler = (e) => { e.preventDefault(); dragMoveRef.current(e.touches[0].clientX) }
    el.addEventListener('touchmove', handler, { passive: false })
    return () => el.removeEventListener('touchmove', handler)
  }, [])   // ← empty array: register once on mount, remove on unmount

  const slotW = SLOT()

  /* ── drag / swipe ── */
  function dragStart(clientX) {
    dragging.current = true
    hasMoved.current = false
    startX.current   = clientX
    liveX.current    = 0
    setSnapping(false)
    clearTimeout(timer.current)
  }

  function dragMove(clientX) {
    if (!dragging.current) return
    const delta = clientX - startX.current
    if (Math.abs(delta) > 6) hasMoved.current = true
    let x = delta
    if ((x > 0 && activeIdx === 0) || (x < 0 && activeIdx === products.length - 1)) x *= 0.14
    x = Math.max(-slotW * 1.2, Math.min(slotW * 1.2, x))
    liveX.current = x
    setDragX(x)
  }

  function dragEnd() {
    if (!dragging.current) return
    dragging.current = false
    if (!hasMoved.current) { setDragX(0); liveX.current = 0; return }

    const dx = liveX.current
    const th = slotW * 0.2

    if      (dx < -th && activeIdx < products.length - 1) snapTo(activeIdx + 1)
    else if (dx >  th && activeIdx > 0)                   snapTo(activeIdx - 1)
    else    bounce()
  }

  function bounce() {
    setSnapping(true)
    setDragX(0); liveX.current = 0
    timer.current = setTimeout(() => setSnapping(false), 320)
  }

  function snapTo(newIdx) {
    const offset  = newIdx - activeIdx
    const target  = -offset * slotW
    setSnapping(true)
    setInfo(false)
    setDragX(target); liveX.current = target

    timer.current = setTimeout(() => {
      setSnapping(false)
      setActiveIdx(newIdx)
      setDragX(0); liveX.current = 0
      timer.current = setTimeout(() => setInfo(true), 70)
    }, 300)
  }

  function clickProduct(i) {
    if (i === activeIdx || snapping) return
    snapTo(i)
  }

  /* ── style per product card ──
     Scale, blur & opacity are driven purely by visual distance from centre,
     so the active card also shrinks/blurs as you drag it away — fully smooth.
  ── */
  function cardImgStyle(i) {
    const offset    = i - activeIdx
    const visualPos = offset * slotW + dragX        // px from stage centre
    const dist      = Math.abs(visualPos) / slotW   // 0 = centre, 1 = one slot, 2 = two slots
    const d         = Math.min(dist, 1.0)           // clamp for style calc

    const scale   = Math.max(0.52, 1 - 0.48 * d)   // 1.0 → 0.52
    const blur    = 5.0 * d                         // 0   → 5 px
    const opacity = Math.max(0.38, 1 - 0.58 * d)   // 1.0 → 0.42
    const shadow  = 0.06 + 0.26 * (1 - d)          // 0.32 at centre → 0.06 at edge
    // Closest-to-centre card wins z-index → no overlap glitch
    const zIndex  = 4 + Math.round((1 - d) * 3)    // 7 at centre, 4 at edges

    const snapTr = 'transform 0.32s cubic-bezier(0.22,1,0.36,1), opacity 0.32s ease, filter 0.32s ease'

    return {
      position: 'absolute',
      top: '8%', left: '50%',
      width: '84%', height: '66%',
      objectFit: 'contain',
      objectPosition: 'center center',
      userSelect: 'none', WebkitUserSelect: 'none',
      pointerEvents: i === activeIdx ? 'none' : 'auto',
      cursor:        i === activeIdx ? 'default' : 'pointer',
      zIndex,
      transform: `translateX(calc(-50% + ${visualPos}px)) scale(${scale.toFixed(3)})`,
      filter:    `drop-shadow(0 20px 32px rgba(0,0,0,${shadow.toFixed(2)})) blur(${blur.toFixed(2)}px)`,
      opacity:   opacity.toFixed(3),
      transition: snapping ? snapTr : 'none',
    }
  }

  const active  = products[activeIdx]
  const { bg: sheetBg, arch } = getColors(active, cat.id)


  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.52)',
        backdropFilter: 'blur(7px)',
        zIndex: 200, animation: 'bdIn 0.25s ease',
      }} />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        borderRadius: '26px 26px 0 0',
        zIndex: 201, height: '88vh',
        display: 'flex', flexDirection: 'column',
        animation: 'sheetUp 0.40s cubic-bezier(0.22,1,0.36,1)',
        boxShadow: '0 -12px 56px rgba(0,0,0,0.22)',
        overflow: 'hidden',
        background: sheetBg,
        transition: 'background-color 0.44s ease',
      }}>

        {/* Close */}
        <div style={{ display:'flex', justifyContent:'flex-end', padding:'14px 16px 0', zIndex:10 }}>
          <button onClick={onClose} style={{
            width:32, height:32, borderRadius:'50%',
            border:`1.5px solid ${arch}44`, background:`${arch}18`,
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', fontSize:'0.82rem', color:arch,
          }}>✕</button>
        </div>

        {/* ── Stage ── */}
        <div
          ref={stageRef}
          style={{ position:'relative', flex:1, overflow:'hidden', touchAction:'none' }}
          onTouchStart={e => dragStart(e.touches[0].clientX)}
          onTouchEnd={dragEnd}
          onMouseDown={e  => dragStart(e.clientX)}
          onMouseMove={e  => dragMove(e.clientX)}
          onMouseUp={dragEnd}
          onMouseLeave={dragEnd}
        >
          {loading && <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#999',fontSize:'0.9rem' }}>Loading…</div>}
          {!loading && products.length === 0 && <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#999' }}>No products yet.</div>}

          {!loading && products.length > 0 && (
            <>


              {/* ══ Burger image track — all products ══ */}
              {products.map((p, i) => {
                const offset = i - activeIdx
                const dist   = Math.abs(offset * slotW + dragX) / slotW
                if (dist > 2.8) return null   // skip far-off cards
                return (
                  <img
                    key={p.id}
                    src={p.img}
                    alt={p.name}
                    draggable={false}
                    onClick={() => clickProduct(i)}
                    style={cardImgStyle(i)}
                  />
                )
              })}

              {/* ══ Bottom info ══ */}
              <div style={{
                position:'absolute', bottom:'3.5%',
                width:'100%', zIndex:8,
                display:'flex', flexDirection:'column',
                alignItems:'center', gap:8,
                opacity: infoVisible ? 1 : 0,
                transform: infoVisible ? 'translateY(0)' : 'translateY(8px)',
                transition:'opacity 0.24s ease, transform 0.24s ease',
                pointerEvents: infoVisible ? 'auto' : 'none',
              }}>
                {/* Product name */}
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontStyle: 'italic', fontWeight: 800,
                  fontSize: 'clamp(1.2rem, 5.5vw, 2rem)',
                  color: arch,
                  textAlign: 'center',
                  lineHeight: 1.2,
                  padding: '0 24px',
                }}>
                  {active?.name}
                </div>

                {/* Price pill */}
                {active?.price && (
                  <div
                    onClick={() => { onClose(); nav(`/product/${active.id}`) }}
                    style={{
                      border:`2px solid ${arch}`,
                      borderRadius:50,
                      padding:'10px 36px',
                      fontSize:'0.9rem', fontWeight:800,
                      color:arch, letterSpacing:'1.6px',
                      textTransform:'uppercase',
                      background:`${arch}10`,
                      cursor:'pointer',
                      boxShadow:`0 4px 18px ${arch}22`,
                      transition:'background 0.2s',
                    }}
                  >
                    {active.price} &nbsp;EACH
                  </div>
                )}
                {/* Caption */}
                <div style={{
                  fontSize:'0.60rem', fontWeight:600,
                  color:`${arch}70`, letterSpacing:'0.4px',
                }}>
                  tap price to view details
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bdIn    { from{opacity:0}                  to{opacity:1}          }
        @keyframes sheetUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
      `}</style>
    </>
  )
}
