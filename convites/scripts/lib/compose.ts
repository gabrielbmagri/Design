// Monta tudo de um cliente a partir do formulário (cliente.json): configuração do evento, convites e convidados.
// Roda no Node (via esbuild) e usa as mesmas funções do site, para a busca por nome funcionar igual.
import { PRESETS } from '../../src/lib/presets'
import { makeMessages } from '../../src/lib/messageKit'
import { nameKeys, phoneKey } from '../../src/lib/text'
import { THEMES } from '../../src/themes'
import type { EventSettings, GiftItem } from '../../src/lib/types'

export interface Pessoa { nome: string; crianca?: boolean; idade?: number | null; telefone?: string }
export interface ConviteForm { convite?: string; anfitriao?: 1 | 2; telefone?: string; pessoas: Pessoa[]; acompanhante?: boolean; reserva?: boolean; etiquetas?: string[] }
export interface ClienteForm {
  slug: string
  tipo: 'aniversario' | 'casamento'
  tema: string
  contratante: { nome: string; email: string; whatsapp?: string }
  festejado: { nome: string; artigo?: 'o' | 'a'; nascimento?: string; inicio?: string; faz?: string }
  anfitrioes: string[]
  anfitrioesWhatsapp?: string[]
  evento: { data: string; hora: string; local: string; endereco: string; mapa?: string; traje?: string; prazoConfirmacao?: string; nota?: string }
  textos?: Partial<Pick<EventSettings, 'subtitle' | 'introText' | 'letter' | 'letterSign' | 'welcomeYes' | 'welcomeNo' | 'welcomeMaybe' | 'entryEyebrow' | 'entryLead' | 'entryAccent' | 'counterLead' | 'counterTail'>>
  historia?: { titulo: string; texto?: string; foto: string }[]
  carrossel?: string[]
  fotoCapa?: string
  conviteImagem?: string
  presentes?: { ativar: boolean; pix?: string; nomePix?: string; cidade?: string; titulo?: string; nota?: string; itens?: GiftItem[]; aceitouTermos?: boolean }
  convidados?: ConviteForm[]
  limitePorAnfitriao?: number
  /** gratuidade para crianças no salão: até que idade (anos). Vazio ou null = o salão não tem gratuidade */
  gratuidadeCriancaAte?: number | null
  dicaDia?: string
  pacote?: string
  preco?: number
  aceitouTermos?: boolean
}

