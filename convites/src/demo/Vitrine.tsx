import { useEffect, useRef, useState } from 'react'
import { __resetDemo } from './firestore'
import { PRESET_KEY, currentPreset } from './seed'

/** Demonstração para clientes: só o convite. Alterna menino/menina e mostra sozinha a convidada "Maria" entrando no convite dela. */
const CONTACT = (import.meta.env.VITE_DEMO_WA_URL as string | undefined) || 'https://instagram.com/meuconfetedigital'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const setValue = (el: HTMLInputElement, v: string) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, v)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}
async function waitFor<T>(fn: () => T | null | undefined, alive: () => boolean, ms = 15000): Promise<T | null> {
  const t0 = Date.now()
  while (alive() && Date.now() - t0 < ms) { const v = fn(); if (v) return v; await sleep(120) }
  return null
}
const byText = (sel: string, txt: RegExp) => [...document.querySelectorAll<HTMLElement>(sel)].find((b) => txt.test(b.textContent || ''))

export default function Vitrine() {
  const cur = currentPreset()
  const [tip, setTip] = useState('')
  const [done, setDone] = useState(false)
  const alive = useRef(true)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = '#root{padding-top:66px}.im-progress{top:66px!important}'
    document.head.appendChild(style)
    const stop = (e: Event) => { if (e.isTrusted) { alive.current = false; setTip('') } }
    addEventListener('pointerdown', stop, true); addEventListener('keydown', stop, true)
    const run = async () => {
      const ok = () => alive.current
      const input = await waitFor(() => document.querySelector<HTMLInputElement>('#nome'), ok)
      if (!input || !ok()) return
      // os convidados de exemplo entram em segundo plano: espera estarem prontos antes de digitar
      const ready = () => { try { return Object.keys(JSON.parse(localStorage.getItem('convite-demo-db') || '{}')['events/principal/guests'] || {}).length >= 8 } catch { return false } }
      await waitFor(() => ready(), ok, 20000)
      setTip('A Maria recebeu o link no WhatsApp e abriu o convite 💌')
      await sleep(2600)
      if (!ok()) return
      setTip('Ela só digita o nome…')
      for (const ch of 'maria') { if (!ok()) return; setValue(input, input.value + ch); await sleep(210) }
      await sleep(650)
      byText('button[type=submit]', /Continuar/)?.click()
      const yes = await waitFor(() => byText('button', /Sim, sou eu/), ok)
      if (!yes || !ok()) return
      setTip('O convite reconhece a família dela ✨')
      await sleep(1700); if (!ok()) return
      yes.click()
      const all = await waitFor(() => document.querySelector<HTMLElement>('.g-allyes'), ok)
      if (!all || !ok()) return
      setTip('E ela responde pela família toda, em 1 toque')
      await sleep(1500); if (!ok()) return
      all.click(); await sleep(900); if (!ok()) return
      document.querySelector<HTMLElement>('.g-sticky .g-btn')?.click()
      await waitFor(() => document.querySelector('.im'), ok)
      setTip('Pronto! Agora é a história, feita pra Maria. Role a tela 👇')
      setDone(true)
      await sleep(5200); if (ok()) setTip('')
    }
    void run()
    return () => { alive.current = false; removeEventListener('pointerdown', stop, true); removeEventListener('keydown', stop, true); style.remove() }
  }, [])

  const pick = (id: string) => {
    if (id === cur.id) return
    __resetDemo()
    try { localStorage.setItem(PRESET_KEY, id); localStorage.removeItem('convite.me') } catch { /* ignore */ }
    location.reload()
  }
  const restart = () => { __resetDemo(); try { localStorage.setItem(PRESET_KEY, cur.id); localStorage.removeItem('convite.me') } catch { /* ignore */ } location.reload() }

  const seg = (id: string, label: string, emoji: string) => (
    <button onClick={() => pick(id)} aria-pressed={cur.id === id} style={{ border: 0, borderRadius: 999, padding: '9px 16px', font: '800 14px "Plus Jakarta Sans", system-ui, sans-serif', cursor: 'pointer', background: cur.id === id ? '#2A1B3D' : 'transparent', color: cur.id === id ? '#fff' : '#2A1B3D', transition: 'background .2s' }}>
      {emoji} {label}
    </button>
  )
  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 66, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '0 12px', background: 'rgba(255,248,236,.94)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(42,27,61,.08)', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', color: '#2A1B3D' }}>
        <div style={{ display: 'grid', lineHeight: 1.15, minWidth: 0 }}>
          <span style={{ whiteSpace: 'nowrap', font: '800 13px "Plus Jakarta Sans", system-ui, sans-serif' }}>Veja como fica</span>
          <span style={{ font: '500 11.5px "Plus Jakarta Sans", system-ui, sans-serif', opacity: 0.7 }}>escolha o convite de exemplo</span>
        </div>
        <div style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 999, background: '#FFD84D', flex: 'none' }}>
          {seg('safari', 'Menino', '👦')}
          {seg('jardim', 'Menina', '👧')}
        </div>
        <button onClick={restart} aria-label="Ver desde o início" title="Ver desde o início" style={{ border: 0, background: 'transparent', font: '800 18px system-ui', color: '#2A1B3D', cursor: 'pointer', padding: 6, flex: 'none' }}>↺</button>
      </div>
      {tip && (
        <div role="status" style={{ position: 'fixed', left: 12, right: 12, bottom: done ? 86 : 18, zIndex: 1000, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ maxWidth: 420, background: '#2A1B3D', color: '#fff', borderRadius: 18, padding: '12px 16px', font: '700 14.5px/1.3 "Plus Jakarta Sans", system-ui, sans-serif', boxShadow: '0 10px 30px rgba(42,27,61,.3)', textAlign: 'center' }}>{tip}</span>
        </div>
      )}
      {done && (
        <a href={CONTACT} target="_blank" rel="noreferrer" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 16, zIndex: 1000, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#22C55E', color: '#fff', textDecoration: 'none', borderRadius: 999, padding: '14px 22px', font: '800 15px "Plus Jakarta Sans", system-ui, sans-serif', boxShadow: '0 12px 30px rgba(20,120,60,.35)', whiteSpace: 'nowrap' }}>
          💛 Quero um desses pra minha festa
        </a>
      )}
    </>
  )
}
