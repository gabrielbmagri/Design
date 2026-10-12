import { useState } from 'react'
import { saveAnswers, type InviteMatch } from '../lib/data'
import type { EventSettings, Guest, Status } from '../lib/types'
import { firstName, shortDate } from '../lib/text'
import Icon, { type IconName } from '../lib/Icon'
import { outcomeOf, type Outcome } from './GuestApp'
import { timeLabel } from './bits'

interface Props {
  settings: EventSettings
  invite: InviteMatch
  me: Guest
  onDone: (inv: InviteMatch, o: Outcome) => void
  onLater: () => void
  onNotMe: () => void
}

const CHOICES: { s: Status; label: string; icon: IconName }[] = [
  { s: 'yes', label: 'Vou', icon: 'check' },
  { s: 'no', label: 'Não vou', icon: 'x' },
  { s: 'maybe', label: 'Talvez', icon: 'help' },
]

export default function Rsvp({ settings, invite, me, onDone, onLater, onNotMe }: Props) {
  // quem está respondendo aparece primeiro
  const people = [...invite.guests].sort((a, b) => (a.id === me.id ? -1 : b.id === me.id ? 1 : a.order - b.order))
  const [status, setStatus] = useState<Record<string, Status>>(() =>
    Object.fromEntries(invite.guests.map((g) => [g.id, g.status])),
  )
  const [ages, setAges] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(invite.guests.map((g) => [g.id, g.age])),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const closed = settings.rsvpOpen === false

  const changed = invite.guests.filter((g) => status[g.id] !== g.status || ages[g.id] !== g.age)
  const answered = invite.guests.filter((g) => status[g.id] !== 'pending').length

  const submit = async () => {
    setError('')
    if (!changed.length) {
      onDone(invite, outcomeOf(invite.guests))
      return
    }
    setBusy(true)
    try {
      await saveAnswers(
        invite,
        changed.map((g) => ({ guestId: g.id, status: status[g.id], age: ages[g.id] })),
        me.name,
      )
      const updated: InviteMatch = {
        ...invite,
        guests: invite.guests.map((g) => ({ ...g, status: status[g.id], age: ages[g.id] })),
      }
      onDone(updated, outcomeOf(updated.guests))
    } catch (e) {
      console.error('saveAnswers', e)
      setError('Não conseguimos salvar. Confira a internet e toque em "Enviar resposta" de novo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="g-screen">
      <div className="g-body" style={{ gap: 16 }}>
        <div className="g-top">
          <span className="g-eyebrow">Olá, {firstName(me.name)}</span>
          <button className="g-link" style={{ padding: 0 }} onClick={onNotMe}>
            Não sou eu
          </button>
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <h1 className="g-h2">{people.length > 1 ? 'Quem vai à festa?' : 'Você vai à festa?'}</h1>
          <p className="g-lead">
            {shortDate(settings.dateISO)}, {timeLabel(settings)}
            {people.length > 1 && ' · Você pode responder por todos.'}
          </p>
        </div>

        {closed && (
          <div className="g-error">
            <Icon name="help" size={18} />
            <span>As confirmações foram encerradas. Fale com a família pelo WhatsApp para mudar algo.</span>
          </div>
        )}

        {people.length > 1 && !closed && (
          <button className="g-allyes" onClick={() => setStatus(Object.fromEntries(people.map((g) => [g.id, 'yes'])))}>
            <Icon name="check" size={16} /> Todos vão
          </button>
        )}

        {people.map((g) => {
          const isMe = g.id === me.id
          const fn = firstName(g.name)
          const askAge = g.isChild && status[g.id] !== 'no' && !(g.age != null && !g.ageFromGuest)
          return (
            <section key={g.id} className="g-person" aria-label={g.name}>
              <div className="g-person-head">
                <span className="g-avatar" style={{ width: 38, height: 38, fontSize: 15 }}>{fn[0]?.toUpperCase()}</span>
                <b>{isMe ? `${g.name} (você)` : g.name}</b>
                {g.isChild && <span className="g-chip">criança</span>}
              </div>
              <div className="g-seg" role="radiogroup" aria-label={`Resposta de ${fn}`}>
                {CHOICES.map((c) => (
                  <button
                    key={c.s}
                    role="radio"
                    aria-checked={status[g.id] === c.s}
                    aria-label={`${fn}: ${c.label}`}
                    disabled={closed}
                    className={`${c.s} ${status[g.id] === c.s ? 'on' : ''}`}
                    onClick={() => setStatus((x) => ({ ...x, [g.id]: x[g.id] === c.s ? 'pending' : c.s }))}
                  >
                    <Icon name={c.icon} size={16} stroke={2.2} />
                    {c.label}
                  </button>
                ))}
              </div>
              {askAge && (
                <label className="g-age" htmlFor={`idade-${g.id}`}>
                  <span>
                    <b style={{ color: 'var(--ink)' }}>Idade de {fn}</b>
                    <small>Pedimos só a idade da criança. Menos de 1 ano, coloque 0.</small>
                  </span>
                  <span className="g-age-field">
                    <input
                      id={`idade-${g.id}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={17}
                      placeholder="—"
                      value={ages[g.id] ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        setAges((a) => ({ ...a, [g.id]: v === '' ? null : Math.max(0, Math.min(17, Math.floor(Number(v)))) }))
                      }}
                    />
                    anos
                  </span>
                </label>
              )}
            </section>
          )
        })}

        {error && (
          <div className="g-error" role="alert">
            <Icon name="help" size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="g-sticky">
          <button className="g-btn" onClick={submit} disabled={busy || closed}>
            {busy ? <span className="g-spinner" /> : answered ? 'Enviar resposta' : 'Continuar'}
          </button>
          <button className="g-link" onClick={onLater}>
            Decidir depois
          </button>
        </div>
      </div>
    </main>
  )
}
