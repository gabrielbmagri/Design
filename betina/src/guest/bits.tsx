import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { EventSettings } from '../lib/types'
import { fmtTime, parseISODate } from '../lib/text'

export function Carousel({ photos, interval = 3800 }: { photos: string[]; interval?: number }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (photos.length < 2) return
    const t = setInterval(() => setI((x) => (x + 1) % photos.length), interval)
    return () => clearInterval(t)
  }, [photos.length, interval])
  // pré-carrega a próxima foto
  useEffect(() => {
    const next = photos[(i + 1) % photos.length]
    if (next) new Image().src = next
  }, [i, photos])
  if (!photos.length) return null
  return (
    <div className="g-carousel" aria-hidden="true">
      <AnimatePresence initial={false}>
        <motion.img
          key={photos[i]}
          src={photos[i]}
          alt=""
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.2 }, scale: { duration: interval / 1000 + 1.2, ease: 'linear' } }}
        />
      </AnimatePresence>
      <div className="g-dots">
        {photos.map((_, k) => (
          <span key={k} className={k === i ? 'on' : ''} />
        ))}
      </div>
    </div>
  )
}

const FARM = ['🐷', '🐮', '🐴', '🐔', '🐰', '🌼', '🐑', '🤠', '💗']

export function Sparkles({ count = 26 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, k) => ({
        k,
        emoji: k % 3 === 0 ? FARM[k % FARM.length] : '',
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 4,
        dur: 2.6 + Math.random() * 3,
        size: 0.6 + Math.random() * 1.2,
      })),
    [count],
  )
  return (
    <div className="im-sparkles" aria-hidden="true">
      {items.map((s) => (
        <i
          key={s.k}
          className={s.emoji ? 'emoji' : ''}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.emoji ? s.dur * 2.2 : s.dur}s`,
            transform: `scale(${s.size})`,
          }}
        >
          {s.emoji || null}
        </i>
      ))}
    </div>
  )
}

export function eventStart(s: EventSettings) {
  const d = parseISODate(s.dateISO)
  const [h, m] = (s.timeStart || '00:00').split(':').map(Number)
  d.setHours(h || 0, m || 0, 0, 0)
  return d
}

export function eventEnd(s: EventSettings) {
  const d = parseISODate(s.dateISO)
  const [h, m] = (s.timeEnd || s.timeStart || '00:00').split(':').map(Number)
  d.setHours(h || 0, m || 0, 0, 0)
  if (!s.timeEnd) d.setHours(d.getHours() + 4)
  return d
}

export function Countdown({ settings }: { settings: EventSettings }) {
  const target = eventStart(settings).getTime()
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const diff = Math.max(0, target - now)
  if (!diff) return <p className="muted">É hoje! 🎉</p>
  const d = Math.floor(diff / 864e5)
  const h = Math.floor((diff / 36e5) % 24)
  const m = Math.floor((diff / 6e4) % 60)
  const s = Math.floor((diff / 1e3) % 60)
  return (
    <div className="im-countdown" aria-label={`Faltam ${d} dias`}>
      <div><b>{d}</b><small>dias</small></div>
      <div><b>{h}</b><small>horas</small></div>
      <div><b>{m}</b><small>min</small></div>
      <div><b>{s}</b><small>seg</small></div>
    </div>
  )
}

const pad = (n: number) => String(n).padStart(2, '0')
const stamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`

export function googleCalendarUrl(s: EventSettings) {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: s.title,
    dates: `${stamp(eventStart(s))}/${stamp(eventEnd(s))}`,
    details: `${s.subtitle}\n${window.location.origin}`,
    location: `${s.venueName} — ${s.address}`,
  })
  return `https://calendar.google.com/calendar/render?${p}`
}

export function downloadIcs(s: EventSettings) {
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//betina//convite//PT', 'BEGIN:VEVENT',
    `UID:betina-${s.dateISO}@convite`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(eventStart(s))}`,
    `DTEND:${stamp(eventEnd(s))}`,
    `SUMMARY:${s.title}`,
    `LOCATION:${s.venueName} - ${s.address}`.replace(/,/g, '\\,'),
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${s.title}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'aniversario-betina.ics'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function mapsUrl(s: EventSettings) {
  return s.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.venueName} ${s.address}`)}`
}

export function wazeUrl(s: EventSettings) {
  return s.wazeUrl || `https://waze.com/ul?q=${encodeURIComponent(placeLabel(s))}&navigate=yes`
}

