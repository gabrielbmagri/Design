// Pix "copia e cola" (BR Code estático). Nada passa por nós: o código só aponta para a conta de quem recebe.

const tlv = (id: string, value: string) => id + String(value.length).padStart(2, '0') + value

/** CRC16/CCITT-FALSE, exigido no fim do BR Code. */
export function crc16(text: string) {
  let crc = 0xffff
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

const clean = (t: string, max: number) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .toUpperCase()
    .trim()
    .slice(0, max)

/** Chave como a pessoa digitou: e-mail, CPF/CNPJ só com números, celular com +55, ou chave aleatória. */
export function normalizePixKey(key: string) {
  const k = key.trim()
  if (k.includes('@')) return k.toLowerCase()
  if (k.startsWith('+')) return '+' + k.replace(/\D/g, '')
  if (/^[\d.\-/\s]+$/.test(k)) return k.replace(/\D/g, '')
  return k
}

export interface PixInput {
  key: string
  name: string
  city: string
  /** em reais; vazio ou 0 = o convidado digita o valor no banco */
  amount?: number
  txid?: string
}

export function pixPayload({ key, name, city, amount, txid }: PixInput) {
  const k = normalizePixKey(key)
  if (!k) return ''
  const account = tlv('00', 'br.gov.bcb.pix') + tlv('01', k)
  const body =
    tlv('00', '01') +
    tlv('01', '11') +
    tlv('26', account) +
    tlv('52', '0000') +
    tlv('53', '986') +
    (amount && amount > 0 ? tlv('54', amount.toFixed(2)) : '') +
    tlv('58', 'BR') +
    tlv('59', clean(name, 25) || 'RECEBEDOR') +
    tlv('60', clean(city, 15) || 'BRASIL') +
    tlv('62', tlv('05', clean(txid ?? '', 25).replace(/ /g, '') || '***'))
  const withCrc = body + '6304'
  return withCrc + crc16(withCrc)
}