const join = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`)
const TS = { __ts: true }

function brDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function kidsMoments(n: string, art: string, pais: string, nasc: string | undefined) {
  const de = art === 'a' ? 'da' : 'do'
  const label0 = nasc ? `${brDate(nasc.slice(0, 10))}${nasc.length > 10 ? ` · ${nasc.slice(11, 13)}h` : ''}` : 'O dia em que chegou'
  return [
    [label0, `Nesse dia ${art} ${n} chegou e a nossa vida ganhou uma cor nova.`],
    ['Os primeiros dias', 'Noites curtas, colo longo e um amor que a gente nem sabia que cabia no peito.'],
    ['Os primeiros sorrisos', 'Veio o primeiro sorriso e, com ele, a certeza de que os dias iam ficar mais leves.'],
    ['Descobertas', 'Mãozinhas curiosas, gargalhadas e a vontade de explorar tudo ao redor.'],
    [pais, `Acompanhar o crescimento ${de} ${n}, com tanta curiosidade e carinho por todo mundo, é o maior presente que a vida nos deu.`],
    ['1 aninho', `Chegou a hora de celebrar o primeiro ano ${de} ${n}. E a festa só fica completa com você.`],
  ]
}
function weddingMoments(nomes: string) {
  return [
    ['Como nos conhecemos', 'Foi num dia comum, que deixou de ser comum assim que a gente se viu.'],
    ['O primeiro encontro', 'Um café que virou tarde, a tarde que virou noite e a vontade de não ir embora.'],
    ['Os primeiros planos', 'Entre viagens e sonhos, a gente descobriu que o melhor lugar era um ao lado do outro.'],
    ['O pedido', 'Uma pergunta simples, uma resposta sem hesitar e o começo de uma nova história.'],
    ['Nosso lar', 'Das pequenas coisas do dia a dia nasceu um lar cheio de amor.'],
    ['Agora, o grande dia', `Chegou a hora de dizer sim diante de quem a gente mais ama. E a celebração de ${nomes} só fica completa com você.`],
  ]
}

export function composeSettings(f: ClienteForm, assetBase: string): EventSettings {
  const theme = THEMES.find((t) => t.id === f.tema) ?? THEMES[0]
  const wedding = f.tipo === 'casamento'
  const base = PRESETS.find((p) => p.settings.kind === (wedding ? 'wedding' : 'kids') && p.id === (PRESETS.some((p2) => p2.id === f.tema) ? f.tema : wedding ? 'ouro' : 'safari'))!.settings
  const nome = f.festejado.nome
  const art = f.festejado.artigo ?? 'o'
  const [a, b] = [f.anfitrioes[0] ?? 'Anfitrião 1', f.anfitrioes[1] ?? '']
  const pais = join(f.anfitrioes)
  const ph = (x?: string) => (x ? assetBase + x : '')
  const moments = wedding ? weddingMoments(nome) : kidsMoments(nome, art, pais, f.festejado.nascimento)
  const story = moments.map(([label, text], i) => {
    const o = f.historia?.[i]
    return { label: o?.titulo ?? label, text: o?.texto ?? text, photo: ph(o?.foto) }
  })
  const subjectLead = wedding ? nome : `${art} ${nome}`
  const occasion = wedding ? `casamento de ${nome}` : `aniversário ${art === 'a' ? 'da' : 'do'} ${nome}`
  const emoji = theme.emojis[0]
  const dress = f.evento.traje ?? ''
  const gifts = f.presentes
  const msgs = makeMessages({
    kind: wedding ? 'wedding' : 'kids',
    subject: subjectLead,
    occasion,
    emoji,
    sign: join(f.anfitrioes),
    dress,
    opening: wedding
      ? `${nome} vão se casar e queremos muito você ao nosso lado nesse dia tão especial.`
      : `${art === 'a' ? 'A' : 'O'} ${nome} vai fazer ${f.festejado.faz ?? '1 aninho'} e queremos muito você com a gente nessa festa.`,
    tomorrowTip: f.dicaDia ?? 'Chegando no horário, aproveitamos a festa juntos. 💗',
  })
  const s: EventSettings = {
    ...base,
    ...msgs,
    themeId: theme.id,
    kind: wedding ? 'wedding' : 'kids',
    hostAName: a,
    hostBName: b || a,
    eventShort: occasion,
    childName: nome,
    title: wedding ? `${nome} vão se casar` : `${nome} faz ${f.festejado.faz ?? '1 ano'}`.replace('1 aninho', '1 ano'),
    entryEyebrow: wedding ? `O casamento de ${nome}` : `O primeiro aninho ${art === 'a' ? 'da' : 'do'} ${nome}`,
    entryLead: wedding ? 'Confirme sua presença no' : 'Confirme sua presença na',
    entryAccent: wedding ? 'nosso grande dia' : `festa ${art === 'a' ? 'da' : 'do'} ${nome}`,
    counterLead: wedding ? 'Juntos há' : `${art === 'a' ? 'A' : 'O'} ${nome} já viveu`,
    counterTail: wedding ? 'e cada um deles foi uma escolha de amor.' : 'e cada um deles foi cheio de amor.',
    subtitle: wedding ? 'E queremos você ao nosso lado.' : 'Venha celebrar com a gente!',
    dateISO: f.evento.data,
    dateNote: f.evento.nota ?? '',
    timeStart: f.evento.hora,
    timeEnd: '',
    venueName: f.evento.local,
    address: f.evento.endereco,
    mapsUrl: f.evento.mapa ?? '',
    mapsQuery: `${f.evento.local}, ${f.evento.endereco}`,
    dressCode: dress,
    rsvpDeadlineISO: f.evento.prazoConfirmacao ?? '',
    welcomeYes: wedding ? 'Será uma alegria enorme ter você ao nosso lado nesse dia.' : `${art === 'a' ? 'A' : 'O'} ${nome} vai ficar muito feliz com a sua companhia.`,
    story,
    birthISO: (wedding ? f.festejado.inicio : f.festejado.nascimento) ?? base.birthISO,
    introText: wedding ? 'Essa é a história de dois caminhos que se encontraram.' : 'Essa é a história de um ano que mudou as nossas vidas.',
    letter: wedding
      ? 'Obrigado por fazer parte da nossa história. Cada pessoa convidada para este dia tem um pedacinho dela. Queremos muito viver esse momento ao seu lado.'
      : `Obrigado por fazer parte da vida ${art === 'a' ? 'da' : 'do'} ${nome}. Cada pessoa convidada para esta festa tem um pedacinho dessa história: num colo, numa visita, numa mensagem, numa oração. Queremos muito viver esse dia ao seu lado.`,
    letterSign: `Com amor, ${join(f.anfitrioes)}`,
    carousel: (f.carrossel?.length ? f.carrossel : f.historia?.map((h) => h.foto) ?? []).map(ph),
    gifts: gifts?.itens ?? [],
    giftNote: gifts?.nota ?? base.giftNote,
    giftsEnabled: !!gifts?.ativar,
    giftsTitle: gifts?.titulo ?? (wedding ? 'Lista de presentes' : 'Presentes'),
    pix: gifts?.pix ?? '',
    pixName: gifts?.nomePix ?? '',
    pixCity: gifts?.cidade ?? '',
    giftsTermsISO: gifts?.ativar && gifts.aceitouTermos ? new Date().toISOString().slice(0, 10) : '',
    capPerHost: f.limitePorAnfitriao ?? (wedding ? 80 : 50),
    childFreeMaxAge: f.gratuidadeCriancaAte ?? -1,
    inviteImage: ph(f.conviteImagem),
    heroPhoto: ph(f.fotoCapa ?? f.historia?.[5]?.foto ?? f.historia?.[0]?.foto),
    gabrielPhone: f.anfitrioesWhatsapp?.[0] ?? '',
    luizaPhone: f.anfitrioesWhatsapp?.[1] ?? f.anfitrioesWhatsapp?.[0] ?? '',
    hostsPhone: f.anfitrioesWhatsapp?.[0] ?? '',
    ...f.textos,
  }
  if (gifts?.ativar && !gifts.aceitouTermos) s.giftsEnabled = false // sem aceite, a loja não liga
  return s
}

export interface Doc { path: string; data: Record<string, unknown> }

/** Convites e pessoas prontos para gravar (ids determinísticos: rodar de novo não duplica). */
export async function composeGuests(f: ClienteForm, eventId: string): Promise<Doc[]> {
  const out: Doc[] = []
  const list = f.convidados ?? []
  for (let n = 0; n < list.length; n++) {
    const c = list[n]
    const pessoas = c.pessoas.filter((p) => p.nome.trim())
    if (!pessoas.length) continue
    const host = c.anfitriao === 2 ? 'luiza' : 'gabriel'
    const label = c.convite?.trim() || join(pessoas.filter((p) => !p.crianca).map((p) => p.nome.trim().split(/\s+/)[0]))
    const inviteId = `c${String(n + 1).padStart(3, '0')}`
    const invitePk = await phoneKey(c.telefone ?? '')
    const memberPhones: Record<string, string> = {}
    for (let i = 0; i < pessoas.length; i++) {
      const p = pessoas[i]
      const gid = `${inviteId}p${i + 1}`
      if (p.telefone?.trim()) memberPhones[gid] = p.telefone.trim()
      const keys = new Set(nameKeys(p.nome))
      if (invitePk) keys.add(invitePk)
      const pk = await phoneKey(p.telefone ?? '')
      if (pk) keys.add(pk)
      out.push({
        path: `events/${eventId}/guests/${gid}`,
        data: {
          name: p.nome.trim(), inviteId, inviteLabel: label, host, active: !c.reserva, reserve: !!c.reserva, removed: false,
          isChild: !!p.crianca, age: p.crianca ? p.idade ?? null : null, ageFromGuest: false, searchKeys: [...keys], order: i,
          status: 'pending', respondedAt: null, respondedBy: null, createdAt: TS, updatedAt: TS,
        },
      })
    }
    if (c.acompanhante) {
      out.push({
        path: `events/${eventId}/guests/${inviteId}plus`,
        data: {
          name: 'Acompanhante', isPlusOne: true, inviteId, inviteLabel: label, host, active: !c.reserva, reserve: !!c.reserva, removed: false,
          isChild: false, age: null, searchKeys: [], order: 99, status: 'pending', plusOneName: null, respondedAt: null, respondedBy: null,
          createdAt: TS, updatedAt: TS,
        },
      })
    }
    out.push({
      path: `events/${eventId}/invites/${inviteId}`,
      data: {
        label, host, phone: (c.telefone ?? '').trim(), memberPhones, notes: '', tags: c.etiquetas ?? [], reserve: !!c.reserva, archived: false,
        createdAt: TS, updatedAt: TS, updatedBy: 'provisionamento', sentAt: null, lastReminderAt: null, reminderCount: 0,
      },
    })
  }
  return out
}
export { THEMES } from '../../src/themes'
