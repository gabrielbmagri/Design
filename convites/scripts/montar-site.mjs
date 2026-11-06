// Monta a pasta dist-site (o site "confetedigital") SEM publicar nada.
//   https://confetedigital.web.app/          → página de link na bio (logo + 2 botões)
//   https://confetedigital.web.app/exemplo/  → demonstração do convite (menino/menina, Maria entra sozinha)
// Endereço grátis do Firebase até comprar o domínio. Com o domínio: SITE_URL=https://confetedigital.com.br node scripts/montar-site.mjs
// Uso: node scripts/montar-site.mjs   (depois, quando validar: npx firebase deploy --only hosting --config firebase.site.json)
import { execSync } from 'node:child_process'
import { cpSync, rmSync, mkdirSync, readdirSync, writeFileSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const KIT = 'marketing/marca/kit'
const OUT = 'dist-site'
const BASE = (process.env.SITE_URL || 'https://confetedigital.web.app').replace(/\/$/, '')
const sh = (c, env = {}) => execSync(c, { stdio: 'inherit', env: { ...process.env, ...env } })

sh('npx vite build --mode vitrine', { VITE_SITE_URL: BASE + '/exemplo' })
rmSync(OUT, { recursive: true, force: true })
mkdirSync(join(OUT, 'og'), { recursive: true })
cpSync('dist-vitrine', join(OUT, 'exemplo'), { recursive: true })

// enxugar a demonstração: só os temas infantis e só o que o convite do convidado usa
for (const t of ['ouro', 'prata']) rmSync(join(OUT, 'exemplo/demo', t), { recursive: true, force: true })
for (const f of readdirSync(join(OUT, 'exemplo/assets'))) if (/^(AdminApp|SuperApp|DemoBar|admin-|SuperApp-)/.test(f)) rmSync(join(OUT, 'exemplo/assets', f))

// prévias do WhatsApp/Instagram (1200x630) e página inicial
mkdirSync(join(OUT, 'exemplo/og'), { recursive: true })
cpSync(join(KIT, 'out/og/exemplo.jpg'), join(OUT, 'exemplo/og/convite.jpg'))
cpSync(join(KIT, 'out/og/link.jpg'), join(OUT, 'og/link.jpg'))
writeFileSync(join(OUT, 'index.html'), readFileSync(join(KIT, 'link-na-bio/index.html'), 'utf8').replaceAll('https://confetedigital.com.br', BASE))
// ícone da Confete (o "c") na aba do navegador e no atalho do celular, nas duas páginas
const ICONS = `<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">`
for (const f of ['favicon.svg', 'favicon.ico', 'favicon-32.png', 'apple-touch-icon.png', 'icon-512.png']) cpSync(join(KIT, 'favicon', f), join(OUT, f))
rmSync(join(OUT, 'exemplo/favicon.svg'), { force: true })
for (const p of ['index.html', 'exemplo/index.html']) {
  const f = join(OUT, p)
  writeFileSync(f, readFileSync(f, 'utf8').replace(/<link rel="icon"[^>]*>/g, '').replace('</head>', ICONS + '\n</head>'))
}
writeFileSync(join(OUT, 'robots.txt'), 'User-agent: *\nAllow: /\n')

const size = (d) => readdirSync(d, { recursive: true }).reduce((n, f) => { const p = join(d, f); return n + (statSync(p).isFile() ? statSync(p).size : 0) }, 0)
console.log(`\nendereço: ${BASE}\nsite montado em ${OUT}: ${(size(OUT) / 1048576).toFixed(1)} MB (nada foi publicado)`)
