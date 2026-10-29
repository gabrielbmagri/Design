import type { AdminCtx } from './AdminApp'
import { useState } from 'react'
import type { Guest, Host, Invite } from '../lib/types'
import { HOST_LABEL } from '../lib/types'
import { markCountdown, markReminded, markSent } from './ops'
import { countdownWa, daysToParty, inviteWa, lastCallWa, pendingWa, reminderWa } from './messages'
import { DAY, ms } from './stats'
import Icon from '../lib/Icon'
import { guestName, plural } from '../lib/text'

function Row({ invite, open, extra, children }: { invite: Invite; open: Guest[]; extra?: string; children: React.ReactNode }) {
  return (
    <div className="ad-inv">
      <div className="ad-inv-top">
        <b>{invite.label}</b>
        <span className={`ad-tag ${invite.host}`}>{HOST_LABEL[invite.host]}</span>
        {extra && <span className="ad-tag late">{extra}</span>}
        <span className="ad-meta">{invite.phone || 'sem telefone — escolha o contato no WhatsApp'}</span>
      </div>
      {open.length > 0 && (
        <div style={{ fontSize: 14, color: 'var(--muted)' }}>
          Falta responder: <b style={{ color: 'var(--text)' }}>{open.map((g) => guestName(g) + (g.status === 'maybe' ? ' (talvez)' : '')).join(', ')}</b>
        </div>
      )}
      <div className="ad-row">{children}</div>
    </div>
  )
}

function Dots({ invite }: { invite: Invite }) {
  const n = invite.countdownCount ?? 0
  return (
    <span className="ad-dots" title="Lembranças enviadas (toque para corrigir)">
      {[1, 2, 3].map((k) => (
        <button key={k} className={`ad-dot ${k <= n ? 'on' : ''}`} aria-label={`Lembrança ${k}${k <= n ? ' enviada' : ''}`} onClick={() => markCountdown(invite, k === n ? k - 1 : k)}>
          {k}
        </button>
      ))}
    </span>
  )
}

