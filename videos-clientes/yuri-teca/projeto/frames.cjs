const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path')
const PAGE = '/tmp/claude-0/-home-user-Design/a301d730-512a-5d99-9d23-2d6ae1294b3b/scratchpad/talk/reel.html'
;(async () => { const [mode, a, c, out] = process.argv.slice(2)
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 }); const p = await ctx.newPage(); const errs = []
  p.on('pageerror', e => errs.push(String(e))); await p.goto('file://' + PAGE); await p.evaluate(() => window.ready); await p.waitForTimeout(500)
  const shot = async (t, file, q) => { await p.evaluate(t => render(t), t); await p.evaluate(() => window.decodeVideo()); await p.screenshot({ path: file, type: 'jpeg', quality: q }) }
  if (mode === 'snap') { const dir = '/tmp/claude-0/-home-user-Design/a301d730-512a-5d99-9d23-2d6ae1294b3b/scratchpad/talk/snap'; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); for (const t of process.argv.slice(3).map(Number)) await shot(t, dir + '/t' + t.toFixed(2) + '.jpg', 85) }
  else if (mode === 'events') { const r = await p.evaluate(async () => ({ events: await collectEvents(), total: window.TOTAL })); fs.writeFileSync('/tmp/claude-0/-home-user-Design/a301d730-512a-5d99-9d23-2d6ae1294b3b/scratchpad/talk/events.json', JSON.stringify(r)); console.log(r.events.length, 'eventos') }
  else if (mode === 'render') { fs.mkdirSync(out, { recursive: true }); for (let f = +a; f < +c; f++) await shot(f / 30, path.join(out, 'f' + String(f).padStart(5, '0') + '.jpg'), 93) }
  console.log('erros', errs.slice(0, 4)); await b.close() })()
