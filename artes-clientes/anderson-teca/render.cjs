const { chromium } = require('playwright')
;(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] })
  for (const [f, h] of [['feed', 1350], ['story', 1920]]) { const p = await (await b.newContext({ viewport: { width: 1080, height: h }, deviceScaleFactor: 1 })).newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)))
    await p.goto('file:///tmp/claude-0/-home-user-Design/a301d730-512a-5d99-9d23-2d6ae1294b3b/scratchpad/teca/arte2.html?f=' + f); await p.evaluate(() => window.ready); await p.waitForTimeout(400)
    await p.screenshot({ path: '/tmp/claude-0/-home-user-Design/a301d730-512a-5d99-9d23-2d6ae1294b3b/scratchpad/teca/out2-' + f + '.png' }); console.log(f, 'erros', errs) }
  await b.close() })()
