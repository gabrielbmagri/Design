import type { EventSettings } from './types'

const BASE = import.meta.env.BASE_URL
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
  rsvpDeadlineISO: '2026-10-19',
  rsvpOpen: true,
  welcomeYes: 'A Betina vai ficar muito feliz com a sua companhia na fazendinha.',
  welcomeNo: 'Que pena! Vamos sentir sua falta, mas a gente entende.',
  welcomeMaybe: 'Volte aqui e responda quando souber. As porteiras continuam abertas.',
  story: [
    { label: '31 de outubro de 2025 · 15h', photo: photo('nascimento'), text: 'No Instituto Fernandes Figueira, nasceu a Betina. Naquele instante, tudo ganhou uma cor nova.' },
    { label: 'Os primeiros dias', photo: photo('primeiros-dias'), text: 'Noites em claro, colo sem fim e um amor que a gente nem sabia que cabia no peito.' },
    { label: 'Os primeiros sorrisos', photo: photo('primeiros-sorrisos'), text: 'Veio o primeiro sorriso e, com ele, a certeza de que os dias iam ficar mais leves.' },
    { label: 'Descobertas', photo: photo('descobertas'), text: 'Mãozinhas curiosas, gargalhadas, as primeiras palavrinhas. Cada descoberta virou uma pequena conquista.' },
    { label: 'Gabriel e Luíza', photo: photo('gabriel-e-luiza'), text: 'Ver a Betina crescer cheia de curiosidade e carinho por todo mundo é o maior presente que a vida nos deu.' },
    { label: '1 aninho', photo: photo('um-aninho'), text: 'Chegou a hora de celebrar o primeiro ano da Betina na fazendinha. E a festa só fica completa com você.' },
  ],
  birthISO: '2025-10-31T15:00',
  introText: 'Essa é a história de um ano que mudou as nossas vidas.',
  letter:
    'Obrigado por fazer parte da vida da Betina. Cada pessoa convidada para esta festa tem um pedacinho dessa história: num colo, numa visita, numa mensagem, numa oração. Queremos muito viver esse dia ao seu lado.',
  letterSign: 'Com amor, Gabriel e Luíza',
  carousel: [
    photo('um-aninho'), photo('c-sorriso-rosa'), photo('primeiros-sorrisos'), photo('c-familia'), photo('nascimento'),
    photo('c-cavalinho'), photo('descobertas'), photo('c-cabecinha'), photo('primeiros-dias'), photo('c-colo'),
    photo('gabriel-e-luiza'),
  ],
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
    '🤖 *Lembrete automático · Aniversário da {crianca}*\n\nOi, {nome}! Tudo bem?\n\nAqui é o assistente da fazendinha 🐮 Consultei o sistema e este é o status do convite:\n\n{convidados}\n\nPara organizarmos tudo com carinho (comidinhas, lembrancinhas e lugares), a confirmação vai até *{prazo}*. Ainda na dúvida? Dá para marcar "Talvez" e mudar depois.\n\nÉ rapidinho, menos de um minuto:\n{link}\n\n📅 {data}, às {hora}\n📍 {local}\n\n_Mensagem automática enviada em nome de Gabriel e Luíza_ 💗',
  lastCallMessage:
    '🤖 *Aviso automático · Aniversário da {crianca}*\n\n⏰ *Hoje é o último dia para confirmar presença!*\n\nOi, {nome}. Consultei o sistema e ainda não consta a confirmação do convite de:\n\n{pessoas}\n\nLeva menos de um minuto:\n{link}\n\n_Mensagem automática enviada em nome de Gabriel e Luíza_',
  inviteImage: `${BASE}photos/convite.jpg`,
  heroPhoto: `${BASE}photos/um-aninho.jpg`,
}
