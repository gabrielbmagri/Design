const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path')
const D = '/tmp/claude-0/-home-user-Design/a301d730-512a-5d99-9d23-2d6ae1294b3b/scratchpad/reel/'
;(async () => { const [mode, a, c, out] = process.argv.slice(2)
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 }); const p = await ctx.newPage(); const errs = []
  p.on('pageerror', e => errs.push(String(e))); await p.goto('file://' + D + 'reel5.html'); await p.evaluate(() => window.ready); await p.waitForTimeout(600)
  if (mode === 'snap') { const dir = D + 'g5/snap'; fs.mkdirSync(dir, { recursive: true }); for (const t of [a, c, out].filter(Boolean).map(Number).concat(process.argv.slice(6).map(Number))) { await p.evaluate(t => render(t), t); await p.evaluate(() => window.decodeVideo()); await p.waitForTimeout(60); await p.screenshot({ path: `${dir}/t${String(t).replace('.', '_')}.jpg`, type: 'jpeg', quality: 88 }) } }
  else if (mode === 'events') { const r = await p.evaluate(async () => ({ events: await collectEvents(), total: window.TOTAL, t0: window.T0 })); fs.writeFileSync('/tmp/claude-0/-home-user-Design/a301d730-512a-5d99-9d23-2d6ae1294b3b/scratchpad/reel/g5/events.json', JSON.stringify(r)); console.log(r.events.length, 'eventos; total', r.total) }
  else if (mode === 'render') { fs.mkdirSync(out, { recursive: true }); for (let f = +a; f < +c; f++) { await p.evaluate(t => render(t), f / 30); await p.evaluate(() => window.decodeVideo()); await p.screenshot({ path: path.join(out, `f${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 }) } }
  console.log('erros', errs.slice(0, 4)); await b.close() })()
