import { useState } from 'react'
import type { EventSettings } from '../lib/types'
import { firstName, fmtTime, parseISODate } from '../lib/text'
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
  const rest = settings.title.replace(settings.childName, '').trim()
  const d = parseISODate(settings.dateISO)
  const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')

  return (
    <main className="g-screen">
      <div className="g-paper">
      <Carousel photos={settings.carousel} />
      <div className="g-center" style={{ paddingTop: 12, paddingBottom: 0, gap: 14 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <h1 className="g-title">
            <span className="g-title-main">{settings.childName}</span>
            {rest && <span className="g-title-sub">{rest.charAt(0).toUpperCase() + rest.slice(1)}</span>}
          </h1>
          {settings.subtitle && <p className="g-script">{settings.subtitle}</p>}
          <div className="g-datebar" aria-label={`Dia ${d.getDate()} de ${month}, ${fmtTime(settings.timeStart)}`}>
            <div style={{ textAlign: 'center' }}>
              <b>{String(d.getDate()).padStart(2, '0')}</b>
              <div style={{ fontSize: 15 }}>{month}</div>
            </div>
            <span />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15 }}>às</div>
              <b>{fmtTime(settings.timeStart).toUpperCase()}</b>
            </div>
          </div>
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
      </div>

      <div className="g-subtle">
        <button className="g-link" style={{ background: 'rgba(255,255,255,.85)', borderRadius: 99, padding: '10px 18px' }} onClick={onVisitor}>
          Só quero ver as informações da festa
        </button>
      </div>
    </main>
  )
}
