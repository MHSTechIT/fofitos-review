/**
 * ON/OFF pill toggle — when OFF, the item is hidden from customers.
 *   on       — boolean, current state
 *   onClick  — () => void, flips the state
 */
export default function StatusToggle({ on, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={on
        ? 'Visible to customers — click to hide'
        : 'Hidden from customers — click to show'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 12px', borderRadius: 50, border: 'none',
        cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem',
        background: on ? '#2CB67D' : '#D1D5DB',
        color:      on ? '#fff'    : '#6B7280',
        transition: 'background 0.2s, color 0.2s',
      }}
    >
      <span style={{
        width: 10, height: 10, borderRadius: '50%',
        background: on ? '#fff' : '#9CA3AF',
        display: 'inline-block', flexShrink: 0,
      }}/>
      {on ? 'ON' : 'OFF'}
    </button>
  )
}
