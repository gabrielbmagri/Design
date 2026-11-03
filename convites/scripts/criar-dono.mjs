#!/usr/bin/env node
// Cadastra quem pode entrar no painel do dono (/super). Rode uma vez por projeto:
//   node scripts/criar-dono.mjs voce@gmail.com --projeto <id-do-projeto>        (ou --emulador)
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const args = process.argv.slice(2)
const email = args.find((a) => !a.startsWith('--'))?.trim().toLowerCase()
const EMU = args.includes('--emulador')
const i = args.indexOf('--projeto')
const PROJECT = i >= 0 ? args[i + 1] : EMU ? 'demo-convites' : ''
if (!email || !email.includes('@') || !PROJECT) { console.error('Uso: node scripts/criar-dono.mjs voce@gmail.com --projeto <id> | --emulador'); process.exit(1) }

let token = 'owner'
if (!EMU) {
  const base = resolve('node_modules/firebase-tools/lib/')
  const { getAccessToken } = await import(pathToFileURL(base + '/auth.js').href).then((m) => m.default ?? m)
  const cfg = (await import(pathToFileURL(base + '/configstore.js').href)).configstore
  token = (await getAccessToken(cfg.get('tokens').refresh_token, [])).access_token
}
const FS = EMU ? `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents` : `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`
const r = await fetch(`${FS}/owners/${email}`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(EMU ? {} : { 'X-Goog-User-Project': PROJECT }) },
  body: JSON.stringify({ fields: { ok: { booleanValue: true }, at: { timestampValue: new Date().toISOString() } } }),
})
if (!r.ok) { console.error(r.status, await r.text()); process.exit(1) }
console.log(`✓ ${email} agora pode entrar em /super no projeto ${PROJECT}`)
