import { useState } from 'react'
import type { AdminCtx } from './AdminApp'
import type { Guest } from '../lib/types'
import { HOST_LABEL, STATUS_LABEL } from '../lib/types'
import { setGuestAge } from './ops'
import { isFreeChild } from './stats'

function AgeInput({ g }: { g: Guest }) {
  const [v, setV] = useState(g.age == null ? '' : String(g.age))
  return (
    <input
      className="ad-input"
      style={{ width: 80 }}
      type="number"
      min={0}
      max={17}
      value={v}
      placeholder="?"
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        const n = v === '' ? null : Math.max(0, Math.min(17, Number(v)))
        if (n !== g.age) setGuestAge(g, n)
      }}
    />
  )
}

export default function Kids({ stats, settings }: AdminCtx) {
  const [only, setOnly] = useState<'all' | 'free' | 'paying' | 'noage'>('all')
  const kids = stats.kids
    .filter((g) => {
      if (only === 'free') return isFreeChild(g, settings)
      if (only === 'paying') return g.age != null && !isFreeChild(g, settings)
      if (only === 'noage') return g.age == null
      return true
    })
    .sort((a, b) => (a.age ?? 99) - (b.age ?? 99))

  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Crianças</h1>
          <p>Base das lembrancinhas e de quem não paga (até {settings.childFreeMaxAge} anos).</p>
        </div>
      </div>
      <div className="ad-grid" style={{ marginBottom: 14 }}>
        <div className="ad-card ad-kpi"><div className="n">{stats.kidsGoing.length}</div><div className="l">Lembrancinhas (confirmadas)</div><div className="s">{stats.kidsExpected.length} se todos vierem</div></div>
        <div className="ad-card ad-kpi"><div className="n">{stats.kidsFree.length}</div><div className="l">Até {settings.childFreeMaxAge} anos (não pagam)</div></div>
        <div className="ad-card ad-kpi"><div className="n">{stats.kidsExpected.length - stats.kidsFree.length - stats.kidsNoAge.length}</div><div className="l">Acima de {settings.childFreeMaxAge} anos (pagam)</div></div>
        <div className="ad-card ad-kpi"><div className="n">{stats.kidsNoAge.length}</div><div className="l">Sem idade</div><div className="s">o convidado é perguntado ao confirmar</div></div>
      </div>
      <div className="ad-filters">
        {([['all', 'Todas'], ['free', `Até ${settings.childFreeMaxAge} anos`], ['paying', 'Pagantes'], ['noage', 'Sem idade']] as const).map(([id, l]) => (
          <button key={id} className={`ad-chip ${only === id ? 'on' : ''}`} onClick={() => setOnly(id)}>{l}</button>
        ))}
      </div>
      <div className="ad-scroll">
        <table className="ad-table">
          <thead>
            <tr><th>Criança</th><th>Idade</th><th>Convite</th><th>De</th><th>Status</th><th>Conta?</th></tr>
          </thead>
          <tbody>
            {kids.map((g) => (
              <tr key={g.id}>
                <td><b>{g.name}</b></td>
                <td><AgeInput key={`${g.id}-${g.age}`} g={g} />{g.ageFromGuest && <small style={{ color: 'var(--muted)' }}> informada pelo convidado</small>}</td>
                <td>{g.inviteLabel}</td>
                <td><span className={`ad-tag ${g.host}`}>{HOST_LABEL[g.host]}</span></td>
                <td><span className={`ad-tag st-${g.status}`}>{STATUS_LABEL[g.status]}</span></td>
                <td>{g.age == null ? '?' : isFreeChild(g, settings) ? 'Não paga' : 'Paga'}</td>
              </tr>
            ))}
            {!kids.length && <tr><td colSpan={6} className="ad-empty">Nenhuma criança aqui.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
