// Gera a prévia do WhatsApp da contagem regressiva:
//   public/og/faltam-N.jpg      (1200x630)
//   public/lembrete/N/index.html  (página com as metatags + redireciona para o convite pessoal)
// O link do lembrete é  <site>/lembrete/N/?c=<id do convite>  (N = dias que faltam, 0 a MAX).
// Uso: npm run countdown
import { chromium } from 'playwright'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const MAX = 10
const SITE = process.env.VITE_SITE_URL || 'https://betina-1ano.web.app'
const src = ['jpg', 'jpeg', 'png', 'webp'].map((e) => resolve(`og-source/convite.${e}`)).find(existsSync)
const img = `data:image/${src.split('.').pop().replace('jpg', 'jpeg')};base64,${readFileSync(src).toString('base64')}`

const label = (n) => (n === 0 ? { big: 'Hoje!', small: 'é dia de festa', script: 'As porteiras estão abertas!' }
  : n === 1 ? { big: 'Amanhã!', small: 'é a festa da Bê', script: 'Falta só um diazinho!' }
  : { big: String(n), small: 'dias para a festa', script: 'Já já as porteiras abrem!' })

const title = (n) => (n === 0 ? 'É hoje! Primeiro Aninho da Bê 🐷🐮🐴' : n === 1 ? 'É amanhã! Primeiro Aninho da Bê 🐷🐮🐴' : `Faltam ${n} dias para o Primeiro Aninho da Bê 🐷🐮🐴`)
const desc = 'Segunda, 2 de novembro, às 13h · Adventure Kids, Nova Iguaçu – RJ. Toque para ver o convite ou atualizar sua resposta 💗'

const html = (n) => {
  const l = label(n)
  return `<!doctype html><html><head>
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
  .big{font:900 ${n > 1 ? 190 : 150}px/1 'Playfair Display',serif;color:#d92f74;margin-top:${n > 1 ? 6 : 36}px}
  .small{font:900 52px 'Playfair Display',serif;color:#dc4f74;margin-top:${n > 1 ? 4 : 6}px}
  .script{font:700 50px 'Dancing Script',cursive;color:#a3564c;margin-top:14px}
  .date{font:900 36px Nunito,sans-serif;color:#d92f74;margin-top:14px}
  .cta{margin-top:20px;font:900 28px Nunito,sans-serif;color:#fff;background:#d92f74;border-radius:99px;padding:14px 32px;display:inline-block;box-shadow:0 10px 24px rgba(217,47,116,.35)}
</style></head><body>
<div class="paper"></div>
<div class="wrap">
 <img class="card" src="${img}">
 <div class="txt">
   <div class="eye">Primeiro aninho da Bê</div>
   <div class="big">${l.big}</div>
   <div class="small">${l.small}</div>
   <div class="script">${l.script}</div>
   <div class="date">02 NOV · 13H</div>
   <div class="cta">Toque para ver o convite</div>
 </div>
</div></body></html>`
}

const page = (n) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title(n)}</title>
    <meta name="description" content="${desc}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:site_name" content="Aniversário da Betina" />
    <meta property="og:title" content="${title(n)}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${SITE}/og/faltam-${n}.jpg" />
    <meta property="og:image:secure_url" content="${SITE}/og/faltam-${n}.jpg" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${SITE}/og/faltam-${n}.jpg" />
    <meta name="theme-color" content="#fff4f8" />
    <script>
      var c = new URLSearchParams(location.search).get('c')
      location.replace(c ? '/c/' + encodeURIComponent(c) : '/')
    </script>
  </head>
  <body style="font-family:system-ui,sans-serif;text-align:center;padding:48px 16px;background:#fffcf8;color:#5b4a50">
    <p>Abrindo o convite…</p>
    <p><a href="/" style="color:#c93a76">Toque aqui se não abrir</a></p>
  </body>
</html>
`

mkdirSync('public/lembrete', { recursive: true })
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
const pg = await browser.newPage({ viewport: { width: 1200, height: 630 } })
for (let n = 0; n <= MAX; n++) {
  await pg.setContent(html(n), { waitUntil: 'networkidle' })
  const out = resolve(`public/og/faltam-${n}.jpg`)
  await pg.screenshot({ path: out, type: 'jpeg', quality: 86 })
  mkdirSync(`public/lembrete/${n}`, { recursive: true })
  writeFileSync(`public/lembrete/${n}/index.html`, page(n))
  console.log(`✓ faltam-${n}.jpg (${Math.round(statSync(out).size / 1024)} KB)`)
}
await browser.close()
