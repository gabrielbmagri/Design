import { useEffect, useState } from 'react'
import type { AdminCtx } from './AdminApp'
import type { EventSettings } from '../lib/types'
import { saveSettings } from './ops'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="ad-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

const SUBS = [
  ['info', 'Informações'],
  ['mensagens', 'Textos e WhatsApp'],
  ['fotos', 'Fotos e história'],
  ['presentes', 'Presentes'],
  ['regras', 'Regras'],
] as const

export default function SettingsView({ settings }: AdminCtx) {
  const [sub, setSub] = useState<(typeof SUBS)[number][0]>('info')
  const [s, setS] = useState<EventSettings>(settings)
  const [dirty, setDirty] = useState(false)
  const [msg, setMsg] = useState('')

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







  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Festa</h1>
          <p>O que aparece no site e nas mensagens. Salve para publicar na hora.</p>
        </div>
        <div className="ad-row">
          {msg && <span style={{ color: '#1d6b47', fontWeight: 800 }}>{msg}</span>}
          <button className="ad-btn primary" disabled={!dirty} onClick={save}>Salvar alterações</button>
        </div>
      </div>

      <nav className="ad-subtabs">
        {SUBS.map(([id, l]) => (
          <button key={id} className={sub === id ? 'on' : ''} onClick={() => setSub(id)}>{l}</button>
        ))}
      </nav>
      <div style={{ display: 'grid', gap: 14 }}>
        {sub === 'info' && (
        <div className="ad-card" style={{ display: 'grid', gap: 10 }}>
          <h3>Informações</h3>
          <Field label="Título">{text('title')}</Field>
          <Field label="Frase do convite">{text('subtitle')}</Field>
          <div className="ad-grid">
            <Field label="Data">{text('dateISO', 'date')}</Field>
            <Field label="Observação do dia (ex.: feriado)">{text('dateNote')}</Field>
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
          <div className="ad-grid">
            <Field label="WhatsApp do Gabriel">{text('gabrielPhone')}</Field>
            <Field label="WhatsApp da Luiza">{text('luizaPhone')}</Field>
          </div>
          <Field label="Busca do mapa embutido (nome do lugar + endereço)">{text('mapsQuery')}</Field>
          <label className="ad-row" style={{ fontWeight: 700 }}>
            <input type="checkbox" checked={s.rsvpOpen} onChange={(e) => set('rsvpOpen', e.target.checked)} /> Confirmações abertas no site
          </label>
        </div>
        )}

        {sub === 'regras' && (
        <div className="ad-card" style={{ display: 'grid', gap: 10 }}>
          <h3>Regras</h3>
          <div className="ad-grid">
            <Field label="Limite por anfitrião">{text('capPerHost', 'number')}</Field>
            <Field label="Criança não paga até (anos)">{text('childFreeMaxAge', 'number')}</Field>
            <Field label="Lembrar após (dias)">{text('reminderDays', 'number')}</Field>
          </div>
        </div>
        )}

        {sub === 'mensagens' && (
        <div className="ad-card" style={{ display: 'grid', gap: 10 }}>
          <h3>Mensagens</h3>
          <Field label="Depois de confirmar">{area('welcomeYes', 2)}</Field>
          <Field label="Depois de recusar">{area('welcomeNo', 2)}</Field>
          <Field label="Depois de 'ainda não sei'">{area('welcomeMaybe', 2)}</Field>
          <div className="ad-note">
            Variáveis do WhatsApp: <code>{'{nome} {crianca} {data} {hora} {local} {endereco} {prazo} {link} {anfitriao} {convidados} {pessoas} {contagem} {linkContagem}'}</code>
          </div>
          <Field label="Mensagem do convite (WhatsApp)">{area('inviteMessage', 8)}</Field>
          <Field label="Mensagem de lembrete (WhatsApp)">{area('reminderMessage', 7)}</Field>
          <Field label="Mensagem de último dia (WhatsApp)">{area('lastCallMessage', 8)}</Field>
          <Field label="Mensagem de confirmação pendente (WhatsApp)">{area('pendingMessage', 9)}</Field>
          <Field label="Mensagem da contagem regressiva (WhatsApp)">{area('countdownMessage', 12)}</Field>
        </div>
        )}

        {sub === 'fotos' && (
        <div className="ad-card" style={{ display: 'grid', gap: 10 }}>
          <Field label="Imagem do convite">{text('inviteImage')}</Field>
          <Field label="Foto de capa da história (topo da imersão)">{text('heroPhoto')}</Field>
          <h3>Fotos do carrossel (uma por linha)</h3>
          <textarea className="ad-textarea" rows={5} value={s.carousel.join('\n')} onChange={(e) => set('carousel', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))} />
          <h3>Linha do tempo (título, foto e texto de cada momento)</h3>
          <Field label="Frase de abertura da história">{text('introText')}</Field>
          <Field label="Nascimento (para o contador de dias vividos)">{text('birthISO', 'datetime-local')}</Field>
          {s.story.map((c, i) => (
            <div key={i} className="ad-member">
              <input className="ad-input" placeholder="Título do momento (ex.: Os primeiros sorrisos)" value={c.label ?? ''} onChange={(e) => set('story', s.story.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} style={{ gridColumn: '1 / -1' }} />
              <input className="ad-input" placeholder="/photos/foto.jpg" value={c.photo} onChange={(e) => set('story', s.story.map((x, k) => (k === i ? { ...x, photo: e.target.value } : x)))} />
              <button className="ad-btn sm danger" onClick={() => set('story', s.story.filter((_, k) => k !== i))}>✕</button>
              <textarea className="ad-textarea" style={{ gridColumn: '1 / -1', minHeight: 60 }} value={c.text} onChange={(e) => set('story', s.story.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))} />
            </div>
          ))}
          <button className="ad-btn" onClick={() => set('story', [...s.story, { label: '', photo: '', text: '' }])}>+ Momento</button>
          <h3 style={{ marginTop: 10 }}>Carta para os convidados</h3>
          <Field label="Texto (aparece com 'Para {nome do convidado},')">{area('letter', 5)}</Field>
          <Field label="Assinatura">{text('letterSign')}</Field>
        </div>
        )}

        {sub === 'presentes' && (
        <div className="ad-card" style={{ display: 'grid', gap: 10 }}>
          <h3>Sugestões de presente</h3>
          <Field label="Texto">{area('giftNote', 2)}</Field>
          {s.gifts.map((g, i) => (
            <div key={i} className="ad-member" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr auto' }}>
              <input className="ad-input" placeholder="Grupo (ex.: Betina adora)" value={g.group ?? ''} onChange={(e) => set('gifts', s.gifts.map((x, k) => (k === i ? { ...x, group: e.target.value } : x)))} />
              <input className="ad-input" placeholder="Presente" value={g.title} onChange={(e) => set('gifts', s.gifts.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} />
              <input className="ad-input" placeholder="Detalhe (tamanho…)" value={g.detail ?? ''} onChange={(e) => set('gifts', s.gifts.map((x, k) => (k === i ? { ...x, detail: e.target.value } : x)))} />
              <input className="ad-input" placeholder="Link (opcional)" value={g.link ?? ''} onChange={(e) => set('gifts', s.gifts.map((x, k) => (k === i ? { ...x, link: e.target.value } : x)))} />
              <button className="ad-btn sm danger" onClick={() => set('gifts', s.gifts.filter((_, k) => k !== i))}>✕</button>
            </div>
          ))}
          <button className="ad-btn" onClick={() => set('gifts', [...s.gifts, { group: s.gifts[s.gifts.length - 1]?.group ?? '', title: '' }])}>+ Presente</button>
          <Field label="Chave Pix (opcional)">{text('pix')}</Field>
        </div>
        )}

      </div>
    </>
  )
}
