import { useEffect, useMemo, useState } from 'react'
import type { AdminCtx } from './AdminApp'
import type { Host, Status } from '../lib/types'
import { HOST_LABEL, STATUS_LABEL } from '../lib/types'
import { guestName, normalize } from '../lib/text'
import Icon from '../lib/Icon'
import { setGuestStatus } from './ops'
import { isFreeChild } from './stats'

type SF = 'all' | 'yes' | 'no' | 'open'

export default function People({ stats, settings, user, filter }: AdminCtx) {
  const [st, setSt] = useState<SF>('all')
  const [host, setHost] = useState<Host | ''>('')
  const [kind, setKind] = useState<'' | 'adult' | 'kid'>('')
  const [q, setQ] = useState('')
  useEffect(() => {
    if (filter === 'yes' || filter === 'no' || filter === 'open') setSt(filter)
  }, [filter])
  const by = user.displayName || user.email || 'admin'

  const list = useMemo(() => {
    const nq = normalize(q)
    return stats.invited
      .filter((g) => {
        if (st === 'yes' && g.status !== 'yes') return false
        if (st === 'no' && g.status !== 'no') return false
        if (st === 'open' && g.status !== 'pending' && g.status !== 'maybe') return false
        if (host && g.host !== host) return false
        if (kind === 'adult' && g.isChild) return false
        if (kind === 'kid' && !g.isChild) return false
        if (nq && !normalize(`${guestName(g)} ${g.inviteLabel}`).includes(nq)) return false
        return true
      })
      .sort((a, b) => guestName(a).localeCompare(guestName(b), 'pt-BR'))
  }, [stats.invited, st, host, kind, q])

  const chip = <T extends string>(cur: T, set: (v: T) => void, v: T, label: string) => (
    <button key={v} className={`ad-chip ${cur === v ? 'on' : ''}`} onClick={() => set(v)}>{label}</button>
  )

  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Pessoas</h1>
          <p>Todos os convidados, um por linha. Mude a resposta direto na tabela.</p>
        </div>
      </div>
      <div className="ad-filters">
        <label className="ad-search">
          <Icon name="search" size={16} />
          <input className="ad-input" placeholder="Buscar pessoa ou convite" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        {chip(st, setSt, 'all', 'Todas')}
        {chip(st, setSt, 'open', 'Sem resposta')}
        {chip(st, setSt, 'yes', 'Confirmadas')}
        {chip(st, setSt, 'no', 'Não vão')}
        <span style={{ width: 8 }} />
        {chip(host, setHost, '', 'Gabriel e Luiza')}
        {chip(host, setHost, 'gabriel', 'Gabriel')}
        {chip(host, setHost, 'luiza', 'Luiza')}
        <span style={{ width: 8 }} />
        {chip(kind, setKind, '', 'Todos')}
        {chip(kind, setKind, 'adult', 'Adultos')}
        {chip(kind, setKind, 'kid', 'Crianças')}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 8px' }}>{list.length} pessoas</p>
      <div className="ad-scroll">
        <table className="ad-table">
          <thead>
            <tr><th>Nome</th><th>Convite</th><th>De</th><th>Tipo</th><th>Resposta</th><th>Respondido por</th></tr>
          </thead>
          <tbody>
            {list.map((g) => (
              <tr key={g.id}>
                <td><b style={{ fontWeight: 600 }}>{guestName(g)}</b></td>
                <td style={{ color: 'var(--muted)' }}>{g.inviteLabel}</td>
                <td><span className={`ad-tag ${g.host}`}>{HOST_LABEL[g.host]}</span></td>
                <td>{g.isPlusOne ? 'Acompanhante' : g.isChild ? `Criança${g.age != null ? `, ${g.age}a` : ''}${isFreeChild(g, settings) ? ' · não paga' : ''}` : 'Adulto'}</td>
                <td>
                  <select className={`ad-select st-${g.status}`} style={{ height: 30, width: 150, fontWeight: 700, fontSize: 12, border: 0 }} value={g.status} onChange={(e) => setGuestStatus(g, e.target.value as Status, by)}>
                    {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </td>
                <td style={{ color: 'var(--muted)' }}>{g.respondedBy ?? '—'}</td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={6} className="ad-empty">Ninguém com esses filtros.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
