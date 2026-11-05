const { chromium } = require('playwright'); const D = __dirname + '/'
;(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const ctx = await b.newContext({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: 1 })
  for (const n of [1, 2, 3]) { const p = await ctx.newPage(); await p.goto(`file://${D}marca.html?p=${n}`); await p.evaluate(() => window.ready); await p.waitForTimeout(700); await p.screenshot({ path: `${D}marca-proposta-${n}.png` }); await p.close() }
  await b.close() })()
