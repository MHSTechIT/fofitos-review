import { useState, useEffect, useRef } from 'react'
import { sb } from '../../lib/supabase'
import ImageUpload from './ImageUpload'
import StatusToggle from './StatusToggle'

const EMPTY_CAT = { id: '', name: '', description: '', img: '', video_url: '', sort_order: 0, group_name: '' }

/* ── Product drag-and-drop reorder modal ── */
function ProductOrderModal({ cat, onClose, onSaved }) {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const dragIdx  = useRef(null)
  const overIdx  = useRef(null)

  useEffect(() => {
    sb.from('products')
      .select('id, name, img, sort_order')
      .eq('cat', cat.id)
      .order('sort_order', { ascending: true })
      .then(({ data }) => { setItems(data || []); setLoading(false) })
  }, [cat.id])

  function onDragStart(i) { dragIdx.current = i }
  function onDragEnter(i) {
    if (i === dragIdx.current) return
    overIdx.current = i
    setItems(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx.current, 1)
      next.splice(i, 0, moved)
      dragIdx.current = i
      return next
    })
  }
  function onDragEnd() { dragIdx.current = null; overIdx.current = null }

  async function handleSave() {
    setSaving(true)
    await Promise.all(
      items.map((p, i) => sb.from('products').update({ sort_order: i + 1 }).eq('id', p.id))
    )
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="modal-overlay open" onClick={e => e.target.classList.contains('modal-overlay') && onClose()}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-head">
          <div className="modal-head-title">
            Product Order — <span style={{ color: 'var(--purple)' }}>{cat.name}</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: '8px 20px 16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)', fontSize: '0.85rem' }}>Loading products…</div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)', fontSize: '0.85rem' }}>No products in this category.</div>
          ) : (
            <>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 14 }}>
                Drag to reorder. Order is reflected on the customer page.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((p, i) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragEnter={() => onDragEnter(i)}
                    onDragEnd={onDragEnd}
                    onDragOver={e => e.preventDefault()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: 'var(--bg)', border: '1.5px solid var(--border)',
                      borderRadius: 10, padding: '10px 14px',
                      cursor: 'grab', userSelect: 'none',
                      transition: 'box-shadow 0.15s',
                    }}
                    onMouseDown={e => e.currentTarget.style.boxShadow = '0 4px 18px rgba(91,33,182,0.18)'}
                    onMouseUp={e => e.currentTarget.style.boxShadow = ''}
                  >
                    {/* Drag handle */}
                    <div style={{ color: 'var(--muted)', fontSize: '1.1rem', lineHeight: 1, letterSpacing: '-1px', flexShrink: 0 }}>⠿</div>
                    {/* Position badge */}
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'var(--purple)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.68rem', fontWeight: 700, flexShrink: 0,
                    }}>{i + 1}</div>
                    {/* Image */}
                    {p.img && <img src={p.img} alt={p.name} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 8, flexShrink: 0 }} />}
                    {/* Name */}
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', flex: 1 }}>{p.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading || items.length === 0}>
            {saving ? 'Saving…' : 'Save Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  const [cats,       setCats]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [form,       setForm]       = useState(EMPTY_CAT)
  const [editing,    setEditing]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [notif,      setNotif]      = useState('')
  const [confirm,    setConfirm]    = useState(null)
  const [orderCat,   setOrderCat]   = useState(null)   // category whose products to reorder

  async function load() {
    const { data } = await sb.from('categories').select('*').order('sort_order')
    setCats(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function showNotif(msg) {
    setNotif(msg)
    setTimeout(() => setNotif(''), 3000)
  }

  function openAdd() {
    setForm(EMPTY_CAT)
    setEditing(false)
    setModal(true)
  }

  function openEdit(cat) {
    setForm({ ...EMPTY_CAT, ...cat, group_name: cat.group_name || '' })
    setEditing(true)
    setModal(true)
  }

  async function handleSave() {
    if (!form.id || !form.name) return
    setSaving(true)
    const payload = {
      name: form.name,
      description: form.description,
      img: form.img,
      video_url: form.video_url || null,
      sort_order: form.sort_order,
      group_name: form.group_name?.trim() || null,
    }
    if (editing) {
      await sb.from('categories').update(payload).eq('id', form.id)
    } else {
      await sb.from('categories').insert({ id: form.id, ...payload })
    }
    setSaving(false)
    setModal(false)
    showNotif(editing ? '✓ Category updated' : '✓ Category added')
    load()
  }

  async function handleDelete(id) {
    await sb.from('categories').delete().eq('id', id)
    setConfirm(null)
    showNotif('✓ Category deleted')
    load()
  }

  // Flip a category's ON/OFF state — OFF hides it (and its products) from customers
  async function toggleActive(c) {
    const next = c.active === false
    await sb.from('categories').update({ active: next }).eq('id', c.id)
    setCats(prev => prev.map(x => x.id === c.id ? { ...x, active: next } : x))
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <>
      <div className="admin-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Category</button>
        </div>
        {loading ? <div className="loading">Loading…</div> : (
          <div className="table-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Group</th>
                    <th>Description</th>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cats.map(c => (
                    <tr
                      key={c.id}
                      onClick={() => setOrderCat(c)}
                      style={{ cursor: 'pointer', opacity: c.active === false ? 0.55 : 1 }}
                      title={`Click to reorder ${c.name} products`}
                    >
                      <td><img className="img-thumb" src={c.img} alt={c.name} /></td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{c.id}</td>
                      <td><strong>{c.name}</strong></td>
                      <td>
                        {c.group_name ? (
                          <span style={{
                            display: 'inline-block', padding: '2px 10px',
                            borderRadius: 50, fontSize: '0.72rem', fontWeight: 600,
                            background: 'rgba(91,33,182,0.10)', color: 'var(--purple)',
                          }}>{c.group_name}</span>
                        ) : <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>—</span>}
                      </td>
                      <td style={{ color: 'var(--muted)' }}>{c.description}</td>
                      <td>{c.sort_order}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <StatusToggle on={c.active !== false} onClick={() => toggleActive(c)} />
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="action-btns">
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setConfirm(c.id)}>Delete</button>
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
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-head-title">{editing ? 'Edit Category' : 'Add Category'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="f-label">ID (slug) *</label>
                  <input className="f-input" value={form.id} onChange={e => set('id', e.target.value)} disabled={editing} placeholder="e.g. burgers" />
                </div>
                <div className="form-group">
                  <label className="f-label">Sort Order</label>
                  <input className="f-input" type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} />
                </div>
                <div className="form-group full">
                  <label className="f-label">Name *</label>
                  <input className="f-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Burgers" />
                </div>
                <div className="form-group full">
                  <label className="f-label">
                    Group Name
                    <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: 6 }}>
                      (optional — categories sharing the same group name appear under one card)
                    </span>
                  </label>
                  <input
                    className="f-input"
                    list="group-name-suggestions"
                    value={form.group_name || ''}
                    onChange={e => set('group_name', e.target.value)}
                    placeholder="e.g. Bowls  (leave blank for standalone)"
                  />
                  <datalist id="group-name-suggestions">
                    {[...new Set(cats.map(c => c.group_name).filter(Boolean))].map(g => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
                  {form.group_name?.trim() && (
                    <div style={{
                      marginTop: 7, padding: '7px 12px', borderRadius: 8,
                      background: 'rgba(91,33,182,0.07)', border: '1px solid rgba(91,33,182,0.14)',
                      fontSize: '0.76rem', color: 'var(--purple)',
                    }}>
                      💡 This category will appear as a sub-section inside the <strong>"{form.group_name.trim()}"</strong> group card on the home page.
                    </div>
                  )}
                </div>
                <div className="form-group full">
                  <label className="f-label">Description</label>
                  <input className="f-input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short tagline" />
                </div>
                <div className="form-group full">
                  <label className="f-label">Category Image</label>
                  <ImageUpload value={form.img} onChange={v => set('img', v)} />
                </div>
                <div className="form-group full">
                  <label className="f-label">Video URL <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional — share URL: YouTube or Google Drive)</span></label>
                  <input
                    className="f-input"
                    value={form.video_url || ''}
                    onChange={e => set('video_url', e.target.value)}
                    placeholder="https://youtube.com/watch?v=… or any video share URL"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div className="confirm-overlay open">
          <div className="confirm-box">
            <div className="confirm-title">Delete Category?</div>
            <div className="confirm-msg">This will also delete all products in this category.</div>
            <div className="confirm-btns">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {orderCat && (
        <ProductOrderModal
          cat={orderCat}
          onClose={() => setOrderCat(null)}
          onSaved={() => showNotif(`✓ ${orderCat.name} product order saved`)}
        />
      )}

      <div className={`admin-notif${notif ? ' show' : ''}`}>{notif}</div>
    </>
  )
}
