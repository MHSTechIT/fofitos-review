import { useState, useEffect } from 'react'
import { sb } from '../../lib/supabase'
import ImageUpload from './ImageUpload'

const MACRO_COLORS = ['#2CB67D', '#E09A2C', '#4A90D9', '#C8BEA8', '#E05252', '#7B2CBF']


function emptyProduct() {
  return {
    cat: '', name: '', img: '', tagline: '', price: '',
    rating: 4.0, reviews: 0,
    is_veg: true,
    cal: 0, pro: 0, carb: 0, fat: 0, fibre: 0,
    tags: [], nutrition: [], ingr: [],
  }
}

/* ── Indian food type badge ── */
function VegBadge({ isVeg, size = 16 }) {
  const color = isVeg ? '#2D9E45' : '#8B1A1A'
  return (
    <div style={{
      width: size, height: size, border: `2px solid ${color}`, borderRadius: 3,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, background: '#fff',
    }}>
      <div style={{ width: size * 0.44, height: size * 0.44, borderRadius: '50%', background: color }} />
    </div>
  )
}

function starStr(r) {
  let s = ''
  for (let i = 1; i <= 5; i++) s += i <= Math.floor(r) ? '★' : (i - 0.5 <= r ? '⭑' : '☆')
  return s
}

function ProductReviews({ productId }) {
  const [reviews,   setReviews]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filterStar, setFilterStar] = useState(0)   // 0 = all stars

  const MAX_ON = 8

  useEffect(() => {
    if (!productId) return
    setLoading(true)
    sb.from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false })
      .then(({ data }) => { setReviews(data || []); setLoading(false) })
  }, [productId])

  const onCount = reviews.filter(r => r.visible !== false).length

  async function toggleVisible(r) {
    const isOn = r.visible !== false
    if (!isOn && onCount >= MAX_ON) return   // max 8 limit
    const newVal = !isOn
    await sb.from('reviews').update({ visible: newVal }).eq('id', r.id)
    setReviews(prev => prev.map(x => x.id === r.id ? { ...x, visible: newVal } : x))
  }

  const filtered = filterStar === 0
    ? reviews
    : reviews.filter(r => Math.floor(r.rating || r.stars || 0) === filterStar)

  if (loading) return <div style={{ color:'var(--muted)', fontSize:'0.82rem', padding:'8px 0' }}>Loading reviews…</div>

  return (
    <div>
      {/* Header row: count badge + star filter */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{
          fontSize:'0.72rem', fontWeight:700, color: onCount >= MAX_ON ? '#DC2626' : '#2CB67D',
          background: onCount >= MAX_ON ? 'rgba(220,38,38,0.08)' : 'rgba(44,182,125,0.1)',
          borderRadius:50, padding:'3px 10px',
        }}>
          {onCount}/{MAX_ON} showing on page
        </div>
        {/* Star filter */}
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          {[0,1,2,3,4,5].map(s => (
            <button key={s} onClick={() => setFilterStar(s)} style={{
              padding:'3px 9px', borderRadius:50, fontSize:'0.72rem', fontWeight:600,
              cursor:'pointer', border:'1.5px solid',
              borderColor: filterStar===s ? 'var(--purple)' : 'var(--border)',
              background: filterStar===s ? 'var(--purple)' : 'transparent',
              color: filterStar===s ? '#fff' : 'var(--muted)',
              transition:'all 0.15s',
            }}>
              {s === 0 ? 'All' : '★'.repeat(s)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'24px 0', color:'var(--muted)', fontSize:'0.82rem' }}>
          No reviews {filterStar > 0 ? `with ${filterStar} star${filterStar>1?'s':''}` : 'yet'} for this product.
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.map(r => {
          const isOn    = r.visible !== false
          const atLimit = !isOn && onCount >= MAX_ON
          return (
            <div key={r.id} style={{
              background:'var(--bg)', border:`1.5px solid ${isOn ? 'rgba(44,182,125,0.35)' : 'var(--border)'}`,
              borderRadius:12, padding:'12px 14px',
              display:'flex', flexDirection:'column', gap:6,
              opacity: atLimit ? 0.55 : 1,
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{
                    width:30, height:30, borderRadius:'50%',
                    background:'var(--purple)', color:'#fff',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'0.72rem', fontWeight:700, flexShrink:0,
                  }}>{(r.name||'U')[0].toUpperCase()}</div>
                  <div>
                    <div style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text)' }}>{r.name||'Anonymous'}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
                      {r.phone && (
                        <span style={{ fontSize:'0.68rem', color:'var(--purple)', fontWeight:600 }}>📱 {r.phone}</span>
                      )}
                      <span style={{ fontSize:'0.68rem', color:'var(--muted)' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ color:'#F59E0B', fontSize:'0.8rem', letterSpacing:1 }}>{starStr(r.rating||r.stars||0)}</span>
                  {/* ON / OFF toggle */}
                  <button
                    onClick={() => toggleVisible(r)}
                    disabled={atLimit}
                    title={atLimit ? `Max ${MAX_ON} reviews allowed` : isOn ? 'Hide from customer page' : 'Show on customer page'}
                    style={{
                      display:'flex', alignItems:'center', gap:6,
                      padding:'4px 12px', borderRadius:50, border:'none',
                      cursor: atLimit ? 'not-allowed' : 'pointer',
                      fontWeight:700, fontSize:'0.72rem',
                      background: isOn ? '#2CB67D' : '#D1D5DB',
                      color: isOn ? '#fff' : '#6B7280',
                      transition:'background 0.2s, color 0.2s',
                    }}>
                    <span style={{
                      width:10, height:10, borderRadius:'50%',
                      background: isOn ? '#fff' : '#9CA3AF',
                      display:'inline-block', transition:'background 0.2s',
                    }}/>
                    {isOn ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
              <div style={{ fontSize:'0.8rem', color:'var(--text)', lineHeight:1.5, paddingLeft:38 }}>
                {r.text||r.txt||'—'}
              </div>
              {(r.verified||r.v) && (
                <div style={{ paddingLeft:38 }}>
                  <span style={{ fontSize:'0.67rem', color:'#2CB67D', fontWeight:600, background:'rgba(44,182,125,0.1)', borderRadius:50, padding:'2px 8px', display:'inline-block' }}>
                    ✓ Verified Order
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')
  function add() {
    const v = input.trim()
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInput('')
  }
  return (
    <div>
      <div className="tag-add-row">
        <input className="f-input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Type tag and press Enter" style={{ flex: 1 }} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={add}>Add</button>
      </div>
      <div className="tags-wrap" style={{ marginTop: 8 }}>
        {tags.map(t => (
          <span key={t} className="tag-chip">
            {t}
            <button className="tag-remove" onClick={() => onChange(tags.filter(x => x !== t))}>×</button>
          </span>
        ))}
      </div>
    </div>
  )
}

function NutritionEditor({ rows, onChange }) {
  function update(i, k, v) {
    const next = rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r)
    onChange(next)
  }
  function addRow() {
    onChange([...rows, { n: '', v: '', p: 0, c: '#2CB67D', s: false }])
  }
  function remove(i) { onChange(rows.filter((_, idx) => idx !== i)) }

  return (
    <div>
      <table className="dyn-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
            <th>Bar%</th>
            <th>Color</th>
            <th>Sub?</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td><input value={r.n} onChange={e => update(i, 'n', e.target.value)} placeholder="Total Fat" /></td>
              <td><input value={r.v} onChange={e => update(i, 'v', e.target.value)} placeholder="12 g" /></td>
              <td><input type="number" min="0" max="100" value={r.p} onChange={e => update(i, 'p', parseInt(e.target.value) || 0)} /></td>
              <td>
                <select value={r.c} onChange={e => update(i, 'c', e.target.value)}>
                  {MACRO_COLORS.map(c => <option key={c} value={c} style={{ background: c }}>{c}</option>)}
                </select>
              </td>
              <td style={{ textAlign: 'center' }}>
                <input type="checkbox" checked={!!r.s} onChange={e => update(i, 's', e.target.checked)} />
              </td>
              <td><button className="row-del-btn" onClick={() => remove(i)}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="add-row-btn" onClick={addRow}>+ Add Row</button>
    </div>
  )
}

function IngrEditor({ rows, onChange }) {
  function update(i, k, v) {
    onChange(rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r))
  }
  function addRow() { onChange([...rows, { n: '', src: '', c: '#2CB67D' }]) }
  function remove(i) { onChange(rows.filter((_, idx) => idx !== i)) }

  return (
    <div>
      <table className="dyn-table">
        <thead>
          <tr>
            <th>Ingredient</th>
            <th>Source</th>
            <th>Color</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td><input value={r.n} onChange={e => update(i, 'n', e.target.value)} placeholder="Chicken" /></td>
              <td><input value={r.src} onChange={e => update(i, 'src', e.target.value)} placeholder="Free range" /></td>
              <td>
                <select value={r.c} onChange={e => update(i, 'c', e.target.value)}>
                  {MACRO_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </td>
              <td><button className="row-del-btn" onClick={() => remove(i)}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="add-row-btn" onClick={addRow}>+ Add Row</button>
    </div>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyProduct())
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notif, setNotif] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [filterCat, setFilterCat] = useState('')
  const [search, setSearch] = useState('')

  async function load() {
    const [{ data: prods }, { data: catData }] = await Promise.all([
      sb.from('products').select('id, name, img, cat, price, rating, tagline'),
      sb.from('categories').select('id, name').order('sort_order'),
    ])
    setProducts(prods || [])
    setCats(catData || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function showNotif(msg) {
    setNotif(msg)
    setTimeout(() => setNotif(''), 3000)
  }

  function openAdd() {
    setForm(emptyProduct())
    setEditing(false)
    setModal(true)
  }

  async function openEdit(id) {
    const { data } = await sb.from('products').select('*').eq('id', id).single()
    if (!data) return
    setForm({
      ...data,
      is_veg: data.is_veg !== false,
      tags: Array.isArray(data.tags) ? data.tags : [],
      nutrition: Array.isArray(data.nutrition) ? data.nutrition : [],
      ingr: Array.isArray(data.ingr) ? data.ingr : [],
    })
    setEditing(true)
    setModal(true)
  }

  async function handleSave() {
    if (!form.cat || !form.name) return
    setSaving(true)
    const payload = {
      cat: form.cat, name: form.name, img: form.img, tagline: form.tagline,
      price: form.price, rating: parseFloat(form.rating) || 4.0,
      reviews: parseInt(form.reviews) || 0,
      is_veg: form.is_veg !== false,
      cal: parseInt(form.cal) || 0, pro: parseInt(form.pro) || 0,
      carb: parseInt(form.carb) || 0, fat: parseInt(form.fat) || 0,
      fibre: parseInt(form.fibre) || 0,
      tags: form.tags, nutrition: form.nutrition, ingr: form.ingr,
    }
    if (editing) {
      await sb.from('products').update(payload).eq('id', form.id)
    } else {
      await sb.from('products').insert(payload)
    }
    setSaving(false)
    setModal(false)
    showNotif(editing ? '✓ Product updated' : '✓ Product added')
    load()
  }

  async function handleDelete(id) {
    await sb.from('products').delete().eq('id', id)
    setConfirm(null)
    showNotif('✓ Product deleted')
    load()
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const filtered = products.filter(p => {
    const matchCat = !filterCat || p.cat === filterCat
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <>
      <div className="admin-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <input className="filter-input" style={{ margin: 0 }} placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="filter-select" style={{ margin: 0, flexShrink: 0 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">All Categories</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn btn-primary" style={{ flexShrink: 0 }} onClick={openAdd}>+ Add Product</button>
        </div>

        {loading ? <div className="loading">Loading…</div> : (
          <div className="table-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>No products found.</td></tr>
                  )}
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img className="img-thumb" src={p.img} alt={p.name} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{p.tagline}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-cat">{p.cat}</span></td>
                      <td>
                        <div className="action-btns">
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p.id)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setConfirm(p.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay open" onClick={e => e.target.classList.contains('modal-overlay') && setModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-head-title">{editing ? 'Edit Product' : 'Add Product'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-section">Basic Info</div>
              <div className="form-grid">
                <div className="form-group full">
                  <label className="f-label">Name *</label>
                  <input className="f-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Product name" />
                </div>
                {/* ── Veg / Non-Veg ── */}
                <div className="form-group full">
                  <label className="f-label">Food Type *</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[{ label: 'Veg', val: true }, { label: 'Non-Veg', val: false }].map(opt => {
                      const sel = form.is_veg === opt.val
                      const color = opt.val ? '#2D9E45' : '#8B1A1A'
                      return (
                        <button key={opt.label} type="button" onClick={() => set('is_veg', opt.val)} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                          border: `2px solid ${sel ? color : '#E5E7EB'}`,
                          background: sel ? (opt.val ? 'rgba(45,158,69,0.06)' : 'rgba(139,26,26,0.06)') : '#fff',
                          fontWeight: 700, fontSize: '0.88rem', color: sel ? color : '#6B7280',
                          transition: 'all 0.15s',
                        }}>
                          <VegBadge isVeg={opt.val} size={18} />
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="form-group">
                  <label className="f-label">Category *</label>
                  <select className="f-select" value={form.cat} onChange={e => set('cat', e.target.value)}>
                    <option value="">Select category</option>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group full">
                  <label className="f-label">Tagline</label>
                  <input className="f-input" value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Short description" />
                </div>
                <div className="form-group full">
                  <label className="f-label">Product Image</label>
                  <ImageUpload value={form.img} onChange={v => set('img', v)} />
                </div>
              </div>

              <div className="form-section">Macros</div>
              <div className="form-grid">
                {[['cal','Calories (kcal)'],['pro','Protein (g)'],['carb','Carbs (g)'],['fat','Fat (g)'],['fibre','Fibre (g)']].map(([k, label]) => (
                  <div key={k} className="form-group">
                    <label className="f-label">{label}</label>
                    <input className="f-input" type="number" value={form[k]} onChange={e => set(k, e.target.value)} />
                  </div>
                ))}
              </div>

              <div className="form-section">Tags</div>
              <TagInput tags={form.tags} onChange={v => set('tags', v)} />

              <div className="form-section">Nutrition Facts</div>
              <NutritionEditor rows={form.nutrition} onChange={v => set('nutrition', v)} />

              <div className="form-section">Ingredients</div>
              <IngrEditor rows={form.ingr} onChange={v => set('ingr', v)} />

            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div className="confirm-overlay open">
          <div className="confirm-box">
            <div className="confirm-title">Delete Product?</div>
            <div className="confirm-msg">This will permanently delete this product and its reviews.</div>
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
