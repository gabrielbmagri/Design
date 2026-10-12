import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { InviteMatch } from '../lib/data'
import type { EventSettings, Guest } from '../lib/types'
import { STATUS_LABEL } from '../lib/types'
import { eventDate, firstName, forGroup, guestName, waLink } from '../lib/text'
import Icon, { type IconName } from '../lib/Icon'
import { Countdown, FloatingAnimals, GiftList, MapEmbed, Sparkles, hostContacts, timeLabel } from './bits'
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
  { id: 'historia', icon: 'heart', label: 'Nossa história' },
  { id: 'confirmacao', icon: 'check', label: 'Minha resposta' },
]

function Card({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <motion.div
      className="im-card"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="im-card-head">
        <span className="im-icon"><Icon name={icon} size={22} /></span>
        <h3>{title}</h3>
      </div>
      {children}
    </motion.div>
  )
}

export default function Hub({ settings, invite, me, section, onSection, onManage, onReplay, onExit }: Props) {
  const [open, setOpen] = useState(false)
  const tabsRef = useRef<HTMLElement>(null)
  const go = (id: string) => {
    onSection(id)
    setOpen(false)
    document.getElementById(`hub-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ao abrir, vai direto para a seção pedida (ex.: "Minha confirmação")
  useEffect(() => {
    if (section !== 'convite') setTimeout(() => document.getElementById(`hub-${section}`)?.scrollIntoView({ block: 'start' }), 50)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // destaca a aba da seção que está na tela
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (vis) onSection(vis.target.id.replace('hub-', ''))
      },
      { rootMargin: '-130px 0px -55% 0px' },
    )
    MENU.forEach((m) => {
      const el = document.getElementById(`hub-${m.id}`)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [onSection])

  useEffect(() => {
    const bar = tabsRef.current
    const on = bar?.querySelector<HTMLElement>('.on')
    if (bar && on) bar.scrollTo({ left: on.offsetLeft - bar.clientWidth / 2 + on.clientWidth / 2, behavior: 'smooth' })
  }, [section])
  const contacts = hostContacts(settings, me?.host)

  return (
    <div className="im">
      <div className="im-glow" />
      <Sparkles count={10} />
      <FloatingAnimals count={8} />
      <header className="hub-top">
        <button className="hub-menu-btn" onClick={() => setOpen(true)} aria-label="Abrir menu" aria-expanded={open}>
          <Icon name="menu" size={22} />
        </button>
        <b>
          <span>{settings.childName}</span> · 1 ano
        </b>
        <span style={{ width: 44 }} />
      </header>

      <nav className="hub-tabs" aria-label="Seções" ref={tabsRef} style={{ position: 'sticky', top: 'calc(64px + env(safe-area-inset-top))', zIndex: 15, background: 'rgba(255,252,248,.97)', backdropFilter: 'blur(10px)', maxWidth: 'none', paddingBottom: 10 }}>
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
                <small>{eventDate(settings.dateISO, settings.dateNote)}</small>
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
        <section id="hub-convite" className="hub-section" style={{ display: 'grid', gap: 14 }}>
          <>
            {settings.inviteImage && (
              <div className="im-invite" style={{ maxWidth: '100%', margin: '0 auto' }}>
                <img src={settings.inviteImage} alt={`Convite: ${settings.title}`} />
              </div>
            )}
            <button className="g-btn" onClick={() => (me ? go('confirmacao') : onManage())}>
              {me ? 'Ver minha resposta' : 'Responder ao convite'}
            </button>
            {settings.dressCode && <p className="g-small" style={{ textAlign: 'center' }}>{settings.dressCode}</p>}
          </>
        </section>

        <section id="hub-quando" className="hub-section" style={{ display: 'grid', gap: 14 }}>
          <Card icon="calendar" title="Data e hora">
            <p>
              <b style={{ color: 'var(--ink)' }}>{eventDate(settings.dateISO, settings.dateNote)}</b>, {timeLabel(settings)}
            </p>
            <Countdown settings={settings} />
            <CalendarButton settings={settings} />
          </Card>
        </section>

        <section id="hub-onde" className="hub-section" style={{ display: 'grid', gap: 14 }}>
          <Card icon="pin" title="Local">
            <p>
              <b style={{ color: 'var(--ink)' }}>{settings.venueName}</b>
              <br />
              {settings.address}
            </p>
            <MapEmbed settings={settings} />
            <PlaceActions settings={settings} />
          </Card>
        </section>

        <section id="hub-presentes" className="hub-section" style={{ display: 'grid', gap: 14 }}>
          <Card icon="gift" title="Sugestões de presente">
            <p>{forGroup(settings.giftNote, (invite?.guests.filter((g) => !g.isPlusOne).length ?? 1) > 1)}</p>
            <GiftList settings={settings} />
            {settings.pix && <p>Pix: <b>{settings.pix}</b></p>}
          </Card>
        </section>

        <section id="hub-historia" className="hub-section" style={{ display: 'grid', gap: 14 }}>
          <Card icon="heart" title="Nossa história">
            <p>Os momentos que marcaram esse primeiro ano.</p>
            <div className="im-strip">
              {settings.story.map((c, i) => (
                <figure key={i}>
                  <img src={c.photo} alt={c.label || `Momento ${i + 1}`} loading="lazy" />
                  {c.label && <figcaption>{c.label}</figcaption>}
                </figure>
              ))}
            </div>
            <button className="g-btn ghost" onClick={onReplay}>
              <Icon name="sparkle" size={18} /> Ver a história completa
            </button>
          </Card>
        </section>

        <section id="hub-confirmacao" className="hub-section" style={{ display: 'grid', gap: 14 }}>
          <Card icon="check" title={invite ? 'Respostas do seu convite' : 'Sua resposta'}>
            {invite ? (
              <>
                <div>
                  {invite.guests.map((g) => (
                    <div key={g.id} className="hub-status">
                      <b style={{ fontWeight: 600 }}>{guestName(g)}</b>
                      <span className={`pill ${g.status}`}>{STATUS_LABEL[g.status]}</span>
                    </div>
                  ))}
                </div>
                <button className="g-btn" onClick={onManage}>Alterar resposta</button>
              </>
            ) : (
              <>
                <p>Encontre seu convite pelo nome para responder.</p>
                <button className="g-btn" onClick={onManage}>Responder agora</button>
              </>
            )}
            <ContactButtons settings={settings} me={me} />
          </Card>
        </section>
      </main>
    </div>
  )
}
