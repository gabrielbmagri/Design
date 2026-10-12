import { useEffect, useState } from 'react'
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { AdminCtx } from './AdminApp'
import type { EventSettings } from '../lib/types'
import { HOST_LABEL, STATUS_LABEL } from '../lib/types'
import { download, exportBackup, saveSettings } from './ops'
import { isFreeChild } from './stats'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="ad-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export default function SettingsView({ settings, admins, user, invites, guests }: AdminCtx) {
  const [s, setS] = useState<EventSettings>(settings)
  const [dirty, setDirty] = useState(false)
  const [msg, setMsg] = useState('')
  const [newAdmin, setNewAdmin] = useState('')

  useEffect(() => {
    if (!dirty) setS(settings)
  }, [settings, dirty])

  const set = <K extends keyof EventSettings>(k: K, v: EventSettings[K]) => {
    setS((x) => ({ ...x, [k]: v }))
    setDirty(true)
  }
  const text = (k: keyof EventSettings, type = 'text') => (
    <input className="ad-input" type={type} value={String(s[k] ?? '')} onChange={(e) => set(k, (type === 'number' ? Number(e.target.value) : e.target.value) as never)} />
  )
  const area = (k: keyof EventSettings, rows = 3) => (
    <textarea className="ad-textarea" rows={rows} value={String(s[k] ?? '')} onChange={(e) => set(k, e.target.value as never)} />
  )

  const save = async () => {
    await saveSettings(s)
    setDirty(false)
    setMsg('Salvo! O site já está atualizado.')
    setTimeout(() => setMsg(''), 3000)
  }

  const backup = async () => {
    const data = await exportBackup()
    download(`betina-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json')
  }

  const csv = () => {
    const inv = new Map(invites.map((i) => [i.id, i]))
    const rows = [['Convite', 'Nome', 'De', 'Reserva', 'Criança', 'Idade', 'Paga', 'Status', 'Respondido por', 'Telefone', 'Enviado em']]
    for (const g of guests.filter((x) => !x.removed)) {
      const i = inv.get(g.inviteId)
      if (!i || i.archived) continue
      rows.push([
        i.label, g.name, HOST_LABEL[g.host], i.reserve ? 'sim' : '', g.isChild ? 'sim' : '', g.age == null ? '' : String(g.age),
        isFreeChild(g, s) ? 'não' : 'sim', STATUS_LABEL[g.status], g.respondedBy ?? '', i.memberPhones?.[g.id] || i.phone || '',
        i.sentAt ? i.sentAt.toDate().toLocaleDateString('pt-BR') : '',
      ])
    }
    const body = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
    download('convidados-betina.csv', '﻿' + body, 'text/csv')
  }

  const addAdmin = async () => {
    const email = newAdmin.trim().toLowerCase()
    if (!email.includes('@')) return
    await setDoc(doc(db, 'admins', email), { addedBy: user.email, at: serverTimestamp() })
    setNewAdmin('')
  }

  return (
    <>
      <div className="ad-head">
        <h1>Festa</h1>
        <div className="ad-row">
          {msg && <span style={{ color: '#1d6b47', fontWeight: 800 }}>{msg}</span>}
          <button className="ad-btn primary" disabled={!dirty} onClick={save}>Salvar alterações</button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        <div className="ad-card" style={{ display: 'grid', gap: 10 }}>
          <h3>Informações</h3>
          <Field label="Título">{text('title')}</Field>
          <Field label="Frase de abertura">{text('subtitle')}</Field>
          <div className="ad-grid">
            <Field label="Data">{text('dateISO', 'date')}</Field>
            <Field label="Começa">{text('timeStart', 'time')}</Field>
            <Field label="Termina">{text('timeEnd', 'time')}</Field>
            <Field label="Prazo de confirmação">{text('rsvpDeadlineISO', 'date')}</Field>
          </div>
          <Field label="Nome do salão">{text('venueName')}</Field>
          <Field label="Endereço completo">{text('address')}</Field>
          <div className="ad-grid">
            <Field label="Link do Google Maps (opcional)">{text('mapsUrl')}</Field>
            <Field label="Link do Waze (opcional)">{text('wazeUrl')}</Field>
          </div>
          <Field label="Traje (opcional)">{text('dressCode')}</Field>
          <Field label="WhatsApp da família (botão 'Falar com a família')">{text('hostsPhone')}</Field>
          <label className="ad-row" style={{ fontWeight: 700 }}>
            <input type="checkbox" checked={s.rsvpOpen} onChange={(e) => set('rsvpOpen', e.target.checked)} /> Confirmações abertas no site
          </label>
        </div>

        <div className="ad-card" style={{ display: 'grid', gap: 10 }}>
          <h3>Regras</h3>
          <div className="ad-grid">
            <Field label="Limite por anfitrião">{text('capPerHost', 'number')}</Field>
            <Field label="Criança não paga até (anos)">{text('childFreeMaxAge', 'number')}</Field>
            <Field label="Lembrar após (dias)">{text('reminderDays', 'number')}</Field>
          </div>
        </div>

        <div className="ad-card" style={{ display: 'grid', gap: 10 }}>
          <h3>Mensagens</h3>
          <Field label="Depois de confirmar">{area('welcomeYes', 2)}</Field>
          <Field label="Depois de recusar">{area('welcomeNo', 2)}</Field>
          <Field label="Depois de 'ainda não sei'">{area('welcomeMaybe', 2)}</Field>
          <div className="ad-note">
            Variáveis do WhatsApp: <code>{'{nome} {crianca} {data} {hora} {local} {endereco} {prazo} {link}'}</code>
          </div>
          <Field label="Mensagem do convite (WhatsApp)">{area('inviteMessage', 8)}</Field>
          <Field label="Mensagem de lembrete (WhatsApp)">{area('reminderMessage', 7)}</Field>
        </div>

        <div className="ad-card" style={{ display: 'grid', gap: 10 }}>
          <Field label="Imagem do convite">{text('inviteImage')}</Field>
          <h3>Fotos do carrossel (endereços)</h3>
          <textarea className="ad-textarea" rows={5} value={s.carousel.join('\n')} onChange={(e) => set('carousel', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))} />
          <h3>História (uma foto + texto por capítulo)</h3>
          {s.story.map((c, i) => (
            <div key={i} className="ad-member">
              <input className="ad-input" placeholder="/photos/foto.jpg" value={c.photo} onChange={(e) => set('story', s.story.map((x, k) => (k === i ? { ...x, photo: e.target.value } : x)))} />
              <button className="ad-btn sm danger" onClick={() => set('story', s.story.filter((_, k) => k !== i))}>✕</button>
              <textarea className="ad-textarea" style={{ gridColumn: '1 / -1', minHeight: 60 }} value={c.text} onChange={(e) => set('story', s.story.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))} />
            </div>
          ))}
          <button className="ad-btn" onClick={() => set('story', [...s.story, { photo: '', text: '' }])}>+ Capítulo</button>
        </div>

        <div className="ad-card" style={{ display: 'grid', gap: 10 }}>
          <h3>Sugestões de presente</h3>
          <Field label="Texto">{area('giftNote', 2)}</Field>
          {s.gifts.map((g, i) => (
            <div key={i} className="ad-member" style={{ gridTemplateColumns: '1fr 1fr 1fr auto' }}>
              <input className="ad-input" placeholder="Presente" value={g.title} onChange={(e) => set('gifts', s.gifts.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} />
              <input className="ad-input" placeholder="Detalhe (tamanho…)" value={g.detail ?? ''} onChange={(e) => set('gifts', s.gifts.map((x, k) => (k === i ? { ...x, detail: e.target.value } : x)))} />
              <input className="ad-input" placeholder="Link (opcional)" value={g.link ?? ''} onChange={(e) => set('gifts', s.gifts.map((x, k) => (k === i ? { ...x, link: e.target.value } : x)))} />
              <button className="ad-btn sm danger" onClick={() => set('gifts', s.gifts.filter((_, k) => k !== i))}>✕</button>
            </div>
          ))}
          <button className="ad-btn" onClick={() => set('gifts', [...s.gifts, { title: '' }])}>+ Presente</button>
          <Field label="Chave Pix (opcional)">{text('pix')}</Field>
        </div>

        <div className="ad-card" style={{ display: 'grid', gap: 10 }}>
          <h3>Administradores</h3>
          {admins.map((a) => (
            <div key={a} className="ad-row">
              <span style={{ flex: 1 }}>{a}</span>
              {a !== user.email && <button className="ad-btn sm danger" onClick={() => confirm(`Remover ${a}?`) && deleteDoc(doc(db, 'admins', a))}>Remover</button>}
            </div>
          ))}
          <div className="ad-row">
            <input className="ad-input" style={{ flex: 1 }} placeholder="email@gmail.com da Luiza" value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} />
            <button className="ad-btn" onClick={addAdmin}>Adicionar</button>
          </div>
        </div>

        <div className="ad-card" style={{ display: 'grid', gap: 10 }}>
          <h3>Backup</h3>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Baixe uma cópia completa (convites, convidados e histórico). Recomendado uma vez por semana.
          </p>
          <div className="ad-row">
            <button className="ad-btn" onClick={backup}>Baixar backup (JSON)</button>
            <button className="ad-btn" onClick={csv}>Baixar planilha (CSV/Excel)</button>
          </div>
        </div>
      </div>
    </>
  )
}
