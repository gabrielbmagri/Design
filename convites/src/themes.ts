// Biblioteca de temas. Cada tema é só um conjunto de cores, símbolos e fontes:
// o fluxo do convite e o painel são sempre os mesmos. Para criar um tema novo,
// copie um bloco abaixo e troque as cores, os emojis e a fonte de destaque.
import { setHostLabels, type EventSettings } from './lib/types'

export interface Theme {
  id: string
  name: string
  kind: 'kids' | 'wedding'
  /** cores de destaque, para as miniaturas */
  swatch: [string, string, string]
  /** símbolos que sobem/descem ao fundo */
  emojis: string[]
  /** variáveis de cor (substituem as de base.css) */
  vars: Record<string, string>
  /** fonte do título grande da abertura */
  heroFont: string
}

const KIDS_FONT = "'Bricolage Grotesque', 'Plus Jakarta Sans', system-ui, sans-serif"
const WED_FONT = "'Cormorant Garamond', 'Playfair Display', Georgia, serif"

export const THEMES: Theme[] = [
  {
    id: 'fazendinha',
    name: 'Fazendinha',
    kind: 'kids',
    swatch: ['#c93a76', '#e8a94a', '#fff4f8'],
    emojis: ['🐷', '🐮', '🐴', '🐔', '🐰', '🐑', '🐥', '🌼'],
    vars: {},
    heroFont: KIDS_FONT,
  },
  {
    id: 'safari',
    name: 'Safari',
    kind: 'kids',
    swatch: ['#2f6b3a', '#e08a2b', '#fbf4e2'],
    emojis: ['🦁', '🐘', '🦒', '🦓', '🐒', '🐯', '🌴', '🦏'],
    vars: {
      '--rose': '#4f9a4f',
      '--rose-deep': '#2f6b3a',
      '--rose-ink': '#1f4a29',
      '--rose-50': '#f3f8ec',
      '--rose-100': '#e3efd3',
      '--rose-200': '#c6dfa9',
      '--cream': '#fdf8ea',
      '--sand': '#f3e9cf',
      '--brown': '#8a5a2b',
      '--gold': '#e08a2b',
      '--ink': '#262a1c',
      '--ink-2': '#4f5240',
      '--ink-3': '#85866f',
      '--line': '#e8e2cb',
    },
    heroFont: KIDS_FONT,
  },
  {
    id: 'jardim',
    name: 'Jardim Encantado',
    kind: 'kids',
    swatch: ['#8e5bb5', '#7cc4a4', '#fbf6ff'],
    emojis: ['🦋', '🌸', '🌷', '🐝', '🍄', '🌼', '🐞', '🌺'],
    vars: {
      '--rose': '#b57fd6',
      '--rose-deep': '#8e5bb5',
      '--rose-ink': '#6a3f8c',
      '--rose-50': '#faf5fe',
      '--rose-100': '#f0e4fa',
      '--rose-200': '#e0c9f2',
      '--cream': '#fefbff',
      '--sand': '#f1ecf7',
      '--brown': '#7b5b8c',
      '--gold': '#6fbf9b',
      '--ink': '#2b2233',
      '--ink-2': '#574a63',
      '--ink-3': '#8f8499',
      '--line': '#eadff2',
    },
    heroFont: KIDS_FONT,
  },
  {
    id: 'ouro',
    name: 'Casamento Ouro',
    kind: 'wedding',
    swatch: ['#8a6a2a', '#d4af5f', '#fffaf0'],
    emojis: ['✨', '🤍', '✨', '🤍'],
    vars: {
      '--rose': '#c9a24d',
      '--rose-deep': '#8a6a2a',
      '--rose-ink': '#5e4718',
      '--rose-50': '#fdf9ee',
      '--rose-100': '#f7edd0',
      '--rose-200': '#ecd9a2',
      '--cream': '#fffdf7',
      '--sand': '#f6eedb',
      '--brown': '#7a5c2a',
      '--gold': '#d4af5f',
      '--ink': '#2a2418',
      '--ink-2': '#58503d',
      '--ink-3': '#948a73',
      '--line': '#eee4cb',
    },
    heroFont: WED_FONT,
  },
  {
    id: 'prata',
    name: 'Casamento Prata',
    kind: 'wedding',
    swatch: ['#46556b', '#a9b4c4', '#f7f9fc'],
    emojis: ['✨', '🤍', '✨', '🤍'],
    vars: {
      '--rose': '#8795ab',
      '--rose-deep': '#46556b',
      '--rose-ink': '#2f3b4e',
      '--rose-50': '#f4f7fb',
      '--rose-100': '#e5ebf3',
      '--rose-200': '#ccd6e4',
      '--cream': '#fbfcfe',
      '--sand': '#eceff4',
      '--brown': '#55627a',
      '--gold': '#aeb8c8',
      '--ink': '#1f2530',
      '--ink-2': '#4a5363',
      '--ink-3': '#8591a3',
      '--line': '#e1e6ee',
    },
    heroFont: WED_FONT,
  },
]

export const themeById = (id?: string) => THEMES.find((t) => t.id === id) ?? THEMES[0]

const BASE_KEYS = ['--rose', '--rose-deep', '--rose-ink', '--rose-50', '--rose-100', '--rose-200', '--cream', '--sand', '--brown', '--gold', '--ink', '--ink-2', '--ink-3', '--line']

/** Aplica o tema e os nomes dos anfitriões da configuração do evento. */
export function applySettings(s: EventSettings) {
  setHostLabels(s.hostAName, s.hostBName)
  const current = themeById(s.themeId)
  const root = document.documentElement
  for (const k of BASE_KEYS) root.style.removeProperty(k)
  for (const [k, v] of Object.entries(current.vars)) root.style.setProperty(k, v)
  root.style.setProperty('--font-hero', current.heroFont)
  root.dataset.theme = current.id
  root.dataset.kind = current.kind
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', current.vars['--rose-50'] ?? '#fff4f8')
}
