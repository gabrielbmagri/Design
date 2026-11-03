#!/usr/bin/env node
// Cria o convite de um cliente a partir do formulário (cliente.json):
//   evento (tema, textos, fotos, presentes), convites e convidados, acesso do cliente com senha provisória
//   e o registro no painel do dono. Opcionalmente publica o site do cliente.
//
// Uso:
//   node scripts/provision.mjs clients/<slug>/cliente.json --projeto <id-do-projeto>        (produção, usa o login do firebase-tools)
//   node scripts/provision.mjs clients/<slug>/cliente.json --emulador                       (teste local nos emuladores)
// Opções: --senha <texto> (padrão: Convite123) · --aleatoria (senha única por cliente) · --atualizar (evento já existe: só reescreve a
//   configuração) · --convidados (com --atualizar, reescreve também os convidados: apaga respostas!) · --redefinir-senha · --simular · --publicar
import { build } from 'esbuild'
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith('--'))
const flag = (n) => args.includes(`--${n}`)
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d }
if (!file) { console.error('Uso: node scripts/provision.mjs clients/<slug>/cliente.json --projeto <id> | --emulador'); process.exit(1) }

const EMU = flag('emulador')
const PROJECT = opt('projeto', EMU ? 'demo-convites' : '')
if (!PROJECT) { console.error('Informe --projeto <id> (ou --emulador para testar).'); process.exit(1) }

const form = JSON.parse(readFileSync(file, 'utf8'))
const req = (v, nome) => { if (!v) { console.error(`Faltou no formulário: ${nome}`); process.exit(1) } }
req(form.slug, 'slug'); req(form.contratante?.email, 'contratante.email'); req(form.evento?.data, 'evento.data'); req(form.festejado?.nome, 'festejado.nome')
if (!/^[a-z0-9][a-z0-9-]{2,30}$/.test(form.slug)) { console.error('slug: use letras minúsculas, números e hífen (3 a 31 caracteres).'); process.exit(1) }
const email = form.contratante.email.trim().toLowerCase()
const clientDir = dirname(resolve(file))

// ---- compõe o evento com as mesmas regras do site ----
const tmp = join(resolve('.stage'), '_compose.mjs')
await build({
  entryPoints: [resolve('scripts/lib/compose.ts')], bundle: true, platform: 'node', format: 'esm', outfile: tmp, logLevel: 'error',
  define: { 'import.meta.env.BASE_URL': '"/"', 'import.meta.env.MODE': '"production"' },
})
const { composeSettings, composeGuests, THEMES } = await import(pathToFileURL(tmp).href + '?t=' + Date.now())
const settings = composeSettings(form, '/')
const guestDocs = await composeGuests(form, form.slug)

// ---- credenciais ----
async function token() {
  if (EMU) return 'owner'
  const base = resolve('node_modules/firebase-tools/lib/')
  const { getAccessToken } = await import(pathToFileURL(base + '/auth.js').href).then((m) => m.default ?? m)
  const cfg = (await import(pathToFileURL(base + '/configstore.js').href)).configstore
  const t = cfg.get('tokens')
  if (!t?.refresh_token) { console.error('Faça "npx firebase login" antes.'); process.exit(1) }
  return (await getAccessToken(t.refresh_token, [])).access_token
}
const TOKEN = await token()
const FS = EMU ? `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents` : `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`
const AUTH = EMU ? `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${PROJECT}` : `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT}`
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...(EMU ? {} : { 'X-Goog-User-Project': PROJECT }) }

