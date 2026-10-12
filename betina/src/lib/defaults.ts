import type { EventSettings } from './types'

const ph = (n: number) => `/photos/betina-${String(n).padStart(2, '0')}.svg`

// Valores iniciais — tudo editável no painel em "Festa".
export const DEFAULT_SETTINGS: EventSettings = {
  childName: 'Betina',
  title: 'Betina faz 1 aninho',
  subtitle: 'Um ano de amor, sorrisos e descobertas',
  dateISO: '2026-12-05',
  timeStart: '16:00',
  timeEnd: '20:00',
  venueName: 'Salão de Festas',
  address: 'Rua Exemplo, 123 — Bairro, Cidade',
  mapsUrl: '',
  wazeUrl: '',
  dressCode: '',
  rsvpDeadlineISO: '2026-11-25',
  rsvpOpen: true,
  welcomeYes: 'Que alegria! A Betina vai ficar muito feliz com a sua presença.',
  welcomeNo: 'Que pena! Vamos sentir sua falta — obrigado por avisar com carinho.',
  welcomeMaybe: 'Tudo bem! Você pode voltar aqui e responder quando souber.',
  story: [
    { photo: ph(1), text: 'Há um ano, chegou a pessoa mais esperada das nossas vidas.' },
    { photo: ph(2), text: 'Vieram os primeiros sorrisos — e com eles, os nossos dias mudaram de cor.' },
    { photo: ph(3), text: 'Cada descoberta virou uma festa: o primeiro dentinho, as primeiras palavrinhas…' },
    { photo: ph(4), text: 'Agora é hora de celebrar o primeiro aninho. E queremos você lá!' },
  ],
  carousel: [ph(1), ph(2), ph(3), ph(4), ph(5)],
  gifts: [
    { title: 'Roupinhas', detail: 'Tamanho 2 (de 1 a 2 anos)' },
    { title: 'Calçados', detail: 'Número 20 ou 21' },
    { title: 'Brinquedos educativos', detail: 'Para 1 a 2 anos' },
    { title: 'Livrinhos', detail: 'De pano, banho ou cartonados' },
  ],
  giftNote: 'Sua presença é o nosso maior presente. Se quiser presentear, aqui vão algumas ideias:',
  pix: '',
  hostsPhone: '',
  capPerHost: 50,
  childFreeMaxAge: 5,
  reminderDays: 7,
  inviteMessage:
    'Oi, {nome}! 💗\n\nA {crianca} vai fazer 1 aninho e queremos muito você com a gente!\n\n📅 {data}\n⏰ {hora}\n📍 {local}\n\nConfirme sua presença aqui, é bem fácil:\n{link}',
  reminderMessage:
    'Oi, {nome}! Tudo bem? 😊\n\nPassando pra lembrar do aniversário de 1 ano da {crianca}, dia {data}.\n\nVocê consegue confirmar se vai? É só tocar no link:\n{link}\n\nObrigado! 💗',
}
