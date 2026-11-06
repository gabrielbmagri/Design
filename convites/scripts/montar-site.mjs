// Monta a pasta dist-site (o site "confetedigital") SEM publicar nada.
//   confetedigital.com.br/          → página de link na bio (logo + 2 botões)
//   confetedigital.com.br/exemplo/  → demonstração do convite (menino/menina, Maria entra sozinha)
// Uso: node scripts/montar-site.mjs   (depois, quando validar: npx firebase deploy --only hosting --config firebase.site.json)
import { execSync } from 'node:child_process'
import { cpSync, rmSync, mkdirSync, existsSync, readdirSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const KIT = 'marketing/marca/kit'
const OUT = 'dist-site'
const sh = (c) => execSync(c, { stdio: 'inherit' })

sh('npx vite build --mode vitrine')
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
cpSync(join(KIT, 'link-na-bio/index.html'), join(OUT, 'index.html'))
cpSync('public/favicon.svg', join(OUT, 'favicon.svg'))
writeFileSync(join(OUT, 'robots.txt'), 'User-agent: *\nAllow: /\n')

const size = (d) => readdirSync(d, { recursive: true }).reduce((n, f) => { const p = join(d, f); return n + (statSync(p).isFile() ? statSync(p).size : 0) }, 0)
console.log(`\nsite montado em ${OUT}: ${(size(OUT) / 1048576).toFixed(1)} MB (nada foi publicado)`)
