import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { sb } from '../../lib/supabase'
import Nav from './Nav'
import ReviewModal from './ReviewModal'
import Toast from './Toast'
import Footer from './Footer'
import Header from './Header'
import zomatoImg from '../../assets/zomato.png'
import swiggyImg from '../../assets/swiggy.png'

function VegBadge({ isVeg }) {
  const color = isVeg ? '#2D9E45' : '#8B1A1A'
  return (
    <div style={{
      width: 16, height: 16, border: `2.5px solid ${color}`, borderRadius: 3,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, background: 'rgba(255,255,255,0.15)', verticalAlign: 'middle',
    }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
    </div>
  )
}

function starStr(r) {
  let s = ''
  for (let i = 1; i <= 5; i++) s += i <= Math.floor(r) ? '★' : (i - 0.5 <= r ? '⭑' : '☆')
  return s
}
function avatarColor(name) {
  const colors = ['#7B2CBF','#E05252','#4A90D9','#E09A2C','#2CB67D']
  let h = 0; for (let c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[h]
}

/* ── Calorie breakdown — animated pie chart ──
   Built from a single circle whose stroke is thick enough to fill all the way
   to the centre (no hole), so each dash-array arc reads as a solid pie wedge.
   A white under-circle shows through the small gaps as crisp slice dividers. */
function MacroPie({ pro, fat, carb, cal, revealed = false }) {
  const SIZE = 180
  const C    = SIZE / 2          // 90 — centre
  const R    = SIZE / 4          // 45 — path radius (stroke straddles it)
  const SW   = SIZE / 2          // 90 — stroke reaches the centre → solid pie
  const circ = 2 * Math.PI * R

  // 4-4-9 rule — arcs & % reflect calorie contribution, not grams.
  // (1 g carb = 4 kcal, 1 g protein = 4 kcal, 1 g fat = 9 kcal)
  const carbG = carb || 0
  const proG  = pro  || 0
  const fatG  = fat  || 0
  const cK = carbG * 4
  const pK = proG  * 4
  const fK = fatG  * 9
  const totalK = Math.max(cK + pK + fK, 1)

  const segments = [
    { label:'Carbs',   kcalVal: cK, color:'#4A90D9' },
    { label:'Protein', kcalVal: pK, color:'#2CB67D' },
    { label:'Fat',     kcalVal: fK, color:'#E05252' },
  ]

  // Thin white divider between slices. Only contributing segments take a gap.
  const GAP_DEG = 2.5
  const GAP_ARC = (GAP_DEG / 360) * circ
  const visibleCount = segments.filter(s => s.kcalVal > 0).length || 1
  const usable  = circ - visibleCount * GAP_ARC

  // Build arc start angles
  let angle = -90   // 12 o'clock
  const arcs = segments.map(seg => {
    const arcLen   = (seg.kcalVal / totalK) * usable
    const rotAngle = angle + (seg.kcalVal > 0 ? GAP_DEG / 2 : 0)
    angle += (arcLen / circ) * 360 + (seg.kcalVal > 0 ? GAP_DEG : 0)
    return { ...seg, arcLen, rotAngle }
  })

  // Legend uses the same kcal total as the pie, 1 decimal place
  const legend = [
    { l:'Carbs',   pct: ((cK / totalK) * 100).toFixed(1), c:'#4A90D9' },
    { l:'Protein', pct: ((pK / totalK) * 100).toFixed(1), c:'#2CB67D' },
    { l:'Fat',     pct: ((fK / totalK) * 100).toFixed(1), c:'#E05252' },
  ]

  const kcal = Math.round((parseFloat(cal) || 0) * 10) / 10

  return (
    <div style={{display:'flex', alignItems:'center', gap:20}}>

      {/* ── Pie SVG ── */}
      <div style={{flexShrink:0}}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{
            display:'block',
            transformOrigin:'center',
            transform: revealed ? 'scale(1) rotate(0deg)' : 'scale(0.55) rotate(-22deg)',
            opacity: revealed ? 1 : 0,
            transition:'transform 0.7s cubic-bezier(0.34,1.56,0.64,1), opacity 0.45s ease',
          }}>

          {/* White base — shows through slice gaps as dividers */}
          <circle cx={C} cy={C} r={R} fill="none" stroke="#fff" strokeWidth={SW}/>

          {/* Coloured pie wedges — each sweeps in via dash-array */}
          {arcs.map((arc, i) => (
            <circle
              key={arc.label}
              cx={C} cy={C} r={R}
              fill="none"
              stroke={arc.color}
              strokeWidth={SW}
              strokeLinecap="butt"
              transform={`rotate(${arc.rotAngle} ${C} ${C})`}
              style={{
                strokeDasharray: `${revealed ? arc.arcLen : 0} ${circ}`,
                transition: revealed
                  ? `stroke-dasharray 0.85s ${0.25 + i * 0.16}s cubic-bezier(0.22,1,0.36,1)`
                  : 'none',
              }}
            />
          ))}

          {/* Percentage label on each slice — placed at the wedge centroid.
              Skips zero / very thin slices so labels never overflow. */}
          {arcs.map(arc => {
            if (arc.kcalVal <= 0) return null
            const sweepDeg = (arc.arcLen / circ) * 360
            if (sweepDeg < 16) return null
            const midDeg = arc.rotAngle + sweepDeg / 2
            const rad = (midDeg * Math.PI) / 180
            const Rl = 46                       // label distance from centre
            const x = C + Rl * Math.cos(rad)
            const y = C + Rl * Math.sin(rad)
            const pct = (arc.kcalVal / totalK) * 100
            return (
              <text key={arc.label + '-pct'}
                x={x} y={y} textAnchor="middle" dominantBaseline="central"
                fill="#fff" fontSize="14" fontWeight="800" fontFamily="Outfit,sans-serif"
                style={{
                  opacity: revealed ? 1 : 0,
                  transition: revealed ? 'opacity 0.4s 0.95s ease' : 'none',
                }}
              >{pct.toFixed(1)}%</text>
            )
          })}

          {/* Outline ring keeps the pie crisp against a white card */}
          <circle cx={C} cy={C} r={SIZE / 2 - 1} fill="none" stroke="#F0EDF8" strokeWidth={1.5}/>
        </svg>
      </div>

      {/* Legend (with kcal total on top) */}
      <div style={{flex:1, display:'flex', flexDirection:'column', gap:10}}>
        <div style={{marginBottom:2}}>
          <span style={{fontSize:'1.35rem', fontWeight:800, color:'#1a1a2e'}}>{kcal}</span>
          <span style={{fontSize:'0.7rem', color:'#aaa', marginLeft:4}}>kcal total</span>
        </div>
        {legend.map(m => (
          <div key={m.l} style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <span style={{display:'flex', alignItems:'center', gap:7, fontSize:'0.78rem', color:'#555'}}>
              <span style={{
                width:9, height:9, borderRadius:'50%',
                background:m.c, display:'inline-block', flexShrink:0
              }}/>
              {m.l}
            </span>
            <span style={{fontSize:'0.78rem', fontWeight:700, color:'#1a1a2e'}}>{m.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Overall Score card ── */
function OverallScore({ rating, reviews }) {
  const target = Math.round(((rating || 0) / 5) * 100)
  const [count, setCount]     = useState(0)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!entered) return
    let cur = 0
    const step = target / 50
    const id = setInterval(() => {
      cur += step
      if (cur >= target) { setCount(target); clearInterval(id) }
      else setCount(Math.floor(cur))
    }, 20)
    return () => clearInterval(id)
  }, [entered, target])

  return (
    <div style={{
      position:'relative', overflow:'hidden',
      background:'linear-gradient(135deg,#5B21B6 0%,#7C3AED 100%)',
      borderRadius:14, padding:'14px 16px', marginTop:12,
      animation:'scoreCardIn 0.5s ease-out both',
    }}>
      {/* Top-right blob */}
      <div style={{
        position:'absolute', top:-22, right:-22,
        width:80, height:80, borderRadius:'50%',
        background:'rgba(167,139,250,0.22)',
        animation:'blobFloat 3s ease-in-out infinite',
        pointerEvents:'none',
      }}/>
      {/* Smaller inner blob */}
      <div style={{
        position:'absolute', top:-6, right:-6,
        width:38, height:38, borderRadius:'50%',
        background:'rgba(196,181,253,0.15)',
        animation:'blobFloat 3s 0.6s ease-in-out infinite',
        pointerEvents:'none',
      }}/>

      {/* Title */}
      <div style={{fontSize:'0.52rem',fontWeight:800,letterSpacing:'2.5px',color:'rgba(196,181,253,0.65)',textTransform:'uppercase',marginBottom:7,position:'relative',zIndex:1}}>
        Overall Score
      </div>

      {/* Score */}
      <div style={{display:'flex',alignItems:'baseline',gap:4,position:'relative',zIndex:1}}>
        <span style={{fontSize:'2.1rem',fontWeight:800,color:'#fff',lineHeight:1}}>{count}</span>
        <span style={{fontSize:'0.95rem',fontWeight:600,color:'rgba(196,181,253,0.55)'}}>/100</span>
      </div>

      {/* Secondary line + shimmer */}
      <div style={{position:'relative',overflow:'hidden',marginTop:6,zIndex:1}}>
        <div style={{fontSize:'0.62rem',color:'rgba(196,181,253,0.55)',lineHeight:1.4}}>
          Based on {reviews || 0} customer reviews
        </div>
        <div style={{
          position:'absolute',inset:0,
          background:'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.35) 50%,transparent 70%)',
          animation:'shimmerOnce 1s 0.6s ease-out forwards',
          transform:'translateX(-150%)',
          pointerEvents:'none',
        }}/>
      </div>
    </div>
  )
}

export default function DetailPage() {
  const { productId } = useParams()
  const nav           = useNavigate()
  const loc           = useLocation()

  /* ── Redirect to home on direct load / reload (no nav state) ── */
  useEffect(() => {
    if (!loc.state?.product) {
      nav('/', { replace: true })
    }
  }, [])

  /* ── transition context ── */
  const fromCarousel    = !!loc.state?.fromCarousel
  const initialProd     = loc.state?.product  || null
  const savedCat        = loc.state?.cat      || null
  const savedProducts   = loc.state?.products || []

  const [product,     setProduct]     = useState(initialProd)
  const [allProducts, setAllProducts] = useState([])
  const [reviews,     setReviews]     = useState([])
  const [links,       setLinks]       = useState({ zomato_url:'', swiggy_url:'', review_url:'' })
  const [loading,     setLoading]     = useState(!initialProd)
  const [modal,       setModal]       = useState(false)
  const [toast,       setToast]       = useState('')
  const [chartIn,        setChartIn]        = useState(false)
  const [imgLoaded,      setImgLoaded]      = useState(!!fromCarousel) // skip fade when from carousel (already preloaded)

  const scrollRef   = useRef(null)
  const leavingRef  = useRef(false)

  /* ── scroll to top whenever the product changes ── */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [productId])

  /* ── chart draw-in after short delay ── */
  useEffect(() => {
    const t = setTimeout(() => setChartIn(true), 350)
    return () => clearTimeout(t)
  }, [])

  const fetchReviews = useCallback(async () => {
    const { data } = await sb.from('reviews').select('*')
      .eq('product_id', productId)
      .eq('visible', true)
      .order('created_at',{ascending:false})
    setReviews(data||[])
  }, [productId])

  useEffect(() => {
    if (!initialProd) setLoading(true)
    Promise.all([
      sb.from('products').select('*').eq('id', productId).single(),
      sb.from('products').select('id, name'),
      sb.from('links').select('*').eq('id', 'default').maybeSingle(),
    ]).then(([{data:prod},{data:allProds},{data:lnk}]) => {
      setProduct(prod)
      setAllProducts(allProds||[])
      if (lnk) setLinks({ zomato_url: lnk.zomato_url||'', swiggy_url: lnk.swiggy_url||'', review_url: lnk.review_url||'' })
      setLoading(false)
    })
    fetchReviews()
  }, [productId, fetchReviews])

  /* ── Next product navigation ── */
  const navList = savedProducts.length ? savedProducts : allProducts
  const currentIdx = navList.findIndex(x => String(x.id) === String(productId))
  const hasNext = currentIdx !== -1 && currentIdx < navList.length - 1
  const hasPrev = currentIdx > 0

  async function goToProduct(offset) {
    if (leavingRef.current) return
    const next = navList[currentIdx + offset]
    if (!next) return
    const { data: nextProd } = await sb.from('products').select('*').eq('id', next.id).single()
    if (!nextProd) return
    nav(`/product/${next.id}`, {
      state: { product: nextProd, cat: savedCat, products: savedProducts }
    })
  }

  /* helpers for conditional animation — instant when from carousel */
  const heroAnim    = fromCarousel ? 'none' : undefined
  const contentAnim = (base, delay) =>
    fromCarousel
      ? 'none'
      : `fadeUp 0.4s ${delay}s ease both`

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#aaa',fontSize:'0.9rem'}}>Loading…</div>
  if (!product) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#aaa',fontSize:'0.9rem'}}>Not found.</div>

  const p = product
  const allRevs = [...reviews,...(Array.isArray(p.revs)?p.revs:[])]

  /* Round a macro value to 1 decimal for clean display; em-dash when absent. */
  const fmt = (v) => (v == null || v === '') ? '—' : Math.round((parseFloat(v) || 0) * 10) / 10

  return (
    <>
      <style>{`
        @keyframes imgFloat {
          from { transform: translateY(20px) scale(0.9); opacity: 0.6; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes cardUp {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .dp-scroll::-webkit-scrollbar { display:none; }
        .dp-mobile-layout { display:block; }
        .dp-desktop-layout { display:none; }
        @media (min-width:900px) {
          .dp-mobile-layout { display:none !important; }
          .dp-desktop-layout { display:block; zoom:0.8; }
        }
        .dp-right-scroll::-webkit-scrollbar { display:none; }
        .dp-right-scroll { -ms-overflow-style:none; scrollbar-width:none; }
        @keyframes scoreCardIn  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blobFloat    { 0%,100% { transform:scale(1) translateY(0); } 50% { transform:scale(1.08) translateY(-4px); } }
        @keyframes shimmerOnce  { from { transform:translateX(-150%); } to { transform:translateX(250%); } }
        @keyframes macroShine {
          0%   { transform: translateX(-160%) skewX(-15deg); }
          55%, 100% { transform: translateX(320%) skewX(-15deg); }
        }
        @keyframes iconPulse {
          0%, 100% { filter: drop-shadow(0 0 4px currentColor); transform: scale(1); }
          50%       { filter: drop-shadow(0 0 12px currentColor); transform: scale(1.08); }
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      `}</style>

      <div
        ref={scrollRef}
        className="dp-scroll dp-mobile-layout"
        style={{
          overflowY: 'auto',
          height:'100dvh',
          background:'#F2EFF8',
          paddingBottom: 40,
        }}
      >
        {/* ── Header (FOFITOS card + back button) ── */}
        <Header showBack onBack={() => nav(-1)} />

        {/* ══ HERO CARD ══ */}
        <div style={{ padding: '0 16px', marginTop: 16 }}>
          <div style={{
            display: 'flex', justifyContent: 'center',
            marginBottom: -80, position: 'relative', zIndex: 10,
            animation: heroAnim ?? 'imgFloat 0.55s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            <img src={p.img} alt={p.name}
              onLoad={() => setImgLoaded(true)}
              style={{
                width: 185, height: 185, objectFit: 'contain',
                filter: 'drop-shadow(0 16px 36px rgba(0,0,0,0.35))',
                display: 'block',
                willChange: 'transform',
                opacity: imgLoaded ? 1 : 0,
                transition: imgLoaded ? 'opacity 0.28s ease' : 'none',
              }}
            />
          </div>

          <div style={{
            background:'linear-gradient(135deg,#5B21B6 0%,#7C3AED 100%)',
            borderRadius: 22, padding:'90px 20px 24px',
            position:'relative', overflow:'hidden',
            animation: heroAnim ?? 'cardUp 0.45s 0.05s cubic-bezier(0.22,1,0.36,1) both',
            willChange: 'transform',
          }}>
            <div style={{position:'absolute',top:-28,right:-28,width:120,height:120,borderRadius:'50%',background:'rgba(196,181,253,0.18)',pointerEvents:'none',animation:'blobFloat 3s ease-in-out infinite'}}/>
            <div style={{position:'absolute',bottom:-20,left:-10,width:100,height:100,borderRadius:'50%',background:'rgba(91,33,182,0.35)',filter:'blur(25px)',pointerEvents:'none'}}/>
            <div style={{position:'absolute',inset:0,background:'linear-gradient(110deg,transparent 30%,rgba(255,255,255,0.08) 50%,transparent 70%)',animation:'shimmerOnce 1.4s 0.2s ease-out forwards',transform:'translateX(-150%)',pointerEvents:'none',zIndex:1}}/>

            <div style={{position:'relative',zIndex:2}}>
              <div style={{fontSize:'clamp(1.25rem,5vw,1.6rem)',fontWeight:800,color:'#fff',lineHeight:1.3,marginBottom:6}}>
                {(() => {
                  const words = (p.name || '').split(' ')
                  const last  = words.pop()
                  return (
                    <>
                      {words.length > 0 && words.join(' ') + ' '}
                      <span style={{ whiteSpace: 'nowrap' }}>
                        {last}
                        <span style={{display:'inline-flex',alignItems:'center',marginLeft:7,verticalAlign:'middle',position:'relative',top:'-1px'}}>
                          <VegBadge isVeg={p.is_veg !== false} />
                        </span>
                      </span>
                    </>
                  )
                })()}
              </div>
              {p.tagline && <div style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.7)',lineHeight:1.45,marginBottom:12}}>{p.tagline}</div>}
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {(p.tags||[]).map(t=>(
                  <span key={t} style={{fontSize:'0.62rem',fontWeight:800,letterSpacing:'1px',textTransform:'uppercase',color:'rgba(255,255,255,0.95)',border:'1.5px solid rgba(255,255,255,0.5)',borderRadius:50,padding:'4px 12px',background:'rgba(255,255,255,0.1)'}}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ ORDER BUTTONS + REVIEW — single row ══ */}
        <div style={{display:'flex',gap:10,padding:'14px 16px 0',animation:contentAnim('fadeUp',0.2)}}>
          {/* Zomato */}
          <a href={links.zomato_url||undefined} target="_blank" rel="noreferrer"
            style={{flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:links.zomato_url?'auto':'none',opacity:links.zomato_url?1:0.4}}>
            <img src={zomatoImg} alt="Zomato" style={{height:40,objectFit:'contain',display:'block'}}/>
          </a>
          {/* Swiggy */}
          <a href={links.swiggy_url||undefined} target="_blank" rel="noreferrer"
            style={{flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:links.swiggy_url?'auto':'none',opacity:links.swiggy_url?1:0.4}}>
            <img src={swiggyImg} alt="Swiggy" style={{height:40,objectFit:'contain',display:'block'}}/>
          </a>
          {/* Write a Review */}
          {links.review_url ? (
            <a href={links.review_url} target="_blank" rel="noreferrer"
              style={{flex:1,height:46,display:'flex',alignItems:'center',justifyContent:'center',background:'#7B2CBF',color:'#fff',borderRadius:16,fontSize:'0.82rem',fontWeight:700,textDecoration:'none',boxShadow:'0 4px 18px rgba(123,44,191,0.32)'}}>
              Write a Review
            </a>
          ) : (
            <button onClick={()=>setModal(true)} style={{flex:1,height:46,display:'flex',alignItems:'center',justifyContent:'center',background:'#7B2CBF',color:'#fff',border:'none',borderRadius:16,fontSize:'0.82rem',fontWeight:700,cursor:'pointer',boxShadow:'0 4px 18px rgba(123,44,191,0.32)'}}>
              Write a Review
            </button>
          )}
        </div>

        {/* ══ MACRO STATS — Calories card + 2×2 grid ══ */}
        <div style={{padding:'14px 16px 0',animation:contentAnim('fadeUp',0.28)}}>
          {/* Calories — full width */}
          <div style={{
            background:'#fff', borderRadius:16, padding:'18px 20px',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            boxShadow:'0 1px 6px rgba(0,0,0,0.05)', marginBottom:10, position:'relative', overflow:'hidden',
          }}>
            <span style={{fontSize:'1.2rem',fontWeight:800,letterSpacing:'2px',color:'#9C97AD',textTransform:'uppercase'}}>Calories</span>
            <span>
              <span style={{fontSize:'1.75rem',fontWeight:800,color:'#1a1a2e'}}>{fmt(p.cal)}</span>
              <span style={{fontSize:'0.72rem',color:'#bbb',marginLeft:4}}>kcal</span>
            </span>
            <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:'#F59E0B'}}/>
          </div>
          {/* Protein / Carbs / Fat / Fibre */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[
              {label:'Protein', val:p.pro,   line:'#2CB67D'},
              {label:'Carbs',   val:p.carb,  line:'#4A90D9'},
              {label:'Fat',     val:p.fat,   line:'#E05252'},
              {label:'Fibre',   val:p.fibre, line:'#C8A24A'},
            ].map(m=>(
              <div key={m.label} style={{
                background:'#fff', borderRadius:14, padding:'16px 14px 18px',
                textAlign:'center', boxShadow:'0 1px 6px rgba(0,0,0,0.05)',
                position:'relative', overflow:'hidden',
              }}>
                <div style={{fontSize:'0.58rem',fontWeight:800,letterSpacing:'1.5px',color:'#9C97AD',textTransform:'uppercase',marginBottom:6}}>{m.label}</div>
                <div>
                  <span style={{fontSize:'1.45rem',fontWeight:800,color:'#1a1a2e'}}>{fmt(m.val)}</span>
                  <span style={{fontSize:'0.66rem',color:'#bbb',marginLeft:3}}>g</span>
                </div>
                <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:m.line}}/>
              </div>
            ))}
          </div>
        </div>

        {/* ══ CALORIE BREAKDOWN ══ */}
        <div style={{margin:'12px 16px 0',background:'#fff',borderRadius:16,padding:'16px 18px',boxShadow:'0 1px 6px rgba(0,0,0,0.05)',animation:contentAnim('fadeUp',0.34)}}>
          <div style={{fontSize:'0.68rem',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'#aaa',marginBottom:14}}>Calorie Breakdown</div>
          <MacroPie pro={p.pro} fat={p.fat} carb={p.carb} cal={p.cal} revealed={chartIn}/>
        </div>

        {/* ══ NUTRITION FACTS ══ */}
        {p.nutrition_visible !== false && (p.nutrition||[]).length>0 && (
          <div style={{margin:'12px 16px 0',background:'#fff',borderRadius:16,padding:'16px 18px',boxShadow:'0 1px 6px rgba(0,0,0,0.05)',animation:contentAnim('fadeUp',0.4)}}>
            <div style={{fontSize:'0.68rem',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'#aaa',marginBottom:14}}>Nutrition Facts · Per Serving</div>
            {(p.nutrition||[]).map((n,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:'1px solid #F5F2FA'}}>
                <span style={{fontSize:n.s?'0.71rem':'0.78rem',color:n.s?'#ccc':'#444',fontWeight:n.s?400:500,width:130,flexShrink:0,paddingLeft:n.s?12:0}}>{n.n}</span>
                <div style={{flex:1,height:5,background:'#F0EDE6',borderRadius:3,overflow:'hidden'}}>
                  <div style={{
                    width: chartIn ? `${n.p}%` : '0%',
                    height:'100%',
                    background:n.c||'#7B2CBF',
                    borderRadius:3,
                    transition: chartIn ? `width 0.7s ${i * 0.06}s cubic-bezier(0.22,1,0.36,1)` : 'none',
                  }}/>
                </div>
                <span style={{fontSize:'0.76rem',fontWeight:600,color:'#1a1a2e',width:46,textAlign:'right',flexShrink:0}}>{n.v}</span>
              </div>
            ))}
          </div>
        )}

        {/* ══ INGREDIENTS ══ */}
        {(p.ingr||[]).length>0 && (
          <div style={{margin:'12px 16px 0',background:'#fff',borderRadius:16,padding:'16px 18px',boxShadow:'0 1px 6px rgba(0,0,0,0.05)',animation:contentAnim('fadeUp',0.46)}}>
            <div style={{fontSize:'0.68rem',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'#aaa',marginBottom:14}}>Ingredients Used</div>
            {(p.ingr||[]).map((ing,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 12px',borderRadius:10,background:'#FAF8FF',border:'1px solid #EDE8F8',marginBottom:6}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:ing.c||'#7B2CBF',display:'inline-block',flexShrink:0}}/>
                  <span style={{fontSize:'0.82rem',fontWeight:500,color:'#1a1a2e'}}>{ing.n}</span>
                </div>
                <span style={{fontSize:'0.72rem',color:'#bbb'}}>{ing.src}</span>
              </div>
            ))}
          </div>
        )}

        {/* ══ PROMISE ══ */}
        <div style={{margin:'12px 16px 0',padding:'18px',borderRadius:16,background:'linear-gradient(135deg,rgba(91,33,182,0.04),rgba(124,58,237,0.08))',border:'1.5px solid rgba(91,33,182,0.1)',animation:contentAnim('fadeUp',0.58)}}>
          <div style={{fontSize:'0.68rem',fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'#7B2CBF',marginBottom:12}}>The Fofitos Promise</div>
          {['Zero refined oil — cold-pressed only','No MSG or flavour enhancers','No Maida — whole grain always','No artificial colours or preservatives'].map(item=>(
            <div key={item} style={{display:'flex',alignItems:'flex-start',gap:10,fontSize:'0.78rem',color:'#666',marginBottom:7,lineHeight:1.45}}>
              <div style={{width:18,height:18,borderRadius:'50%',background:'#7B2CBF',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.58rem',fontWeight:700,flexShrink:0,marginTop:1}}>✓</div>
              {item}
            </div>
          ))}
        </div>

        {/* ══ MORE FROM THIS CATEGORY ══ */}
        {savedProducts.filter(x => String(x.id) !== String(productId)).length > 0 && (
          <div style={{marginTop:12, animation:contentAnim('fadeUp',0.56)}}>
            <div style={{fontSize:'0.68rem',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'#aaa',marginBottom:10,padding:'0 16px'}}>
              More from {savedCat?.name || 'this category'}
            </div>
            <div style={{
              display:'flex', gap:10, overflowX:'auto', padding:'4px 16px 12px',
              scrollbarWidth:'none', msOverflowStyle:'none',
            }}>
              {savedProducts.filter(x => String(x.id) !== String(productId)).map(prod => (
                <div
                  key={prod.id}
                  onClick={() => { window.scrollTo({ top: 0, behavior: 'instant' }); nav(`/product/${prod.id}`, { state: { product: prod, cat: savedCat, products: savedProducts } }) }}
                  style={{
                    flexShrink:0, width:110, background:'#fff', borderRadius:14,
                    overflow:'hidden', border:'1px solid #EDE8F8', cursor:'pointer',
                    boxShadow:'0 2px 8px rgba(91,33,182,0.07)',
                    transition:'transform 0.18s ease, box-shadow 0.18s ease',
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.04)';e.currentTarget.style.boxShadow='0 6px 18px rgba(91,33,182,0.14)'}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 2px 8px rgba(91,33,182,0.07)'}}
                >
                  <div style={{height:82,background:'#F8F5FF',display:'flex',alignItems:'center',justifyContent:'center',padding:8}}>
                    <img src={prod.img} alt={prod.name} style={{width:64,height:64,objectFit:'contain'}}/>
                  </div>
                  <div style={{padding:'7px 9px 10px'}}>
                    <div style={{fontSize:'0.68rem',fontWeight:700,color:'#1a1a2e',lineHeight:1.3,
                      display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                      {prod.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ FOOTER ══ */}
        <Footer />
      </div>

      {/* ══ DESKTOP LAYOUT ══ */}
      <div className="dp-desktop-layout" style={{ background:'#F2EFF8' }}>
        {/* ── Header (FOFITOS card + back button) ── */}
        <Header showBack onBack={() => nav(-1)} />

        <div style={{ maxWidth:1160, margin:'0 auto', padding:'28px 32px 48px', display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:24, alignItems:'start' }}>

            {/* ════ LEFT COLUMN — sticky product info ════ */}
            <div style={{ display:'flex', flexDirection:'column', gap:14, position:'sticky', top:28 }}>

              {/* Purple product card — image left (inside box), text right */}
              <div style={{
                background:'linear-gradient(135deg,#5B21B6 0%,#7C3AED 100%)',
                borderRadius:18, padding:'22px 24px',
                display:'flex', gap:20, alignItems:'center',
                position:'relative', overflow:'hidden',
                boxShadow:'0 8px 32px rgba(76,29,149,0.35)',
              }}>
                {/* Bubble accents */}
                <div style={{position:'absolute',top:-28,right:-28,width:130,height:130,borderRadius:'50%',background:'rgba(196,181,253,0.18)',pointerEvents:'none',animation:'blobFloat 3s ease-in-out infinite'}}/>
                <div style={{position:'absolute',bottom:-20,left:-10,width:110,height:110,borderRadius:'50%',background:'rgba(91,33,182,0.25)',filter:'blur(28px)',pointerEvents:'none'}}/>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(110deg,transparent 30%,rgba(255,255,255,0.08) 50%,transparent 70%)',animation:'shimmerOnce 1.4s 0.2s ease-out forwards',transform:'translateX(-150%)',pointerEvents:'none',zIndex:1}}/>

                {/* Image — left side inside the box */}
                <img src={p.img} alt={p.name} style={{
                  width:140, height:140, objectFit:'contain', flexShrink:0,
                  filter:'drop-shadow(0 10px 28px rgba(0,0,0,0.55))',
                  position:'relative', zIndex:2,
                }}/>

                {/* Text content — right side */}
                <div style={{ flex:1, minWidth:0, position:'relative', zIndex:2 }}>
                  <div style={{ fontSize:'0.58rem', fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:'rgba(196,181,253,0.7)', marginBottom:8 }}>FOFITOS</div>
                  <div style={{ fontSize:'clamp(1.25rem,1.6vw,1.6rem)', fontWeight:800, color:'#fff', lineHeight:1.2, marginBottom:6 }}>{p.name}</div>
                  {p.tagline && <div style={{ fontSize:'0.78rem', color:'rgba(196,181,253,0.85)', lineHeight:1.45, marginBottom:12 }}>{p.tagline}</div>}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {(p.tags||[]).map(t => (
                      <span key={t} style={{ fontSize:'0.6rem', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'rgba(255,255,255,0.95)', border:'1.5px solid rgba(255,255,255,0.4)', borderRadius:50, padding:'4px 12px', background:'rgba(255,255,255,0.1)' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats — Calories card + 2×2 grid */}
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{
                  background:'#fff', borderRadius:16, padding:'18px 22px',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  boxShadow:'0 1px 8px rgba(76,29,149,0.08)', position:'relative', overflow:'hidden',
                }}>
                  <span style={{ fontSize:'1.2rem', fontWeight:800, letterSpacing:'2px', color:'#9C97AD', textTransform:'uppercase' }}>Calories</span>
                  <span>
                    <span style={{ fontSize:'1.75rem', fontWeight:800, color:'#1a1a2e' }}>{fmt(p.cal)}</span>
                    <span style={{ fontSize:'0.7rem', color:'#bbb', marginLeft:4 }}>kcal</span>
                  </span>
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:'#F59E0B' }}/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    { val:p.pro,   line:'#2CB67D', label:'Protein' },
                    { val:p.carb,  line:'#4A90D9', label:'Carbs'   },
                    { val:p.fat,   line:'#E05252', label:'Fat'     },
                    { val:p.fibre, line:'#C8A24A', label:'Fibre'   },
                  ].map(m => (
                    <div key={m.label} style={{ background:'#fff', borderRadius:14, padding:'16px 14px 18px', textAlign:'center', boxShadow:'0 1px 8px rgba(76,29,149,0.08)', position:'relative', overflow:'hidden' }}>
                      <div style={{ fontSize:'0.58rem', fontWeight:800, letterSpacing:'1.5px', color:'#9C97AD', textTransform:'uppercase', marginBottom:6 }}>{m.label}</div>
                      <div>
                        <span style={{ fontSize:'1.5rem', fontWeight:800, color:'#1a1a2e' }}>{fmt(m.val)}</span>
                        <span style={{ fontSize:'0.66rem', color:'#bbb', marginLeft:3 }}>g</span>
                      </div>
                      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:m.line }}/>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons — below stats */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <a href={links.zomato_url||undefined} target="_blank" rel="noreferrer"
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:links.zomato_url?'auto':'none', opacity:links.zomato_url?1:0.4 }}>
                  <img src={zomatoImg} alt="Zomato" style={{ height:44, objectFit:'contain', display:'block' }}/>
                </a>
                <a href={links.swiggy_url||undefined} target="_blank" rel="noreferrer"
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:links.swiggy_url?'auto':'none', opacity:links.swiggy_url?1:0.4 }}>
                  <img src={swiggyImg} alt="Swiggy" style={{ height:44, objectFit:'contain', display:'block' }}/>
                </a>
                {links.review_url ? (
                  <a href={links.review_url} target="_blank" rel="noreferrer"
                    style={{ height:50, background:'#fff', color:'#4C1D95', border:'2px solid #DDD6FE', borderRadius:12, fontSize:'0.82rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:6, textDecoration:'none' }}>
                    <span style={{ color:'#FBBF24' }}>★</span> Write a Review
                  </a>
                ) : (
                  <button onClick={() => setModal(true)} style={{ height:50, background:'#fff', color:'#4C1D95', border:'2px solid #DDD6FE', borderRadius:12, fontSize:'0.82rem', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    <span style={{ color:'#FBBF24' }}>★</span> Write a Review
                  </button>
                )}
              </div>

              {/* Fofitos Promise — purple theme */}
              <div style={{ background:'linear-gradient(135deg,#5B21B6 0%,#7C3AED 100%)', borderRadius:16, padding:'22px 24px', boxShadow:'0 4px 20px rgba(76,29,149,0.28)' }}>
                <div style={{ fontSize:'1.05rem', fontWeight:700, color:'#C4B5FD', marginBottom:16 }}>The Fofitos Promise</div>
                {['Zero refined oil — cold-pressed only','No MSG or flavour enhancers','No Maida — whole grain always','No artificial colours or preservatives'].map(item => (
                  <div key={item} style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(167,139,250,0.18)', border:'1.5px solid rgba(167,139,250,0.5)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ color:'#A78BFA', fontSize:'0.6rem', fontWeight:800 }}>✓</span>
                    </div>
                    <span style={{ fontSize:'0.82rem', color:'rgba(221,214,254,0.9)', lineHeight:1.55 }}>{item}</span>
                  </div>
                ))}
              </div>

            </div>

            {/* ════ RIGHT COLUMN — scrollable nutrition data ════ */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Calorie Breakdown */}
              <div style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 8px rgba(76,29,149,0.07)' }}>
                <div style={{ fontSize:'0.63rem', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#C4B5FD', marginBottom:16 }}>Calorie Breakdown</div>
                <MacroPie pro={p.pro} fat={p.fat} carb={p.carb} cal={p.cal} revealed={chartIn}/>
              </div>

              {/* Nutrition Facts */}
              {p.nutrition_visible !== false && (p.nutrition||[]).length > 0 && (
                <div style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 8px rgba(76,29,149,0.07)' }}>
                  <div style={{ fontSize:'0.63rem', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#C4B5FD', marginBottom:16 }}>Nutrition Facts · Per Serving</div>
                  {(p.nutrition||[]).map((n,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #F3F0FB' }}>
                      <span style={{ fontSize:n.s?'0.71rem':'0.78rem', color:n.s?'#ccc':'#444', fontWeight:n.s?400:500, width:160, flexShrink:0, paddingLeft:n.s?14:0 }}>{n.n}</span>
                      <div style={{ flex:1, height:5, background:'#EDE8F8', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ width:chartIn?`${n.p}%`:'0%', height:'100%', background:n.c||'#7B2CBF', borderRadius:3, transition:chartIn?`width 0.7s ${i*0.06}s cubic-bezier(0.22,1,0.36,1)`:'none' }}/>
                      </div>
                      <span style={{ fontSize:'0.76rem', fontWeight:600, color:'#1a1a2e', width:46, textAlign:'right', flexShrink:0 }}>{n.v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Ingredients */}
              {(p.ingr||[]).length > 0 && (
                <div style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 8px rgba(76,29,149,0.07)' }}>
                  <div style={{ fontSize:'0.63rem', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#C4B5FD', marginBottom:14 }}>Ingredients Used</div>
                  {(p.ingr||[]).map((ing,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:10, background:'#FAF8FF', border:'1px solid #EDE8F8', marginBottom:6 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:ing.c||'#7B2CBF', display:'inline-block', flexShrink:0 }}/>
                        <span style={{ fontSize:'0.82rem', fontWeight:500, color:'#1a1a2e' }}>{ing.n}</span>
                      </div>
                      <span style={{ fontSize:'0.72rem', color:'#bbb' }}>{ing.src}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* More from this category — desktop */}
              {savedProducts.filter(x => String(x.id) !== String(productId)).length > 0 && (
                <div style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 8px rgba(76,29,149,0.07)' }}>
                  <div style={{ fontSize:'0.63rem', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#C4B5FD', marginBottom:14 }}>
                    More from {savedCat?.name || 'this category'}
                  </div>
                  <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none', msOverflowStyle:'none' }}>
                    {savedProducts.filter(x => String(x.id) !== String(productId)).map(prod => (
                      <div
                        key={prod.id}
                        onClick={() => { window.scrollTo({ top: 0, behavior: 'instant' }); nav(`/product/${prod.id}`, { state: { product: prod, cat: savedCat, products: savedProducts } }) }}
                        style={{
                          flexShrink:0, width:120, background:'#F8F5FF', borderRadius:12,
                          overflow:'hidden', border:'1px solid #EDE8F8', cursor:'pointer',
                          boxShadow:'0 1px 6px rgba(91,33,182,0.07)',
                          transition:'transform 0.18s ease, box-shadow 0.18s ease',
                        }}
                        onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.05)';e.currentTarget.style.boxShadow='0 6px 18px rgba(91,33,182,0.15)'}}
                        onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 1px 6px rgba(91,33,182,0.07)'}}
                      >
                        <div style={{height:90,display:'flex',alignItems:'center',justifyContent:'center',padding:10}}>
                          <img src={prod.img} alt={prod.name} style={{width:70,height:70,objectFit:'contain'}}/>
                        </div>
                        <div style={{padding:'7px 10px 10px',background:'#fff'}}>
                          <div style={{fontSize:'0.7rem',fontWeight:700,color:'#1a1a2e',lineHeight:1.3,
                            display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                            {prod.name}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

        </div>

        {/* ══ FOOTER (desktop) ══ */}
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px' }}>
          <Footer />
        </div>
      </div>


      {modal&&<ReviewModal products={allProducts} preSelectedId={p.id} onClose={()=>setModal(false)} onPosted={()=>{setToast('✦ Review posted!');fetchReviews()}}/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast('')}/>}
    </>
  )
}
