import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sb } from '../../lib/supabase'
import logoImg from '../../assets/logo.png'
import adminLogoImg from '../../assets/admin_logo.png'

const ADMIN_EMAIL = 'marketing.dffoods@gmail.com'

/* ── 3-D Hoverboard card wrapper ── */
function HoverCard({ children }) {
  const cardRef  = useRef(null)
  const frameRef = useRef(null)
  const [tilt,  setTilt]  = useState({ rx: 0, ry: 0 })
  const [glow,  setGlow]  = useState({ x: 50, y: 50 })
  const [hover, setHover] = useState(false)

  function applyTilt(clientX, clientY) {
    const card = cardRef.current
    if (!card) return
    const { left, top, width, height } = card.getBoundingClientRect()
    const x = clientX - left
    const y = clientY - top
    const rx =  ((y / height) - 0.5) * 18
    const ry = -((x / width)  - 0.5) * 18
    cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      setTilt({ rx, ry })
      setGlow({ x: (x / width) * 100, y: (y / height) * 100 })
    })
  }

  function resetTilt() {
    cancelAnimationFrame(frameRef.current)
    setTilt({ rx: 0, ry: 0 })
    setGlow({ x: 50, y: 50 })
    setHover(false)
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={e => applyTilt(e.clientX, e.clientY)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={resetTilt}
      onTouchStart={e => { setHover(true); applyTilt(e.touches[0].clientX, e.touches[0].clientY) }}
      onTouchMove={e => applyTilt(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={resetTilt}
      style={{
        width: '100%', maxWidth: 420,
        borderRadius: 24,
        background: '#fff',
        padding: '44px 40px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        /* 3-D transform */
        transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${hover ? 1.015 : 1})`,
        transition: hover
          ? 'transform 0.08s linear, box-shadow 0.25s ease'
          : 'transform 0.55s cubic-bezier(0.22,1,0.36,1), box-shadow 0.55s ease',
        boxShadow: hover
          ? '0 32px 80px rgba(75,0,150,0.28), 0 8px 24px rgba(0,0,0,0.14)'
          : '0 12px 40px rgba(75,0,150,0.15), 0 2px 8px rgba(0,0,0,0.07)',
        willChange: 'transform',
      }}
    >
      {/* Moving specular highlight */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 24,
        background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(168,85,247,0.13) 0%, transparent 65%)`,
        pointerEvents: 'none',
        transition: hover ? 'none' : 'opacity 0.55s',
        opacity: hover ? 1 : 0,
      }}/>
      {/* Top-edge shine */}
      <div style={{
        position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
        background: 'linear-gradient(90deg,transparent,rgba(168,85,247,0.5),transparent)',
        borderRadius: 1, pointerEvents: 'none',
        opacity: hover ? 1 : 0,
        transition: 'opacity 0.3s',
      }}/>
      {children}
    </div>
  )
}

/* ── Steps: 'login' | 'forgot' | 'sent' | 'reset' ── */
export default function AdminLogin() {
  const nav = useNavigate()

  const [step,        setStep]        = useState('login')
  const [password,    setPassword]    = useState('')
  const [newPass,     setNewPass]     = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [info,        setInfo]        = useState('')

  /* ── Detect password-recovery redirect from email link ── */
  useEffect(() => {
    const { data: { subscription } } = sb.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStep('reset')
        setInfo('You can now set a new password.')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  /* ── Sign in ── */
  async function handleLogin(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error: err } = await sb.auth.signInWithPassword({ email: ADMIN_EMAIL, password })
    setLoading(false)
    if (err) { setError('Incorrect password. Please try again.'); return }
    nav('/admin')
  }

  /* ── Send password reset email ── */
  async function handleForgot(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error: err } = await sb.auth.resetPasswordForEmail(ADMIN_EMAIL, {
      redirectTo: window.location.origin + '/admin/login',
    })
    setLoading(false)
    if (err) { setError('Could not send reset email. Try again.'); return }
    setStep('sent')
  }

  /* ── Reset password ── */
  async function handleReset(e) {
    e.preventDefault()
    if (newPass !== confirmPass) { setError('Passwords do not match.'); return }
    if (newPass.length < 6)     { setError('Password must be at least 6 characters.'); return }
    setError(''); setLoading(true)
    const { error: err } = await sb.auth.updateUser({ password: newPass })
    setLoading(false)
    if (err) { setError('Failed to reset password. Try again.'); return }
    setInfo('Password updated! Please sign in.')
    setStep('login')
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 10,
    border: '1.5px solid #E5E7EB', fontSize: '0.9rem',
    outline: 'none', boxSizing: 'border-box', background: '#F9FAFB',
    color: '#111', fontFamily: 'inherit', transition: 'border 0.2s',
  }
  const btnStyle = {
    width: '100%', padding: '13px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg,#9333EA,#7C3AED)',
    color: '#fff', fontWeight: 700, fontSize: '0.95rem',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
    boxShadow: '0 4px 18px rgba(124,58,237,0.45)',
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: 'linear-gradient(135deg,#3B0764 0%,#6D28D9 40%,#7C3AED 70%,#8B5CF6 100%)',
      position: 'relative',
      flexDirection: 'row',
    }}>

      {/* ── Full-screen animated bubbles ── */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:0 }}>
        {[
          { w:320, h:320, top:'-8%',  left:'-4%',  dur:'8s',  delay:'0s'   },
          { w:220, h:220, top:'60%',  left:'2%',   dur:'10s', delay:'1.2s' },
          { w:180, h:180, top:'10%',  left:'38%',  dur:'7s',  delay:'0.5s' },
          { w:260, h:260, top:'50%',  left:'35%',  dur:'9s',  delay:'2s'   },
          { w:150, h:150, top:'78%',  left:'55%',  dur:'6s',  delay:'0.8s' },
          { w:200, h:200, top:'-5%',  left:'60%',  dur:'11s', delay:'1.8s' },
          { w:120, h:120, top:'40%',  left:'80%',  dur:'7.5s',delay:'0.3s' },
          { w:170, h:170, top:'75%',  left:'82%',  dur:'9s',  delay:'2.5s' },
        ].map((b, i) => (
          <div key={i} style={{
            position:'absolute', borderRadius:'50%',
            width:b.w, height:b.h, top:b.top, left:b.left,
            background:'rgba(255,255,255,0.07)',
            animation:`floatBubble ${b.dur} ${b.delay} ease-in-out infinite`,
          }}/>
        ))}
      </div>

      {/* ── LEFT — brand content (hidden on mobile) ── */}
      <div className="admin-login-left" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 48, position: 'relative', zIndex: 1,
      }}>
        <img src={adminLogoImg} alt="FOFiTOS Admin" style={{ maxWidth: 420, width: '75%', objectFit: 'contain' }}/>
      </div>

      {/* ── RIGHT — hoverboard card ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 1, padding: '24px 16px',
        minHeight: '100vh', gap: 0,
      }}>
        {/* Logo above card — mobile only */}
        <div className="admin-mobile-logo" style={{ width: '100%', textAlign: 'center', alignItems: 'center', justifyContent: 'center', paddingTop: 24 }}>
          <img src={adminLogoImg} alt="FOFiTOS Admin" style={{ width: '85%', objectFit: 'contain' }}/>
        </div>

        <HoverCard>

          {/* ══ SIGN IN ══ */}
          {step === 'login' && (
            <form onSubmit={handleLogin} style={{ width: '100%' }}>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize:'1.5rem', fontWeight:800, color:'#111', marginBottom:5 }}>Welcome back</div>
                <div style={{ fontSize:'0.84rem', color:'#6B7280' }}>Sign in to your admin account</div>
              </div>

              {info && (
                <div style={{ background:'rgba(44,182,125,0.1)', border:'1px solid rgba(44,182,125,0.3)', color:'#2CB67D', borderRadius:8, padding:'10px 14px', fontSize:'0.82rem', marginBottom:16 }}>
                  ✓ {info}
                </div>
              )}
              {error && (
                <div style={{ background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', color:'#DC2626', borderRadius:8, padding:'10px 14px', fontSize:'0.82rem', marginBottom:16 }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize:'0.78rem', fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Password</label>
                <div style={{ position:'relative' }}>
                  <input style={{ ...inputStyle, paddingRight:44 }}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••" value={password} required
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    onFocus={e => e.target.style.borderColor='#7B2CBF'}
                    onBlur={e => e.target.style.borderColor='#E5E7EB'}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'0.8rem', padding:4 }}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div style={{ textAlign:'right', marginBottom:24 }}>
                <button type="button" onClick={() => { setStep('forgot'); setError(''); setInfo('') }}
                  style={{ background:'none', border:'none', color:'#7B2CBF', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', padding:0 }}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" style={btnStyle} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>
          )}

          {/* ══ FORGOT PASSWORD ══ */}
          {step === 'forgot' && (
            <form onSubmit={handleForgot} style={{ width: '100%' }}>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize:'1.5rem', fontWeight:800, color:'#111', marginBottom:5 }}>Reset Password</div>
                <div style={{ fontSize:'0.84rem', color:'#6B7280', lineHeight:1.5 }}>
                  A reset link will be sent to<br/>
                  <strong style={{ color:'#7B2CBF' }}>{ADMIN_EMAIL}</strong>
                </div>
              </div>

              {error && (
                <div style={{ background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', color:'#DC2626', borderRadius:8, padding:'10px 14px', fontSize:'0.82rem', marginBottom:16 }}>
                  {error}
                </div>
              )}

              <button type="submit" style={{ ...btnStyle, marginBottom:14 }} disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link →'}
              </button>
              <button type="button" onClick={() => { setStep('login'); setError('') }}
                style={{ width:'100%', padding:'12px', borderRadius:10, border:'1.5px solid #E5E7EB', background:'transparent', color:'#374151', fontWeight:600, fontSize:'0.9rem', cursor:'pointer' }}>
                ← Back to Sign In
              </button>
            </form>
          )}

          {/* ══ LINK SENT ══ */}
          {step === 'sent' && (
            <div style={{ width:'100%', textAlign:'center' }}>
              <div style={{ fontSize:'3rem', marginBottom:16 }}>📧</div>
              <div style={{ fontSize:'1.4rem', fontWeight:800, color:'#111', marginBottom:10 }}>Check your email</div>
              <div style={{ fontSize:'0.85rem', color:'#6B7280', lineHeight:1.6, marginBottom:28 }}>
                A password reset link was sent to<br/>
                <strong style={{ color:'#7B2CBF' }}>{ADMIN_EMAIL}</strong><br/>
                Click the link in the email to set a new password.
              </div>
              <button onClick={() => { setStep('login'); setError(''); setInfo('') }}
                style={{ width:'100%', padding:'12px', borderRadius:10, border:'1.5px solid #E5E7EB', background:'transparent', color:'#374151', fontWeight:600, fontSize:'0.9rem', cursor:'pointer' }}>
                ← Back to Sign In
              </button>
            </div>
          )}

          {/* ══ RESET PASSWORD ══ */}
          {step === 'reset' && (
            <form onSubmit={handleReset} style={{ width: '100%' }}>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize:'1.5rem', fontWeight:800, color:'#111', marginBottom:5 }}>New Password</div>
                <div style={{ fontSize:'0.84rem', color:'#6B7280' }}>Choose a strong new password.</div>
              </div>

              {info && (
                <div style={{ background:'rgba(44,182,125,0.1)', border:'1px solid rgba(44,182,125,0.3)', color:'#2CB67D', borderRadius:8, padding:'10px 14px', fontSize:'0.82rem', marginBottom:16 }}>
                  ✓ {info}
                </div>
              )}
              {error && (
                <div style={{ background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', color:'#DC2626', borderRadius:8, padding:'10px 14px', fontSize:'0.82rem', marginBottom:16 }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:'0.78rem', fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>New Password</label>
                <input style={inputStyle} type="password" placeholder="Min. 6 characters" value={newPass} required
                  onChange={e => { setNewPass(e.target.value); setError('') }}
                  onFocus={e => e.target.style.borderColor='#7B2CBF'}
                  onBlur={e => e.target.style.borderColor='#E5E7EB'}
                />
              </div>
              <div style={{ marginBottom:24 }}>
                <label style={{ fontSize:'0.78rem', fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Confirm Password</label>
                <input style={inputStyle} type="password" placeholder="Repeat password" value={confirmPass} required
                  onChange={e => { setConfirmPass(e.target.value); setError('') }}
                  onFocus={e => e.target.style.borderColor='#7B2CBF'}
                  onBlur={e => e.target.style.borderColor='#E5E7EB'}
                />
              </div>

              <button type="submit" style={btnStyle} disabled={loading}>
                {loading ? 'Updating…' : 'Update Password →'}
              </button>
            </form>
          )}

        </HoverCard>
      </div>

      <style>{`
        @keyframes floatBubble {
          0%   { transform: translateY(0px)   scale(1);    opacity: 0.7; }
          33%  { transform: translateY(-28px) scale(1.04); opacity: 1;   }
          66%  { transform: translateY(-12px) scale(0.97); opacity: 0.8; }
          100% { transform: translateY(0px)   scale(1);    opacity: 0.7; }
        }
        .admin-mobile-logo { display: none; }
        @media (max-width: 640px) {
          .admin-login-left { display: none !important; }
          .admin-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
