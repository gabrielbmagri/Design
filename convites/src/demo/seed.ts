import { doc, updateDoc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { adminsCol, accountsCol, guestsCol, invitesCol, logCol, settingsRef } from '../lib/data'
import { PRESETS } from '../lib/presets'
import { saveInvite, type MemberDraft } from '../admin/ops'
import type { Host, Status } from '../lib/types'
import { Timestamp, __isEmpty } from './firestore'

const DAY = 864e5
const m = (name: string, isChild = false, age: number | null = null): MemberDraft => ({ name, isChild, age, phone: '' })

const SAMPLE: { host: Host; phone: string; members: MemberDraft[]; status?: Status[]; sentDaysAgo?: number; reserve?: boolean; tags?: string[]; plusOne?: boolean }[] = [
  { host: 'gabriel', phone: '21 99999-0001', members: [m('Maria Silva'), m('João Silva')], status: ['yes', 'yes'], sentDaysAgo: 10, tags: ['família'] },
  { host: 'gabriel', phone: '21 99999-0002', members: [m('Ana Souza'), m('Pedro Souza', true, 3), m('Lia Souza', true)], sentDaysAgo: 9, tags: ['família'] },
  { host: 'gabriel', phone: '21 99999-0003', members: [m('Carlos Mendes')], status: ['maybe'], sentDaysAgo: 8, tags: ['trabalho'], plusOne: true },
  { host: 'gabriel', phone: '21 99999-0004', members: [m('Rosa Oliveira'), m('Antônio Oliveira')], status: ['no', 'no'], sentDaysAgo: 6 },
  { host: 'gabriel', phone: '21 99999-0005', members: [m('Fernanda Lima'), m('Bruno Lima'), m('Theo Lima', true, 7)], sentDaysAgo: 2, tags: ['amigos'] },
  { host: 'gabriel', phone: '21 99999-0006', members: [m('Tia Célia')], reserve: true },
  { host: 'luiza', phone: '21 98888-0001', members: [m('Juliana Menezes'), m('Rafael Menezes'), m('Alice Menezes', true, 4)], status: ['yes', 'yes', 'yes'], sentDaysAgo: 11, tags: ['família'] },
  { host: 'luiza', phone: '21 98888-0002', members: [m('Vó Lourdes')], sentDaysAgo: 12, tags: ['família'] },
  { host: 'luiza', phone: '21 98888-0003', members: [m('Patrícia Costa'), m('Miguel Costa', true, 2)], status: ['yes', 'yes'], sentDaysAgo: 5, tags: ['amigos'] },
  { host: 'luiza', phone: '21 98888-0004', members: [m('Camila Rocha'), m('Diego Rocha')] },
  { host: 'luiza', phone: '21 98888-0005', members: [m('Beatriz Alves')], reserve: true },
]

export const PRESET_KEY = 'convite-demo-preset'
export function currentPreset() {
  let id = ''
  try { id = new URLSearchParams(location.hash.replace(/^#/, '').replace(/^admin&?/, '')).get('tema') || localStorage.getItem(PRESET_KEY) || '' } catch { /* ignore */ }
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0]
}

export async function seedDemo() {
  if (!__isEmpty()) return
  await setDoc(doc(adminsCol, 'demo@convite'), { host: 'gabriel' })
  // conta de exemplo com senha provisória (entra com cliente@exemplo.com / Convite123 e escolhe a própria senha)
  await setDoc(doc(adminsCol, 'cliente@exemplo.com'), { host: 'gabriel' })
  await setDoc(doc(accountsCol, 'cliente@exemplo.com'), { mustChange: true })
  await setDoc(settingsRef, currentPreset().settings as never)
  await setDoc(doc(db, 'owners', 'demo@convite'), { ok: true })
  // o resto (convidados e clientes de exemplo) entra em segundo plano, sem travar a abertura
  void seedRest()
  void seedClients()
}

async function seedRest() {
  for (const s of SAMPLE) {
    const id = await saveInvite(
      { label: '', host: s.host, phone: s.phone, notes: '', tags: s.tags ?? [], reserve: !!s.reserve, members: s.members, plusOne: s.plusOne },
      [],
      'demo',
    )
    if (s.sentDaysAgo != null) await updateDoc(doc(invitesCol, id), { sentAt: Timestamp.fromMillis(Date.now() - s.sentDaysAgo * DAY) })
    if (s.status) {
      const { getDocs, query, where } = await import('firebase/firestore')
      const gs = (await getDocs(query(guestsCol, where('inviteId', '==', id)))).docs.filter((d) => !d.get('isPlusOne')).sort((a, b) => (a.get('order') as number) - (b.get('order') as number))
      const b = writeBatch(db)
      gs.forEach((g, k) => {
        const st = s.status![k] ?? 'pending'
        b.update(g.ref as never, { status: st, respondedAt: serverTimestamp(), respondedBy: s.members[0].name })
        b.set(doc(logCol), { guestId: g.id, guestName: g.get('name'), inviteId: id, status: st, age: g.get('age') ?? null, by: s.members[0].name, source: 'guest', at: serverTimestamp() })
      })
      await b.commit()
    }
  }
}

const ago = (d: number) => new Date(Date.now() - d * DAY).toISOString().slice(0, 10)
const ahead = (d: number) => new Date(Date.now() + d * DAY).toISOString().slice(0, 10)
const pay = (d: number, amount: number, method: 'pix' | 'cartao' = 'pix') => ({ id: `${d}-${amount}`, dateISO: ago(d), amount, method, note: '' })

async function seedClients() {
  const { addDoc, collection } = await import('firebase/firestore')
  const col = collection(db, 'clients')
  const base = { phone: '', source: '', brief: '', notes: '', inviteUrl: '', adminUrl: '', payments: [] as ReturnType<typeof pay>[], createdISO: ago(20), updatedISO: ago(1) }
  const rows = [
    { name: 'Camila Duarte', email: 'cliente@exemplo.com', eventId: 'principal', termsISO: ago(18), phone: '21 98888-1001', source: 'Indicação', eventTitle: 'Théo faz 1 ano', eventDateISO: ahead(40), themeId: 'safari', kind: 'kids', status: 'montagem', pkg: 'completo', price: 399, payments: [pay(6, 200)], updatedISO: ago(2) },
    { name: 'Marcos e Paula', phone: '11 97777-2002', source: 'Instagram', eventTitle: 'Casamento Marcos & Paula', eventDateISO: ahead(95), themeId: 'ouro', kind: 'wedding', status: 'aprovacao', pkg: 'premium', price: 649, payments: [pay(10, 325)], updatedISO: ago(1) },
    { name: 'Renata Lopes', phone: '21 96666-3003', source: 'Indicação', eventTitle: 'Alice faz 1 ano', eventDateISO: ahead(9), themeId: 'jardim', kind: 'kids', status: 'montagem', pkg: 'completo', price: 399, payments: [pay(15, 399)], updatedISO: ago(1) },
    { name: 'Fábio Teixeira', phone: '31 95555-4004', source: 'Instagram', eventTitle: 'Bento faz 2 anos', eventDateISO: ahead(60), themeId: 'novo', kind: 'kids', status: 'briefing', pkg: 'premium', price: 649, brief: 'Quer tema Astronauta: azul-marinho, estrelas, foguete e planetas.', updatedISO: ago(5) },
    { name: 'Larissa Prado', phone: '21 94444-5005', source: 'Amiga', eventTitle: 'Chá da Maria', eventDateISO: ahead(120), themeId: 'jardim', kind: 'kids', status: 'lead', pkg: 'essencial', price: 249, updatedISO: ago(1) },
    { name: 'Gustavo Nunes', phone: '11 93333-6006', source: 'Indicação', eventTitle: 'Casamento Gustavo & Bia', eventDateISO: ahead(30), themeId: 'prata', kind: 'wedding', status: 'entregue', pkg: 'completo', price: 399, payments: [pay(25, 200)], inviteUrl: 'https://exemplo.web.app', updatedISO: ago(3) },
    { name: 'Patrícia Moura', phone: '21 92222-7007', source: 'Instagram', eventTitle: 'Davi faz 1 ano', eventDateISO: ago(12), themeId: 'safari', kind: 'kids', status: 'concluido', pkg: 'completo', price: 399, payments: [pay(45, 200), pay(40, 199)], updatedISO: ago(12) },
    { name: 'Eduarda Ribeiro', phone: '11 91111-8008', source: 'Indicação', eventTitle: 'Helô faz 1 ano', eventDateISO: ago(40), themeId: 'jardim', kind: 'kids', status: 'concluido', pkg: 'essencial', price: 249, payments: [pay(70, 249, 'cartao')], updatedISO: ago(40) },
  ]
  for (const r of rows) await addDoc(col, { ...base, ...r } as never)
}
