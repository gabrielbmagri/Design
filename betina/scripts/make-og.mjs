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
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden}
  body{background:radial-gradient(60% 80% at 15% 30%, #fde6ef, transparent 70%), radial-gradient(50% 70% at 90% 90%, #f7efe6, transparent 70%), #fffcf8}
  .paper{display:none}
  .wrap{position:absolute;inset:0;display:flex;align-items:center;gap:60px;padding:0 70px 0 60px}
  .card{height:540px;border-radius:24px;box-shadow:0 24px 50px rgba(42,29,34,.22)}
  .txt{flex:1;text-align:left;color:#2a1d22}
  .eye{font:700 22px 'Plus Jakarta Sans',sans-serif;letter-spacing:.12em;color:#c93a76;text-transform:uppercase}
  .name{font:800 120px/1 'Plus Jakarta Sans',sans-serif;letter-spacing:-.03em;color:#2a1d22;margin-top:10px}
  .sub{font:800 52px 'Plus Jakarta Sans',sans-serif;letter-spacing:-.02em;color:#c93a76}
  .script{font:500 28px 'Plus Jakarta Sans',sans-serif;color:#5b4a50;margin-top:14px}
  .date{font:700 30px 'Plus Jakarta Sans',sans-serif;color:#2a1d22;margin-top:6px}
  .cta{margin-top:26px;font:700 26px 'Plus Jakarta Sans',sans-serif;color:#fff;background:#c93a76;border-radius:99px;padding:14px 32px;display:inline-block;box-shadow:0 10px 24px rgba(217,47,116,.35)}
</style></head><body>
<div class="paper"></div>
<div class="wrap">
 ${img ? `<img class="card" src="${img}">` : ''}
 <div class="txt">
   <div class="eye">Você está convidado</div>
   <div class="name">Betina</div>
   <div class="sub">faz 1 ano</div>
   <div class="script">As porteiras estão abertas!</div>
   <div class="date">2 de novembro · 13h</div>
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
