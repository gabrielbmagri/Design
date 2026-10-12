import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { InviteMatch } from '../lib/data'
import type { EventSettings, Guest } from '../lib/types'
import { STATUS_LABEL } from '../lib/types'
import { firstName, longDate, waLink } from '../lib/text'
import Icon, { type IconName } from '../lib/Icon'
import { Countdown, GiftList, MapEmbed, hostContacts, timeLabel } from './bits'
import { CalendarButton, ContactButtons, PlaceActions } from './Immersion'

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

const MENU: { id: string; icon: IconName; label: string }[] = [
  { id: 'convite', icon: 'mail', label: 'Convite' },
  { id: 'quando', icon: 'calendar', label: 'Data e hora' },
  { id: 'onde', icon: 'pin', label: 'Local' },
  { id: 'presentes', icon: 'gift', label: 'Presentes' },
  { id: 'confirmacao', icon: 'check', label: 'Minha confirmação' },
]

function Card({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  return (
    <div className="im-card">
      <div className="im-card-head">
        <span className="im-icon"><Icon name={icon} size={22} /></span>
        <h3>{title}</h3>
      </div>
      {children}
    </div>
  )
}

export default function Hub({ settings, invite, me, section, onSection, onManage, onReplay, onExit }: Props) {
  const [open, setOpen] = useState(false)
  const go = (id: string) => {
    onSection(id)
    setOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const contacts = hostContacts(settings, me?.host)

  return (
    <div className="im">
      <header className="hub-top">
        <button className="hub-menu-btn" onClick={() => setOpen(true)} aria-label="Abrir menu" aria-expanded={open}>
          <Icon name="menu" size={22} />
        </button>
        <b>
          <span>{settings.childName}</span> · 1 ano
        </b>
        <span style={{ width: 44 }} />
      </header>

      <nav className="hub-tabs" aria-label="Seções">
        {MENU.map((m) => (
          <button key={m.id} className={section === m.id ? 'on' : ''} onClick={() => go(m.id)}>
            {m.label}
          </button>
        ))}
      </nav>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="hub-drawer-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.nav
              className="hub-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              aria-label="Menu"
            >
              <div className="head">
                <b>{settings.title}</b>
                <small>{longDate(settings.dateISO)}</small>
              </div>
              {MENU.map((m) => (
                <button key={m.id} className={section === m.id ? 'on' : ''} onClick={() => go(m.id)}>
                  <Icon name={m.icon} size={20} />
                  {m.label}
                </button>
              ))}
              <hr />
              <button onClick={() => { setOpen(false); onReplay() }}>
                <Icon name="sparkle" size={20} /> Ver a história de novo
              </button>
              {contacts.map((c) => (
                <button key={c.host} onClick={() => window.open(waLink(c.phone, `Oi, ${c.host === 'gabriel' ? 'Gabriel' : 'Luiza'}! Tenho uma dúvida sobre o aniversário da ${settings.childName}.`), '_blank')}>
                  <Icon name="chat" size={20} /> {c.label}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              {me && (
                <button onClick={() => { setOpen(false); onExit() }} style={{ color: 'var(--ink-3)' }}>
                  <Icon name="logout" size={20} /> Não sou {firstName(me.name)}
                </button>
              )}
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      <main className="hub-main">
        {section === 'convite' && (
          <>
            {settings.inviteImage && (
              <div className="im-invite" style={{ maxWidth: '100%', margin: '0 auto' }}>
                <img src={settings.inviteImage} alt={`Convite: ${settings.title}`} />
              </div>
            )}
            <Card icon="calendar" title={longDate(settings.dateISO)}>
              <p>
                {timeLabel(settings)} · {settings.venueName}
              </p>
              <Countdown settings={settings} />
            </Card>
            <button className="g-btn" onClick={() => (me ? go('confirmacao') : onManage())}>
              {me ? 'Ver minha confirmação' : 'Confirmar presença'}
            </button>
            {settings.dressCode && <p className="g-small" style={{ textAlign: 'center' }}>{settings.dressCode}</p>}
          </>
        )}

        {section === 'quando' && (
          <Card icon="calendar" title="Data e hora">
            <p>
              <b style={{ color: 'var(--ink)' }}>{longDate(settings.dateISO)}</b>, {timeLabel(settings)}
            </p>
            <Countdown settings={settings} />
            <CalendarButton settings={settings} />
          </Card>
        )}

        {section === 'onde' && (
          <Card icon="pin" title="Local">
            <p>
              <b style={{ color: 'var(--ink)' }}>{settings.venueName}</b>
              <br />
              {settings.address}
            </p>
            <MapEmbed settings={settings} />
            <PlaceActions settings={settings} />
          </Card>
        )}

        {section === 'presentes' && (
          <Card icon="gift" title="Sugestões de presente">
            <p>{settings.giftNote}</p>
            <GiftList settings={settings} />
            {settings.pix && <p>Pix: <b>{settings.pix}</b></p>}
          </Card>
        )}

        {section === 'confirmacao' && (
          <Card icon="check" title={invite ? 'Respostas do seu convite' : 'Confirme sua presença'}>
            {invite ? (
              <>
                <div>
                  {invite.guests.map((g) => (
                    <div key={g.id} className="hub-status">
                      <b style={{ fontWeight: 600 }}>{g.name}</b>
                      <span className={`pill ${g.status}`}>{STATUS_LABEL[g.status]}</span>
                    </div>
                  ))}
                </div>
                <button className="g-btn" onClick={onManage}>Alterar resposta</button>
              </>
            ) : (
              <>
                <p>Digite seu nome para encontrar seu convite.</p>
                <button className="g-btn" onClick={onManage}>Confirmar presença</button>
              </>
            )}
            <ContactButtons settings={settings} me={me} />
          </Card>
        )}
      </main>
    </div>
  )
}
