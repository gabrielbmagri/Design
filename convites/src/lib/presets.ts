import type { EventSettings } from './types'
import { makeMessages } from './messageKit'

const BASE = import.meta.env.BASE_URL
const img = (theme: string, n: number | string) => `${BASE}demo/${theme}/${typeof n === 'number' ? `p${n}` : n}.jpg`

/** Campos que não mudam de um cliente para outro. */
const COMMON = {
  timeEnd: '',
  wazeUrl: '',
  rsvpOpen: true,
  pix: '',
  pixName: '',
  pixCity: '',
  giftsEnabled: false,
  giftsTitle: 'Presentes',
  giftsTermsISO: '',
  hostsPhone: '',
  gabrielPhone: '',
  luizaPhone: '',
  childFreeMaxAge: 5,
  reminderDays: 7,
}

export interface Preset {
  id: string
  label: string
  tagline: string
  settings: EventSettings
}

const kidsStory = (name: string, theme: string, moments: [string, string][]) =>
  moments.map(([label, text], i) => ({ label, text: text.split('{n}').join(name), photo: img(theme, i + 1) }))

const SAFARI: EventSettings = {
  ...COMMON,
  themeId: 'safari',
  kind: 'kids',
  hostAName: 'Carol',
  hostBName: 'Rafa',
  eventShort: 'aniversário do Théo',
  entryEyebrow: 'O primeiro aninho do Théo',
  entryLead: 'Confirme sua presença na',
  entryAccent: 'aventura do Théo',
  counterLead: 'O Théo já viveu',
  counterTail: 'e cada um deles foi uma aventura.',
  childName: 'Théo',
  title: 'Théo faz 1 ano',
  subtitle: 'Uma aventura selvagem está começando!',
  dateISO: '2027-03-20',
  dateNote: '',
  timeStart: '15:00',
  venueName: 'Espaço Safari Park',
  address: 'Rua das Acácias, 120 – Jardim América, São Paulo – SP',
  mapsUrl: '',
  mapsQuery: 'Rua das Acácias, 120, Jardim América, São Paulo - SP',
  dressCode: 'Venha com roupa de explorador!',
  rsvpDeadlineISO: '2027-03-06',
  welcomeYes: 'O Théo vai ficar muito feliz com a sua companhia nessa aventura.',
  welcomeNo: 'Que pena! Vamos sentir sua falta, mas a gente entende.',
  welcomeMaybe: 'Volte aqui e responda quando souber. A expedição continua de portas abertas.',
  story: kidsStory('Théo', 'safari', [
    ['20 de março de 2026 · 10h', 'Nesse dia o Théo chegou e a nossa vida virou uma grande aventura.'],
    ['Os primeiros dias', 'Noites curtas, colo longo e um amor que a gente nem sabia que cabia no peito.'],
    ['Os primeiros sorrisos', 'Veio o primeiro sorriso e, com ele, a certeza de que os dias iam ficar mais leves.'],
    ['Descobertas', 'Mãozinhas curiosas, gargalhadas e a vontade de explorar tudo ao redor.'],
    ['Carol e Rafa', 'Ver o Théo crescer curioso e carinhoso com todo mundo é o maior presente que a vida nos deu.'],
    ['1 aninho', 'Chegou a hora de celebrar o primeiro ano do Théo. E o safari só fica completo com você.'],
  ]),
  birthISO: '2026-03-20T10:00',
  introText: 'Essa é a história de um ano que mudou as nossas vidas.',
  letter:
    'Obrigado por fazer parte da vida do Théo. Cada pessoa convidada para esta festa tem um pedacinho dessa história: num colo, numa visita, numa mensagem, numa oração. Queremos muito viver esse dia ao seu lado.',
  letterSign: 'Com amor, Carol e Rafa',
  carousel: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => img('safari', n)),
  gifts: [
    { group: 'Théo adora', title: 'Livros' },
    { group: 'Théo adora', title: 'Brinquedos educativos' },
    { group: 'Théo adora', title: 'Bichinhos de pelúcia' },
    { group: 'Théo veste', title: 'Roupa', detail: 'Tamanho 1 ou 2 anos' },
    { group: 'Théo veste', title: 'Sapato', detail: 'Número 20 ou 21' },
  ],
  giftNote: 'O mais importante é ter você lá. Se quiser levar uma lembrança, aqui vão algumas ideias:',
  capPerHost: 50,
  inviteImage: img('safari', 'invite'),
  heroPhoto: img('safari', 6),
  ...makeMessages({
    kind: 'kids', subject: 'o Théo', occasion: 'aniversário do Théo', emoji: '🦁', sign: 'Carol e Rafa',
    dress: 'Venha com roupa de explorador!',
    opening: 'A expedição está aberta! O Théo vai fazer 1 aninho e queremos muito você com a gente nessa aventura.',
    tomorrowTip: 'Chegando no horário, aproveitamos a festa juntos. O espaço tem estacionamento próprio, bem na frente. 🚗',
  }),
}

