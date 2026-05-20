import { useState, useRef, useEffect } from 'react'

/**
 * Custom-styled dropdown — replaces the native <select> so it matches the app UI.
 *
 * Props:
 *   value        — current selected value
 *   options      — array of { value, label } objects, or array of strings
 *   onChange     — (value) => void
 *   placeholder  — text shown when nothing is selected
 *   style        — extra styles for the outer wrapper (e.g. a fixed width)
 */
export default function Dropdown({ value, options = [], onChange, placeholder = 'Select…', style }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const opts = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o))
  const selected = opts.find(o => String(o.value) === String(value))

  // Close on outside click
  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="dd" ref={ref} style={style}>
      <button
        type="button"
        className={`dd-trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className={selected ? 'dd-val' : 'dd-placeholder'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className="dd-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="dd-panel">
          {opts.map(o => {
            const isSel = String(o.value) === String(value)
            return (
              <button
                type="button"
                key={String(o.value)}
                className={`dd-option${isSel ? ' is-selected' : ''}`}
                onClick={() => { onChange(o.value); setOpen(false) }}
              >
                <span>{o.label}</span>
                {isSel && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
