import { useState, useEffect } from 'react'
import { sb } from '../../lib/supabase'
import ImageUpload from './ImageUpload'

const ROW_ID = 'default'
const EMPTY = {
  zomato_url:      '',
  swiggy_url:      '',
  review_url:      '',
  footer_company:  '',
  footer_fssai:    '',
  footer_gst:      '',
  footer_phone1:   '',
  footer_phone2:   '',
  footer_email:    '',
  media_images:    [],
  media_videos:    [],
}

const PLACEHOLDERS = {
  zomato_url:     'https://zomato.com/...',
  swiggy_url:     'https://swiggy.com/...',
  review_url:     'https://g.page/r/... or any review page',
  footer_company: 'Doctor Farmer Foods Private Limited',
  footer_fssai:   '12426023000520',
  footer_gst:     '33AAMCD2507N1ZJ',
  footer_phone1:  '+91 89258 41987',
  footer_phone2:  '+91 89258 41983',
  footer_email:   'doctorfarmerfoods@gmail.com',
}

export default function LinksPage() {
  const [form,    setForm]    = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [notif,   setNotif]   = useState('')

  useEffect(() => {
    sb.from('links').select('*').eq('id', ROW_ID).maybeSingle()
      .then(({ data }) => {
        if (data) {
          // Normalise media_videos: older rows stored bare strings; new shape is {url, autoplay}
          const videos = Array.isArray(data.media_videos)
            ? data.media_videos.map(v => typeof v === 'string' ? { url: v, autoplay: true } : { url: v?.url || '', autoplay: v?.autoplay !== false })
            : []
          // Normalise media_images: older rows stored bare strings; new shape is {url, link}
          const imgs = Array.isArray(data.media_images)
            ? data.media_images.map(v => typeof v === 'string' ? { url: v, link: '' } : { url: v?.url || '', link: v?.link || '' })
            : []
          setForm({
            zomato_url:     data.zomato_url     || '',
            swiggy_url:     data.swiggy_url     || '',
            review_url:     data.review_url     || '',
            footer_company: data.footer_company || '',
            footer_fssai:   data.footer_fssai   || '',
            footer_gst:     data.footer_gst     || '',
            footer_phone1:  data.footer_phone1  || '',
            footer_phone2:  data.footer_phone2  || '',
            footer_email:   data.footer_email   || '',
            media_images:   imgs,
            media_videos:   videos,
          })
        }
        setLoading(false)
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    await sb.from('links').upsert({ id: ROW_ID, ...form })
    setSaving(false)
    setNotif('✓ Saved successfully')
    setTimeout(() => setNotif(''), 3000)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const Section = ({ title, children }) => (
    <div style={{ background:'#fff', borderRadius:14, border:'1px solid var(--border)', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', marginBottom:24, overflow:'hidden' }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', background:'var(--bg)' }}>
        <div style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text)', letterSpacing:'0.5px' }}>{title}</div>
      </div>
      <div style={{ padding:'20px' }}>
        {children}
      </div>
    </div>
  )

  const Field = ({ label, k, dot }) => (
    <div style={{ marginBottom:14 }}>
      <label className="f-label" style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
        {dot && <span style={{ width:8, height:8, borderRadius:'50%', background:dot, display:'inline-block', flexShrink:0 }}/>}
        {label}
        {form[k] && k.endsWith('_url') && (
          <a href={form[k]} target="_blank" rel="noreferrer"
            style={{ marginLeft:'auto', fontSize:'0.7rem', color:'var(--purple)', fontWeight:600, textDecoration:'none' }}>
            Test ↗
          </a>
        )}
      </label>
      <input
        className="f-input"
        value={form[k]}
        onChange={e => set(k, e.target.value)}
        placeholder={PLACEHOLDERS[k]}
      />
    </div>
  )

  function addImage(url) {
    if (!url) return
    setForm(f => ({ ...f, media_images: [...(f.media_images || []), { url, link: '' }] }))
  }
  function updateImageLink(i, link) {
    setForm(f => ({ ...f, media_images: f.media_images.map((im, idx) => idx === i ? { ...im, link } : im) }))
  }
  function removeImage(i) {
    setForm(f => ({ ...f, media_images: f.media_images.filter((_, idx) => idx !== i) }))
  }
  function addVideo() {
    setForm(f => ({ ...f, media_videos: [...(f.media_videos || []), { url: '', autoplay: true }] }))
  }
  function updateVideoUrl(i, url) {
    setForm(f => ({ ...f, media_videos: f.media_videos.map((v, idx) => idx === i ? { ...v, url } : v) }))
  }
  function updateVideoAutoplay(i, autoplay) {
    setForm(f => ({ ...f, media_videos: f.media_videos.map((v, idx) => idx === i ? { ...v, autoplay } : v) }))
  }
  function removeVideo(i) {
    setForm(f => ({ ...f, media_videos: f.media_videos.filter((_, idx) => idx !== i) }))
  }

  return (
    <>
      <div className="admin-content">
        <div className="links-grid">

          {loading ? <div className="loading">Loading…</div> : (
            <>
              <div className="links-col-left">
                {/* ── Order Links ── */}
                <Section title="Order & Review Buttons">
                  <p style={{ fontSize:'0.76rem', color:'var(--muted)', marginBottom:18 }}>
                    When a customer taps a button on the product page they'll open this link in a new tab.
                  </p>
                  <Field label="Zomato URL"          k="zomato_url" dot="#E84040"/>
                  <Field label="Swiggy URL"           k="swiggy_url" dot="#FC8019"/>
                  <Field label="Write a Review URL"   k="review_url" dot="#7B2CBF"/>
                </Section>

                {/* ── Footer Content ── */}
                <Section title="Footer Content">
                  <p style={{ fontSize:'0.76rem', color:'var(--muted)', marginBottom:18 }}>
                    These values appear in the footer across all pages. Leave a field blank to keep the default.
                  </p>
                  <Field label="Company Name"   k="footer_company"/>
                  <Field label="FSSAI Lic. No." k="footer_fssai"/>
                  <Field label="GST Number"     k="footer_gst"/>
                  <Field label="Phone 1"        k="footer_phone1"/>
                  <Field label="Phone 2"        k="footer_phone2"/>
                  <Field label="Email"          k="footer_email"/>
                </Section>

                <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth:140 }}>
                  {saving ? 'Saving…' : 'Save All'}
                </button>
              </div>

              <div className="links-col-right">
                {/* ── Media (images + video links) ── */}
                <Section title="Media — Images & Videos">
                  <p style={{ fontSize:'0.76rem', color:'var(--muted)', marginBottom:18 }}>
                    Images and videos shown in the home-page carousel. An image with a link
                    redirects when tapped; leave the link blank to show it as a plain image.
                  </p>

                  {/* Images */}
                  <div style={{ marginBottom:22 }}>
                    <div className="f-label" style={{ marginBottom:8 }}>Images</div>
                    {(form.media_images || []).length > 0 && (
                      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:10 }}>
                        {form.media_images.map((im, i) => (
                          <div key={i} style={{ display:'flex', gap:10, padding:10, border:'1px solid var(--border)', borderRadius:10, background:'#FAF9FE' }}>
                            <div style={{ position:'relative', width:72, height:72, flexShrink:0, borderRadius:8, overflow:'hidden', border:'1px solid var(--border)', background:'#fff' }}>
                              <img src={im.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                            </div>
                            <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:6 }}>
                              <label style={{ fontSize:'0.68rem', fontWeight:600, color:'var(--muted)' }}>
                                Link when tapped (optional)
                              </label>
                              <input
                                className="f-input"
                                value={im.link || ''}
                                onChange={e => updateImageLink(i, e.target.value)}
                                placeholder="https://… — leave blank for image only"
                              />
                            </div>
                            <button onClick={() => removeImage(i)} style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'#fff', color:'var(--danger)', fontSize:'1rem', cursor:'pointer', flexShrink:0, alignSelf:'flex-start' }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <ImageUpload value="" onChange={addImage}/>
                  </div>

                  {/* Video URLs */}
                  <div>
                    <div className="f-label" style={{ marginBottom:2, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span>Video URLs</span>
                      <button onClick={addVideo} style={{ background:'transparent', border:'1px dashed var(--purple)', color:'var(--purple)', borderRadius:8, padding:'4px 10px', fontSize:'0.72rem', fontWeight:600, cursor:'pointer' }}>+ Add Video</button>
                    </div>
                    <div style={{ fontSize:'0.7rem', color:'var(--muted)', marginBottom:10 }}>
                      Carousel size: 1920 × 810 px · ratio 64:27 (desktop) / 16:9 (mobile)
                    </div>
                    {(form.media_videos || []).length === 0 && (
                      <p style={{ fontSize:'0.72rem', color:'var(--muted)', margin:0 }}>No videos added.</p>
                    )}
                    {(form.media_videos || []).map((v, i) => (
                      <div key={i} style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:10, padding:10, border:'1px solid var(--border)', borderRadius:10, background:'#FAF9FE' }}>
                        <div style={{ display:'flex', gap:8 }}>
                          <input
                            className="f-input"
                            value={v.url}
                            onChange={e => updateVideoUrl(i, e.target.value)}
                            placeholder="https://youtube.com/... or video URL"
                            style={{ flex:1 }}
                          />
                          <button onClick={() => removeVideo(i)} style={{ width:38, height:38, borderRadius:8, border:'1px solid var(--border)', background:'#fff', color:'var(--danger)', fontSize:'1rem', cursor:'pointer', flexShrink:0 }}>×</button>
                        </div>
                        {/* Autoplay toggle */}
                        <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.75rem', color:'var(--muted)', cursor:'pointer', userSelect:'none' }}>
                          <input
                            type="checkbox"
                            checked={v.autoplay}
                            onChange={e => updateVideoAutoplay(i, e.target.checked)}
                            style={{ width:16, height:16, cursor:'pointer' }}
                          />
                          Autoplay on the home carousel
                          <span style={{ marginLeft:'auto', fontSize:'0.68rem', color: v.autoplay ? 'var(--success)' : 'var(--muted)', fontWeight:600 }}>
                            {v.autoplay ? 'ON — plays automatically' : 'OFF — show thumbnail + play button'}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            </>
          )}
        </div>
      </div>
      <div className={`admin-notif${notif ? ' show' : ''}`}>{notif}</div>
    </>
  )
}
