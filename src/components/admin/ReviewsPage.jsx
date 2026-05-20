import { useState, useEffect } from 'react'
import { sb } from '../../lib/supabase'

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterProd, setFilterProd] = useState('')
  const [filterStar, setFilterStar] = useState('')
  const [confirm,    setConfirm]    = useState(null)
  const [viewReview, setViewReview] = useState(null)
  const [notif,      setNotif]      = useState('')

  async function load() {
    const [{ data: revs }, { data: prods }] = await Promise.all([
      sb.from('reviews').select('*').order('created_at', { ascending: false }),
      sb.from('products').select('id, name'),
    ])
    setReviews(revs || [])
    setProducts(prods || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function showNotif(msg) {
    setNotif(msg)
    setTimeout(() => setNotif(''), 3000)
  }

  async function handleDelete(id) {
    await sb.from('reviews').delete().eq('id', id)
    setConfirm(null)
    showNotif('✓ Review deleted')
    load()
  }

  const filtered = reviews
    .filter(r => filterProd ? String(r.product_id) === filterProd : true)
    .filter(r => filterStar ? r.rating === parseInt(filterStar) : true)

  const prodName = id => products.find(p => p.id === id)?.name || `Product #${id}`

  return (
    <>
      <div className="admin-content">
        <div className="filter-bar">
          <select className="filter-select" value={filterProd} onChange={e => setFilterProd(e.target.value)}>
            <option value="">All Products</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select className="filter-select" value={filterStar} onChange={e => setFilterStar(e.target.value)}>
            <option value="">All Ratings</option>
            <option value="5">★★★★★ 5 Star</option>
            <option value="4">★★★★☆ 4 Star</option>
            <option value="3">★★★☆☆ 3 Star</option>
            <option value="2">★★☆☆☆ 2 Star</option>
            <option value="1">★☆☆☆☆ 1 Star</option>
          </select>
          <span style={{ color: 'var(--muted)', fontSize: '0.84rem' }}>{filtered.length} review{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? <div className="loading">Loading…</div> : (
          <div className="table-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Product</th>
                    <th>Rating</th>
                    <th>Review</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>No reviews yet.</td></tr>
                  )}
                  {filtered.map(r => (
                    <tr key={r.id} onClick={() => setViewReview(r)} style={{ cursor: 'pointer' }} title="Click to read full review">
                      <td><strong>{r.name}</strong></td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--purple)', fontWeight: 600 }}>
                        {r.phone || <span style={{ color: 'var(--muted)', fontWeight: 400 }}>—</span>}
                      </td>
                      <td><span className="badge badge-cat">{prodName(r.product_id)}</span></td>
                      <td><span className="stars">{'★'.repeat(r.rating)}</span></td>
                      <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--muted)' }}>{r.text}</td>
                      <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <button className="btn btn-danger btn-xs" onClick={() => setConfirm(r.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {viewReview && (
        <div className="modal-overlay open" onClick={() => setViewReview(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-head" style={{ background: 'linear-gradient(135deg,#7B2CBF,#4C1D95)', borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div className="modal-head-title" style={{ color: '#fff' }}>{viewReview.name}</div>
                {viewReview.phone && <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>📱 {viewReview.phone}</div>}
              </div>
              <button className="modal-close" onClick={() => setViewReview(null)} style={{ color: '#fff', opacity: 0.8 }}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '20px 24px' }}>
              {/* Product + rating row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span className="badge badge-cat">{prodName(viewReview.product_id)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#F59E0B', fontSize: '1rem', letterSpacing: 2 }}>{'★'.repeat(viewReview.rating)}{'☆'.repeat(5 - viewReview.rating)}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.88rem' }}>{viewReview.rating}/5</span>
                </div>
              </div>
              {/* Full review text */}
              <div style={{
                background: 'var(--bg)', borderRadius: 10, padding: '14px 16px',
                fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.65,
                border: '1px solid var(--border)', minHeight: 80,
              }}>
                {viewReview.text || '—'}
              </div>
              {/* Date + verified */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {new Date(viewReview.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {viewReview.verified && (
                  <span style={{ fontSize: '0.72rem', color: '#2CB67D', fontWeight: 600, background: 'rgba(44,182,125,0.1)', borderRadius: 50, padding: '3px 10px' }}>
                    ✓ Verified Order
                  </span>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setViewReview(null)}>Close</button>
              <button className="btn btn-danger" onClick={() => { setConfirm(viewReview.id); setViewReview(null) }}>Delete Review</button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div className="confirm-overlay open">
          <div className="confirm-box">
            <div className="confirm-title">Delete Review?</div>
            <div className="confirm-msg">This action cannot be undone.</div>
            <div className="confirm-btns">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className={`admin-notif${notif ? ' show' : ''}`}>{notif}</div>
    </>
  )
}
