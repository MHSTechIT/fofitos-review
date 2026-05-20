import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/customer.css'
import App from './App.jsx'
import { sb } from './lib/supabase.js'

const CACHE_KEY = 'fofitos_qr_dest_v1'
const CACHE_TTL = 8 * 60 * 1000 // 8 minutes

function isFofitos(url) {
  return !url || url.trim() === '' || url.includes('fofitos.com')
}

function getCached(qrId) {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY + qrId))
    if (c && Date.now() - c.ts < CACHE_TTL) return c.url
  } catch {}
  return null
}

export function setQRCache(qrId, url) {
  localStorage.setItem(CACHE_KEY + qrId, JSON.stringify({ url: url || '', ts: Date.now() }))
}

export function clearQRCache(qrId) {
  localStorage.removeItem(CACHE_KEY + qrId)
}

function startReact() {
  createRoot(document.getElementById('root')).render(
    <StrictMode><App /></StrictMode>
  )
}

function showSpinner() {
  document.getElementById('root').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:12px;font-family:Outfit,sans-serif;color:#7C3AED">
      <div style="width:36px;height:36px;border:3px solid #E9D5FF;border-top-color:#7C3AED;border-radius:50%;animation:qrspin 0.8s linear infinite"></div>
      <div style="font-size:0.9rem;font-weight:600">Opening…</div>
      <style>@keyframes qrspin{to{transform:rotate(360deg)}}</style>
    </div>
  `
}

// Only redirect if URL has ?qr= param (i.e. actually scanned from QR code)
const params = new URLSearchParams(window.location.search)
const qrId   = params.get('qr') // '1', '2', or null

if (qrId) {
  const cached = getCached(qrId)

  if (cached !== null) {
    // ── Cache hit: instant decision ──
    if (!isFofitos(cached)) {
      window.location.replace(cached) // instant redirect, React never loads
    } else {
      startReact() // no redirect needed, show homepage
    }
  } else {
    // ── Cache miss: show spinner, wait for Supabase, THEN decide ──
    showSpinner()
    sb.from('qr_links').select('url').eq('id', qrId).single()
      .then(({ data }) => {
        const dest = data?.url?.trim() || ''
        setQRCache(qrId, dest)
        if (!isFofitos(dest)) {
          window.location.replace(dest) // redirect
        } else {
          startReact() // no redirect, show homepage
        }
      })
      .catch(() => {
        setQRCache(qrId, '')
        startReact()
      })
  }
} else {
  // ── Normal visit (no ?qr= param) — never redirect ──
  startReact()
}
