import { themeById } from '../themes'

/** Símbolo do tema atual (usado como "logo" nas telas de entrada). */
export function currentThemeEmoji() {
  const id = document.documentElement.dataset.theme
  return themeById(id).emojis[0]
}
