import { useRef, useState } from 'react'
import { sb } from '../../lib/supabase'

const BUCKET = 'fofitos-videos'
const MAX_MB = 200

export default function VideoUpload({ value, onChange }) {
  const inputRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  async function processFile(file) {
    if (!file) return
    if (!file.type.startsWith('video/')) {
      setError('Only video files are allowed (MP4, WEBM, MOV…)')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Video must be under ${MAX_MB} MB.`)
      return
    }

    setError('')
    setUploading(true)
    setProgress(10)

    const filename = `${Date.now()}_${file.name.replace(/[^a-z0-9._-]/gi, '_')}`

    // Simulate progress ticks while uploading (the storage shim has no native
    // progress events — videos are large, so keep the bar moving slowly).
    const tick = setInterval(() => setProgress(p => Math.min(p + 8, 85)), 400)

    const { error: uploadErr } = await sb.storage
      .from(BUCKET)
      .upload(filename, file, { upsert: false, contentType: file.type })

    clearInterval(tick)

    if (uploadErr) {
      setError(`Upload failed: ${uploadErr.message}`)
      setUploading(false)
      setProgress(0)
      return
    }

    setProgress(100)
    const { data } = sb.storage.from(BUCKET).getPublicUrl(filename)
    onChange(data.publicUrl)

    setTimeout(() => {
      setUploading(false)
      setProgress(0)
    }, 600)
  }

  function handleInputChange(e) {
    processFile(e.target.files?.[0])
    e.target.value = '' // reset so same file can be re-selected
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files?.[0])
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleRemove() {
    onChange('')
    setError('')
  }

  const hasVideo = !!value

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

      {/* ── Drop Zone / Preview ── */}
      <div
        onClick={() => !uploading && inputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          width: 120, height: 120, borderRadius: 12, flexShrink: 0,
          border: dragging
            ? '2px dashed var(--purple)'
            : hasVideo
              ? '2px solid var(--border)'
              : '2px dashed var(--border)',
          background: dragging ? 'rgba(91,33,182,0.05)' : hasVideo ? '#000' : 'var(--bg)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          cursor: uploading ? 'default' : 'pointer',
          position: 'relative',
          transition: 'border-color 0.2s, background 0.2s',
          boxShadow: hasVideo ? '0 2px 10px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        {hasVideo && !uploading && (
          <>
            <video
              src={value}
              muted
              playsInline
              preload="metadata"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Hover overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(91,33,182,0.55)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.2s',
              color: '#fff', fontSize: '0.72rem', fontWeight: 600, gap: 4,
            }}
              className="img-hover-overlay"
            >
              <span style={{ fontSize: '1.3rem' }}>🔄</span>
              Change
            </div>
          </>
        )}

        {!hasVideo && !uploading && (
          <>
            <span style={{ fontSize: '1.8rem', marginBottom: 6 }}>
              {dragging ? '📂' : '🎬'}
            </span>
            <span style={{
              fontSize: '0.68rem', color: dragging ? 'var(--purple)' : 'var(--muted)',
              fontWeight: 600, textAlign: 'center', lineHeight: 1.4, padding: '0 8px'
            }}>
              {dragging ? 'Drop here' : 'Click or\ndrag & drop'}
            </span>
          </>
        )}

        {uploading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 12 }}>
            <Spinner />
            <div style={{
              width: '100%', height: 5, borderRadius: 3,
              background: 'var(--border)', overflow: 'hidden'
            }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: 'var(--purple)',
                width: `${progress}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 600 }}>
              {progress < 100 ? 'Uploading…' : 'Done ✓'}
            </span>
          </div>
        )}
      </div>

      {/* ── Right side ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => inputRef.current.click()}
            disabled={uploading}
            style={{ flex: 1 }}
          >
            {uploading ? 'Uploading…' : hasVideo ? '🔄 Replace Video' : '📁 Upload Video'}
          </button>

          {hasVideo && !uploading && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleRemove}
              title="Remove video"
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.5 }}>
          MP4, WEBM, MOV · Max {MAX_MB} MB<br />
          Plays directly on the page — no YouTube needed.
        </div>

        {/* URL fallback */}
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
            Or paste a URL
          </div>
          <input
            className="f-input"
            value={value || ''}
            onChange={e => { onChange(e.target.value); setError('') }}
            placeholder="https://... , /api/uploads/... , or a YouTube link"
            style={{ fontSize: '0.8rem' }}
          />
        </div>

        {error && (
          <div style={{
            background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.3)',
            borderRadius: 8, padding: '8px 12px',
            color: '#c94444', fontSize: '0.78rem', fontWeight: 500,
          }}>
            ⚠️ {error}
          </div>
        )}

        {hasVideo && !error && (
          <div style={{
            background: 'rgba(44,182,125,0.08)', border: '1px solid rgba(44,182,125,0.25)',
            borderRadius: 8, padding: '8px 12px',
            color: '#1e9966', fontSize: '0.76rem', fontWeight: 500,
            wordBreak: 'break-all',
          }}>
            ✓ Video ready
          </div>
        )}
      </div>

      <style>{`
        div:hover > .img-hover-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      border: '3px solid var(--border)',
      borderTopColor: 'var(--purple)',
      animation: 'spin 0.7s linear infinite',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
