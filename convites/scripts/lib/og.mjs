// Imagem da prévia do WhatsApp (1200x630): convite à esquerda, nome e data à direita, nas cores do tema.
import { chromium } from 'playwright'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export async function makeOg({ outfile, theme, eyebrow, title, date, image }) {
  mkdirSync(dirname(outfile), { recursive: true })
  const [deep, accent, paper] = theme.swatch
  const wedding = theme.kind === 'wedding'
  const img = image && existsSync(image) ? `data:image/${image.split('.').pop().replace('jpg', 'jpeg')};base64,${readFileSync(image).toString('base64')}` : ''
  const serif = wedding ? "'Cormorant Garamond',serif" : "'Playfair Display',serif"
  const html = `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=Cormorant+Garamond:wght@700&family=Nunito:wght@800;900&display=swap" rel="stylesheet">
<style>html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:${wedding ? `linear-gradient(135deg,${paper},${accent}55)` : `repeating-linear-gradient(0deg,${accent}55 0 36px,transparent 36px 72px),repeating-linear-gradient(90deg,${accent}55 0 36px,transparent 36px 72px),#fff`}}
.paper{position:absolute;inset:26px;border-radius:${wedding ? 4 : 44}px;background:${paper};${wedding ? `border:2px solid ${accent}` : 'box-shadow:0 20px 50px rgba(0,0,0,.15)'}}
.wrap{position:absolute;inset:26px;display:flex;align-items:center;gap:44px;padding:0 56px 0 40px}
.card{height:510px;border-radius:${wedding ? 4 : 24}px;border:7px solid #fff;box-shadow:0 24px 50px rgba(0,0,0,.28);transform:rotate(${wedding ? 0 : -2.5}deg)}
.txt{flex:1;text-align:center;color:${deep}}
.eye{font:900 24px Nunito,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:${deep}}
.t{font:${wedding ? 700 : 900} ${title.length > 18 ? 78 : 112}px/1 ${serif};margin-top:14px;color:${deep}}
.d{font:900 40px Nunito,sans-serif;margin-top:22px;color:${accent}}
.cta{margin-top:26px;font:900 28px Nunito,sans-serif;color:#fff;background:${deep};border-radius:${wedding ? 2 : 99}px;padding:14px 32px;display:inline-block}</style></head><body>
<div class="paper"></div><div class="wrap">${img ? `<img class="card" src="${img}">` : ''}<div class="txt">
<div class="eye">${eyebrow}</div><div class="t">${title}</div><div class="d">${date}</div><div class="cta">Toque para confirmar presença</div></div></div></body></html>`
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } })
  await p.setContent(html, { waitUntil: 'networkidle' })
  await p.screenshot({ path: outfile, type: 'jpeg', quality: 86 })
  await b.close()
}