export default function Reminders({ stats, settings, invites, myHost }: AdminCtx) {
  const now = Date.now()
  const [host, setHost] = useState<Host | ''>(myHost ?? '')
  const reminders = stats.reminders.filter((r) => !host || r.invite.host === host)
  const toParty = daysToParty(settings)
  // lembrança da festa: todos os convites ativos, menos quem já recusou por completo
  const everyone = invites
    .filter((i) => !i.archived && !i.reserve && (!host || i.host === host))
    .map((i) => ({ invite: i, members: stats.guestsOf(i.id).filter((g) => !g.isPlusOne) }))
    .filter((r) => r.members.length && r.members.some((g) => g.status !== 'no'))
  const notSent = stats.notSent.filter((i) => !host || i.host === host)
  const upcoming = stats.upcoming.filter((r) => !host || r.invite.host === host)
  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Envios e lembretes</h1>
          <p>Quem não respondeu {settings.reminderDays} dias depois do envio (ou do último lembrete) aparece em "Lembrar agora".</p>
        </div>
      </div>
      <div className="ad-filters">
        {([['', 'Todos'], ['gabriel', 'Convidados do Gabriel'], ['luiza', 'Convidados da Luiza']] as const).map(([id, l]) => (
          <button key={id} className={`ad-chip ${host === id ? 'on' : ''}`} onClick={() => setHost(id)}>{l}</button>
        ))}
      </div>


      {toParty >= 0 && (
        <>
          <h3 style={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', margin: '8px 0 4px' }}>
            Lembrança da festa · {everyone.length}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 10px' }}>
            {toParty === 0 ? 'A festa é hoje.' : toParty === 1 ? 'A festa é amanhã.' : `Faltam ${toParty} dias.`} A prévia do WhatsApp mostra a contagem do dia. Vai para todos, menos quem já recusou o convite inteiro.
          </p>
          <div className="ad-list" style={{ marginBottom: 24 }}>
            {everyone.map((r) => (
              <Row key={r.invite.id} invite={r.invite} open={[]}>
                <a className="ad-btn wa" href={countdownWa(settings, r.invite, r.members)} target="_blank" rel="noreferrer" onClick={() => markCountdown(r.invite)}>
                  <Icon name="chat" size={14} /> {HOST_LABEL[r.invite.host]} envia a lembrança
                </a>
                <Dots invite={r.invite} />
              </Row>
            ))}
          </div>
        </>
      )}

      <h3 style={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', margin: '8px 0 10px' }}>Lembrar agora · {reminders.length}</h3>
      <div className="ad-list" style={{ marginBottom: 24 }}>
        {reminders.length === 0 && <div className="ad-empty">Ninguém para lembrar hoje.</div>}
        {reminders.map((r) => (
          <Row key={r.invite.id} invite={r.invite} open={r.open} extra={`enviado há ${r.days} dias${r.invite.reminderCount ? ` · ${r.invite.reminderCount}º lembrete feito` : ''}`}>
            <a className="ad-btn wa" href={reminderWa(settings, r.invite, r.members)} target="_blank" rel="noreferrer" onClick={() => markReminded(r.invite)}>
              <Icon name="chat" size={14} /> {HOST_LABEL[r.invite.host]} lembra no WhatsApp
            </a>
            <a className="ad-btn sm" href={lastCallWa(settings, r.invite, r.members)} target="_blank" rel="noreferrer" onClick={() => markReminded(r.invite)}>
              Último dia
            </a>
            <a className="ad-btn sm" href={pendingWa(settings, r.invite, r.members)} target="_blank" rel="noreferrer" onClick={() => markReminded(r.invite)}>
              Confirmação pendente
            </a>
            <button className="ad-btn sm" onClick={() => markReminded(r.invite)}>Já lembrei por fora</button>
          </Row>
        ))}
      </div>

      <h3 style={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', margin: '8px 0 10px' }}>Ainda não enviados · {notSent.length}</h3>
      <div className="ad-list" style={{ marginBottom: 24 }}>
        {notSent.length === 0 && <div className="ad-empty">Todos os convites foram enviados.</div>}
        {notSent.map((i) => {
          const members = stats.guestsOf(i.id)
          return (
            <Row key={i.id} invite={i} open={[]}>
              <a className="ad-btn wa" href={inviteWa(settings, i, members)} target="_blank" rel="noreferrer" onClick={() => markSent(i)}>
                <Icon name="chat" size={14} /> {HOST_LABEL[i.host]} envia no WhatsApp
              </a>
              <button className="ad-btn sm" onClick={() => markSent(i)}>Já enviei por fora</button>
            </Row>
          )
        })}
      </div>

      <h3 style={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', margin: '8px 0 10px' }}>Dentro do prazo · {upcoming.length}</h3>
      <div className="ad-list">
        {upcoming.map((r) => {
          const since = Math.max(ms(r.invite.sentAt), ms(r.invite.lastReminderAt))
          const left = Math.max(0, Math.ceil((since + settings.reminderDays * DAY - now) / DAY))
          return (
            <Row key={r.invite.id} invite={r.invite} open={r.open} extra={`lembrar em ${plural(left, 'dia')}`}>
              <a className="ad-btn sm" href={reminderWa(settings, r.invite, stats.guestsOf(r.invite.id))} target="_blank" rel="noreferrer" onClick={() => markReminded(r.invite)}>
                Lembrar mesmo assim
              </a>
              <a className="ad-btn sm" href={lastCallWa(settings, r.invite, stats.guestsOf(r.invite.id))} target="_blank" rel="noreferrer" onClick={() => markReminded(r.invite)}>
                Último dia
              </a>
              <a className="ad-btn sm" href={pendingWa(settings, r.invite, stats.guestsOf(r.invite.id))} target="_blank" rel="noreferrer" onClick={() => markReminded(r.invite)}>
                Confirmação pendente
              </a>
            </Row>
          )
        })}
      </div>
    </>
  )
}
