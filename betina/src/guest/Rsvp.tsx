import { useState } from 'react'
import { saveAnswers, type InviteMatch } from '../lib/data'
import type { EventSettings, Guest, Status } from '../lib/types'
import { firstName, longDate } from '../lib/text'
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

const CHOICES: { s: Status; cls: string; label: (n: string, isMe: boolean) => string }[] = [
  { s: 'yes', cls: 'yes', label: (n, isMe) => (isMe ? 'Sim, eu vou!' : `Sim, ${n} vai!`) },
  { s: 'no', cls: 'no', label: (n, isMe) => (isMe ? 'Não vou poder ir' : `${n} não vai poder ir`) },
  { s: 'maybe', cls: 'maybe', label: () => 'Ainda não sei' },
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
  const unanswered = invite.guests.filter((g) => status[g.id] === 'pending').length

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
      setError('Não conseguimos salvar. Confira a internet e toque em "Enviar" de novo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="g-screen soft">
      <div className="g-wrap" style={{ display: 'grid', gap: 18, paddingTop: 28 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <p className="g-eyebrow">Olá, {firstName(me.name)}! 💗</p>
          <h1 className="g-h2">{people.length > 1 ? 'Quem vai à festa?' : 'Você vai à festa?'}</h1>
          <p className="g-lead">
            {longDate(settings.dateISO)}, {timeLabel(settings)}
          </p>
          {people.length > 1 && (
            <p className="g-help" style={{ marginTop: 0 }}>
              Você pode responder por todos deste convite.
            </p>
          )}
        </div>

        {closed && (
          <div className="g-error">
            As confirmações foram encerradas. Fale com a família pelo WhatsApp para mudar algo.
          </div>
        )}

        {people.length > 1 && !closed && (
          <button
            className="g-allyes"
            onClick={() => setStatus(Object.fromEntries(people.map((g) => [g.id, 'yes'])))}
          >
            ✓ Todos vão!
          </button>
        )}

        {people.map((g) => {
          const isMe = g.id === me.id
          const fn = firstName(g.name)
          const needsAge = g.isChild && status[g.id] !== 'no'
          return (
            <section key={g.id} className="g-person" aria-label={g.name}>
              <div className="g-person-name">
                <span className="g-avatar" style={{ width: 44, height: 44, fontSize: 20 }}>
                  {fn[0]?.toUpperCase()}
                </span>
                <span style={{ flex: 1 }}>{isMe ? `${g.name} (você)` : g.name}</span>
                {g.isChild && <span className="tag">criança</span>}
              </div>
              <div className="g-choices" role="radiogroup" aria-label={`Resposta de ${fn}`}>
                {CHOICES.map((c) => (
                  <button
                    key={c.s}
                    role="radio"
                    aria-checked={status[g.id] === c.s}
                    disabled={closed}
                    className={`g-choice ${c.cls} ${status[g.id] === c.s ? 'on' : ''}`}
                    onClick={() => setStatus((x) => ({ ...x, [g.id]: x[g.id] === c.s ? 'pending' : c.s }))}
                  >
                    <span className="ic" />
                    {c.label(fn, isMe)}
                  </button>
                ))}
              </div>
              {needsAge && !(g.age != null && !g.ageFromGuest) && (
                <div className="g-age">
                  <p>Quantos anos {fn} terá no dia da festa?</p>
                  <div className="g-stepper">
                    <button
                      aria-label="Menos"
                      onClick={() => setAges((a) => ({ ...a, [g.id]: Math.max(0, (a[g.id] ?? 1) - 1) }))}
                    >
                      −
                    </button>
                    <output>
                      {ages[g.id] == null ? '—' : ages[g.id] === 0 ? 'bebê' : `${ages[g.id]} ${ages[g.id] === 1 ? 'ano' : 'anos'}`}
                    </output>
                    <button
                      aria-label="Mais"
                      onClick={() => setAges((a) => ({ ...a, [g.id]: Math.min(17, a[g.id] == null ? 1 : a[g.id]! + 1) }))}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </section>
          )
        })}

        {error && (
          <div className="g-error" role="alert">
            {error}
          </div>
        )}

        <div className="g-sticky">
          <button className="g-btn" onClick={submit} disabled={busy || closed}>
            {busy ? (
              <span className="g-spinner" />
            ) : unanswered === invite.guests.length ? (
              'Continuar sem responder'
            ) : (
              'Enviar resposta'
            )}
          </button>
          <button className="g-link" onClick={onLater}>
            Decidir depois
          </button>
        </div>
        <button className="g-link" style={{ fontSize: 16 }} onClick={onNotMe}>
          Não sou {firstName(me.name)}
        </button>
      </div>
    </main>
  )
}
