import { useState, useRef, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { sb } from '../../lib/supabase'
import '../../styles/admin.css'

const MODULES = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/admin',
    icon: (
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
        <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
        <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
        <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'products',
    label: 'Products',
    path: '/admin/products',
    icon: (
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'categories',
    label: 'Categories',
    path: '/admin/categories',
    icon: (
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'links',
    label: 'Links',
    path: '/admin/links',
    icon: (
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'qr',
    label: 'QR Code',
    path: '/admin/qr',
    icon: (
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        <rect x="14" y="14" width="3" height="3" fill="currentColor"/>
        <rect x="18" y="14" width="3" height="3" fill="currentColor"/>
        <rect x="14" y="18" width="3" height="3" fill="currentColor"/>
        <rect x="18" y="18" width="3" height="3" fill="currentColor"/>
      </svg>
    ),
  },
]

function HamburgerIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  )
}

/* ── Star helper ── */
function Stars({ rating }) {
  return (
    <span style={{ color: '#F59E0B', fontSize: '0.72rem', letterSpacing: 1 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

/* ── Time-ago helper ── */
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

/* ── Change Password Modal ── */
function ChangePasswordModal({ onClose }) {
  const [newPass,     setNewPass]     = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (newPass !== confirmPass) { setError('Passwords do not match.'); return }
    if (newPass.length < 6)     { setError('Password must be at least 6 characters.'); return }
    setError(''); setLoading(true)
    const { error: err } = await sb.auth.updateUser({ password: newPass })
    setLoading(false)
    if (err) { setError('Failed to update password. Try again.'); return }
    setSuccess(true)
    setTimeout(onClose, 1500)
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid #E5E7EB', fontSize: '0.9rem',
    outline: 'none', boxSizing: 'border-box', background: '#F9FAFB',
    color: '#111', fontFamily: 'inherit', transition: 'border 0.2s',
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:16, padding:'32px 28px', width:360, boxShadow:'0 20px 60px rgba(0,0,0,0.18)', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#111' }}>Change Password</div>
            <div style={{ fontSize:'0.78rem', color:'#6B7280', marginTop:2 }}>No email verification required</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'1.1rem' }}>✕</button>
        </div>

        {success ? (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <div style={{ fontSize:'2.2rem', marginBottom:8 }}>✅</div>
            <div style={{ fontWeight:700, color:'#2CB67D' }}>Password updated!</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div style={{ background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', color:'#DC2626', borderRadius:8, padding:'9px 13px', fontSize:'0.82rem', marginBottom:14 }}>{error}</div>}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:'0.75rem', fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>New Password</label>
              <input style={inputStyle} type="password" placeholder="Min. 6 characters" value={newPass} required
                onChange={e => { setNewPass(e.target.value); setError('') }}
                onFocus={e => e.target.style.borderColor='#7B2CBF'}
                onBlur={e => e.target.style.borderColor='#E5E7EB'}
              />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:'0.75rem', fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Confirm Password</label>
              <input style={inputStyle} type="password" placeholder="Repeat password" value={confirmPass} required
                onChange={e => { setConfirmPass(e.target.value); setError('') }}
                onFocus={e => e.target.style.borderColor='#7B2CBF'}
                onBlur={e => e.target.style.borderColor='#E5E7EB'}
              />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button type="button" onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:8, border:'1.5px solid #E5E7EB', background:'transparent', color:'#374151', fontWeight:600, fontSize:'0.88rem', cursor:'pointer' }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#7B2CBF,#4C1D95)', color:'#fff', fontWeight:700, fontSize:'0.88rem', cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1 }}>
                {loading ? 'Saving…' : 'Update →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

/* ── Notification Panel ── */
function NotificationPanel({ reviews, onClearAll, onClose }) {
  return (
    <div style={{
      position:'absolute', top:'calc(100% + 10px)', right:0,
      background:'#fff', borderRadius:14, width:320,
      boxShadow:'0 8px 32px rgba(0,0,0,0.14)', border:'1px solid #F0EBFA',
      zIndex:999, overflow:'hidden',
      animation:'fadeDropdown 0.15s ease',
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderBottom:'1px solid #F3F4F6' }}>
        <div style={{ fontWeight:700, fontSize:'0.88rem', color:'#111' }}>
          Notifications
          {reviews.length > 0 && (
            <span style={{ marginLeft:7, background:'#7B2CBF', color:'#fff', borderRadius:50, fontSize:'0.65rem', fontWeight:700, padding:'1px 7px' }}>
              {reviews.length}
            </span>
          )}
        </div>
        {reviews.length > 0 && (
          <button
            onClick={onClearAll}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.75rem', color:'#7B2CBF', fontWeight:600, padding:0 }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight:340, overflowY:'auto' }}>
        {reviews.length === 0 ? (
          <div style={{ padding:'28px 16px', textAlign:'center', color:'#9CA3AF', fontSize:'0.82rem' }}>
            No new notifications
          </div>
        ) : (
          reviews.map(r => (
            <div key={r.id} style={{ padding:'12px 16px', borderBottom:'1px solid #F9FAFB', display:'flex', flexDirection:'column', gap:3 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontWeight:700, fontSize:'0.82rem', color:'#111' }}>
                  ⭐ New Review — {r.name}
                </div>
                <div style={{ fontSize:'0.68rem', color:'#9CA3AF' }}>{timeAgo(r.created_at)}</div>
              </div>
              <Stars rating={r.rating} />
              <div style={{ fontSize:'0.78rem', color:'#6B7280', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {r.text}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const CLEARED_KEY = 'fofitos_notif_cleared_at'

export default function AdminLayout() {
  const [dropdownOpen,   setDropdownOpen]   = useState(false)
  const [notifOpen,      setNotifOpen]      = useState(false)
  const [changePassOpen, setChangePassOpen] = useState(false)
  const [reviews,        setReviews]        = useState([])

  const navigate   = useNavigate()
  const location   = useLocation()
  const dropdownRef = useRef(null)
  const notifRef    = useRef(null)

  /* ── Determine current active module ── */
  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  /* ── Load reviews newer than last clear time ── */
  useEffect(() => {
    const clearedAt = localStorage.getItem(CLEARED_KEY) || new Date(0).toISOString()

    sb.from('reviews')
      .select('id, name, rating, text, created_at')
      .gt('created_at', clearedAt)
      .order('created_at', { ascending: false })
      .then(({ data }) => setReviews(data || []))
  }, [])

  /* ── Realtime: listen for new reviews ── */
  useEffect(() => {
    const channel = sb
      .channel('admin-reviews')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, payload => {
        setReviews(prev => [payload.new, ...prev])
      })
      .subscribe()
    return () => sb.removeChannel(channel)
  }, [])

  /* ── Close dropdowns when clicking outside ── */
  useEffect(() => {
    function handleOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
      if (notifRef.current    && !notifRef.current.contains(e.target))    setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function handleClearAll() {
    localStorage.setItem(CLEARED_KEY, new Date().toISOString())
    setReviews([])
    setNotifOpen(false)
  }

  async function handleLogout() {
    setDropdownOpen(false)
    await sb.auth.signOut()
    navigate('/admin/login')
  }

  return (
    <div className="admin-layout">

      {/* ── Floating Top Panel ── */}
      <div className="floating-panel-wrapper">
      <header className="modern-top-panel">
        <div className="panel-left">
          <div className="panel-logo">FOFiTOS</div>
        </div>

        {/* Module Buttons */}
        <div className="panel-modules">
          {MODULES.map(module => (
            <button
              key={module.id}
              onClick={() => navigate(module.path)}
              className={`module-btn${isActive(module.path) ? ' active' : ''}`}
              title={module.label}
            >
              <span className="module-icon">{module.icon}</span>
              <span className="module-label">{module.label}</span>
            </button>
          ))}
        </div>

        {/* Right side actions */}
        <div className="panel-right">
          <button className="panel-action-btn" onClick={() => navigate('/')} title="View customer menu">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* ── Notification Bell ── */}
          <div ref={notifRef} style={{ position:'relative' }}>
            <button
              className="topbar-icon-btn"
              title="Notifications"
              onClick={() => { setNotifOpen(v => !v); setDropdownOpen(false) }}
              style={{ position:'relative' }}
            >
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {reviews.length > 0 && (
                <span style={{
                  position:'absolute', top:4, right:4,
                  width:8, height:8, borderRadius:'50%',
                  background:'#DC2626', border:'2px solid #fff',
                }}/>
              )}
            </button>
            {notifOpen && (
              <NotificationPanel
                reviews={reviews}
                onClearAll={handleClearAll}
                onClose={() => setNotifOpen(false)}
              />
            )}
          </div>

          {/* ── Avatar with dropdown ── */}
          <div ref={dropdownRef} style={{ position:'relative' }}>
            <div
              className="topbar-avatar"
              onClick={() => { setDropdownOpen(v => !v); setNotifOpen(false) }}
              style={{ cursor:'pointer', userSelect:'none' }}
              title="Account options"
            >
              A
            </div>

            {dropdownOpen && (
              <div style={{
                position:'absolute', top:'calc(100% + 10px)', right:0,
                background:'#fff', borderRadius:12, minWidth:190,
                boxShadow:'0 8px 32px rgba(0,0,0,0.14)', border:'1px solid #F0EBFA',
                overflow:'hidden', zIndex:999,
                animation:'fadeDropdown 0.15s ease',
              }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid #F3F4F6' }}>
                  <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#111' }}>Fofitos Marketing</div>
                  <div style={{ fontSize:'0.7rem', color:'#9CA3AF', marginTop:1 }}>Administrator</div>
                </div>

                <button
                  onClick={() => { setDropdownOpen(false); setChangePassOpen(true) }}
                  style={{ width:'100%', padding:'11px 16px', background:'none', border:'none', textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:10, fontSize:'0.85rem', color:'#374151', fontWeight:500 }}
                  onMouseEnter={e => e.currentTarget.style.background='#F5F0FF'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}
                >
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="#7B2CBF" strokeWidth="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="#7B2CBF" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Change Password
                </button>

                <div style={{ height:1, background:'#F3F4F6' }} />

                <button
                  onClick={handleLogout}
                  style={{ width:'100%', padding:'11px 16px', background:'none', border:'none', textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:10, fontSize:'0.85rem', color:'#DC2626', fontWeight:500 }}
                  onMouseEnter={e => e.currentTarget.style.background='#FEF2F2'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}
                >
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="16 17 21 12 16 7" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="21" y1="12" x2="9" y2="12" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      </div>

      {/* ── Main content area ── */}
      <div className="admin-main-content">
        <Outlet />
      </div>

      {changePassOpen && <ChangePasswordModal onClose={() => setChangePassOpen(false)} />}

      <style>{`
        @keyframes fadeDropdown {
          from { opacity: 0; transform: translateY(-6px) }
          to   { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </div>
  )
}
