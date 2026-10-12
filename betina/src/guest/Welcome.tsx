import { useState } from 'react'
import type { EventSettings } from '../lib/types'
import { firstName, shortDate } from '../lib/text'
import { Carousel } from './bits'

interface Props {
  settings: EventSettings
  busy: boolean
  error: string
  saved: { name: string } | null
  onSearch: (name: string) => void
  onContinue: () => void
  onForget: () => void
  onVisitor: () => void
}

export default function Welcome({ settings, busy, error, saved, onSearch, onContinue, onForget, onVisitor }: Props) {
  const [name, setName] = useState('')
  const titleParts = settings.title.split(settings.childName)

  return (
    <main className="g-screen">
      <Carousel photos={settings.carousel} />
      <div className="g-center" style={{ paddingTop: 18 }}>
        <div>
          <p className="g-eyebrow">Você está convidado · {shortDate(settings.dateISO)}</p>
          <h1 className="g-title" style={{ marginTop: 8 }}>
            {titleParts.length === 2 ? (
              <>
                {titleParts[0]}
                <em>{settings.childName}</em>
                {titleParts[1]}
              </>
            ) : (
              settings.title
            )}
          </h1>
        </div>

        {saved ? (
          <div className="g-card" style={{ display: 'grid', gap: 12 }}>
            <p className="g-label" style={{ margin: 0 }}>
              Que bom te ver de novo, {firstName(saved.name)}! 💗
            </p>
            <button className="g-btn" onClick={onContinue} disabled={busy}>
              {busy ? <span className="g-spinner" /> : 'Abrir meu convite'}
            </button>
            <button className="g-link" onClick={onForget}>
              Não sou {firstName(saved.name)}
            </button>
          </div>
        ) : (
          <form
            className="g-card"
            onSubmit={(e) => {
              e.preventDefault()
              if (name.trim().length >= 2) onSearch(name)
            }}
          >
            <label className="g-label" htmlFor="nome">
              Digite seu nome
            </label>
            <input
              id="nome"
              className="g-input"
              placeholder="Ex.: Maria"
              autoComplete="given-name"
              autoCapitalize="words"
              enterKeyHint="search"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="g-help">Pode ser só o primeiro nome, ou o número do seu celular.</p>
            <div style={{ height: 16 }} />
            <button className="g-btn" type="submit" disabled={busy || name.trim().length < 2}>
              {busy ? <span className="g-spinner" /> : 'Encontrar meu convite'}
            </button>
          </form>
        )}

        {error && (
          <div className="g-error" role="alert">
            {error}
          </div>
        )}
      </div>

      <div className="g-subtle">
        <button className="g-link" onClick={onVisitor}>
          Só quero ver as informações da festa
        </button>
      </div>
    </main>
  )
}
