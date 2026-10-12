import type { Timestamp } from 'firebase/firestore'

export type Host = 'gabriel' | 'luiza'
export type Status = 'pending' | 'yes' | 'no' | 'maybe'

export const HOST_LABEL: Record<Host, string> = { gabriel: 'Gabriel', luiza: 'Luiza' }

export const STATUS_LABEL: Record<Status, string> = {
  pending: 'Sem resposta',
  yes: 'Confirmado',
  no: 'Não vai',
  maybe: 'Talvez',
}

/** Documento público de cada pessoa (sem telefone). */
export interface Guest {
  id: string
  name: string
  inviteId: string
  inviteLabel: string
  host: Host
  /** false = reserva (ainda não convidado) ou arquivado */
  active: boolean
  reserve: boolean
  isChild: boolean
  /** idade da criança; null = não informada */
  age: number | null
  /** true quando a idade foi preenchida pelo próprio convidado */
  ageFromGuest?: boolean
  status: Status
  respondedAt?: Timestamp | null
  respondedBy?: string | null
  updatedAt?: Timestamp
  searchKeys: string[]
  order: number
  /** tirado do convite pelo admin (fica guardado) */
  removed?: boolean
  createdAt?: Timestamp
}

/** Documento interno do convite (só admin). */
export interface Invite {
  id: string
  label: string
  host: Host
  phone: string
  memberPhones: Record<string, string>
  notes: string
  tags: string[]
  sentAt: Timestamp | null
  lastReminderAt: Timestamp | null
  reminderCount: number
  reserve: boolean
  archived: boolean
  createdAt: Timestamp
}

export interface GiftItem {
  /** grupo na tela, ex.: "Betina adora" */
  group?: string
  title: string
  detail?: string
  link?: string
}

export interface EventSettings {
  childName: string
  title: string
  subtitle: string
  dateISO: string // 2026-12-05
  timeStart: string // 15:00
  timeEnd: string
  venueName: string
  address: string
  mapsUrl: string
  wazeUrl: string
  dressCode: string
  rsvpDeadlineISO: string
  rsvpOpen: boolean
  welcomeYes: string
  welcomeNo: string
  welcomeMaybe: string
  story: { photo: string; text: string; label?: string }[]
  /** nascimento (para o contador "já viveu X dias") */
  birthISO: string
  introText: string
  letter: string
  letterSign: string
  carousel: string[]
  gifts: GiftItem[]
  giftNote: string
  pix: string
  hostsPhone: string
  /** WhatsApp de cada anfitrião (botão "Falar com…" e assinatura das mensagens) */
  gabrielPhone: string
  luizaPhone: string
  /** o que procurar no mapa embutido (nome do lugar + endereço) */
  mapsQuery: string
  capPerHost: number
  childFreeMaxAge: number
  reminderDays: number
  inviteMessage: string
  reminderMessage: string
  /** imagem do convite (aparece na imersão e no convite completo) */
  inviteImage: string
}

export interface RsvpLog {
  id: string
  guestId: string
  guestName: string
  inviteId: string
  status: Status
  age?: number | null
  by: string
  source: 'guest' | 'admin'
  at: Timestamp
}
