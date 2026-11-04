import { useEffect, useState } from 'react'
import type { AdminCtx } from './AdminApp'
import type { EventSettings } from '../lib/types'
import { HOST_LABEL } from '../lib/types'
import { LEGAL_TITLE, LegalBody } from '../legal/content'
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
  const [terms, setTerms] = useState(false)

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
            <Field label={`WhatsApp de ${HOST_LABEL.gabriel}`}>{text('gabrielPhone')}</Field>
            <Field label={`WhatsApp de ${HOST_LABEL.luiza}`}>{text('luizaPhone')}</Field>
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
            <Field label="Lembrar após (dias)">{text('reminderDays', 'number')}</Field>
          </div>
          <label className="ad-row" style={{ gap: 8, fontWeight: 700 }}>
            <input type="checkbox" checked={s.childFreeMaxAge >= 0} onChange={(e) => set('childFreeMaxAge', e.target.checked ? 5 : -1)} />
            O salão tem gratuidade para crianças (não entram na conta de pagantes)
          </label>
          {s.childFreeMaxAge >= 0 && (
            <div className="ad-grid">
              <Field label="Gratuidade até (anos completos)">{text('childFreeMaxAge', 'number')}</Field>
            </div>
          )}
          <small style={{ color: 'var(--muted)' }}>Cada salão tem a sua regra. Desligado, todas as crianças contam como convidados normais.</small>
        </div>
        )}

        {sub === 'mensagens' && (
        <div className="ad-card" style={{ display: 'grid', gap: 10 }}>
          <h3>Mensagens</h3>
          <Field label="Depois de confirmar">{area('welcomeYes', 2)}</Field>
          <Field label="Depois de recusar">{area('welcomeNo', 2)}</Field>
          <Field label="Depois de 'ainda não sei'">{area('welcomeMaybe', 2)}</Field>
          <div className="ad-note">
            Variáveis do WhatsApp: <code>{'{nome} {crianca} {data} {hora} {local} {endereco} {prazo} {link} {anfitriao} {convidados} {pessoas} {contagem} {linkContagem} {salao} {mapa}'}</code>
          </div>
          <Field label="Mensagem do convite (WhatsApp)">{area('inviteMessage', 8)}</Field>
          <Field label="Mensagem de lembrete (WhatsApp)">{area('reminderMessage', 7)}</Field>
          <Field label="Mensagem de último dia (WhatsApp)">{area('lastCallMessage', 8)}</Field>
          <Field label="Mensagem de confirmação pendente (WhatsApp)">{area('pendingMessage', 9)}</Field>
          <Field label="Mensagem da contagem regressiva (WhatsApp)">{area('countdownMessage', 12)}</Field>
          <Field label={'Legenda do "É amanhã" (WhatsApp, vai junto da imagem)'}>{area('tomorrowMessage', 10)}</Field>
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
          <h3>Loja de presentes (opcional)</h3>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
            Mostra aos convidados itens para reservar e cotas em dinheiro com Pix. O dinheiro cai direto na sua conta; o site não recebe nem guarda pagamentos.
          </p>
          <label className="ad-row" style={{ gap: 8, fontWeight: 700 }}>
            <input type="checkbox" checked={!!s.giftsTermsISO} onChange={(e) => { set('giftsTermsISO', e.target.checked ? new Date().toISOString().slice(0, 10) : ''); if (!e.target.checked) set('giftsEnabled', false) }} />
            Li e aceito os <button type="button" className="ad-link" onClick={() => setTerms(true)}>termos da loja de presentes</button>
          </label>
          <label className="ad-row" style={{ gap: 8, fontWeight: 700, opacity: s.giftsTermsISO ? 1 : 0.5 }}>
            <input type="checkbox" disabled={!s.giftsTermsISO} checked={s.giftsEnabled} onChange={(e) => set('giftsEnabled', e.target.checked)} />
            Ligar a loja de presentes no convite
          </label>
          {s.giftsEnabled && !s.pix && <div className="ad-note">Falta a chave Pix: sem ela os convidados não conseguem contribuir.</div>}
          <Field label="Nome da seção (ex.: Lista de presentes)">{text('giftsTitle')}</Field>
          <Field label="Chave Pix de quem recebe (em seu nome)">{text('pix')}</Field>
          <small style={{ color: 'var(--muted)', marginTop: -6 }}>E-mail, CPF/CNPJ só com números, chave aleatória ou celular com +55 e DDD (ex.: +5521999990000).</small>
          <div className="ad-grid2">
            <Field label="Nome de quem recebe (como no banco)">{text('pixName')}</Field>
            <Field label="Cidade">{text('pixCity')}</Field>
          </div>
          <Field label="Texto de apresentação">{area('giftNote', 2)}</Field>
          {s.gifts.map((g, i) => (
            <div key={i} className="ad-member" style={{ gridTemplateColumns: '1fr 1fr 110px 90px 1fr auto' }}>
              <input className="ad-input" placeholder="Grupo (ex.: Lua de mel)" value={g.group ?? ''} onChange={(e) => set('gifts', s.gifts.map((x, k) => (k === i ? { ...x, group: e.target.value } : x)))} />
              <input className="ad-input" placeholder="Presente" value={g.title} onChange={(e) => set('gifts', s.gifts.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} />
              <select className="ad-input" value={g.kind ?? 'item'} onChange={(e) => set('gifts', s.gifts.map((x, k) => (k === i ? { ...x, kind: e.target.value as 'item' | 'cota' } : x)))}>
                <option value="item">Item</option>
                <option value="cota">Cota Pix</option>
              </select>
              <input className="ad-input" placeholder="R$" inputMode="decimal" disabled={g.kind !== 'cota'} value={g.amount ?? ''} onChange={(e) => set('gifts', s.gifts.map((x, k) => (k === i ? { ...x, amount: Number(e.target.value.replace(',', '.')) || undefined } : x)))} />
              <input className="ad-input" placeholder="Detalhe ou link" value={g.detail ?? ''} onChange={(e) => set('gifts', s.gifts.map((x, k) => (k === i ? { ...x, detail: e.target.value } : x)))} />
              <button className="ad-btn sm danger" onClick={() => set('gifts', s.gifts.filter((_, k) => k !== i))}>✕</button>
            </div>
          ))}
          <button className="ad-btn" onClick={() => set('gifts', [...s.gifts, { id: 'g' + Date.now().toString(36), kind: 'item', group: s.gifts[s.gifts.length - 1]?.group ?? '', title: '' }])}>+ Presente</button>
          <small style={{ color: 'var(--muted)' }}>“Cota Pix” aceita vários contribuintes e deixa o valor vazio para o convidado escolher. “Item” só pode ser reservado por uma pessoa.</small>
        </div>
        )}

      </div>
      {terms && (
        <div className="ad-modal-bg" onClick={(e) => e.target === e.currentTarget && setTerms(false)}>
          <div className="ad-modal">
            <h2>{LEGAL_TITLE.presentes}</h2>
            <LegalBody doc="presentes" />
            <div className="ad-row" style={{ justifyContent: 'flex-end' }}><button className="ad-btn primary" onClick={() => setTerms(false)}>Fechar</button></div>
          </div>
        </div>
      )}
    </>
  )
}
