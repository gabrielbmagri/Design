import type { EventSettings } from './types'
import { PRESETS } from './presets'

// Valores iniciais de um evento novo: o primeiro modelo. Tudo é editável no painel (aba Festa).
export const DEFAULT_SETTINGS: EventSettings = PRESETS[0].settings
