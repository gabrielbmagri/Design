import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { InviteMatch } from '../lib/data'
import type { EventSettings, Guest } from '../lib/types'
import { STATUS_LABEL } from '../lib/types'
import { firstName, longDate, waLink } from '../lib/text'
import { Countdown, MapEmbed, downloadIcs, googleCalendarUrl, hostContacts, isIOS, mapsUrl, timeLabel, wazeUrl } from './bits'

interface Props {
  settings: EventSettings
  invite: InviteMatch | null
  me: Guest | null
  section: string
  onSection: (s: string) => void
  onManage: () => void
  onReplay: () => void
  onExit: () => void
}

const MENU = [
  { id: 'convite', icon: '💌', label: 'Convite' },
  { id: 'quando', icon: '📅', label: 'Data e horário' },
  { id: 'onde', icon: '📍', label: 'Local' },
  { id: 'presentes', icon: '🎁', label: 'Sugestões de presente' },
  { id: 'confirmacao', icon: '✅', label: 'Minha confirmação' },
]

export default function Hub({ settings, invite, me, section, onSection, onManage, onReplay, onExit }: Props) {
  const [open, setOpen] = useState(false)
  const go = (id: string) => {
    onSection(id)
    setOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const calendarBtn = isIOS() ? (
    <button className="g-btn secondary" onClick={() => downloadIcs(settings)}>Salvar na minha agenda</button>
  ) : (
    <a className="g-btn secondary" href={googleCalendarUrl(settings)} target="_blank" rel="noreferrer">
      Salvar na minha agenda
    </a>
  )

  return (
    <div className="im" style={{ minHeight: '100dvh' }}>
      <header className="hub-top">
        <button className="hub-menu-btn" onClick={() => setOpen(true)} aria-expanded={open}>
          ☰ Menu
        </button>
        <b style={{ color: 'var(--rose-deep)' }}>{settings.childName} · 1 ano</b>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="hub-drawer-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.nav
              className="hub-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              aria-label="Menu"
            >
              <h3>Menu</h3>
              {MENU.map((m) => (
                <button key={m.id} className={section === m.id ? 'on' : ''} onClick={() => go(m.id)}>
                  <span>{m.icon}</span>
                  {m.label}
                </button>
              ))}
              <button onClick={() => { setOpen(false); onReplay() }}>
                <span>✨</span>Ver a história de novo
              </button>
              {hostContacts(settings, me?.host).map((c) => (
                <button key={c.host} onClick={() => window.open(waLink(c.phone, `Oi, ${c.host === 'gabriel' ? 'Gabriel' : 'Luiza'}! Tenho uma dúvida sobre o aniversário da ${settings.childName}.`), '_blank')}>
                  <span>💬</span>{c.label}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              {me && (
                <button onClick={() => { setOpen(false); onExit() }} style={{ background: 'transparent', boxShadow: 'none', fontSize: 17 }}>
                  <span>↩</span>Sair (não sou {firstName(me.name)})
                </button>
              )}
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      <main className="hub-main">
        {section === 'convite' && (
          <>
            {settings.inviteImage ? (
              <div className="im-invite" style={{ margin: '0 auto', width: 'min(84vw, 380px)' }}>
                <img src={settings.inviteImage} alt={`Convite: ${settings.title}`} />
              </div>
            ) : (
              <h1 className="g-title" style={{ fontSize: 'clamp(34px, 9vw, 46px)' }}>{settings.title}</h1>
            )}
            {settings.dressCode && <p className="g-lead">{settings.dressCode}</p>}
            <div className="im-info" style={{ textAlign: 'center' }}>
              <div className="big" style={{ fontSize: 28 }}>{longDate(settings.dateISO)}</div>
              <div className="muted">{timeLabel(settings)} · {settings.venueName}</div>
              <Countdown settings={settings} />
            </div>
            <div className="hub-actions">
              <button className="g-btn" onClick={() => (me ? go('confirmacao') : onManage())}>
                {me ? 'Ver minha confirmação' : 'Confirmar presença'}
              </button>
              <button className="g-btn secondary" onClick={() => go('onde')}>Como chegar</button>
              <button className="g-btn secondary" onClick={() => go('presentes')}>Sugestões de presente</button>
            </div>
          </>
        )}

        {section === 'quando' && (
          <div className="im-info" style={{ textAlign: 'center' }}>
            <div className="icon">📅</div>
            <div className="big">{longDate(settings.dateISO)}</div>
            <div className="muted">{timeLabel(settings)}</div>
            <Countdown settings={settings} />
            {calendarBtn}
          </div>
        )}

        {section === 'onde' && (
          <div className="im-info" style={{ textAlign: 'center' }}>
            <div className="icon">📍</div>
            <div className="big">{settings.venueName}</div>
            <div className="muted">{settings.address}</div>
            <MapEmbed settings={settings} />
            <a className="g-btn" href={mapsUrl(settings)} target="_blank" rel="noreferrer">Abrir no Google Maps</a>
            <a className="g-btn secondary" href={wazeUrl(settings)} target="_blank" rel="noreferrer">Ir com Waze</a>
          </div>
        )}

        {section === 'presentes' && (
          <div className="im-info">
            <div className="icon" style={{ textAlign: 'center' }}>🎁</div>
            <p className="muted" style={{ margin: 0, textAlign: 'center' }}>{settings.giftNote}</p>
            <div className="im-gifts">
              {settings.gifts.map((g, i) => (
                <div className="im-gift" key={i}>
                  <span style={{ fontSize: 28 }}>💝</span>
                  <div>
                    <b>{g.title}</b>
                    {g.detail && <span>{g.detail}</span>}
                    {g.link && <div><a href={g.link} target="_blank" rel="noreferrer">Ver sugestão →</a></div>}
                  </div>
                </div>
              ))}
            </div>
            {settings.pix && <p className="muted" style={{ textAlign: 'center' }}>Pix: <b>{settings.pix}</b></p>}
          </div>
        )}

        {section === 'confirmacao' && (
          <div className="im-info" style={{ textAlign: 'center' }}>
            <div className="icon">✅</div>
            {invite ? (
              <>
                <div className="big" style={{ fontSize: 28 }}>Respostas do seu convite</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {invite.guests.map((g) => (
                    <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--blush)', borderRadius: 16 }}>
                      <b style={{ textAlign: 'left' }}>{g.name}</b>
                      <span className={`hub-pill ${g.status}`}>{STATUS_LABEL[g.status]}</span>
                    </div>
                  ))}
                </div>
                <button className="g-btn" onClick={onManage}>Alterar resposta</button>
              </>
            ) : (
              <>
                <div className="big" style={{ fontSize: 28 }}>Confirme sua presença</div>
                <p className="muted">Digite seu nome para encontrar seu convite.</p>
                <button className="g-btn" onClick={onManage}>Confirmar presença</button>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
