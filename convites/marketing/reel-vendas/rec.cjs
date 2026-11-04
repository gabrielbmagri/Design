// Grava a experiência do convidado (tela real, com os emojis caindo) via screencast do Chromium
const { chromium, devices } = require('playwright'); const fs = require('fs')
const D = '/tmp/claude-0/-home-user-Design/a301d730-512a-5d99-9d23-2d6ae1294b3b/scratchpad/reel/rec/'
const preset = process.argv[2] || 'safari'
;(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await c.addInitScript((p) => { try { localStorage.setItem('convite-demo-preset', p); localStorage.setItem('convite-demo-reel', '1') } catch {} }, preset)
  const p = await c.newPage(); await p.goto('http://127.0.0.1:5180/')
  await p.waitForFunction(() => { try { return Object.keys(JSON.parse(localStorage.getItem('convite-demo-db') || '{}')['events/principal/guests'] || {}).length >= 50 } catch { return false } }, null, { timeout: 60000 })
  await p.reload(); await p.waitForTimeout(1500)
  await p.addStyleTag({ content: 'div[style*="z-index: 999"]{display:none!important}' })
  await p.waitForTimeout(700)
  const cdp = await c.newCDPSession(p); const frames = []
  cdp.on('Page.screencastFrame', async (f) => { frames.push({ ts: f.metadata.timestamp, data: f.data }); try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }) } catch {} })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 82, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 })
  const t0 = Date.now(); const ev = []; const now = () => (Date.now() - t0) / 1000
  await p.waitForTimeout(1700)
  await p.locator('#nome').click(); ev.push({ t: now(), type: 'tap' })
  for (const ch of 'marina almeida') { await p.keyboard.type(ch); ev.push({ t: now(), type: 'key' }); await p.waitForTimeout(70) }
  await p.waitForTimeout(450)
  ev.push({ t: now(), type: 'tap' }); await p.getByRole('button', { name: /^Continuar/ }).click(); await p.waitForTimeout(800)
  ev.push({ t: now(), type: 'tap' }); await p.getByRole('button', { name: 'Sim, sou eu' }).click(); await p.waitForTimeout(1000)
  ev.push({ t: now(), type: 'tap' }); await p.getByRole('button', { name: /Enviar resposta|Continuar/ }).click()
  ev.push({ t: now() + .35, type: 'chime' }); await p.waitForTimeout(2600)
  // rolagem suave da história
  const start = now()
  await p.evaluate(() => new Promise((res) => { let y = 0; const t0 = performance.now(); const step = (t) => { const k = Math.min(1, (t - t0) / 3400); y = 2900 * (k * k * (3 - 2 * k)); window.scrollTo(0, y); k < 1 ? requestAnimationFrame(step) : res() }; requestAnimationFrame(step) }))
  ev.push({ t: start, type: 'swipe' })
  await p.waitForTimeout(500)
  const dur = now(); await cdp.send('Page.stopScreencast'); await b.close()
  // reamostra para 30 quadros por segundo
  const t_first = frames[0].ts; const N = Math.floor((frames[frames.length - 1].ts - t_first) * 30)
  const out = []; let j = 0
  for (let k = 0; k < N; k++) { const t = t_first + k / 30; while (j + 1 < frames.length && frames[j + 1].ts <= t) j++; const name = `r${String(j).padStart(4, '0')}.jpg`; if (!fs.existsSync(D + name)) fs.writeFileSync(D + name, Buffer.from(frames[j].data, 'base64')); out.push(name) }
  // os tempos dos eventos vêm de relógio de parede; alinha ao primeiro quadro
  const wall0 = frames[0].ts
  fs.writeFileSync(D + 'meta.js', 'window.REC = ' + JSON.stringify({ frames: out, events: ev, duration: N / 30 }))
  console.log('quadros brutos', frames.length, '-> 30fps', out.length, 'duração', (N / 30).toFixed(1), 's; eventos', ev.length)
})()
