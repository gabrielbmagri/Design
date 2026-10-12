import {
  addDoc, collection, doc, getDoc, getDocs, limit, onSnapshot, query, serverTimestamp,
  where, writeBatch,
} from 'firebase/firestore'
import { db, ensureGuestSession } from './firebase'
import { DEFAULT_SETTINGS } from './defaults'
import { guestName, queryKey } from './text'
import type { EventSettings, Guest, Status } from './types'

export const guestsCol = collection(db, 'guests')
export const invitesCol = collection(db, 'invites')
export const logCol = collection(db, 'rsvpLog')
export const settingsRef = doc(db, 'settings', 'event')

export function withDefaults(data: Partial<EventSettings> | undefined): EventSettings {
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) }
}

export function watchSettings(cb: (s: EventSettings) => void) {
  return onSnapshot(
    settingsRef,
    (snap) => cb(withDefaults(snap.data() as Partial<EventSettings>)),
    () => cb(DEFAULT_SETTINGS),
  )
}

const toGuest = (d: { id: string; data: () => unknown }) => ({ id: d.id, ...(d.data() as object) }) as Guest

export interface InviteMatch {
  inviteId: string
  label: string
  guests: Guest[]
  /** pessoas deste convite que bateram com o nome digitado */
  matchedIds?: string[]
}

/** Busca convites pelo nome (ou telefone) digitado. */
export async function findInvites(input: string): Promise<InviteMatch[]> {
  await ensureGuestSession()
  const key = await queryKey(input)
  if (!key) return []
  const search = (k: string) =>
    getDocs(query(guestsCol, where('active', '==', true), where('searchKeys', 'array-contains', k), limit(30)))
  let snap = await search(key)
  // "Maria Aparecida" não achou? tenta só "maria".
  if (snap.empty && key.includes(' ') && !key.startsWith('tel:')) snap = await search(key.split(' ')[0])
  const matched = snap.docs.map(toGuest)
  const inviteIds = [...new Set(matched.map((g) => g.inviteId))].slice(0, 8)
  const invites = await Promise.all(inviteIds.map(loadInvite))
  return invites
    .filter((x): x is InviteMatch => !!x)
    .map((inv) => ({ ...inv, matchedIds: matched.filter((g) => g.inviteId === inv.inviteId).map((g) => g.id) }))
}

export async function loadInvite(inviteId: string): Promise<InviteMatch | null> {
  await ensureGuestSession()
  const snap = await getDocs(
    query(guestsCol, where('active', '==', true), where('inviteId', '==', inviteId), limit(30)),
  )
  if (snap.empty) return null
  const guests = snap.docs.map(toGuest).sort((a, b) => a.order - b.order)
  return { inviteId, label: guests[0].inviteLabel, guests }
}

export async function loadGuest(id: string) {
  await ensureGuestSession()
  const s = await getDoc(doc(db, 'guests', id))
  return s.exists() ? toGuest(s) : null
}

export interface Answer {
  guestId: string
  status: Status
  age?: number | null
  /** só para a vaga de acompanhante */
  plusOneName?: string | null
}

/**
 * Grava as respostas do convite inteiro de uma vez (tudo ou nada) e
 * registra cada uma no histórico permanente.
 */
export async function saveAnswers(
  invite: InviteMatch,
  answers: Answer[],
  by: string,
  source: 'guest' | 'admin' = 'guest',
) {
  if (source === 'guest') await ensureGuestSession()
  const batch = writeBatch(db)
  for (const a of answers) {
    const g = invite.guests.find((x) => x.id === a.guestId)
    if (!g) continue
    const patch: Record<string, unknown> = {
      status: a.status,
      respondedAt: a.status === 'pending' ? null : serverTimestamp(),
      respondedBy: a.status === 'pending' ? null : by,
      updatedAt: serverTimestamp(),
    }
    if (g.isPlusOne && a.plusOneName !== undefined) patch.plusOneName = a.plusOneName ? a.plusOneName.trim().slice(0, 60) : null
    if (a.age !== undefined && a.age !== g.age) {
      patch.age = a.age
      if (source === 'guest') patch.ageFromGuest = true
    }
    batch.update(doc(db, 'guests', g.id), patch)
    batch.set(doc(logCol), {
      guestId: g.id,
      guestName: g.isPlusOne ? guestName({ ...g, plusOneName: a.plusOneName ?? g.plusOneName }) : g.name,
      inviteId: invite.inviteId,
      status: a.status,
      age: a.age ?? g.age ?? null,
      by,
      source,
      at: serverTimestamp(),
    })
  }
  await batch.commit()
}

export async function logAdminChange(g: Guest, status: Status, by: string) {
  await addDoc(logCol, {
    guestId: g.id, guestName: g.name, inviteId: g.inviteId, status,
    age: g.age ?? null, by, source: 'admin', at: serverTimestamp(),
  })
}
