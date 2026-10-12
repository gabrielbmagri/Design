// Gera public/og/convite.jpg (1200x630) — a imagem grande que aparece no WhatsApp.
// Se existir og-source/convite.(jpg|png|webp), usa o convite real; senão, gera um provisório.
// Uso: npm run og
import { chromium } from 'playwright'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const src = ['jpg', 'jpeg', 'png', 'webp'].map((e) => resolve(`og-source/convite.${e}`)).find(existsSync)
const out = resolve('public/og/convite.jpg')

const img = src ? `data:image/${src.split('.').pop().replace('jpg', 'jpeg')};base64,${readFileSync(src).toString('base64')}` : ''

const html = `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=Dancing+Script:wght@700&family=Nunito:wght@800;900&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden}
  body{background:
    repeating-linear-gradient(0deg, rgba(247,168,200,.5) 0 36px, transparent 36px 72px),
    repeating-linear-gradient(90deg, rgba(247,168,200,.5) 0 36px, transparent 36px 72px), #fff}
  .paper{position:absolute;inset:26px;border-radius:44px;background:#fefcf4;box-shadow:0 20px 50px rgba(217,47,116,.18)}
  .wrap{position:absolute;inset:26px;display:flex;align-items:center;gap:44px;padding:0 56px 0 40px}
  .card{height:510px;border-radius:24px;border:7px solid #fff;box-shadow:0 24px 50px rgba(75,43,42,.3);transform:rotate(-2.5deg)}
  .txt{flex:1;text-align:center;color:#4b2b2a}
  .eye{font:900 24px Nunito,sans-serif;letter-spacing:.16em;color:#d92f74;text-transform:uppercase}
  .name{font:900 150px/0.95 'Playfair Display',serif;color:#d92f74;margin-top:8px}
  .sub{font:900 56px 'Playfair Display',serif;color:#dc4f74}
  .script{font:700 52px 'Dancing Script',cursive;color:#a3564c;margin-top:10px}
  .date{font:900 40px Nunito,sans-serif;color:#d92f74;margin-top:14px}
  .cta{margin-top:20px;font:900 28px Nunito,sans-serif;color:#fff;background:#d92f74;border-radius:99px;padding:14px 32px;display:inline-block;box-shadow:0 10px 24px rgba(217,47,116,.35)}
</style></head><body>
<div class="paper"></div>
<div class="wrap">
 ${img ? `<img class="card" src="${img}">` : ''}
 <div class="txt">
   <div class="eye">Você está convidado</div>
   <div class="name">Betina</div>
   <div class="sub">faz 1 ano</div>
   <div class="script">As porteiras estão abertas!</div>
   <div class="date">02 NOV · 13H</div>
   <div class="cta">Toque para confirmar presença</div>
 </div>
</div></body></html>`

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.screenshot({ path: out, type: 'jpeg', quality: 86 })
await browser.close()
const kb = Math.round(statSync(out).size / 1024)
console.log(`✓ ${out} (${kb} KB)${src ? ' a partir de ' + src : ' — provisório'}`)
if (kb > 300) console.log('⚠ Acima de 300 KB: o WhatsApp pode mostrar só a miniatura. Use um convite menor.')
