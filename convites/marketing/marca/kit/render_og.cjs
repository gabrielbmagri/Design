const { chromium } = require('playwright'); const D = __dirname + '/'; const fs = require('fs'); fs.mkdirSync(D + 'out/og', { recursive: true })
;(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const c = await b.newContext({ viewport: { width: 1200, height: 630 } })
  for (const [n, f] of [['og_link', 'link'], ['og_exemplo', 'exemplo']]) { const p = await c.newPage(); const e = []; p.on('pageerror', x => e.push(String(x))); await p.goto(`file://${D}kit.html?p=${n}&frame=1`); await p.evaluate(() => window.ready); await p.waitForTimeout(500); await p.screenshot({ path: `${D}out/og/${f}.jpg`, type: 'jpeg', quality: 88 }); console.log(f, e) }
  await b.close() })()
