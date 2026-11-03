import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { __resetDemo } from './firestore'
import { PRESETS } from '../lib/presets'
import { PRESET_KEY, currentPreset } from './seed'
import { THEMES } from '../themes'
import { demoLogin } from './auth'

export default function DemoBar() {
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const loc = useLocation().pathname
  const isAdmin = loc.startsWith('/admin')
  const isSuper = loc.startsWith('/super')
  const cur = currentPreset()
  const style: React.CSSProperties = {
    position: 'fixed', top: 8, right: 8, zIndex: 999, fontFamily: 'Nunito, system-ui, sans-serif', fontSize: 13,
    fontWeight: 800, background: 'rgba(30,30,40,.92)', color: '#fff', borderRadius: 14, padding: open ? 12 : '6px 12px',
    boxShadow: '0 6px 20px rgba(0,0,0,.25)', display: 'grid', gap: 8, maxWidth: 280,
  }
  const btn: React.CSSProperties = { border: 0, borderRadius: 10, padding: '8px 10px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }
  const pick = (id: string) => {
    __resetDemo()
    try { localStorage.setItem(PRESET_KEY, id); localStorage.removeItem('convite.me') } catch { /* ignore */ }
    location.reload()
  }
  return (
    <div style={style}>
      <button style={{ ...btn, background: 'transparent', color: '#fff', padding: 0 }} onClick={() => setOpen(!open)}>
        🧪 Demonstração · {cur.label} {open ? '▴' : '▾'}
      </button>
      {open && (
        <>
          <span style={{ fontWeight: 600 }}>Dados de exemplo, salvos só neste navegador. Experimente digitar "Maria", "Ana" ou "Vó Lourdes".</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {PRESETS.map((p) => {
              const t = THEMES.find((x) => x.id === p.settings.themeId)!
              return (
                <button key={p.id} onClick={() => pick(p.id)} style={{ ...btn, background: cur.id === p.id ? '#fff' : 'rgba(255,255,255,.14)', color: cur.id === p.id ? '#222' : '#fff', display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 6, background: t.swatch[0], flex: 'none' }} />
                  {p.label}
                </button>
              )
            })}
          </div>
          <button style={{ ...btn, background: '#fff', color: '#222' }} onClick={() => { nav('/'); setOpen(false); window.scrollTo(0, 0) }}>
            Ver site do convidado
          </button>
          <button style={{ ...btn, background: '#fff', color: '#222' }} onClick={() => { demoLogin(); nav('/admin'); setOpen(false); window.scrollTo(0, 0) }}>
            Ver painel do cliente
          </button>
          <button style={{ ...btn, background: '#fff', color: '#222' }} onClick={() => { demoLogin(); nav('/super'); setOpen(false); window.scrollTo(0, 0) }}>
            Ver meu painel (dono)
          </button>
          <button
            style={{ ...btn, background: '#d92f74', color: '#fff' }}
            onClick={() => pick(cur.id)}
          >
            Recomeçar do zero
          </button>
          {(isAdmin || isSuper) && <span style={{ fontWeight: 600, opacity: 0.8 }}>Você está no painel.</span>}
        </>
      )}
    </div>
  )
}
