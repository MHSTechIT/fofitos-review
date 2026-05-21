import { useState, useEffect } from 'react'
import { sb } from '../../lib/supabase'

/* Format a timestamp like "12 Apr 2026, 3:30 PM" */
function fmtTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  if (isNaN(d)) return '—'
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

export default function Dashboard() {
  const [stats, setStats] = useState({ cats: 0, prods: 0 })
  const [recentProducts, setRecentProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      sb.from('categories').select('id', { count: 'exact', head: true }),
      sb.from('products').select('id, name, img, cat, created_at, updated_at, done_by', { count: 'exact' }).order('updated_at', { ascending: false }),
    ]).then(([{ count: catCount }, { data: prods, count: prodCount }]) => {
      setStats({ cats: catCount || 0, prods: prodCount || 0 })
      setRecentProducts((prods || []).slice(0, 5))
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="admin-content"><div className="loading">Loading…</div></div>

  return (
    <>
      <div className="admin-content">
        <div className="stats-grid">
          <div className="stat-card" style={{ flex: 1 }}>
            <div className="stat-label">Categories</div>
            <div className="stat-value">{stats.cats}</div>
            <div className="stat-sub">menu sections</div>
          </div>
          <div className="stat-card" style={{ flex: 1 }}>
            <div className="stat-label">Products</div>
            <div className="stat-value">{stats.prods}</div>
            <div className="stat-sub">items on menu</div>
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
                  <th>Time</th>
                  <th>Done by</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map(p => {
                  // "edited" only if updated_at is meaningfully later than created_at
                  const edited = p.created_at && p.updated_at &&
                    (new Date(p.updated_at) - new Date(p.created_at)) > 2000
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img className="img-thumb" src={p.img} alt={p.name} />
                          <strong>{p.name}</strong>
                        </div>
                      </td>
                      <td><span className="badge badge-cat">{p.cat}</span></td>
                      <td>
                        <div style={{ fontSize: '0.76rem', lineHeight: 1.5 }}>
                          <div><span style={{ color: 'var(--muted)' }}>Created:</span> {fmtTime(p.created_at)}</div>
                          <div><span style={{ color: 'var(--muted)' }}>Edited:</span> {edited ? fmtTime(p.updated_at) : '—'}</div>
                        </div>
                      </td>
                      <td>
                        {p.done_by
                          ? <span className="badge badge-cat">{p.done_by}</span>
                          : <span style={{ color: 'var(--muted)' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  )
}
