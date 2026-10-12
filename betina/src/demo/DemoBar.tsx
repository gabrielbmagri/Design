import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { __resetDemo } from './firestore'

export default function DemoBar() {
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const isAdmin = useLocation().pathname.startsWith('/admin')
  const style: React.CSSProperties = {
    position: 'fixed', top: 8, right: 8, zIndex: 999, fontFamily: 'Nunito, sans-serif', fontSize: 13,
    fontWeight: 800, background: 'rgba(75,43,42,.92)', color: '#fff', borderRadius: 14, padding: open ? 12 : '6px 12px',
    boxShadow: '0 6px 20px rgba(0,0,0,.25)', display: 'grid', gap: 8, maxWidth: 260,
  }
  const btn: React.CSSProperties = { border: 0, borderRadius: 10, padding: '8px 10px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }
  return (
    <div style={style}>
      <button style={{ ...btn, background: 'transparent', color: '#fff', padding: 0 }} onClick={() => setOpen(!open)}>
        🧪 Demonstração {open ? '▴' : '▾'}
      </button>
      {open && (
        <>
          <span style={{ fontWeight: 600 }}>Dados de exemplo, salvos só neste navegador. Experimente digitar "Maria", "Ana" ou "Vó Lourdes".</span>
          <button style={{ ...btn, background: '#fff', color: '#4b2b2a' }} onClick={() => { nav(isAdmin ? '/' : '/admin'); setOpen(false); window.scrollTo(0, 0) }}>
            {isAdmin ? 'Ver site do convidado' : 'Ver painel admin'}
          </button>
          <button
            style={{ ...btn, background: '#d92f74', color: '#fff' }}
            onClick={() => {
              __resetDemo()
              try { localStorage.removeItem('betina.me') } catch { /* ignore */ }
              location.reload()
            }}
          >
            Recomeçar do zero
          </button>
        </>
      )}
    </div>
  )
}
