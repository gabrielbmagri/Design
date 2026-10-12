import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useRef, type ReactNode } from 'react'
import type { InviteMatch } from '../lib/data'
import type { EventSettings, Guest } from '../lib/types'
import { firstName, joinNames, longDate } from '../lib/text'
import type { Outcome } from './GuestApp'
import { Countdown, Sparkles, downloadIcs, googleCalendarUrl, isIOS, mapsUrl, wazeUrl } from './bits'

interface Props {
  settings: EventSettings
  outcome: Outcome
  me: Guest | null
  invite: InviteMatch | null
  onFinish: () => void
}

const reveal = {
  initial: { opacity: 0, y: 50, scale: 0.96 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, amount: 0.35 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
} as const

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div {...reveal} transition={{ ...reveal.transition, delay }} style={{ width: '100%' }}>
      {children}
    </motion.div>
  )
}

function StoryChapter({ photo, text, index }: { photo: string; text: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [60, -60])
  const rotate = useTransform(scrollYProgress, [0, 1], [index % 2 ? 4 : -4, index % 2 ? -3 : 3])
  return (
    <section className="im-section" ref={ref}>
      <motion.div className="im-photo" style={{ y, rotate }} {...reveal}>
        <img src={photo} alt={`Foto da Betina ${index + 1}`} loading="lazy" />
      </motion.div>
      <Reveal delay={0.15}>
        <p className="im-story-text">{text}</p>
      </Reveal>
    </section>
  )
}

export default function Immersion({ settings, outcome, me, invite, onFinish }: Props) {
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const going = invite?.guests.filter((g) => g.status === 'yes').map((g) => firstName(g.name)) ?? []
  const story = settings.story

  const hero = (() => {
    if (outcome === 'yes')
      return {
        eyebrow: going.length > 1 ? `${joinNames(going)}, presença confirmada!` : 'Presença confirmada!',
        title: 'Estamos muito felizes!',
        msg: settings.welcomeYes,
      }
    if (outcome === 'no') return { eyebrow: 'Resposta recebida', title: 'Obrigado por avisar', msg: settings.welcomeNo }
    if (outcome === 'maybe') return { eyebrow: 'Sem pressa', title: 'Combinado!', msg: settings.welcomeMaybe }
    return {
      eyebrow: me ? `Oi, ${firstName(me.name)}!` : 'Seja bem-vindo',
      title: settings.title,
      msg: settings.subtitle,
    }
  })()

  const blocks: ReactNode[] = [
    <section className="im-section" key="date">
      <Reveal>
        <div className="im-info">
          <div className="icon">📅</div>
          <p className="g-eyebrow">Quando</p>
          <div className="big">{longDate(settings.dateISO)}</div>
          <div className="muted">
            das {settings.timeStart}
            {settings.timeEnd && ` às ${settings.timeEnd}`}
          </div>
          <Countdown settings={settings} />
          {isIOS() ? (
            <button className="g-btn secondary" onClick={() => downloadIcs(settings)}>
              Salvar na minha agenda
            </button>
          ) : (
            <a className="g-btn secondary" href={googleCalendarUrl(settings)} target="_blank" rel="noreferrer">
              Salvar na minha agenda
            </a>
          )}
        </div>
      </Reveal>
    </section>,
    <section className="im-section" key="place">
      <Reveal>
        <div className="im-info">
          <div className="icon">📍</div>
          <p className="g-eyebrow">Onde</p>
          <div className="big">{settings.venueName}</div>
          <div className="muted">{settings.address}</div>
          <a className="g-btn" href={mapsUrl(settings)} target="_blank" rel="noreferrer">
            Abrir no mapa
          </a>
          <a className="g-btn secondary" href={wazeUrl(settings)} target="_blank" rel="noreferrer">
            Ir com Waze
          </a>
        </div>
      </Reveal>
    </section>,
    <section className="im-section" key="gifts">
      <Reveal>
        <div className="im-info">
          <div className="icon">🎁</div>
          <p className="g-eyebrow">Sugestões de presente</p>
          <p className="muted" style={{ margin: 0 }}>
            {settings.giftNote}
          </p>
          <div className="im-gifts">
            {settings.gifts.map((g, i) => (
              <motion.div
                className="im-gift"
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span style={{ fontSize: 28 }}>💝</span>
                <div>
                  <b>{g.title}</b>
                  {g.detail && <span>{g.detail}</span>}
                  {g.link && (
                    <div>
                      <a href={g.link} target="_blank" rel="noreferrer">
                        Ver sugestão →
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          {settings.pix && <p className="muted">Pix: <b>{settings.pix}</b></p>}
        </div>
      </Reveal>
    </section>,
  ]

  if (settings.dressCode)
    blocks.push(
      <section className="im-section" key="dress">
        <Reveal>
          <div className="im-info">
            <div className="icon">👗</div>
            <p className="g-eyebrow">Traje</p>
            <div className="big" style={{ fontSize: 28 }}>
              {settings.dressCode}
            </div>
          </div>
        </Reveal>
      </section>,
    )

  // intercala capítulos da história com as informações
  const sequence: ReactNode[] = []
  const max = Math.max(story.length, blocks.length)
  for (let i = 0; i < max; i++) {
    if (story[i]) sequence.push(<StoryChapter key={`s${i}`} index={i} photo={story[i].photo} text={story[i].text} />)
    if (blocks[i]) sequence.push(blocks[i])
  }

  return (
    <main className="im">
      <motion.div
        style={{
          scaleX: progress,
          transformOrigin: '0 50%',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          zIndex: 30,
          background: 'linear-gradient(90deg, var(--rose), var(--gold), var(--lilac))',
        }}
      />
      <Sparkles />

      <section className="im-section" style={{ minHeight: '100dvh' }}>
        <motion.div
          className="im-hero-badge"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 12, delay: 0.2 }}
        >
          1
        </motion.div>
        <motion.p className="g-eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          {hero.eyebrow}
        </motion.p>
        <motion.h1
          className="g-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
        >
          {hero.title}
        </motion.h1>
        <motion.div
          className="im-msg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7 }}
        >
          {hero.msg}
        </motion.div>
        <motion.div className="im-scroll-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
          Deslize para baixo
          <span>↓</span>
        </motion.div>
      </section>

      {sequence}

      <section className="im-section">
        <Reveal>
          <h2 className="g-title" style={{ fontSize: 'clamp(34px, 9vw, 48px)' }}>
            Esperamos você! 💗
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <button className="g-btn gold" onClick={onFinish}>
            Ver o convite completo
          </button>
        </Reveal>
      </section>
    </main>
  )
}
