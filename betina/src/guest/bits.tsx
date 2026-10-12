import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { EventSettings } from '../lib/types'
import { parseISODate } from '../lib/text'

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

export function Sparkles({ count = 26 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, k) => ({
        k,
        heart: k % 4 === 0,
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
          className={s.heart ? 'heart' : ''}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.heart ? s.dur * 2 : s.dur}s`,
            transform: `scale(${s.size})`,
          }}
        >
          {s.heart ? '♥' : null}
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
  return s.wazeUrl || `https://waze.com/ul?q=${encodeURIComponent(s.address)}&navigate=yes`
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