const JARDIM: EventSettings = {
  ...COMMON,
  themeId: 'jardim',
  kind: 'kids',
  hostAName: 'Marina',
  hostBName: 'Bruno',
  eventShort: 'aniversário da Lara',
  entryEyebrow: 'O primeiro aninho da Lara',
  entryLead: 'Confirme sua presença no',
  entryAccent: 'jardim encantado da Lara',
  counterLead: 'A Lara já viveu',
  counterTail: 'e cada um deles floresceu com amor.',
  childName: 'Lara',
  title: 'Lara faz 1 ano',
  subtitle: 'O jardim está em flor!',
  dateISO: '2027-04-17',
  dateNote: '',
  timeStart: '10:00',
  venueName: 'Espaço Jardim das Borboletas',
  address: 'Alameda das Flores, 45 – Alphaville, Barueri – SP',
  mapsUrl: '',
  mapsQuery: 'Alameda das Flores, 45, Alphaville, Barueri - SP',
  dressCode: 'Cores leves, flores e muita alegria!',
  rsvpDeadlineISO: '2027-04-03',
  welcomeYes: 'A Lara vai ficar radiante com a sua presença no jardim.',
  welcomeNo: 'Que pena! Vamos sentir sua falta, mas a gente entende.',
  welcomeMaybe: 'Volte aqui e responda quando souber. As flores continuam esperando por você.',
  story: kidsStory('Lara', 'jardim', [
    ['17 de abril de 2026 · 9h', 'Nesse dia a Lara chegou e o nosso mundo floresceu.'],
    ['Os primeiros dias', 'Colo, cheirinho de bebê e um amor que a gente nem sabia que cabia no peito.'],
    ['Os primeiros sorrisos', 'O primeiro sorriso chegou e iluminou a casa inteira.'],
    ['Descobertas', 'Olhinhos curiosos, risadinhas e o encanto por tudo o que se move: borboletas, flores e folhas.'],
    ['Marina e Bruno', 'Ver a Lara crescer doce e cheia de curiosidade é o maior presente que a vida nos deu.'],
    ['1 aninho', 'Chegou a hora de celebrar o primeiro ano da Lara. E o jardim só fica completo com você.'],
  ]),
  birthISO: '2026-04-17T09:00',
  introText: 'Essa é a história de um ano que mudou as nossas vidas.',
  letter:
    'Obrigado por fazer parte da vida da Lara. Cada pessoa convidada para esta festa tem um pedacinho dessa história: num colo, numa visita, numa mensagem, numa oração. Queremos muito viver esse dia ao seu lado.',
  letterSign: 'Com amor, Marina e Bruno',
  carousel: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => img('jardim', n)),
  gifts: [
    { group: 'Lara adora', title: 'Livros' },
    { group: 'Lara adora', title: 'Bonecas e bichinhos' },
    { group: 'Lara adora', title: 'Brinquedos de encaixe' },
    { group: 'Lara veste', title: 'Roupa', detail: 'Tamanho 1 ou 2 anos' },
    { group: 'Lara veste', title: 'Sapato', detail: 'Número 19 ou 20' },
  ],
  giftNote: 'O mais importante é ter você lá. Se quiser levar uma lembrança, aqui vão algumas ideias:',
  capPerHost: 50,
  inviteImage: img('jardim', 'invite'),
  heroPhoto: img('jardim', 6),
  ...makeMessages({
    kind: 'kids', subject: 'a Lara', occasion: 'aniversário da Lara', emoji: '🦋', sign: 'Marina e Bruno',
    dress: 'Cores leves, flores e muita alegria!',
    opening: 'O jardim está em flor! A Lara vai fazer 1 aninho e queremos muito você com a gente nesse dia encantado.',
    tomorrowTip: 'Chegando no horário, aproveitamos a festa juntos. O espaço tem estacionamento próprio. 🚗',
  }),
}

