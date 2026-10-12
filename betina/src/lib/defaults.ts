import type { EventSettings } from './types'

const BASE = import.meta.env.BASE_URL
const ph = (n: number) => `${BASE}photos/betina-${String(n).padStart(2, '0')}.svg`
const photo = (name: string) => `${BASE}photos/${name}.jpg`

// Valores iniciais — tudo editável no painel em "Festa".
export const DEFAULT_SETTINGS: EventSettings = {
  childName: 'Betina',
  title: 'Betina faz 1 ano',
  subtitle: 'As porteiras estão abertas!',
  dateISO: '2026-11-02',
  dateNote: 'feriado',
  timeStart: '13:00',
  timeEnd: '',
  venueName: 'Adventure Kids — Casa 01',
  address: 'Av. Dr. Luiz Guimarães, 669 – Centro, Nova Iguaçu – RJ',
  mapsUrl: 'https://share.google/ic7mYwxZPlUNpQ9vC',
  wazeUrl: '',
  dressCode: 'Seu chapéu de cowboy é bem-vindo!',
  rsvpDeadlineISO: '2026-10-26',
  rsvpOpen: true,
  welcomeYes: 'A Betina vai ficar muito feliz com a sua companhia na fazendinha.',
  welcomeNo: 'Que pena! Vamos sentir sua falta, mas a gente entende.',
  welcomeMaybe: 'Volte aqui e responda quando souber. As porteiras continuam abertas.',
  story: [
    { label: '31 de outubro de 2025 · 15h', photo: photo('nascimento'), text: 'No Instituto Fernandes Figueira, nasceu a Betina. Naquele instante, tudo ganhou uma cor nova.' },
    { label: 'Os primeiros dias', photo: photo('primeiros-dias'), text: 'Noites em claro, colo sem fim e um amor que a gente nem sabia que cabia no peito.' },
    { label: 'Os primeiros sorrisos', photo: photo('primeiros-sorrisos'), text: 'Veio o primeiro sorriso e, com ele, a certeza de que os dias iam ficar mais leves.' },
    { label: 'Descobertas', photo: ph(4), text: 'Mãozinhas curiosas, gargalhadas, as primeiras palavrinhas. Cada descoberta virou uma pequena conquista.' },
    { label: 'Gabriel e Luíza', photo: ph(5), text: 'Ver a Betina crescer cheia de curiosidade e carinho por todo mundo é o maior presente que a vida nos deu.' },
    { label: '1 aninho', photo: ph(1), text: 'Chegou a hora de celebrar o primeiro ano da Betina na fazendinha. E a festa só fica completa com você.' },
  ],
  birthISO: '2025-10-31T15:00',
  introText: 'Essa é a história de um ano que mudou as nossas vidas.',
  letter:
    'Obrigado por fazer parte da vida da Betina. Cada pessoa convidada para esta festa tem um pedacinho dessa história: num colo, numa visita, numa mensagem, numa oração. Queremos muito viver esse dia ao seu lado.',
  letterSign: 'Com amor, Gabriel e Luíza',
  carousel: [photo('primeiros-sorrisos'), photo('nascimento'), photo('primeiros-dias')],
  gifts: [
    { group: 'Betina adora', title: 'Livros' },
    { group: 'Betina adora', title: 'Brinquedos educativos' },
    { group: 'Betina adora', title: 'Brinquedos de animais' },
    { group: 'Betina adora', title: 'Bonecas' },
    { group: 'Betina veste', title: 'Roupa', detail: 'Tamanho 1 ou 2 anos' },
    { group: 'Betina veste', title: 'Sapato', detail: 'Número 19 ou 20' },
  ],
  giftNote: 'O mais importante é ter você lá. Se quiser levar uma lembrança, aqui vão algumas ideias:',
  pix: '',
  hostsPhone: '',
  gabrielPhone: '',
  luizaPhone: '',
  mapsQuery: "Adventure Kid's Casa de Festas, Av. Dr. Luiz Guimarães, 669, Nova Iguaçu - RJ",
  capPerHost: 50,
  childFreeMaxAge: 5,
  reminderDays: 7,
  inviteMessage:
    'Oi, {nome}! 🐮\n\nAs porteiras estão abertas! A {crianca} vai fazer 1 aninho e queremos muito você com a gente na fazendinha.\n\n📅 {data}\n⏰ {hora}\n📍 {local}\n🤠 Seu chapéu de cowboy é bem-vindo!\n\nConfirme a presença por aqui, leva menos de um minuto:\n{link}\n\nCom carinho, {anfitriao} 💗',
  reminderMessage:
    'Oi, {nome}! Tudo bem? 🐷\n\nPassando pra lembrar do aniversário de 1 ano da {crianca}, {data}, às {hora}.\n\nConsegue confirmar a presença? Leva menos de um minuto:\n{link}\n\nObrigado! {anfitriao} 💗',
  inviteImage: `${BASE}photos/convite.jpg`,
}
