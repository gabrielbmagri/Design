// Gera public/og/e-amanha.jpg (1080x1350): imagem "É amanhã!" para enviar no WhatsApp com legenda.
// Uso: node scripts/make-amanha.mjs
import { chromium } from 'playwright'
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const b64 = (f) => `data:image/jpeg;base64,${readFileSync(resolve(f)).toString('base64')}`
const photo = b64('public/photos/um-aninho.jpg')
const out = resolve('public/og/e-amanha.jpg')

const html = `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=Dancing+Script:wght@700&family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;width:1080px;height:1350px;overflow:hidden}
  body{background:
    repeating-linear-gradient(0deg, rgba(247,168,200,.5) 0 36px, transparent 36px 72px),
    repeating-linear-gradient(90deg, rgba(247,168,200,.5) 0 36px, transparent 36px 72px), #fff;
    font-family:Nunito,sans-serif;color:#4b2b2a}
  .paper{position:absolute;inset:30px;border-radius:52px;background:#fefcf4;box-shadow:0 24px 60px rgba(217,47,116,.2);overflow:hidden}
  .top{position:absolute;left:0;right:0;top:0;height:640px;overflow:hidden}
  .top img{width:100%;height:100%;object-fit:cover;object-position:50% 22%}
  .top::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(254,252,244,0) 55%,#fefcf4 100%)}
  .badge{position:absolute;left:50%;top:44px;transform:translateX(-50%);background:#d92f74;color:#fff;font:900 26px Nunito;letter-spacing:.16em;text-transform:uppercase;padding:12px 30px;border-radius:99px;box-shadow:0 10px 24px rgba(217,47,116,.35);white-space:nowrap}
  .body{position:absolute;left:0;right:0;top:560px;text-align:center;padding:0 56px}
  .big{font:900 150px/1 'Playfair Display',serif;color:#d92f74}
  .script{font:700 56px 'Dancing Script',cursive;color:#a3564c;margin-top:2px}
  .when{margin-top:22px;font:900 40px Nunito;color:#d92f74;letter-spacing:.02em}
  .where{margin-top:8px;font:800 31px Nunito;color:#4b2b2a;line-height:1.3}
  .where small{display:block;font:700 26px Nunito;color:#7a5a58}
  .tips{margin:26px auto 0;display:grid;gap:12px;text-align:left;width:820px}
  .tip{display:flex;gap:16px;align-items:center;background:#fff;border:2px solid #f8c9dc;border-radius:22px;padding:14px 22px;font:800 27px/1.25 Nunito}
  .tip i{font-style:normal;font-size:38px}
</style></head><body>
<div class="paper">
  <div class="top"><img src="${photo}"></div>
  <div class="badge">Primeiro aninho da Bê</div>
  <div class="body">
    <div class="big">É amanhã!</div>
    <div class="script">Esperamos vocês na fazendinha</div>
    <div class="when">SEGUNDA, 02 NOV · 13H</div>
    <div class="where">Adventure Kids — Casa 01<small>Av. Dr. Luiz Guimarães, 669 – Centro, Nova Iguaçu – RJ</small></div>
    <div class="tips">
      <div class="tip"><i>⏰</i><span>Pontualidade: para aproveitarmos a festa juntos</span></div>
      <div class="tip"><i>🚗</i><span>Estacionamento na rua, em volta do salão</span></div>
      <div class="tip"><i>🤠</i><span>Seu chapéu de cowboy é bem-vindo!</span></div>
    </div>
  </div>
</div></body></html>`

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.screenshot({ path: out, type: 'jpeg', quality: 90 })
await browser.close()
console.log(`✓ ${out} (${Math.round(statSync(out).size / 1024)} KB)`)