const weddingStory = (theme: string, moments: [string, string][]) => moments.map(([label, text], i) => ({ label, text, photo: img(theme, i + 1) }))

const OURO: EventSettings = {
  ...COMMON,
  themeId: 'ouro',
  kind: 'wedding',
  hostAName: 'Helena',
  hostBName: 'Rafael',
  eventShort: 'casamento de Helena & Rafael',
  entryEyebrow: 'O casamento de Helena & Rafael',
  entryLead: 'Confirme sua presença no',
  entryAccent: 'nosso grande dia',
  counterLead: 'Juntos há',
  counterTail: 'e cada um deles foi uma escolha de amor.',
  childName: 'Helena & Rafael',
  title: 'Helena & Rafael vão se casar',
  subtitle: 'E queremos você ao nosso lado.',
  dateISO: '2027-05-22',
  dateNote: '',
  timeStart: '17:00',
  venueName: 'Casa Aurora Eventos',
  address: 'Av. das Palmeiras, 800 – Cambuí, Campinas – SP',
  mapsUrl: '',
  mapsQuery: 'Av. das Palmeiras, 800, Cambuí, Campinas - SP',
  dressCode: 'Traje: passeio completo.',
  rsvpDeadlineISO: '2027-04-24',
  welcomeYes: 'Será uma alegria enorme ter você ao nosso lado nesse dia.',
  welcomeNo: 'Que pena! Vamos sentir sua falta, mas a gente entende.',
  welcomeMaybe: 'Volte aqui e responda quando souber. Seu lugar continua reservado.',
  story: weddingStory('ouro', [
    ['Como nos conhecemos', 'Foi num dia comum, que deixou de ser comum assim que a gente se viu.'],
    ['O primeiro encontro', 'Um café que virou tarde, a tarde que virou noite e a vontade de não ir embora.'],
    ['Os primeiros planos', 'Entre viagens e sonhos, a gente descobriu que o melhor lugar era um ao lado do outro.'],
    ['O pedido', 'Uma pergunta simples, uma resposta sem hesitar e o começo de uma nova história.'],
    ['Nossa casa', 'Das pequenas coisas do dia a dia nasceu um lar cheio de amor.'],
    ['Agora, o grande dia', 'Chegou a hora de dizer sim diante de quem a gente mais ama. E a celebração só fica completa com você.'],
  ]),
  birthISO: '2019-06-15T20:00',
  introText: 'Essa é a história de dois caminhos que se encontraram.',
  letter:
    'Obrigado por fazer parte da nossa história. Cada pessoa convidada para este dia tem um pedacinho dela: num conselho, numa visita, numa oração. Queremos muito viver esse momento ao seu lado.',
  letterSign: 'Com amor, Helena e Rafael',
  carousel: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => img('ouro', n)),
  giftsEnabled: true,
  giftsTitle: 'Lista de presentes',
  pix: 'helena.exemplo@email.com',
  pixName: 'Helena Silva',
  pixCity: 'Campinas',
  giftsTermsISO: '2027-03-01',
  gifts: [
    { id: 'jantar', kind: 'cota', amount: 150, group: 'Lua de mel', title: 'Jantar à luz de velas' },
    { id: 'passeio', kind: 'cota', amount: 300, group: 'Lua de mel', title: 'Passeio de barco ao pôr do sol' },
    { id: 'hotel', kind: 'cota', amount: 500, group: 'Lua de mel', title: 'Uma noite no hotel dos sonhos' },
    { id: 'livre', kind: 'cota', group: 'Lua de mel', title: 'Contribuir com outro valor', detail: 'Qualquer valor ajuda a realizar o sonho' },
    { id: 'cafeteira', kind: 'item', group: 'Nossa casa nova', title: 'Cafeteira italiana', detail: 'Cor inox' },
    { id: 'jogo-cama', kind: 'item', group: 'Nossa casa nova', title: 'Jogo de cama casal', detail: 'Branco, 400 fios' },
  ],
  giftNote: 'A sua presença é o nosso maior presente. Se quiser nos presentear, escolha abaixo:',
  capPerHost: 80,
  inviteImage: img('ouro', 'invite'),
  heroPhoto: img('ouro', 6),
  ...makeMessages({
    kind: 'wedding', subject: 'Helena & Rafael', occasion: 'casamento de Helena & Rafael', emoji: '💍', sign: 'Helena e Rafael',
    dress: 'Traje: passeio completo.',
    opening: 'Helena & Rafael vão se casar e queremos muito você ao nosso lado nesse dia tão especial.',
    tomorrowTip: 'Chegando no horário, a cerimônia começa pontualmente. O local tem estacionamento com manobrista. 🚗',
  }),
}

