import { useNavigate } from 'react-router-dom'

const logoImg = '/logo.png'

/**
 * Shared page header — flat full-width nav bar.
 * Props:
 *   showBack  — show the ← button on the left side of the bar (default false)
 *   onBack    — override back action (default: navigate to '/')
 */
export default function Header({ showBack = false, onBack }) {
  const nav = useNavigate()
  const handleBack = onBack || (() => nav('/'))

  return (
    <nav className="hdr-nav">
      {/* Left slot — back button or spacer to balance the right slot */}
      <div className="hdr-nav-slot hdr-nav-slot-left">
        {showBack && (
          <button
            onClick={handleBack}
            className="hdr-back-btn"
            aria-label="Back"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="#4C1D95" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Centered logo */}
      <img src={logoImg} alt="FOFiTOS" className="hdr-logo-img" />

      {/* Right slot — empty, balances the left visually so the logo stays centered */}
      <div className="hdr-nav-slot hdr-nav-slot-right" />
    </nav>
  )
}
