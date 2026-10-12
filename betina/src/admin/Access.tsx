import { useState } from 'react'
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { AdminCtx } from './AdminApp'
import type { Host } from '../lib/types'
import { HOST_LABEL, STATUS_LABEL } from '../lib/types'
import Icon from '../lib/Icon'
import { download, exportBackup } from './ops'
import { isFreeChild } from './stats'

export default function Access({ admins, user, invites, guests, settings }: AdminCtx) {
  const [newAdmin, setNewAdmin] = useState('')
  const [newHost, setNewHost] = useState<Host>('luiza')
  const [busy, setBusy] = useState(false)

  const addAdmin = async () => {
    const email = newAdmin.trim().toLowerCase()
    if (!email.includes('@')) return
    await setDoc(doc(db, 'admins', email), { host: newHost, addedBy: user.email, at: serverTimestamp() })
    setNewAdmin('')
  }

  const backup = async () => {
    setBusy(true)
    try {
      const data = await exportBackup()
      download(`betina-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json')
    } finally {
      setBusy(false)
    }
  }

  const csv = () => {
    const inv = new Map(invites.map((i) => [i.id, i]))
    const rows = [['Convite', 'Nome', 'De', 'Reserva', 'Criança', 'Idade', 'Paga', 'Status', 'Respondido por', 'Telefone', 'Enviado em']]
    for (const g of guests.filter((x) => !x.removed)) {
      const i = inv.get(g.inviteId)
      if (!i || i.archived) continue
      rows.push([
        i.label, g.name, HOST_LABEL[g.host], i.reserve ? 'sim' : '', g.isChild ? 'sim' : '', g.age == null ? '' : String(g.age),
        isFreeChild(g, settings) ? 'não' : 'sim', STATUS_LABEL[g.status], g.respondedBy ?? '', i.memberPhones?.[g.id] || i.phone || '',
        i.sentAt ? i.sentAt.toDate().toLocaleDateString('pt-BR') : '',
      ])
    }
    const body = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
    download('convidados-betina.csv', '﻿' + body, 'text/csv')
  }

  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Acesso e backup</h1>
          <p>Quem pode entrar no painel e cópias de segurança dos dados.</p>
        </div>
      </div>
      <div className="ad-cols">
        <div className="ad-card">
          <div className="ad-card-head">
            <h3>Administradores</h3>
          </div>
          <div className="ad-actions">
            {admins.map((a) => (
              <div key={a.email} className="ad-action" style={{ cursor: 'default' }}>
                <span className="ic"><Icon name="shield" size={16} /></span>
                <div>
                  <b>{a.email}</b>
                  <small>{a.email === user.email ? 'Você' : 'Administrador'}</small>
                </div>
                <select className="ad-select" style={{ width: 120 }} value={a.host ?? ''} onChange={(e) => setDoc(doc(db, 'admins', a.email), { host: e.target.value || null }, { merge: true })}>
                  <option value="">—</option>
                  <option value="gabriel">Gabriel</option>
                  <option value="luiza">Luiza</option>
                </select>
                {a.email !== user.email && (
                  <button className="ad-icon-btn" aria-label={`Remover ${a.email}`} onClick={() => confirm(`Remover ${a.email}?`) && deleteDoc(doc(db, 'admins', a.email))}>
                    <Icon name="x" size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="ad-row" style={{ marginTop: 12, flexWrap: 'nowrap' }}>
            <input className="ad-input" placeholder="email@gmail.com" value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} />
            <select className="ad-select" style={{ width: 120 }} value={newHost} onChange={(e) => setNewHost(e.target.value as Host)}>
              <option value="gabriel">Gabriel</option>
              <option value="luiza">Luiza</option>
            </select>
            <button className="ad-btn primary" onClick={addAdmin}>Adicionar</button>
          </div>
        </div>
        <div className="ad-card">
          <div className="ad-card-head">
            <h3>Backup</h3>
          </div>
          <p style={{ margin: '0 0 12px', color: 'var(--muted)' }}>
            O histórico de respostas nunca é apagado. Mesmo assim, baixe uma cópia completa de vez em quando.
          </p>
          <div className="ad-row">
            <button className="ad-btn" onClick={backup} disabled={busy}><Icon name="download" size={16} /> Backup completo (JSON)</button>
            <button className="ad-btn" onClick={csv}><Icon name="download" size={16} /> Planilha (Excel)</button>
          </div>
        </div>
      </div>
    </>
  )
}