const PRATA: EventSettings = {
  ...OURO,
  themeId: 'prata',
  hostAName: 'Júlia',
  hostBName: 'André',
  eventShort: 'casamento de Júlia & André',
  entryEyebrow: 'O casamento de Júlia & André',
  childName: 'Júlia & André',
  title: 'Júlia & André vão se casar',
  subtitle: 'Nosso começo, juntos para sempre.',
  dateISO: '2027-06-12',
  timeStart: '16:00',
  venueName: 'Villa Cristal',
  address: 'Rua dos Ipês, 310 – Centro, Petrópolis – RJ',
  mapsQuery: 'Rua dos Ipês, 310, Centro, Petrópolis - RJ',
  dressCode: 'Traje: social.',
  rsvpDeadlineISO: '2027-05-15',
  story: weddingStory('prata', [
    ['Como nos conhecemos', 'Uma amiga em comum, uma conversa que não acabava e a certeza de que algo começava ali.'],
    ['O primeiro encontro', 'Nervosismo, risadas e um jantar que a gente nem lembra o que comeu.'],
    ['Crescendo juntos', 'Entre mudanças e conquistas, descobrimos que o melhor caminho era o que fazíamos de mãos dadas.'],
    ['O pedido', 'Um sim cheio de lágrimas e o começo de uma nova fase.'],
    ['Nosso lar', 'De pequenos hábitos nasceu uma casa cheia de afeto.'],
    ['Agora, o grande dia', 'Chegou a hora de dizer sim diante de quem a gente mais ama. E a celebração só fica completa com você.'],
  ]),
  birthISO: '2018-09-08T20:00',
  letterSign: 'Com amor, Júlia e André',
  carousel: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => img('prata', n)),
  inviteImage: img('prata', 'invite'),
  heroPhoto: img('prata', 6),
  ...makeMessages({
    kind: 'wedding', subject: 'Júlia & André', occasion: 'casamento de Júlia & André', emoji: '💍', sign: 'Júlia e André',
    dress: 'Traje: social.',
    opening: 'Júlia & André vão se casar e queremos muito você ao nosso lado nesse dia tão especial.',
    tomorrowTip: 'Chegando no horário, a cerimônia começa pontualmente. O local tem estacionamento próprio. 🚗',
  }),
}

SAFARI.story = SAFARI.story.map((s) => ({ ...s }))
PRATA.story = PRATA.story.map((s) => ({ ...s }))
// no tema prata a estrutura de presentes é a mesma do ouro, com outra conta
PRATA.gifts = OURO.gifts.map((g) => ({ ...g }))
PRATA.pix = 'julia.exemplo@email.com'
PRATA.pixName = 'Julia Andrade'
PRATA.pixCity = 'Petropolis'

export const PRESETS: Preset[] = [
  { id: 'safari', label: 'Safari', tagline: 'Aniversário de menino', settings: SAFARI },
  { id: 'jardim', label: 'Jardim Encantado', tagline: 'Aniversário de menina', settings: JARDIM },
  { id: 'ouro', label: 'Casamento Ouro', tagline: 'Casamento clássico', settings: OURO },
  { id: 'prata', label: 'Casamento Prata', tagline: 'Casamento elegante', settings: PRATA },
]
