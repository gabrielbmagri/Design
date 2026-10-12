import type { InviteMatch } from '../lib/data'
import type { Guest } from '../lib/types'
import { joinNames } from '../lib/text'

interface Props {
  matches: InviteMatch[]
  onChoose: (inv: InviteMatch, g: Guest) => void
  onBack: () => void
}

export default function Pick({ matches, onChoose, onBack }: Props) {
  const options = matches.flatMap((inv) =>
    inv.guests
      .filter((g) => !inv.matchedIds || inv.matchedIds.includes(g.id))
      .map((g) => ({ inv, g, others: inv.guests.filter((o) => o.id !== g.id).map((o) => o.name) })),
  )
  const fromLink = matches.length === 1 && matches[0].matchedIds?.length === matches[0].guests.length
  const single = options.length === 1

  return (
    <main className="g-screen">
      <button className="g-back" onClick={onBack}>
        ← Voltar
      </button>
      <div className="g-center">
        <div style={{ display: 'grid', gap: 10 }}>
          <h1 className="g-h2">
            {single ? 'Esse é você?' : fromLink ? 'Quem é você?' : 'Encontramos! Qual destes é você?'}
          </h1>
          {fromLink && !single && (
            <p className="g-lead">
              Este convite é para {joinNames(matches[0].guests.map((g) => g.name))}. Toque no seu nome.
            </p>
          )}
          {!fromLink && matches.length > 1 && (
            <p className="g-lead">Seu nome aparece em mais de um convite. Toque no seu.</p>
          )}
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {options.map(({ inv, g, others }) => (
            <button key={g.id} className="g-option" onClick={() => onChoose(inv, g)}>
              <span className="g-avatar">{g.name.trim()[0]?.toUpperCase()}</span>
              <span>
                {g.name}
                {others.length > 0 && <small>Convite junto com {joinNames(others)}</small>}
                {others.length === 0 && inv.label && inv.label !== g.name && <small>{inv.label}</small>}
              </span>
            </button>
          ))}
        </div>

        {single && (
          <button className="g-btn" onClick={() => onChoose(options[0].inv, options[0].g)}>
            Sim, sou eu
          </button>
        )}
        <button className="g-link" onClick={onBack}>
          {single ? 'Não sou eu' : 'Meu nome não está aqui'}
        </button>
      </div>
    </main>
  )
}
