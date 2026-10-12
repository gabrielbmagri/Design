import type { InviteMatch } from '../lib/data'
import type { Guest } from '../lib/types'
import { firstName, joinNames } from '../lib/text'
import Icon from '../lib/Icon'

interface Props {
  matches: InviteMatch[]
  onChoose: (inv: InviteMatch, g: Guest) => void
  onBack: () => void
}

export default function Pick({ matches, onChoose, onBack }: Props) {
  const options = matches.flatMap((inv) =>
    inv.guests
      .filter((g) => !inv.matchedIds || inv.matchedIds.includes(g.id))
      .map((g) => ({ inv, g, others: inv.guests.filter((o) => o.id !== g.id).map((o) => firstName(o.name)) })),
  )
  const fromLink = matches.length === 1 && matches[0].matchedIds?.length === matches[0].guests.length
  const single = options.length === 1

  return (
    <main className="g-screen">
      <div className="g-body" style={{ gap: 20 }}>
        <div className="g-top">
          <button className="g-back" onClick={onBack}>
            <Icon name="arrowLeft" size={18} /> Voltar
          </button>
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <h1 className="g-h2">{single ? 'Esse é você?' : fromLink ? 'Quem é você?' : 'Qual destes é você?'}</h1>
          <p className="g-lead">
            {single
              ? 'Confirme para ver o seu convite.'
              : fromLink
                ? 'Toque no seu nome.'
                : matches.length > 1
                  ? 'Seu nome aparece em mais de um convite.'
                  : 'Toque no seu nome.'}
          </p>
        </div>

        <div className="g-list">
          {options.map(({ inv, g, others }) => (
            <button key={g.id} className="g-option" onClick={() => onChoose(inv, g)}>
              <span className="g-avatar">{g.name.trim()[0]?.toUpperCase()}</span>
              <span style={{ minWidth: 0 }}>
                <b>{g.name}</b>
                {others.length > 0 && <small>Com {joinNames(others)}</small>}
              </span>
              <Icon name="chevronRight" size={20} />
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 4, marginTop: 'auto' }}>
          {single && (
            <button className="g-btn" onClick={() => onChoose(options[0].inv, options[0].g)}>
              Sim, sou eu
            </button>
          )}
          <button className="g-link" onClick={onBack}>
            {single ? 'Não sou eu' : 'Meu nome não está aqui'}
          </button>
        </div>
      </div>
    </main>
  )
}
