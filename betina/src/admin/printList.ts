import type { EventSettings, Guest, Invite } from '../lib/types'
import { eventDate, guestName, plural } from '../lib/text'

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

const TAG: Record<string, string> = { yes: 'Confirmado', maybe: 'Talvez', pending: 'Sem resposta' }

/** Lista para imprimir, agrupada por família. Fica de fora quem respondeu "não vou". */
export function guestListHtml(invites: Invite[], guests: Guest[], s: EventSettings) {
  const byInvite = new Map(invites.map((i) => [i.id, i]))
  const people = guests.filter((g) => g.status !== 'no')
  const families = new Map<string, Guest[]>()
  for (const g of people) families.set(g.inviteId, [...(families.get(g.inviteId) ?? []), g])

  const rows = [...families.entries()]
    .map(([id, members]) => ({ invite: byInvite.get(id), members: members.sort((a, b) => a.order - b.order) }))
    .sort((a, b) => (a.invite?.label ?? '').localeCompare(b.invite?.label ?? '', 'pt-BR'))

  const count = (st: string) => people.filter((g) => g.status === st).length
  const kids = people.filter((g) => g.isChild).length
  const block = ({ invite, members }: (typeof rows)[number]) => `
    <section class="fam">
      <h2>${esc(invite?.label ?? members[0].inviteLabel)}<small>${invite ? (invite.host === 'gabriel' ? 'Gabriel' : 'Luíza') : ''}</small></h2>
      ${members
        .map(
          (g) => `<div class="p ${g.status}"><span class="box"></span><span class="n">${esc(guestName(g))}${
            g.isChild ? `<em>${g.age != null ? plural(g.age, 'ano') : 'criança'}</em>` : ''
          }</span><span class="t">${TAG[g.status]}</span></div>`,
        )
        .join('')}
    </section>`

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Lista de convidados</title>
<style>
  @page { size: A4; margin: 14mm 12mm }
  * { box-sizing: border-box }
  body { margin: 0; font: 13px/1.35 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: #2a1d22 }
  header { border-bottom: 2px solid #c93a76; padding-bottom: 8px; margin-bottom: 12px }
  h1 { margin: 0; font-size: 20px; color: #c93a76 }
  .sub { color: #5b4a50; margin-top: 2px }
  .sum { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 8px; font-weight: 700 }
  .sum span { font-weight: 500; color: #5b4a50 }
  .cols { column-count: 2; column-gap: 16px }
  .fam { break-inside: avoid; border: 1px solid #e3cdd6; border-radius: 8px; padding: 6px 10px 4px; margin: 0 0 8px }
  h2 { margin: 0 0 3px; font-size: 13px; display: flex; justify-content: space-between; gap: 8px; border-bottom: 1px solid #f0e3e8; padding-bottom: 3px }
  h2 small { font-weight: 600; color: #8d7c82; font-size: 11px }
  .p { display: flex; align-items: center; gap: 8px; padding: 2px 0 }
  .box { width: 12px; height: 12px; border: 1.5px solid #5b4a50; border-radius: 3px; flex: none }
  .n { flex: 1; font-weight: 600 }
  .n em { font-style: normal; font-weight: 500; color: #8d7c82; margin-left: 6px }
  .t { font-size: 11px; color: #2f8a4f; font-weight: 700 }
  .maybe .t { color: #a8741f }
  .pending .t { color: #8d7c82; font-weight: 600 }
</style></head><body>
<header>
  <h1>Lista de convidados · ${esc(s.title)}</h1>
  <div class="sub">${esc(eventDate(s.dateISO, s.dateNote))} · ${esc(s.venueName)}</div>
  <div class="sum">
    <div>${rows.length} <span>famílias</span></div><div>${people.length} <span>pessoas</span></div>
    <div>${count('yes')} <span>confirmadas</span></div><div>${count('maybe')} <span>talvez</span></div>
    <div>${count('pending')} <span>sem resposta</span></div><div>${kids} <span>crianças</span></div>
  </div>
</header>
<div class="cols">${rows.map(block).join('')}</div>
</body></html>`
}

/** Abre a janela de impressão (no celular ou computador, "Salvar como PDF"). */
export function printGuestList(invites: Invite[], guests: Guest[], s: EventSettings) {
  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  frame.srcdoc = guestListHtml(invites, guests, s)
  frame.onload = () => {
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
    setTimeout(() => frame.remove(), 60000)
  }
  document.body.appendChild(frame)
}
