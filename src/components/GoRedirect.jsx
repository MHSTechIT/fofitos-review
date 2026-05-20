import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { sb } from '../lib/supabase'

export default function GoRedirect() {
  const { id } = useParams()

  useEffect(() => {
    sb.from('qr_links').select('url').eq('id', id).single()
      .then(({ data, error }) => {
        const dest = data?.url
        if (!error && dest && dest.trim() !== '') {
          window.location.replace(dest.trim())
        } else {
          window.location.replace('/')
        }
      })
      .catch(() => window.location.replace('/'))
  }, [id])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', flexDirection: 'column', gap: 12,
      fontFamily: 'Outfit, sans-serif', color: '#7C3AED',
    }}>
      <svg width="40" height="40" fill="none" viewBox="0 0 24 24"
        style={{ animation: 'spin 0.8s linear infinite' }}>
        <circle cx="12" cy="12" r="10" stroke="#E9D5FF" strokeWidth="3"/>
        <path d="M12 2a10 10 0 0110 10" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Redirecting…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
