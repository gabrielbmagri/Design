import { doc, updateDoc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { guestsCol, invitesCol, logCol } from '../lib/data'
import { saveInvite, type MemberDraft } from '../admin/ops'
import type { Host, Status } from '../lib/types'
import { Timestamp, __isEmpty } from './firestore'

const DAY = 864e5
const m = (name: string, isChild = false, age: number | null = null): MemberDraft => ({ name, isChild, age, phone: '' })

const SAMPLE: { host: Host; phone: string; members: MemberDraft[]; status?: Status[]; sentDaysAgo?: number; reserve?: boolean; tags?: string[] }[] = [
  { host: 'gabriel', phone: '21 99999-0001', members: [m('Maria Silva'), m('João Silva')], status: ['yes', 'yes'], sentDaysAgo: 10, tags: ['família'] },
  { host: 'gabriel', phone: '21 99999-0002', members: [m('Ana Souza'), m('Pedro Souza', true, 3), m('Lia Souza', true)], sentDaysAgo: 9, tags: ['família'] },
  { host: 'gabriel', phone: '21 99999-0003', members: [m('Carlos Mendes')], status: ['maybe'], sentDaysAgo: 8, tags: ['trabalho'] },
  { host: 'gabriel', phone: '21 99999-0004', members: [m('Rosa Oliveira'), m('Antônio Oliveira')], status: ['no', 'no'], sentDaysAgo: 6 },
  { host: 'gabriel', phone: '21 99999-0005', members: [m('Fernanda Lima'), m('Bruno Lima'), m('Theo Lima', true, 7)], sentDaysAgo: 2, tags: ['amigos'] },
  { host: 'gabriel', phone: '21 99999-0006', members: [m('Tia Célia')], reserve: true },
  { host: 'luiza', phone: '21 98888-0001', members: [m('Juliana Menezes'), m('Rafael Menezes'), m('Alice Menezes', true, 4)], status: ['yes', 'yes', 'yes'], sentDaysAgo: 11, tags: ['família'] },
  { host: 'luiza', phone: '21 98888-0002', members: [m('Vó Lourdes')], sentDaysAgo: 12, tags: ['família'] },
  { host: 'luiza', phone: '21 98888-0003', members: [m('Patrícia Costa'), m('Miguel Costa', true, 2)], status: ['yes', 'yes'], sentDaysAgo: 5, tags: ['amigos'] },
  { host: 'luiza', phone: '21 98888-0004', members: [m('Camila Rocha'), m('Diego Rocha')] },
  { host: 'luiza', phone: '21 98888-0005', members: [m('Beatriz Alves')], reserve: true },
]

export async function seedDemo() {
  if (!__isEmpty()) return
  await setDoc(doc(db, 'admins', 'demo@betina'), { host: 'gabriel' })
  for (const s of SAMPLE) {
    const id = await saveInvite(
      { label: '', host: s.host, phone: s.phone, notes: '', tags: s.tags ?? [], reserve: !!s.reserve, members: s.members },
      [],
      'demo',
    )
    if (s.sentDaysAgo != null) await updateDoc(doc(invitesCol, id), { sentAt: Timestamp.fromMillis(Date.now() - s.sentDaysAgo * DAY) })
    if (s.status) {
      const { getDocs, query, where } = await import('firebase/firestore')
      const gs = (await getDocs(query(guestsCol, where('inviteId', '==', id)))).docs.sort((a, b) => (a.get('order') as number) - (b.get('order') as number))
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
