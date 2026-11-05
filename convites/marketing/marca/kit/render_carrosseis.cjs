const { chromium } = require('playwright'); const D = __dirname + '/'; const fs = require('fs')
;(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const c = await b.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 }); fs.mkdirSync(D + 'out/carrosseis', { recursive: true })
  for (let k = 1; k <= 3; k++) for (let s = 1; s <= 6; s++) { const n = `c${k}s${s}`; const p = await c.newPage(); const e = []; p.on('pageerror', x => e.push(String(x))); await p.goto(`file://${D}kit.html?p=${n}&frame=1`); await p.evaluate(() => window.ready); await p.waitForTimeout(350); await p.screenshot({ path: `${D}out/carrosseis/carrossel${k}-${s}.png` }); await p.close(); if (e.length) console.log(n, e) }
  await b.close() })()
