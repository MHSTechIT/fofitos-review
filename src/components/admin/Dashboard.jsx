import { useState, useEffect } from 'react'
import { sb } from '../../lib/supabase'

export default function Dashboard() {
  const [stats, setStats] = useState({ cats: 0, prods: 0, revs: 0, avgRating: 0 })
  const [recentProducts, setRecentProducts] = useState([])
  const [recentReviews, setRecentReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      sb.from('categories').select('id', { count: 'exact', head: true }),
      sb.from('products').select('id, name, img, price, rating, cat', { count: 'exact' }),
      sb.from('reviews').select('id, name, rating, text, created_at, product_id', { count: 'exact' }),
      sb.from('products').select('rating'),
    ]).then(([{ count: catCount }, { data: prods, count: prodCount }, { data: revs, count: revCount }, { data: allRatings }]) => {
      const avg = allRatings?.length
        ? (allRatings.reduce((s, p) => s + (p.rating || 0), 0) / allRatings.length).toFixed(1)
        : '—'
      setStats({ cats: catCount || 0, prods: prodCount || 0, revs: revCount || 0, avgRating: avg })
      setRecentProducts((prods || []).slice(0, 5))
      setRecentReviews((revs || []).slice(0, 5))
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="admin-content"><div className="loading">Loading…</div></div>

  return (
    <>
      <div className="admin-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Categories</div>
            <div className="stat-value">{stats.cats}</div>
            <div className="stat-sub">menu sections</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Products</div>
            <div className="stat-value">{stats.prods}</div>
            <div className="stat-sub">items on menu</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Reviews</div>
            <div className="stat-value">{stats.revs}</div>
            <div className="stat-sub">customer reviews</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Rating</div>
            <div className="stat-value">{stats.avgRating}</div>
            <div className="stat-sub">across all items</div>
          </div>
        </div>

        <div className="table-card" style={{ marginBottom: 24 }}>
          <div className="table-header">
            <div>
              <div className="table-title">Recent Products</div>
              <div className="table-sub">Latest additions to the menu</div>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img className="img-thumb" src={p.img} alt={p.name} />
                        <strong>{p.name}</strong>
                      </div>
                    </td>
                    <td><span className="badge badge-cat">{p.cat}</span></td>
                    <td><span className="badge badge-price">{p.price}</span></td>
                    <td><span className="stars">{'★'.repeat(Math.round(p.rating || 0))}</span> {p.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {recentReviews.length > 0 && (
          <div className="table-card">
            <div className="table-header">
              <div>
                <div className="table-title">Recent Reviews</div>
                <div className="table-sub">Latest customer feedback</div>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Rating</th>
                    <th>Review</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReviews.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.name}</strong></td>
                      <td><span className="stars">{'★'.repeat(r.rating)}</span></td>
                      <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.text}</td>
                      <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
