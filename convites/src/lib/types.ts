import type { Timestamp } from 'firebase/firestore'

export type Host = 'gabriel' | 'luiza'
export type Status = 'pending' | 'yes' | 'no' | 'maybe'

/** Nome de cada anfitrião; vem da configuração do evento (setHostLabels). */
export const HOST_LABEL: Record<Host, string> = { gabriel: 'Anfitrião 1', luiza: 'Anfitrião 2' }

export function setHostLabels(a: string, b: string) {
  HOST_LABEL.gabriel = a || 'Anfitrião 1'
  HOST_LABEL.luiza = b || 'Anfitrião 2'
}

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
  /** vaga de acompanhante liberada pelo admin; o convidado escreve o nome */
  isPlusOne?: boolean
  plusOneName?: string | null
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
  countdownCount?: number
  reserve: boolean
  archived: boolean
  createdAt: Timestamp
}

export interface GiftItem {
  /** identificador estável (não muda se a lista for reordenada) */
  id?: string
  /** "item" = presente físico, só uma pessoa escolhe; "cota" = valor em dinheiro via Pix (qualquer um pode contribuir) */
  kind?: 'item' | 'cota'
  /** valor da cota em reais; vazio = valor livre */
  amount?: number
  /** grupo na tela, ex.: "Ela adora" */
  group?: string
  title: string
  detail?: string
  link?: string
}

export interface EventSettings {
  /** tema visual (src/themes.ts) e tipo de evento */
  themeId: string
  kind: 'kids' | 'wedding'
  /** nomes dos dois anfitriões (ex.: pais, ou os noivos) e o nome curto do evento */
  hostAName: string
  hostBName: string
  eventShort: string
  /** tela de entrada */
  entryEyebrow: string
  entryLead: string
  entryAccent: string
  /** contador de tempo (nascimento / início do casal) */
  counterLead: string
  counterTail: string
  childName: string
  title: string
  subtitle: string
  dateISO: string // 2026-12-05
  /** observação ao lado do dia da semana, ex.: "feriado" */
  dateNote: string
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
  /** chave Pix de quem recebe (loja de presentes) */
  pix: string
  pixName: string
  pixCity: string
  /** loja de presentes opcional: mostra Pix e cotas; precisa do aceite dos termos */
  giftsEnabled: boolean
  giftsTitle: string
  /** quando o cliente aceitou os termos da loja de presentes (AAAA-MM-DD) */
  giftsTermsISO: string
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
  lastCallMessage: string
  pendingMessage: string
  countdownMessage: string
  tomorrowMessage: string
  /** imagem do convite (aparece na imersão e no convite completo) */
  inviteImage: string
  /** foto de capa no topo da imersão */
  heroPhoto: string
}

/** Presente informado por um convidado (aparece só no painel). */
export interface Gift {
  id: string
  itemId: string
  itemTitle: string
  amount: number
  from: string
  message: string
  anonymous: boolean
  status: 'declared' | 'confirmed'
  at: Timestamp
  confirmedAt?: Timestamp | null
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
