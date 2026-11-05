const { chromium } = require('playwright'); const D = __dirname + '/'
;(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const c = await b.newContext({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 })
  for (const n of ['ad1', 'ad2']) { const p = await c.newPage(); const e = []; p.on('pageerror', x => e.push(String(x))); await p.goto(`file://${D}kit.html?p=${n}&frame=1`); await p.evaluate(() => window.ready); await p.waitForTimeout(600); await p.screenshot({ path: `${D}out/pecas/${n}.png` }); console.log(n, e) }
  await b.close() })()
