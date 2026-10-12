import type { EventSettings } from './types'

const BASE = import.meta.env.BASE_URL
const ph = (n: number) => `${BASE}photos/betina-${String(n).padStart(2, '0')}.svg`

// Valores iniciais — tudo editável no painel em "Festa".
export const DEFAULT_SETTINGS: EventSettings = {
  childName: 'Betina',
  title: 'Betina faz 1 ano',
  subtitle: 'As porteiras estão abertas!',
  dateISO: '2026-11-02',
  timeStart: '13:00',
  timeEnd: '',
  venueName: 'Adventure Kids — Casa 01',
  address: 'Av. Dr. Luiz Guimarães, 669 – Centro, Nova Iguaçu – RJ',
  mapsUrl: 'https://share.google/ic7mYwxZPlUNpQ9vC',
  wazeUrl: '',
  dressCode: 'Seu chapéu de cowboy é bem-vindo!',
  rsvpDeadlineISO: '2026-10-26',
  rsvpOpen: true,
  welcomeYes: 'Que alegria! A Betina vai ficar muito feliz com você na fazendinha.',
  welcomeNo: 'Que pena! Vamos sentir sua falta — obrigado por avisar com tanto carinho.',
  welcomeMaybe: 'Tudo bem! Volte aqui e responda quando souber — as porteiras continuam abertas.',
  story: [
    { photo: ph(1), text: 'No dia 31 de outubro de 2025, às 15h, no Instituto Fernandes Figueira, nasceu a Betina — e a nossa vida ganhou uma cor nova.' },
    { photo: ph(2), text: 'Vieram os primeiros sorrisos, os primeiros balbucios, as primeiras gargalhadas… cada dia uma descoberta, cada descoberta uma festa.' },
    { photo: ph(3), text: 'Gabriel e Luíza viram essa pequena crescer cheia de curiosidade — e de amor por todo mundo que está por perto.' },
    { photo: ph(4), text: 'Agora as porteiras estão abertas: chegou a hora de celebrar o primeiro aninho da Betina na fazendinha. E a festa só fica completa com você!' },
  ],
  carousel: [ph(1), ph(2), ph(3), ph(4), ph(5)],
  gifts: [
    { group: 'Betina adora', title: 'Livros' },
    { group: 'Betina adora', title: 'Brinquedos educativos' },
    { group: 'Betina adora', title: 'Brinquedos de animais' },
    { group: 'Betina adora', title: 'Bonecas' },
    { group: 'Betina veste', title: 'Roupa', detail: 'Tamanho 1 ou 2 anos' },
    { group: 'Betina veste', title: 'Sapato', detail: 'Número 19 ou 20' },
  ],
  giftNote: 'Sua presença é o nosso maior presente. Se quiser presentear, aqui vão algumas ideias:',
  pix: '',
  hostsPhone: '',
  gabrielPhone: '',
  luizaPhone: '',
  mapsQuery: "Adventure Kid's Casa de Festas, Av. Dr. Luiz Guimarães, 669, Nova Iguaçu - RJ",
  capPerHost: 50,
  childFreeMaxAge: 5,
  reminderDays: 7,
  inviteMessage:
    'Oi, {nome}! 🐮\n\nAs porteiras estão abertas! A {crianca} vai fazer 1 aninho e queremos muito você com a gente na fazendinha.\n\n📅 {data}\n⏰ {hora}\n📍 {local}\n🤠 Seu chapéu de cowboy é bem-vindo!\n\nConfirme sua presença aqui, é bem fácil:\n{link}\n\nCom carinho, {anfitriao} 💗',
  reminderMessage:
    'Oi, {nome}! Tudo bem? 🐷\n\nPassando pra lembrar do aniversário de 1 ano da {crianca}, {data}, às {hora}.\n\nVocê consegue confirmar se vai? É só tocar no link:\n{link}\n\nObrigado! {anfitriao} 💗',
  inviteImage: `${BASE}photos/convite.jpg`,
}
