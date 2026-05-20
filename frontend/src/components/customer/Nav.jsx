import { useNavigate } from 'react-router-dom'

export default function Nav({ back }) {
  const nav = useNavigate()
  return (
    <div className="top-nav">
      {back ? (
        <button className="nav-back" onClick={() => nav(back)}>←</button>
      ) : (
        <div style={{ width: 36 }} />
      )}
      <div className="nav-logo">FOFiTOS</div>
      <div style={{ width: 36 }} />
    </div>
  )
}
