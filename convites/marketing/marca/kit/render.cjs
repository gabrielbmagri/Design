const { chromium } = require('playwright'); const D = __dirname + '/'; const fs = require('fs')
const BOARDS = ['capa','logo','uso','paleta','tipo','elementos','posts','stories','reels','voz']
const PIECES = { post1:[1080,1350], post2:[1080,1350], post3:[1080,1350], story1:[1080,1920], story2:[1080,1920], reel1:[1080,1920], reel2:[1080,1920] }
;(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] })
  fs.mkdirSync(D + 'out/manual', { recursive: true }); fs.mkdirSync(D + 'out/pecas', { recursive: true })
  const only = process.argv[2]
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 })
  if (!only || only === 'boards') for (const [i, n] of BOARDS.entries()) { const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)))
    await p.goto(`file://${D}kit.html?p=${n}`); await p.evaluate(() => window.ready); await p.waitForTimeout(500)
    await p.screenshot({ path: `${D}out/manual/${String(i + 1).padStart(2, '0')}-${n}.png` }); if (errs.length) console.log(n, errs); await p.close() }
  if (!only || only === 'pieces') for (const [n, [w, h]] of Object.entries(PIECES)) { const c2 = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 }); const p = await c2.newPage()
    await p.goto(`file://${D}kit.html?p=${n}&frame=1`); await p.evaluate(() => window.ready); await p.waitForTimeout(500)
    await p.screenshot({ path: `${D}out/pecas/${n}.png` }); await c2.close() }
  await b.close() })()
