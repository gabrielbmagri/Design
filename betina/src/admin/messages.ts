import { SITE_URL } from '../lib/firebase'
import type { EventSettings, Guest, Invite } from '../lib/types'
import { HOST_LABEL } from '../lib/types'
import { eventDate, fillTemplate, forGroup, firstName, fmtTime, guestName, joinNames, longDate, waLink } from '../lib/text'

const MEMBER_STATUS: Record<Guest['status'], string> = {
  pending: '⏳ aguardando resposta',
  maybe: '🤔 talvez',
  yes: '✅ presença confirmada',
  no: '❌ não poderá ir',
}

export function inviteLink(inviteId: string) {
  return `${SITE_URL}/c/${inviteId}`
}

function vars(s: EventSettings, invite: Invite, members: Guest[]) {
  const adults = members.filter((g) => !g.isChild && !g.isPlusOne)
  const names = (adults.length ? adults : members.filter((g) => !g.isPlusOne)).map((g) => firstName(g.name))
  return {
    nome: joinNames(names) || invite.label,
    convite: invite.label,
    crianca: s.childName,
    data: eventDate(s.dateISO, s.dateNote),
    hora: fmtTime(s.timeStart),
    local: [s.venueName, s.address].filter(Boolean).join(', '),
    endereco: s.address,
    prazo: longDate(s.rsvpDeadlineISO),
    link: inviteLink(invite.id),
    anfitriao: HOST_LABEL[invite.host],
    pessoas: members
      .filter((g) => !g.isPlusOne)
      .map((g) => `• ${guestName(g)}`)
      .join('\n'),
    convidados: members
      .filter((g) => !g.isPlusOne)
      .map((g) => `• ${guestName(g)} — ${MEMBER_STATUS[g.status]}`)
      .join('\n'),
  }
}

const many = (members: Guest[]) => members.filter((g) => !g.isChild && !g.isPlusOne).length > 1

export function inviteText(s: EventSettings, invite: Invite, members: Guest[]) {
  return forGroup(fillTemplate(s.inviteMessage, vars(s, invite, members)), many(members))
}

export function reminderText(s: EventSettings, invite: Invite, members: Guest[]) {
  return forGroup(fillTemplate(s.reminderMessage, vars(s, invite, members)), many(members))
}

export function lastCallText(s: EventSettings, invite: Invite, members: Guest[]) {
  return forGroup(fillTemplate(s.lastCallMessage, vars(s, invite, members)), many(members))
}

export function lastCallWa(s: EventSettings, invite: Invite, members: Guest[]) {
  return waLink(invite.phone, lastCallText(s, invite, members))
}

export function pendingWa(s: EventSettings, invite: Invite, members: Guest[]) {
  return waLink(invite.phone, forGroup(fillTemplate(s.pendingMessage, vars(s, invite, members)), many(members)))
}

export function inviteWa(s: EventSettings, invite: Invite, members: Guest[]) {
  return waLink(invite.phone, inviteText(s, invite, members))
}

export function reminderWa(s: EventSettings, invite: Invite, members: Guest[]) {
  return waLink(invite.phone, reminderText(s, invite, members))
}
