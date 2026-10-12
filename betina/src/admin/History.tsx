import { useState } from 'react'
import type { AdminCtx } from './AdminApp'
import { STATUS_LABEL } from '../lib/types'
import { normalize } from '../lib/text'

export default function History({ logs }: AdminCtx) {
  const [q, setQ] = useState('')
  const list = logs.filter((l) => !q || normalize(`${l.guestName} ${l.by}`).includes(normalize(q)))
  return (
    <>
      <div className="ad-head">
        <h1>Histórico</h1>
        <input className="ad-input" style={{ maxWidth: 260 }} placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <p style={{ color: 'var(--muted)', marginTop: -6 }}>
        Toda resposta fica registrada aqui para sempre — ninguém consegue apagar ou editar este histórico.
      </p>
      <div className="ad-scroll">
        <table className="ad-table">
          <thead>
            <tr><th>Quando</th><th>Pessoa</th><th>Resposta</th><th>Quem respondeu</th><th>Por</th></tr>
          </thead>
          <tbody>
            {list.map((l) => (
              <tr key={l.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{l.at?.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td><b>{l.guestName}</b>{l.age != null && <small> · {l.age}a</small>}</td>
                <td><span className={`ad-tag st-${l.status}`}>{STATUS_LABEL[l.status]}</span></td>
                <td>{l.by}</td>
                <td>{l.source === 'admin' ? 'Painel' : 'Site'}</td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={5} className="ad-empty">Nada por aqui ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