// ---- Firestore (REST) ----
function toFs(v) {
  if (v === null || v === undefined) return { nullValue: null }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
  if (typeof v === 'string') return { stringValue: v }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFs) } }
  if (v.__ts) return { timestampValue: new Date().toISOString() }
  return { mapValue: { fields: Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => [k, toFs(x)])) } }
}
const fields = (o) => Object.fromEntries(Object.entries(o).filter(([, x]) => x !== undefined).map(([k, x]) => [k, toFs(x)]))
async function put(path, data) {
  const r = await fetch(`${FS}/${path}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: fields(data) }) })
  if (!r.ok) throw new Error(`Firestore ${path}: ${r.status} ${(await r.text()).slice(0, 300)}`)
}
async function exists(path) { return (await fetch(`${FS}/${path}`, { headers: H })).ok }

// ---- Auth (REST, administrador) ----
async function ensureUser(email, password, reset) {
  let r = await fetch(`${AUTH}/accounts`, { method: 'POST', headers: H, body: JSON.stringify({ email, password, emailVerified: true, displayName: form.contratante.nome }) })
  if (r.ok) return 'criado'
  const err = await r.json().catch(() => ({}))
  if (!JSON.stringify(err).includes('EMAIL_EXISTS')) throw new Error(`Auth: ${r.status} ${JSON.stringify(err).slice(0, 300)}`)
  if (!reset) return 'já existia (senha mantida)'
  const q = await fetch(`${AUTH}/accounts:lookup`, { method: 'POST', headers: H, body: JSON.stringify({ email: [email] }) })
  const id = (await q.json()).users?.[0]?.localId
  if (!id) throw new Error('Auth: não achei o usuário para redefinir.')
  r = await fetch(`${AUTH}/accounts:update`, { method: 'POST', headers: H, body: JSON.stringify({ localId: id, password, emailVerified: true }) })
  if (!r.ok) throw new Error(`Auth update: ${r.status} ${(await r.text()).slice(0, 300)}`)
  return 'senha redefinida'
}

const password = flag('aleatoria') ? randomBytes(6).toString('base64url') + '9a' : opt('senha', 'Convite123')
const siteHost = EMU ? 'http://localhost:5173' : `https://${PROJECT}-${form.slug}.web.app`
const siteUrl = process.env.SITE_URL || siteHost

console.log(`\nCliente: ${form.contratante.nome} <${email}>\nEvento:  ${settings.title} · ${settings.dateISO} · tema ${settings.themeId}\nProjeto: ${PROJECT}${EMU ? ' (emulador)' : ''}`)
console.log(`Convidados: ${guestDocs.filter((d) => d.path.includes('/invites/')).length} convites, ${guestDocs.filter((d) => d.path.includes('/guests/')).length} pessoas`)
if (flag('simular')) { console.log('\n(simulação: nada foi gravado)'); process.exit(0) }

const evExists = await exists(`events/${form.slug}/settings/event`)
if (evExists && !flag('atualizar')) { console.error(`\nO evento "${form.slug}" já existe. Use --atualizar para reescrever a configuração (os convidados e as respostas são preservados).`); process.exit(1) }

await put(`events/${form.slug}/settings/event`, { ...settings, updatedAt: { __ts: true } })
if (!evExists || flag('convidados')) for (const d of guestDocs) await put(d.path, d.data)
await put(`events/${form.slug}/admins/${email}`, { host: '', addedBy: 'provisionamento', at: { __ts: true } })
const userMsg = await ensureUser(email, password, flag('redefinir-senha') || !evExists)
if (!evExists || flag('redefinir-senha')) await put(`events/${form.slug}/accounts/${email}`, { mustChange: true, createdAt: { __ts: true } })
if (!evExists || flag('redefinir-senha') === false) { /* o registro de acesso já foi tratado acima */ }

const link = `${siteUrl}`
const money = form.preco ?? null
await put(`clients/${form.slug}`, {
  name: form.contratante.nome, phone: form.contratante.whatsapp ?? '', email, source: '', eventTitle: settings.title, eventDateISO: settings.dateISO,
  themeId: settings.themeId, kind: settings.kind, status: 'montagem', pkg: form.pacote ?? 'completo', price: money ?? 0, payments: [], brief: '', notes: '',
  eventId: form.slug, inviteUrl: link, adminUrl: `${link}/admin`, termsISO: form.aceitouTermos ? new Date().toISOString().slice(0, 10) : '',
  accessCreatedISO: new Date().toISOString().slice(0, 10), createdISO: new Date().toISOString().slice(0, 10), updatedISO: new Date().toISOString().slice(0, 10),
})

console.log(`\n✓ Evento criado: events/${form.slug}`)
console.log(`✓ Acesso: ${userMsg}`)
console.log(`\nPara enviar ao cliente:\n  Convite: ${link}\n  Painel:  ${link}/admin\n  Login:   ${email}\n  Senha provisória: ${password}  (ele troca no primeiro acesso)`)

// ---- publicação opcional do site do cliente ----
if (flag('publicar')) {
  const stage = resolve('.stage', form.slug)
  rmSync(stage, { recursive: true, force: true })
  mkdirSync(stage, { recursive: true })
  const pub = join(stage, 'public')
  cpSync('public', pub, { recursive: true, filter: (s) => !s.includes('/public/demo') })
  if (existsSync(join(clientDir, 'fotos'))) cpSync(join(clientDir, 'fotos'), join(pub, 'fotos'), { recursive: true })
  // imagem da prévia do WhatsApp
  const { makeOg } = await import('./lib/og.mjs')
  const fmt = new Date(settings.dateISO + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '').toUpperCase()
  await makeOg({
    outfile: join(pub, 'og', 'convite.jpg'), theme: THEMES.find((t) => t.id === settings.themeId) ?? THEMES[0],
    eyebrow: settings.entryEyebrow, title: settings.childName, date: `${fmt} · ${settings.timeStart.replace(':00', 'H')}`,
    image: form.conviteImagem ? join(clientDir, form.conviteImagem) : form.fotoCapa ? join(clientDir, form.fotoCapa) : '',
  })
  const siteId = `${PROJECT}-${form.slug}`.slice(0, 30)
  const env = {
    ...process.env, PUBLIC_DIR: pub, VITE_EVENT_ID: form.slug, VITE_SITE_URL: siteUrl,
    VITE_OG_TITLE: `${settings.title}`, VITE_OG_DESCRIPTION: `Você é nosso convidado! ${settings.eventShort}. Toque para ver o convite e confirmar sua presença.`, VITE_OG_SITE_NAME: settings.eventShort,
  }
  const out = join('dist-clientes', form.slug)
  let r = spawnSync('npx', ['vite', 'build', '--outDir', out, '--emptyOutDir'], { stdio: 'inherit', env })
  if (r.status) process.exit(r.status)
  const cfg = `firebase.${form.slug}.json`
  const base = JSON.parse(readFileSync('firebase.json', 'utf8'))
  writeFileSync(cfg, JSON.stringify({ hosting: { ...base.hosting, site: siteId, public: out } }, null, 2))
  spawnSync('npx', ['firebase', 'hosting:sites:create', siteId, '--project', PROJECT, '--non-interactive'], { stdio: 'inherit' })
  r = spawnSync('npx', ['firebase', 'deploy', '--only', 'hosting', '--config', cfg, '--project', PROJECT, '--non-interactive'], { stdio: 'inherit' })
  if (r.status) process.exit(r.status)
  console.log(`\n✓ Publicado: https://${siteId}.web.app`)
}
