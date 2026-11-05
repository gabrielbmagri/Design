import { useEffect, useRef } from 'react'

/** Chuva de confete curta (≈2,5 s) quando o convidado confirma presença. Respeita "reduzir movimento". */
export default function Confetti({ colors }: { colors: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const cv = ref.current
    if (!cv) return
    const cx = cv.getContext('2d')
    if (!cx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = (cv.width = innerWidth * dpr), H = (cv.height = innerHeight * dpr)
    const rnd = (a: number, b: number) => a + Math.random() * (b - a)
    const N = 140
    const ps = Array.from({ length: N }, (_, i) => ({
      x: W / 2 + rnd(-W * 0.1, W * 0.1), y: H * 0.42, vx: rnd(-1, 1) * W * 0.012, vy: rnd(-1.15, -0.35) * H * 0.018,
      w: rnd(6, 11) * dpr, h: rnd(10, 18) * dpr, r: rnd(0, Math.PI), vr: rnd(-0.3, 0.3), c: colors[i % colors.length], shape: i % 4,
    }))
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const k = (t - t0) / 1000
      cx.clearRect(0, 0, W, H)
      for (const p of ps) {
        p.vy += H * 0.0006; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.globalAlpha = Math.max(0, 1 - Math.max(0, k - 1.6) / 0.9); cx.fillStyle = p.c
        if (p.shape === 0) { cx.beginPath(); cx.arc(0, 0, p.w * 0.6, 0, 6.3); cx.fill() } else cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * (p.shape === 1 ? 0.5 : 1))
        cx.restore()
      }
      if (k < 2.6) raf = requestAnimationFrame(tick)
      else cx.clearRect(0, 0, W, H)
    }
    const start = setTimeout(() => (raf = requestAnimationFrame(tick)), 450)
    return () => { clearTimeout(start); cancelAnimationFrame(raf) }
  }, [colors])
  return <canvas ref={ref} aria-hidden="true" style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 60 }} />
}
