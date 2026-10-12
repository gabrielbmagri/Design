import { SITE_URL } from '../lib/firebase'
import type { EventSettings, Guest, Invite } from '../lib/types'
import { HOST_LABEL } from '../lib/types'
import { fillTemplate, firstName, fmtTime, joinNames, longDate, waLink } from '../lib/text'

export function inviteLink(inviteId: string) {
  return `${SITE_URL}/c/${inviteId}`
}

function vars(s: EventSettings, invite: Invite, members: Guest[]) {
  const adults = members.filter((g) => !g.isChild)
  const names = (adults.length ? adults : members).map((g) => firstName(g.name))
  return {
    nome: joinNames(names) || invite.label,
    convite: invite.label,
    crianca: s.childName,
    data: longDate(s.dateISO),
    hora: fmtTime(s.timeStart),
    local: [s.venueName, s.address].filter(Boolean).join(', '),
    endereco: s.address,
    prazo: longDate(s.rsvpDeadlineISO),
    link: inviteLink(invite.id),
    anfitriao: HOST_LABEL[invite.host],
  }
}

export function inviteText(s: EventSettings, invite: Invite, members: Guest[]) {
  return fillTemplate(s.inviteMessage, vars(s, invite, members))
}

export function reminderText(s: EventSettings, invite: Invite, members: Guest[]) {
  return fillTemplate(s.reminderMessage, vars(s, invite, members))
}

export function inviteWa(s: EventSettings, invite: Invite, members: Guest[]) {
  return waLink(invite.phone, inviteText(s, invite, members))
}

export function reminderWa(s: EventSettings, invite: Invite, members: Guest[]) {
  return waLink(invite.phone, reminderText(s, invite, members))
}
