const { chromium } = require('playwright'); const D = __dirname + '/'
;(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const ctx = await b.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })
  for (let s = 1; s <= 6; s++) { const p = await ctx.newPage(); await p.goto('file://' + D + 'post2.html?s=' + s); await p.evaluate(() => window.ready); await p.waitForTimeout(500); await p.screenshot({ path: D + `post2-jardim-${s}.png` }) }
  await b.close() })()
