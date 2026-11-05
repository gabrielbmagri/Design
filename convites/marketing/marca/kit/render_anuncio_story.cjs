const { chromium } = require('playwright'); const D = __dirname + '/'
;(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const c = await b.newContext({ viewport: { width: 1080, height: 1920 } }); const p = await c.newPage(); const e = []; p.on('pageerror', x => e.push(String(x)))
  await p.goto(`file://${D}kit.html?p=ad_story&frame=1`); await p.evaluate(() => window.ready); await p.waitForTimeout(500); await p.screenshot({ path: `${D}out/pecas/anuncio-story.png` }); console.log(e); await b.close() })()
