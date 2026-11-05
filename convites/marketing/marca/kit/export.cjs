const { chromium } = require('playwright'); const D = __dirname + '/'; const fs = require('fs')
;(async () => { const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); fs.mkdirSync(D + 'out/logos', { recursive: true }); fs.mkdirSync(D + 'out/destaques', { recursive: true })
  const ctx = await b.newContext({ viewport: { width: 1200, height: 700 }, deviceScaleFactor: 2 })
  for (const n of ['principal', 'mono-tinta', 'mono-branco', 'creme']) { const p = await ctx.newPage(); fs.writeFileSync(D+'_t.html',`<body style="margin:0;background:transparent"><img id=i src="logos/confete-${n}.svg" style="display:block;width:1200px"></body>`); await p.goto('file://'+D+'_t.html'); await p.waitForSelector('#i'); await p.waitForTimeout(400)
    const el = await p.$('#i'); await el.screenshot({ path: `${D}out/logos/confete-${n}.png`, omitBackground: true }); await p.close() }
  const c2 = await b.newContext({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 })
  for (const n of ['principal', 'butter', 'tinta']) { const p = await c2.newPage(); fs.writeFileSync(D+'_t.html',`<body style="margin:0"><img src="logos/confete-icone-${n}.svg" style="display:block;width:1024px"></body>`); await p.goto('file://'+D+'_t.html'); await p.waitForTimeout(400); await p.screenshot({ path: `${D}out/logos/confete-icone-${n}.png` }); await p.close() }
  // capas de destaque (1080x1920, círculo central de 620 px)
  const c3 = await b.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
  const H = [['como-funciona', '✨', '#FFD84D'], ['temas', '🎨', '#5BC8F5'], ['painel', '📊', '#7EE0B5'], ['duvidas', '💬', '#FF5FA2']]
  for (const [n, e, bg] of H) { const p = await c3.newPage(); await p.setContent(`<link href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&display=swap" rel="stylesheet"><body style="margin:0;width:1080px;height:1920px;background:${bg};position:relative;overflow:hidden">
    <div style="position:absolute;left:190px;top:650px;width:700px;height:700px;border-radius:50%;background:rgba(255,255,255,.35)"></div>
    <div style="position:absolute;left:240px;top:700px;width:600px;height:600px;border-radius:50%;background:#FFF8EC;display:grid;place-items:center;font-size:290px;box-shadow:0 30px 70px rgba(42,27,61,.2)">${e}</div>
    ${[[110,380,'r','#FF5FA2',-24],[880,420,'r','#fff',30],[160,1480,'d','#FF5FA2',0],[860,1440,'r','#2A1B3D',-18],[500,330,'d','#fff',0],[540,1560,'r','#fff',20]].map(([x,y,k,c,r])=>k==='r'?`<div style="position:absolute;left:${x}px;top:${y}px;width:70px;height:28px;border-radius:14px;background:${c};transform:rotate(${r}deg)"></div>`:`<div style="position:absolute;left:${x}px;top:${y}px;width:34px;height:34px;border-radius:50%;background:${c}"></div>`).join('')}</body>`); await p.waitForTimeout(900)
    await p.screenshot({ path: `${D}out/destaques/capa-${n}.png` }); await p.close() }
  await b.close() })()
