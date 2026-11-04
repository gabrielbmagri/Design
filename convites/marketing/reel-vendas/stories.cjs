const { chromium } = require('playwright'); const D = __dirname + '/'; const fs = require('fs')
const N = { como: 6, temas: 3, painel: 4, duvidas: 3 }
;(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
  fs.mkdirSync(D + 'stories', { recursive: true })
  const only = process.argv[2]
  for (const [hl, n] of Object.entries(N)) { if (only && only !== hl) continue
    for (let s = 1; s <= n; s++) { const p = await ctx.newPage(); await p.goto(`file://${D}stories.html?h=${hl}&s=${s}`); await p.evaluate(() => window.ready); await p.waitForTimeout(400); await p.screenshot({ path: `${D}stories/${hl}-${s}.png` }); await p.close() }
    const p = await ctx.newPage(); await p.goto(`file://${D}stories.html?h=${hl}&cover=1`); await p.evaluate(() => window.ready); await p.waitForTimeout(400); await p.screenshot({ path: `${D}stories/capa-${hl}.png` }); await p.close() }
  await b.close() })()
