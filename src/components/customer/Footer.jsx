import { useState, useEffect } from 'react'
import { sb } from '../../lib/supabase'

const DEFAULTS = {
  footer_company: 'Doctor Farmer Foods Private Limited',
  footer_fssai:   '12426023000520',
  footer_gst:     '33AAMCD2507N1ZJ',
  footer_phone1:  '+91 89258 41987',
  footer_phone2:  '+91 89258 41983',
  footer_email:   'doctorfarmerfoods@gmail.com',
}

export default function Footer() {
  const [d, setD] = useState(DEFAULTS)

  useEffect(() => {
    sb.from('links').select('footer_company,footer_fssai,footer_gst,footer_phone1,footer_phone2,footer_email')
      .eq('id', 'default').maybeSingle()
      .then(({ data }) => {
        if (data) setD(prev => ({
          footer_company: data.footer_company || prev.footer_company,
          footer_fssai:   data.footer_fssai   || prev.footer_fssai,
          footer_gst:     data.footer_gst     || prev.footer_gst,
          footer_phone1:  data.footer_phone1  || prev.footer_phone1,
          footer_phone2:  data.footer_phone2  || prev.footer_phone2,
          footer_email:   data.footer_email   || prev.footer_email,
        }))
      })
  }, [])

  const phone1Href = `tel:${d.footer_phone1.replace(/\s/g, '')}`
  const phone2Href = `tel:${d.footer_phone2.replace(/\s/g, '')}`

  const contactBlock = (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {(d.footer_phone1 || d.footer_phone2) && (
        <a href={phone1Href} style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
          </svg>
          <span style={{ fontSize:'0.73rem', color:'#aaa', fontWeight:400 }}>
            {d.footer_phone1}{d.footer_phone2 && <> &nbsp;·&nbsp; {d.footer_phone2}</>}
          </span>
        </a>
      )}
      {d.footer_email && (
        <a href={`mailto:${d.footer_email}`} style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <span style={{ fontSize:'0.73rem', color:'#aaa', fontWeight:400 }}>
            {d.footer_email}
          </span>
        </a>
      )}
    </div>
  )

  return (
    <div style={{
      margin: '24px 0 0',
      borderTop: '1px solid rgba(0,0,0,0.07)',
      background: 'transparent',
    }}>
      <div className="footer-inner">
      {/* ── Row: company left | contact right ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>

        {/* Company block */}
        <div>
          <div style={{ fontSize:'0.58rem', fontWeight:600, letterSpacing:'2px', textTransform:'uppercase', color:'#bbb', marginBottom:3 }}>
            A Product Of
          </div>
          <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#888', lineHeight:1.3, marginBottom:4 }}>
            {d.footer_company}
          </div>
          <div style={{ fontSize:'0.62rem', color:'#bbb', fontWeight:500, letterSpacing:'0.2px', lineHeight:1.6 }}>
            {d.footer_fssai && <>FSSAI Lic. No. {d.footer_fssai}<br /></>}
            {d.footer_gst   && <>GST {d.footer_gst}</>}
          </div>

          {/* Mobile only: contact below company */}
          <div className="footer-contact-mobile" style={{ marginTop:10 }}>
            {contactBlock}
          </div>
        </div>

        {/* Desktop only: contact right-aligned */}
        <div className="footer-contact-desktop" style={{ textAlign:'right' }}>
          {contactBlock}
        </div>
      </div>

      {/* Copyright */}
      <div style={{ fontSize:'0.58rem', color:'#ccc', textAlign:'center', letterSpacing:'0.3px', paddingTop:12, marginTop:14, borderTop:'1px solid rgba(0,0,0,0.06)' }}>
        © {new Date().getFullYear()} {d.footer_company}. All rights reserved.
      </div>

      <style>{`
        .footer-contact-mobile  { display: block; }
        .footer-contact-desktop { display: none !important; }
        @media (min-width: 768px) {
          .footer-contact-mobile  { display: none !important; }
          .footer-contact-desktop { display: block !important; }
        }
        .footer-inner {
          padding: 16px 16px 28px;
        }
        @media (min-width: 900px) {
          .footer-inner {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px 120px 36px;
          }
        }
      `}</style>
      </div>
    </div>
  )
}
