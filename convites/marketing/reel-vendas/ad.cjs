const { chromium } = require('playwright'); const D = __dirname + '/'
;(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const ctx = await b.newContext({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 })
  for (const t of ['safari', 'jardim']) { const p = await ctx.newPage(); await p.goto('file://' + D + 'ad.html?t=' + t); await p.evaluate(() => window.ready); await p.waitForTimeout(600); await p.screenshot({ path: D + `anuncio-${t}-1x1.png` }) }
  await b.close() })()
