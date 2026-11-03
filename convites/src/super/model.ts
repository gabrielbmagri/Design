import { addDoc, collection, deleteField, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export const clientsCol = collection(db, 'clients')
export const ownerSettingsRef = doc(db, 'ownerSettings', 'main')

export type ClientStatus = 'lead' | 'briefing' | 'montagem' | 'aprovacao' | 'entregue' | 'concluido' | 'cancelado'

export const STATUS: { id: ClientStatus; label: string; hint: string }[] = [
  { id: 'lead', label: 'Contato', hint: 'Conversa iniciada' },
  { id: 'briefing', label: 'Briefing enviado', hint: 'Aguardando respostas e fotos' },
  { id: 'montagem', label: 'Montando', hint: 'Convite em construção' },
  { id: 'aprovacao', label: 'Em aprovação', hint: 'Prévia com o cliente' },
  { id: 'entregue', label: 'Entregue', hint: 'Links enviados' },
  { id: 'concluido', label: 'Concluído', hint: 'Evento realizado' },
  { id: 'cancelado', label: 'Cancelado', hint: '' },
]
export const STATUS_LABEL = Object.fromEntries(STATUS.map((s) => [s.id, s.label])) as Record<ClientStatus, string>

export interface Payment {
  id: string
  dateISO: string
  amount: number
  method: 'pix' | 'cartao' | 'dinheiro' | 'outro'
  note: string
}

export interface Client {
  id: string
  name: string
  phone: string
  source: string
  eventTitle: string
  eventDateISO: string
  themeId: string // 'novo' = tema sob encomenda ainda não criado
  kind: 'kids' | 'wedding'
  status: ClientStatus
  pkg: string
  price: number
  payments: Payment[]
  brief: string
  notes: string
  inviteUrl: string
  adminUrl: string
  createdISO: string
  updatedISO: string
  archived?: boolean
}

export interface PackageDef { id: string; name: string; price: number; includes: string }

export interface OwnerSettings {
  packages: PackageDef[]
  briefingMessage: string
  deliveryMessage: string
  chargeMessage: string
}

export const DEFAULT_OWNER: OwnerSettings = {
  // valores de exemplo: ajuste em "Configurações"
  packages: [
    { id: 'essencial', name: 'Essencial', price: 249, includes: 'Convite digital, confirmação por família e painel de convidados' },
    { id: 'completo', name: 'Completo', price: 399, includes: 'Essencial + lembretes prontos para WhatsApp, lista para impressão e história com fotos' },
    { id: 'premium', name: 'Premium', price: 649, includes: 'Completo + tema sob encomenda e filme de retrospectiva' },
  ],
  briefingMessage:
    'Oi, {nome}! Que bom ter você por aqui 💗\n\nPara montar o seu convite, me responda estas perguntas (pode ser por áudio):\n\n1) Quem é o homenageado ou quem são os noivos? Nomes e, se for criança, a data de nascimento.\n2) Data, horário e local da festa (com endereço).\n3) Tema: temos Safari, Jardim Encantado, Casamento Ouro e Casamento Prata. Ou me conte como você imagina o seu: cores, bichinhos ou símbolos, estilo.\n4) De 6 a 10 fotos para a história (e uma foto de capa).\n5) Quem são os anfitriões? Se forem duas pessoas, a lista de convidados é dividida entre elas.\n6) Mais ou menos quantos convidados? Alguma dica de traje ou observação importante?\n\nCom isso eu monto uma prévia e te mando para aprovar.',
  deliveryMessage:
    'Oi, {nome}! Seu convite está pronto 🎉\n\n🔗 Convite: {convite}\n🛠️ Painel (só você e quem você escolher): {painel}\n\nNo painel você cadastra os convidados, acompanha as confirmações e envia os convites e lembretes pelo WhatsApp com um toque.\n\nQualquer ajuste, é só me chamar!',
  chargeMessage:
    'Oi, {nome}! Tudo bem? Passando para lembrar do saldo de {saldo} do seu convite. Pode ser por Pix. Qualquer dúvida estou por aqui 💗',
}

export const money = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const paidOf = (c: Client) => (c.payments ?? []).reduce((s, p) => s + p.amount, 0)
export const balanceOf = (c: Client) => (c.status === 'cancelado' ? 0 : Math.max(0, c.price - paidOf(c)))
export const todayISO = () => new Date().toISOString().slice(0, 10)

export function blankClient(): Omit<Client, 'id'> {
  return {
    name: '', phone: '', source: '', eventTitle: '', eventDateISO: '', themeId: 'safari', kind: 'kids', status: 'lead',
    pkg: 'completo', price: DEFAULT_OWNER.packages[1].price, payments: [], brief: '', notes: '', inviteUrl: '', adminUrl: '',
    createdISO: todayISO(), updatedISO: todayISO(),
  }
}

export async function saveClient(c: Omit<Client, 'id'> & { id?: string }) {
  const { id, ...data } = c
  const body = { ...data, updatedISO: todayISO(), ts: serverTimestamp() }
  if (id) await updateDoc(doc(clientsCol, id), body as never)
  else await addDoc(clientsCol, body)
}

export async function setClientStatus(c: Client, status: ClientStatus) {
  await updateDoc(doc(clientsCol, c.id), { status, updatedISO: todayISO() })
}

export async function archiveClient(c: Client, archived: boolean) {
  await updateDoc(doc(clientsCol, c.id), archived ? { archived: true } : { archived: deleteField() })
}

export async function saveOwnerSettings(s: OwnerSettings) {
  await setDoc(ownerSettingsRef, s as never)
}
