import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useRef, type ReactNode } from 'react'
import type { InviteMatch } from '../lib/data'
import type { EventSettings, Guest } from '../lib/types'
import { firstName, joinNames, longDate, waLink } from '../lib/text'
import Icon, { type IconName } from '../lib/Icon'
import type { Outcome } from './GuestApp'
import {
  Countdown, FloatingAnimals, GiftList, LifeCounter, MapEmbed, Sparkles, WordReveal, downloadIcs, googleCalendarUrl,
  hostContacts, isIOS, mapsUrl, placeLabel, timeLabel, wazeUrl,
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

function Moment({ photo, text, label, index }: { photo: string; text: string; label?: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [30, -30])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.12, 1])
  return (
    <div className="im-moment" ref={ref}>
      {label && (
        <motion.p className="g-eyebrow" initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          {label}
        </motion.p>
      )}
      <motion.div
        className="im-photo"
        style={{ y }}
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.8, ease }}
      >
        <motion.img src={photo} alt={`Foto da Betina ${index + 1}`} loading="lazy" style={{ scale: imgScale }} />
      </motion.div>
      <WordReveal text={text} className="im-story" />
    </div>
  )
}

function Timeline({ items, offset }: { items: EventSettings['story']; offset: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] })
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 25 })
  if (!items.length) return null
  return (
    <div className="im-timeline" ref={ref}>
      <div className="im-timeline-rail">
        <motion.span style={{ scaleY: fill }} />
      </div>
      {items.map((c, i) => (
        <Moment key={i} index={offset + i} photo={c.photo} text={c.text} label={c.label} />
      ))}
    </div>
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
  const names = invite ? joinNames(invite.guests.map((g) => firstName(g.name))) : me ? firstName(me.name) : ''
  const many = (invite?.guests.length ?? 1) > 1

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

  const half = Math.ceil(settings.story.length / 2)
  return (
    <main className="im">
      <motion.div className="im-progress" style={{ scaleX: progress }} />
      <div className="im-glow" />
      <Sparkles />
      <FloatingAnimals />

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

      <section className="im-section">
        <WordReveal text={settings.introText} className="im-intro" />
        <Reveal delay={0.2}>
          <p className="g-small">
            {names ? `${names}, ${many ? 'vocês fazem' : 'você faz'} parte dela.` : 'E você faz parte dela.'}
          </p>
        </Reveal>
      </section>

      <section className="im-section" style={{ paddingTop: 24 }}>
        <Reveal>
          <LifeCounter birthISO={settings.birthISO} name={settings.childName} />
        </Reveal>
      </section>

      <Timeline items={settings.story.slice(0, half)} offset={0} />

      {cards.slice(0, 2)}

      {settings.inviteImage && (
        <section className="im-section">
          <Reveal>
            <p className="g-eyebrow">O convite</p>
          </Reveal>
          <motion.div
            className="im-invite"
            initial={{ opacity: 0, y: 40, rotate: -4, scale: 0.92 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: 'spring', stiffness: 70, damping: 15 }}
          >
            <img src={settings.inviteImage} alt={`Convite: ${settings.title}`} />
          </motion.div>
          <Reveal delay={0.1}>
            <p className="g-small">{placeLabel(settings)}</p>
          </Reveal>
        </section>
      )}

      <Timeline items={settings.story.slice(half)} offset={half} />

      {cards.slice(2)}

      {settings.letter && (
        <section className="im-section">
          <Reveal>
            <div className="im-letter">
              <span className="to">{names ? `Para ${names},` : 'Para você,'}</span>
              <p>{settings.letter}</p>
              <span className="sign">{settings.letterSign}</span>
            </div>
          </Reveal>
        </section>
      )}

      <section className="im-section" style={{ paddingBottom: 96 }}>
        <Reveal>
          <h2 className="g-title">
            {names ? <>{names}, <span className="im-shine">{many ? 'esperamos vocês!' : 'esperamos você!'}</span></> : <span className="im-shine">Esperamos você!</span>}
          </h2>
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
