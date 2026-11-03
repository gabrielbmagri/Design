import { doc, getDocs, increment, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { guestsCol, invitesCol, logCol, settingsRef } from '../lib/data'
import { nameKeys, phoneKey } from '../lib/text'
import type { EventSettings, Guest, Host, Invite, Status } from '../lib/types'

export interface MemberDraft {
  id?: string
  name: string
  isChild: boolean
  age: number | null
  phone: string
  status?: Status
}

export interface InviteDraft {
  id?: string
  label: string
  host: Host
  phone: string
  notes: string
  tags: string[]
  reserve: boolean
  members: MemberDraft[]
  /** libera uma vaga de acompanhante para o convidado preencher */
  plusOne?: boolean
}

export function autoLabel(names: string[]) {
  const n = names.map((x) => x.trim()).filter(Boolean)
  if (n.length <= 2) return n.join(' e ')
  return `${n.slice(0, -1).join(', ')} e ${n[n.length - 1]}`
}

/**
 * Cria ou atualiza o convite e todas as pessoas dele numa única gravação.
 * Pessoas removidas do convite não são apagadas — ficam arquivadas (com a resposta guardada).
 */
export async function saveInvite(draft: InviteDraft, existing: Guest[], by: string) {
  const batch = writeBatch(db)
  const inviteRef = draft.id ? doc(invitesCol, draft.id) : doc(invitesCol)
  const members = draft.members.filter((m) => m.name.trim())
  const label = draft.label.trim() || autoLabel(members.map((m) => m.name))
  const invitePhoneKey = await phoneKey(draft.phone)
  const memberPhones: Record<string, string> = {}

  const keptIds = new Set<string>()
  for (let i = 0; i < members.length; i++) {
    const m = members[i]
    const ref = m.id ? doc(guestsCol, m.id) : doc(guestsCol)
    keptIds.add(ref.id)
    if (m.phone.trim()) memberPhones[ref.id] = m.phone.trim()
    const keys = new Set(nameKeys(m.name))
    if (invitePhoneKey) keys.add(invitePhoneKey)
    const pk = await phoneKey(m.phone)
    if (pk) keys.add(pk)
    const prev = existing.find((g) => g.id === ref.id)
    const data: Record<string, unknown> = {
      name: m.name.trim(),
      inviteId: inviteRef.id,
      inviteLabel: label,
      host: draft.host,
      active: !draft.reserve,
      reserve: draft.reserve,
      removed: false,
      isChild: m.isChild,
      age: m.isChild ? m.age : null,
      ageFromGuest: m.isChild && prev?.ageFromGuest && prev.age === m.age ? true : false,
      searchKeys: [...keys],
      order: i,
      updatedAt: serverTimestamp(),
    }
    if (!prev) {
      data.status = 'pending'
      data.respondedAt = null
      data.respondedBy = null
      data.createdAt = serverTimestamp()
    }
    batch.set(ref, data, { merge: true })
  }

  for (const g of existing) {
    if (g.isPlusOne) continue
    if (!keptIds.has(g.id)) batch.update(doc(guestsCol, g.id), { active: false, removed: true, updatedAt: serverTimestamp() })
  }

  // vaga de acompanhante: não aparece na busca por nome, só dentro do convite
  const plus = existing.find((g) => g.isPlusOne)
  if (draft.plusOne) {
    const ref = plus ? doc(guestsCol, plus.id) : doc(guestsCol)
    const data: Record<string, unknown> = {
      name: 'Acompanhante',
      isPlusOne: true,
      inviteId: inviteRef.id,
      inviteLabel: label,
      host: draft.host,
      active: !draft.reserve,
      reserve: draft.reserve,
      removed: false,
      isChild: false,
      age: null,
      searchKeys: [],
      order: 99,
      updatedAt: serverTimestamp(),
    }
    if (!plus) {
      data.status = 'pending'
      data.plusOneName = null
      data.respondedAt = null
      data.respondedBy = null
      data.createdAt = serverTimestamp()
    }
    batch.set(ref, data, { merge: true })
  } else if (plus && !plus.removed) {
    batch.update(doc(guestsCol, plus.id), { active: false, removed: true, updatedAt: serverTimestamp() })
  }

  const inv: Record<string, unknown> = {
    label,
    host: draft.host,
    phone: draft.phone.trim(),
    memberPhones,
    notes: draft.notes,
    tags: draft.tags,
    reserve: draft.reserve,
    archived: false,
    updatedAt: serverTimestamp(),
    updatedBy: by,
  }
  if (!draft.id) {
    inv.createdAt = serverTimestamp()
    inv.sentAt = null
    inv.lastReminderAt = null
    inv.reminderCount = 0
  }
  batch.set(inviteRef, inv, { merge: true })
  await batch.commit()
  return inviteRef.id
}

/** Arquivar = some do site e das contas, mas nada é apagado. */
export async function setArchived(invite: Invite, guests: Guest[], archived: boolean) {
  const batch = writeBatch(db)
  batch.update(doc(invitesCol, invite.id), { archived, updatedAt: serverTimestamp() })
  for (const g of guests)
    if (!g.removed) batch.update(doc(guestsCol, g.id), { active: !archived && !invite.reserve, updatedAt: serverTimestamp() })
  await batch.commit()
}

/** Reserva → convidado de verdade (ou o contrário). */
export async function setReserve(invite: Invite, guests: Guest[], reserve: boolean) {
  const batch = writeBatch(db)
  batch.update(doc(invitesCol, invite.id), { reserve, updatedAt: serverTimestamp() })
  for (const g of guests)
    if (!g.removed) batch.update(doc(guestsCol, g.id), { reserve, active: !reserve && !invite.archived, updatedAt: serverTimestamp() })
  await batch.commit()
}

export async function markSent(invite: Invite) {
  await updateDoc(doc(invitesCol, invite.id), { sentAt: serverTimestamp() })
}

export async function clearSent(invite: Invite) {
  await updateDoc(doc(invitesCol, invite.id), { sentAt: null, lastReminderAt: null, reminderCount: 0 })
}

export async function markReminded(invite: Invite) {
  await updateDoc(doc(invitesCol, invite.id), { lastReminderAt: serverTimestamp(), reminderCount: increment(1) })
}

/** Lembrança da festa: n = quantas já foram enviadas (0 a 3). Sem n, conta mais uma. */
export async function markCountdown(invite: Invite, n?: number) {
  const next = Math.max(0, Math.min(3, n ?? (invite.countdownCount ?? 0) + 1))
  await updateDoc(doc(invitesCol, invite.id), { countdownCount: next, lastCountdownAt: serverTimestamp() })
}

export async function setGuestStatus(g: Guest, status: Status, by: string) {
  const batch = writeBatch(db)
  batch.update(doc(guestsCol, g.id), {
    status,
    respondedAt: status === 'pending' ? null : serverTimestamp(),
    respondedBy: status === 'pending' ? null : `${by} (painel)`,
    updatedAt: serverTimestamp(),
  })
  batch.set(doc(logCol), {
    guestId: g.id, guestName: g.name, inviteId: g.inviteId, status,
    age: g.age ?? null, by, source: 'admin', at: serverTimestamp(),
  })
  await batch.commit()
}

export async function setGuestAge(g: Guest, age: number | null) {
  await updateDoc(doc(guestsCol, g.id), { age, ageFromGuest: false, updatedAt: serverTimestamp() })
}

export async function saveSettings(s: EventSettings) {
  const batch = writeBatch(db)
  batch.set(settingsRef, { ...s, updatedAt: serverTimestamp() })
  await batch.commit()
}

/** Cópia completa do banco em JSON (backup manual). */
export async function exportBackup() {
  const [inv, gst, log] = await Promise.all([getDocs(invitesCol), getDocs(guestsCol), getDocs(logCol)])
  const conv = (v: unknown): unknown => {
    if (v && typeof v === 'object' && 'toDate' in (v as object)) return (v as { toDate: () => Date }).toDate().toISOString()
    if (Array.isArray(v)) return v.map(conv)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, conv(x)]))
    return v
  }
  const dump = (s: typeof inv) => s.docs.map((d) => ({ id: d.id, ...(conv(d.data()) as object) }))
  return {
    exportedAt: new Date().toISOString(),
    invites: dump(inv),
    guests: dump(gst),
    rsvpLog: dump(log),
  }
}

export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/**
 * Importação rápida: uma linha por convite.
 *   Maria Silva, João Silva ; 11 99999-0000
 *   Ana e Pedro (criança 3) ; 21988887777
 * Use "(criança)" ou "(criança 4)" depois do nome para marcar crianças.
 */
export function parseBulk(text: string): Omit<InviteDraft, 'host' | 'reserve'>[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawNames, phonePart = ''] = line.split(/[;|]/)
      const plusOne = /\(?\+\s*1\)?/.test(rawNames)
      const namesPart = rawNames.replace(/\(?\+\s*1\)?/g, ' ')
      const names = namesPart
        .split(/,|\s+e\s+|\s*&\s*|\s*\+\s*/i)
        .map((n) => n.trim())
        .filter(Boolean)
      const members: MemberDraft[] = names.map((raw) => {
        const m = raw.match(/\((?:crian[cç]a|kid)\s*(\d+)?\s*(?:anos?)?\)/i)
        const name = raw.replace(/\(.*?\)/g, '').trim()
        return { name, isChild: !!m, age: m?.[1] ? Number(m[1]) : null, phone: '' }
      })
      return { label: '', phone: phonePart.trim(), notes: '', tags: [], members, plusOne }
    })
    .filter((d) => d.members.length)
}
