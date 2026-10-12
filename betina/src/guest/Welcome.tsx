import { useState } from 'react'
import type { EventSettings } from '../lib/types'
import { firstName } from '../lib/text'
import Icon from '../lib/Icon'
import { Marquee } from './bits'

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

  return (
    <main className="g-screen">
      <Marquee photos={settings.carousel} />
      <div className="g-body" style={{ gap: 20, paddingTop: 4 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <p className="g-eyebrow">Aniversário de 1 ano</p>
          <h1 className="g-title">
            {saved ? (
              <>Que bom te ver, <span className="accent">{firstName(saved.name)}</span></>
            ) : (
              <>Confirme sua presença na festa da <span className="accent">{settings.childName}</span></>
            )}
          </h1>
        </div>

        {saved ? (
          <div style={{ display: 'grid', gap: 4 }}>
            <button className="g-btn" onClick={onContinue} disabled={busy}>
              {busy ? <span className="g-spinner" /> : <>Abrir meu convite <Icon name="arrowRight" size={18} /></>}
            </button>
            <button className="g-link" onClick={onForget}>
              Não sou {firstName(saved.name)}
            </button>
          </div>
        ) : (
          <form
            style={{ display: 'grid', gap: 12 }}
            onSubmit={(e) => {
              e.preventDefault()
              if (name.trim().length >= 2) onSearch(name)
            }}
          >
            <label className="g-field" htmlFor="nome">
              <span className="g-label">Seu nome ou celular</span>
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
            </label>
            <button className="g-btn" type="submit" disabled={busy || name.trim().length < 2}>
              {busy ? <span className="g-spinner" /> : <>Continuar <Icon name="arrowRight" size={18} /></>}
            </button>
          </form>
        )}

        {error && (
          <div className="g-error" role="alert">
            <Icon name="help" size={18} style={{ marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ marginTop: 'auto', textAlign: 'center' }}>
          <button className="g-link" onClick={onVisitor}>
            Só quero ver os detalhes
          </button>
        </div>
      </div>
    </main>
  )
}
