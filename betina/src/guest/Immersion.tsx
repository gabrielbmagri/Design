import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useRef, type ReactNode } from 'react'
import type { InviteMatch } from '../lib/data'
import type { EventSettings, Guest } from '../lib/types'
import { firstName, joinNames, longDate, waLink } from '../lib/text'
import Icon, { type IconName } from '../lib/Icon'
import type { Outcome } from './GuestApp'
import {
  Countdown, GiftList, MapEmbed, Sparkles, downloadIcs, googleCalendarUrl, hostContacts, isIOS, mapsUrl,
  placeLabel, timeLabel, wazeUrl,
} from './bits'

interface Props {
  settings: EventSettings
  outcome: Outcome
  me: Guest | null
  invite: InviteMatch | null
  onFinish: () => void
}

const ease = [0.22, 1, 0.36, 1] as const

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease, delay }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {children}
    </motion.div>
  )
}

function Chapter({ photo, text, index }: { photo: string; text: string; index: number }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [40, -40])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 0.98])
  return (
    <section className="im-section" ref={ref}>
      <motion.div className="im-photo" style={{ y, scale }}>
        <img src={photo} alt={`Foto da Betina ${index + 1}`} loading="lazy" />
      </motion.div>
      <Reveal delay={0.1}>
        <p className="im-story">{text}</p>
      </Reveal>
    </section>
  )
}

function InfoCard({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <section className="im-section" style={{ paddingBlock: 40 }}>
      <Reveal>
        <div className="im-card">
          <div className="im-card-head">
            <span className="im-icon"><Icon name={icon} size={22} /></span>
            <h3>{title}</h3>
          </div>
          {children}
        </div>
      </Reveal>
    </section>
  )
}

export function CalendarButton({ settings }: { settings: EventSettings }) {
  return isIOS() ? (
    <button className="g-btn ghost" onClick={() => downloadIcs(settings)}>
      <Icon name="calendar" size={18} /> Salvar na agenda
    </button>
  ) : (
    <a className="g-btn ghost" href={googleCalendarUrl(settings)} target="_blank" rel="noreferrer">
      <Icon name="calendar" size={18} /> Salvar na agenda
    </a>
  )
}

export function PlaceActions({ settings }: { settings: EventSettings }) {
  return (
    <div className="im-actions">
      <a className="g-btn" href={mapsUrl(settings)} target="_blank" rel="noreferrer">
        <Icon name="map" size={18} /> Google Maps
      </a>
      <a className="g-btn outline" href={wazeUrl(settings)} target="_blank" rel="noreferrer">
        Waze
      </a>
    </div>
  )
}

export function ContactButtons({ settings, me }: { settings: EventSettings; me: Guest | null }) {
  return (
    <>
      {hostContacts(settings, me?.host).map((c) => (
        <a
          key={c.host}
          className="g-btn outline"
          href={waLink(c.phone, `Oi, ${c.host === 'gabriel' ? 'Gabriel' : 'Luiza'}! Tenho uma dúvida sobre o aniversário da ${settings.childName}.`)}
          target="_blank"
          rel="noreferrer"
        >
          <Icon name="chat" size={18} /> {c.label}
        </a>
      ))}
    </>
  )
}

export default function Immersion({ settings, outcome, me, invite, onFinish }: Props) {
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const going = invite?.guests.filter((g) => g.status === 'yes').map((g) => firstName(g.name)) ?? []

  const hero = (() => {
    if (outcome === 'yes')
      return {
        eyebrow: going.length > 1 ? `${joinNames(going)} confirmados` : 'Presença confirmada',
        title: 'Que alegria ter você com a gente!',
        msg: settings.welcomeYes,
      }
    if (outcome === 'no') return { eyebrow: 'Resposta recebida', title: 'Obrigado por avisar', msg: settings.welcomeNo }
    if (outcome === 'maybe') return { eyebrow: 'Sem pressa', title: 'Tudo bem, combinado', msg: settings.welcomeMaybe }
    return {
      eyebrow: me ? `Oi, ${firstName(me.name)}` : 'Você está convidado',
      title: settings.title,
      msg: settings.subtitle,
    }
  })()

  const cards: ReactNode[] = [
    <InfoCard key="when" icon="calendar" title="Quando">
      <p>
        <b style={{ color: 'var(--ink)' }}>{longDate(settings.dateISO)}</b>, {timeLabel(settings)}
      </p>
      <Countdown settings={settings} />
      <CalendarButton settings={settings} />
    </InfoCard>,
    <InfoCard key="where" icon="pin" title="Onde">
      <p>
        <b style={{ color: 'var(--ink)' }}>{settings.venueName}</b>
        <br />
        {settings.address}
      </p>
      <MapEmbed settings={settings} />
      <PlaceActions settings={settings} />
    </InfoCard>,
    <InfoCard key="gifts" icon="gift" title="Sugestões de presente">
      <p>{settings.giftNote}</p>
      <GiftList settings={settings} animate />
      {settings.pix && <p>Pix: <b>{settings.pix}</b></p>}
    </InfoCard>,
  ]
  if (settings.dressCode)
    cards.push(
      <InfoCard key="dress" icon="shirt" title="Dica de traje">
        <p>{settings.dressCode}</p>
      </InfoCard>,
    )

  const sequence: ReactNode[] = []
  const max = Math.max(settings.story.length, cards.length)
  for (let i = 0; i < max; i++) {
    const c = settings.story[i]
    if (c) sequence.push(<Chapter key={`s${i}`} index={i} photo={c.photo} text={c.text} />)
    if (cards[i]) sequence.push(cards[i])
  }

  return (
    <main className="im">
      <motion.div className="im-progress" style={{ scaleX: progress }} />
      <div className="im-glow" />
      <Sparkles />

      <section className="im-section im-hero">
        <motion.div
          className="im-badge"
          initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 14, delay: 0.15 }}
        >
          1
        </motion.div>
        <motion.p className="g-eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {hero.eyebrow}
        </motion.p>
        <motion.h1
          className="g-title"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6, ease }}
        >
          {hero.title}
        </motion.h1>
        <motion.p className="im-msg" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.6, ease }}>
          {hero.msg}
        </motion.p>
        <motion.div className="im-scroll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
          Deslize para baixo
          <Icon name="chevronDown" size={22} />
        </motion.div>
      </section>

      {settings.inviteImage && (
        <section className="im-section">
          <motion.div
            className="im-invite"
            initial={{ opacity: 0, y: 40, rotate: -3 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease }}
          >
            <img src={settings.inviteImage} alt={`Convite: ${settings.title}`} />
          </motion.div>
          <Reveal delay={0.1}>
            <p className="g-small">{placeLabel(settings)}</p>
          </Reveal>
        </section>
      )}

      {sequence}

      <section className="im-section" style={{ paddingBottom: 96 }}>
        <Reveal>
          <h2 className="g-h2">Esperamos você!</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div style={{ display: 'grid', gap: 10, width: '100%' }}>
            <button className="g-btn" onClick={onFinish}>
              Ver convite completo <Icon name="arrowRight" size={18} />
            </button>
            <ContactButtons settings={settings} me={me} />
          </div>
        </Reveal>
      </section>
    </main>
  )
}
