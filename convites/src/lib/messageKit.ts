import type { EventSettings } from './types'

/**
 * Gera as 6 mensagens de WhatsApp (convite, lembrete, último dia, pendente,
 * contagem e "é amanhã") a partir de poucos dados. Os textos têm o mesmo tom
 * dos usados na primeira festa que deu origem ao produto; o cliente pode editar tudo no painel.
 */
export interface KitOptions {
  kind: 'kids' | 'wedding'
  /** "o Théo", "a Lara" ou "Helena & Rafael" */
  subject: string
  /** "aniversário do Théo", "casamento de Helena & Rafael" */
  occasion: string
  /** emoji do tema */
  emoji: string
  /** assinatura: "Carol e Rafa" */
  sign: string
  /** linha de traje/dica, vazia se não houver */
  dress: string
  /** frase de abertura do convite */
  opening: string
  /** orientação do dia anterior (estacionamento, pontualidade...) */
  tomorrowTip: string
}

export function makeMessages(o: KitOptions): Pick<EventSettings, 'inviteMessage' | 'reminderMessage' | 'lastCallMessage' | 'pendingMessage' | 'countdownMessage' | 'tomorrowMessage'> {
  const dress = o.dress ? `\n🎩 ${o.dress}` : ''
  const warm = o.kind === 'wedding' ? 'viver esse dia tão especial' : 'viver essa festa'
  const star = o.kind === 'wedding' ? 'Os noivos' : o.subject
  return {
    inviteMessage:
      `Oi, {nome}! ${o.emoji}\n\n${o.opening}\n\n📅 {data}\n⏰ {hora}\n📍 {local}${dress}\n\nConfirme a presença por aqui, leva menos de um minuto:\n{link}\n\nCom carinho, {anfitriao} 💗`.replace('🎩', o.kind === 'wedding' ? '👔' : '🎩'),
    reminderMessage:
      `🤖 *Lembrete automático · ${cap(o.occasion)}*\n\nOi, {nome}! Tudo bem?\n\nAqui é o assistente do convite ${o.emoji} Consultei o sistema e este é o status:\n\n{convidados}\n\nPara organizarmos tudo com carinho, a confirmação vai até *{prazo}*. Ainda na dúvida? Dá para marcar "Talvez" e mudar depois.\n\nÉ rapidinho, menos de um minuto:\n{link}\n\n📅 {data}, às {hora}\n📍 {local}\n\n_Mensagem automática enviada em nome de ${o.sign}_ 💗`,
    lastCallMessage:
      `🤖 *Aviso automático · ${cap(o.occasion)}*\n\n⏰ *Hoje é o último dia para confirmar presença!*\n\nOi, {nome}. Consultei o sistema e ainda não consta a confirmação do convite de:\n\n{pessoas}\n\nLeva menos de um minuto:\n{link}\n\n_Mensagem automática enviada em nome de ${o.sign}_`,
    pendingMessage:
      `🤖 *Aviso automático · ${cap(o.occasion)}*\n\nOlá, {nome}. Consta em nosso sistema que o convite de:\n\n{pessoas}\n\nainda não tem a presença confirmada.\n\nPedimos que confirmem pelo link abaixo. É rápido, leva menos de um minuto:\n{link}\n\nSe não puderem comparecer, basta marcar "Não vou" no mesmo link.\n\n_Mensagem automática enviada em nome de ${o.sign}_`,
    countdownMessage:
      `*{contagem}!* ${o.emoji}\n\nOi, {nome}! Está chegando o grande dia e a gente mal pode esperar para ${warm} com vocês. ${star === o.subject ? `${cap(o.subject)} vai` : 'Vai'} ficar radiante de ter por perto quem mais ama.\n\n📅 {data}, às {hora}\n📍 {local}${dress}\n\nSabemos que imprevistos acontecem. Se algo mudar, é só atualizar a resposta pelo link:\n{linkContagem}\n\nVai ser um dia lindo, e a presença de vocês faz toda a diferença.\n\nCom carinho, ${o.sign} 💗`,
    tomorrowMessage:
      `Amanhã é o grande dia! ${o.emoji} ${cap(o.subject)} e a família esperam vocês com muito carinho.\n\n📍 {salao}\n{endereco}\nComo chegar: {mapa}\n\n${o.tomorrowTip}\n\nAté amanhã! 💗\n${o.sign}`,
  }
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)
