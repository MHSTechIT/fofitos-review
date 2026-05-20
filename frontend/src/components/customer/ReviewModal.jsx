import { useState } from 'react'
import { sb } from '../../lib/supabase'

export default function ReviewModal({ products, preSelectedId, onClose, onPosted }) {
  const [productId,  setProductId]  = useState(preSelectedId || (products[0]?.id ?? ''))
  const [name,       setName]       = useState('')
  const [phone,      setPhone]      = useState('')
  const [rating,     setRating]     = useState(0)
  const [text,       setText]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  async function handlePost() {
    if (!name.trim())  { setError('Please enter your name 👤'); return }
    if (!phone.trim()) { setError('Please enter your phone number 📱'); return }
    if (!/^\d{10}$/.test(phone.replace(/\s/g,''))) { setError('Enter a valid 10-digit phone number'); return }
    if (!rating)       { setError('Please select a rating ⭐'); return }
    if (!text.trim())  { setError('Please write your review 📝'); return }

    setSubmitting(true)
    const { error: err } = await sb.from('reviews').insert({
      product_id: parseInt(productId),
      name:       name.trim(),
      phone:      phone.trim(),
      rating,
      text:       text.trim(),
      verified:   true,
      visible:    true,
    })
    setSubmitting(false)
    if (err) { setError('Failed to post review. Try again.'); return }
    onPosted?.()
    onClose()
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid #E8E0F5', fontSize: '0.88rem',
    outline: 'none', boxSizing: 'border-box', marginBottom: 12,
    fontFamily: 'inherit', background: '#FAFAFE', color: '#1a1a2e',
  }

  return (
    <div className="modal-bg open" onClick={e => e.target.classList.contains('modal-bg') && onClose()}>
      <div className="review-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="m-title">Write a Review</div>
        <div className="m-sub">Share your experience — taste, freshness, love.</div>

        <label className="m-label">Select Product</label>
        <select className="m-sel" value={productId} onChange={e => setProductId(e.target.value)}>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Name + Phone row */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label className="m-label">Your Name</label>
            <input
              style={inputStyle}
              placeholder="e.g. Arjun"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="m-label">Phone Number</label>
            <input
              style={inputStyle}
              placeholder="10-digit number"
              value={phone}
              maxLength={10}
              inputMode="numeric"
              onChange={e => { setPhone(e.target.value.replace(/\D/,'')); setError('') }}
            />
          </div>
        </div>

        <label className="m-label">Your Rating</label>
        <div className="star-row">
          {[1,2,3,4,5].map(v => (
            <button key={v} className={`star-btn${rating >= v ? ' lit' : ''}`} onClick={() => setRating(v)}>★</button>
          ))}
        </div>

        <label className="m-label">Your Review</label>
        <textarea
          className="m-area"
          placeholder="Tell us about the taste, freshness, portions..."
          value={text}
          onChange={e => { setText(e.target.value); setError('') }}
        />

        {error && <div style={{ color: '#E05252', fontSize: '0.82rem', marginBottom: 10 }}>{error}</div>}

        <div className="modal-btns">
          <button className="m-cancel" onClick={onClose}>Cancel</button>
          <button className="m-post" onClick={handlePost} disabled={submitting}>
            {submitting ? 'Posting…' : 'Post Review →'}
          </button>
        </div>
      </div>
    </div>
  )
}
