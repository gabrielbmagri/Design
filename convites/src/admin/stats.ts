import type { EventSettings, Guest, Host, Invite } from '../lib/types'

export const DAY = 864e5

export function isFreeChild(g: Guest, s: EventSettings) {
  return g.isChild && g.age != null && g.age <= s.childFreeMaxAge
}

export function ms(t: { toMillis: () => number } | null | undefined) {
  return t ? t.toMillis() : 0
}

export interface HostStats {
  host: Host
  cap: number
  invited: number // pessoas que contam (pagantes) e ainda não recusaram
  confirmed: number
  declined: number
  waiting: number
  maybe: number
  free: number // vagas livres
  reserves: number
  freeKids: number
}

export function computeStats(invites: Invite[], guests: Guest[], s: EventSettings, now = Date.now()) {
  const invById = new Map(invites.map((i) => [i.id, i]))
  const live = guests.filter((g) => !g.removed && invById.get(g.inviteId) && !invById.get(g.inviteId)!.archived)
    // vaga de acompanhante só conta quando a pessoa diz que vai levar alguém
    .filter((g) => !g.isPlusOne || g.status === 'yes')
  const invited = live.filter((g) => !invById.get(g.inviteId)!.reserve)
  const reserves = live.filter((g) => invById.get(g.inviteId)!.reserve)

  const byHost = (host: Host): HostStats => {
    const mine = invited.filter((g) => g.host === host)
    const paying = mine.filter((g) => !isFreeChild(g, s))
    const counting = paying.filter((g) => g.status !== 'no')
    return {
      host,
      cap: s.capPerHost,
      invited: counting.length,
      confirmed: paying.filter((g) => g.status === 'yes').length,
      declined: paying.filter((g) => g.status === 'no').length,
      waiting: paying.filter((g) => g.status === 'pending').length,
      maybe: paying.filter((g) => g.status === 'maybe').length,
      free: s.capPerHost - counting.length,
      reserves: reserves.filter((g) => g.host === host).length,
      freeKids: mine.filter((g) => isFreeChild(g, s) && g.status !== 'no').length,
    }
  }

  const kids = invited.filter((g) => g.isChild)
  const kidsGoing = kids.filter((g) => g.status === 'yes')
  const kidsExpected = kids.filter((g) => g.status !== 'no')

  const activeInvites = invites.filter((i) => !i.archived && !i.reserve)
  const guestsOf = (id: string) => invited.filter((g) => g.inviteId === id)

  const reminders = activeInvites
    .filter((i) => i.sentAt)
    .map((i) => {
      const members = guestsOf(i.id)
      const open = members.filter((g) => g.status === 'pending' || g.status === 'maybe')
      const since = Math.max(ms(i.sentAt), ms(i.lastReminderAt))
      return { invite: i, members, open, since, days: Math.floor((now - ms(i.sentAt)) / DAY) }
    })
    .filter((r) => r.open.length && now - r.since >= s.reminderDays * DAY)
    .sort((a, b) => a.since - b.since)

  const upcoming = activeInvites
    .filter((i) => i.sentAt)
    .map((i) => ({ invite: i, open: guestsOf(i.id).filter((g) => g.status === 'pending' || g.status === 'maybe') }))
    .filter((r) => r.open.length && !reminders.some((x) => x.invite.id === r.invite.id))

  const notSent = activeInvites.filter((i) => !i.sentAt)

  const paying = invited.filter((g) => !isFreeChild(g, s))
  const totals = {
    people: invited.length,
    paying: paying.filter((g) => g.status !== 'no').length,
    payingConfirmed: paying.filter((g) => g.status === 'yes').length,
    confirmed: invited.filter((g) => g.status === 'yes').length,
    declined: invited.filter((g) => g.status === 'no').length,
    pending: invited.filter((g) => g.status === 'pending').length,
    maybe: invited.filter((g) => g.status === 'maybe').length,
    reserves: reserves.length,
    invites: activeInvites.length,
    sent: activeInvites.filter((i) => i.sentAt).length,
    cap: s.capPerHost * 2,
  }

  return {
    live,
    invited,
    reserves,
    hosts: [byHost('gabriel'), byHost('luiza')],
    kids,
    kidsGoing,
    kidsExpected,
    kidsFree: kidsExpected.filter((g) => isFreeChild(g, s)),
    kidsNoAge: kidsExpected.filter((g) => g.age == null),
    reminders,
    upcoming,
    notSent,
    totals,
    guestsOf,
  }
}

export type Stats = ReturnType<typeof computeStats>
