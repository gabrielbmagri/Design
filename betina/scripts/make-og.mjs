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
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Nunito:wght@800&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden}
  .bg{position:absolute;inset:-40px;background:${img ? `url(${img}) center/cover` : 'linear-gradient(135deg,#fde3ea,#f6effd)'};filter:${img ? 'blur(28px) saturate(1.2) brightness(1.05)' : 'none'}}
  .wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:56px}
  .card{height:560px;border-radius:28px;box-shadow:0 30px 60px rgba(74,42,55,.35);border:8px solid #fff}
  .txt{font-family:Fraunces,Georgia,serif;color:#4a2a37;text-align:center}
  .txt small{display:block;font:800 26px Nunito,sans-serif;letter-spacing:.14em;color:#c9517a;text-transform:uppercase;margin-bottom:16px}
  .txt b{font-size:120px;line-height:.95;display:block}
  .txt em{font-style:normal;color:#c9517a}
  .badge{width:150px;height:150px;border-radius:50%;margin:0 auto 26px;display:grid;place-items:center;color:#fff;font:700 100px Fraunces,serif;
    background:conic-gradient(#e8799b,#d9a94e,#b9a4ec,#e8799b);box-shadow:0 0 0 12px rgba(255,255,255,.75)}
  .cta{margin-top:28px;font:800 30px Nunito,sans-serif;color:#fff;background:#c9517a;border-radius:99px;padding:14px 34px;display:inline-block}
</style></head><body>
<div class="bg"></div>
<div class="wrap">
 ${img ? `<img class="card" src="${img}">` : ''}
 ${img ? '' : `<div class="txt"><div class="badge">1</div><small>Você está convidado</small><b><em>Betina</em><br>faz 1 aninho</b><div class="cta">Toque para confirmar presença</div></div>`}
</div></body></html>`

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.screenshot({ path: out, type: 'jpeg', quality: 86 })
await browser.close()
const kb = Math.round(statSync(out).size / 1024)
console.log(`✓ ${out} (${kb} KB)${src ? ' a partir de ' + src : ' — provisório'}`)
if (kb > 300) console.log('⚠ Acima de 300 KB: o WhatsApp pode mostrar só a miniatura. Use um convite menor.')
