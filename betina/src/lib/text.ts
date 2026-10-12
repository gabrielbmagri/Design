/** "  JOÃO  da Silva " -> "joao da silva" */
export function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const STOP = new Set(['da', 'de', 'do', 'das', 'dos', 'e'])

export function digits(s: string) {
  return s.replace(/\D/g, '')
}

/** Últimos 8 dígitos: ignora DDI, DDD e o 9 extra do celular. */
export function phoneCore(s: string) {
  const d = digits(s)
  return d.length >= 8 ? d.slice(-8) : ''
}

export async function phoneKey(phone: string) {
  const core = phoneCore(phone)
  if (!core) return ''
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('betina:' + core))
  const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return 'tel:' + hex.slice(0, 20)
}

/**
 * Chaves de busca de um nome. Permite achar "Maria Aparecida dos Santos" por
 * "maria", "maria santos", "maria aparecida", "santos" etc.
 */
export function nameKeys(name: string) {
  const words = normalize(name).split(' ').filter((w) => w && !STOP.has(w))
  const keys = new Set<string>()
  if (!words.length) return []
  keys.add(words.join(' '))
  for (const w of words) keys.add(w)
  for (let i = 0; i < words.length; i++)
    for (let j = i + 1; j < words.length; j++) keys.add(words[i] + ' ' + words[j])
  return [...keys]
}

/** O que o convidado digitou → a chave que será procurada. */
export async function queryKey(input: string) {
  const d = digits(input)
  if (d.length >= 8 && !/[a-zA-ZÀ-ÿ]/.test(input)) return phoneKey(d)
  const words = normalize(input).split(' ').filter((w) => w && !STOP.has(w))
  if (!words.length) return ''
  if (words.length === 1) return words[0]
  return words[0] + ' ' + words[words.length - 1]
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name
}

export function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? ''
  return names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1]
}

export function waPhone(phone: string) {
  let d = digits(phone)
  if (!d) return ''
  if (d.length <= 11) d = '55' + d
  return d
}

export function waLink(phone: string, text: string) {
  const p = waPhone(phone)
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`
}

export function fillTemplate(t: string, vars: Record<string, string>) {
  return t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
}

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']

export function parseISODate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function longDate(iso: string) {
  if (!iso) return ''
  const dt = parseISODate(iso)
  return `${WEEKDAYS[dt.getDay()]}, ${dt.getDate()} de ${MONTHS[dt.getMonth()]}`
}

export function shortDate(iso: string) {
  if (!iso) return ''
  const dt = parseISODate(iso)
  return `${dt.getDate()} de ${MONTHS[dt.getMonth()]}`
}