export function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [text, onDone])
  return (
    <motion.div className="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} role="status">
      {text}
    </motion.div>
  )
}

export function timeLabel(s: EventSettings) {
  return s.timeEnd ? `das ${fmtTime(s.timeStart)} às ${fmtTime(s.timeEnd)}` : `às ${fmtTime(s.timeStart)}`
}

export function placeLabel(s: EventSettings) {
  return [s.venueName, s.address].filter(Boolean).join(', ')
}

export function mapEmbedUrl(s: EventSettings) {
  const q = s.mapsQuery || placeLabel(s)
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&hl=pt-BR&z=16&output=embed`
}

export function MapEmbed({ settings }: { settings: EventSettings }) {
  if (import.meta.env.MODE === 'demo')
    return (
      <div className="im-map" style={{ display: 'grid', placeItems: 'center', padding: 16, textAlign: 'center', color: 'var(--ink-soft)', fontWeight: 700 }}>
        🗺️ Aqui aparece o mapa do Google com o salão marcado (só no site publicado).
      </div>
    )
  return (
    <div className="im-map">
      <iframe
        title={`Mapa: ${settings.venueName}`}
        src={mapEmbedUrl(settings)}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  )
}

/** Contatos para "Falar com…": o anfitrião do convite, ou os dois para visitantes. */
export function hostContacts(s: EventSettings, host?: 'gabriel' | 'luiza') {
  const all = [
    { host: 'gabriel' as const, label: 'Falar com o Gabriel', phone: s.gabrielPhone || s.hostsPhone },
    { host: 'luiza' as const, label: 'Falar com a Luiza', phone: s.luizaPhone || s.hostsPhone },
  ].filter((c) => c.phone)
  const mine = host ? all.filter((c) => c.host === host) : []
  return mine.length ? mine : all
}

const GIFT_ICONS: [RegExp, string][] = [
  [/livr/i, '📚'], [/educativ|quebra|bloco/i, '🧩'], [/anima/i, '🐮'], [/bonec/i, '🧸'],
  [/sapat|cal[cç]ad|t[eê]nis/i, '👟'], [/roup|vestid|body/i, '👗'],
]
const giftIcon = (title: string) => GIFT_ICONS.find(([re]) => re.test(title))?.[1] ?? '🎁'

export function GiftList({ settings, animate = false }: { settings: EventSettings; animate?: boolean }) {
  const groups: { name: string; items: EventSettings['gifts'] }[] = []
  for (const g of settings.gifts) {
    const name = g.group || ''
    let grp = groups.find((x) => x.name === name)
    if (!grp) groups.push((grp = { name, items: [] }))
    grp.items.push(g)
  }
  let i = 0
  return (
    <div className="im-gifts">
      {groups.map((grp) => (
        <div key={grp.name} style={{ display: 'grid', gap: 10 }}>
          {grp.name && <h3 className="im-gift-group">{grp.name}:</h3>}
          {grp.items.map((g) => {
            const k = i++
            return (
              <motion.div
                className="im-gift"
                key={k}
                initial={animate ? { opacity: 0, x: -30 } : false}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (k % 6) * 0.08 }}
              >
                <span style={{ fontSize: 28 }}>{giftIcon(g.title)}</span>
                <div>
                  <b>{g.title}</b>
                  {g.detail && <span>{g.detail}</span>}
                  {g.link && (
                    <div>
                      <a href={g.link} target="_blank" rel="noreferrer">Ver sugestão →</a>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
