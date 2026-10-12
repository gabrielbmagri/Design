import { useState } from 'react'
import type { AdminCtx } from './AdminApp'
import type { Host } from '../lib/types'
import { HOST_LABEL } from '../lib/types'
import Icon from '../lib/Icon'
import { plural } from '../lib/text'
import { setReserve, type InviteDraft } from './ops'
import { InviteEditor } from './Invites'

export default function Reserves({ invites, guests, stats, user }: AdminCtx) {
  const [editing, setEditing] = useState<InviteDraft | null>(null)
  const by = user.displayName || user.email || 'admin'
  const members = (id: string) => guests.filter((g) => g.inviteId === id && !g.removed).sort((a, b) => a.order - b.order)
  const reserve = invites.filter((i) => i.reserve && !i.archived)

  return (
    <>
      <div className="ad-head">
        <div>
          <h1>Reservas</h1>
          <p>Quem entra quando abrir vaga. Ao convidar, o convite vai para a lista e pode ser enviado pelo WhatsApp.</p>
        </div>
      </div>
      <div className="ad-cols" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {(['gabriel', 'luiza'] as Host[]).map((h) => {
          const hs = stats.hosts.find((x) => x.host === h)!
          const list = reserve.filter((i) => i.host === h)
          return (
            <div key={h} className="ad-card">
              <div className="ad-card-head">
                <div>
                  <h3>Reserva {h === 'gabriel' ? 'do' : 'da'} {HOST_LABEL[h]}</h3>
                  <small style={{ color: hs.free > 0 ? 'var(--ok)' : 'var(--muted)', fontWeight: 600 }}>
                    {hs.free > 0 ? `${plural(hs.free, 'vaga livre', 'vagas livres')} agora` : 'Sem vagas livres'}
                  </small>
                </div>
                <button
                  className="ad-btn sm"
                  onClick={() => setEditing({ label: '', host: h, phone: '', notes: '', tags: [], reserve: true, members: [{ name: '', isChild: false, age: null, phone: '' }] })}
                >
                  <Icon name="plus" size={14} /> Adicionar
                </button>
              </div>
              {list.length === 0 && <div className="ad-empty" style={{ padding: 16 }}>Ninguém na reserva.</div>}
              {list.map((i) => {
                const m = members(i.id)
                return (
                  <div key={i.id} className="ad-action" style={{ cursor: 'default' }}>
                    <div>
                      <b>{i.label}</b>
                      <small>{plural(m.length, 'pessoa')}{i.phone ? ` · ${i.phone}` : ''}</small>
                    </div>
                    <button className="ad-btn sm primary" onClick={() => setReserve(i, m, false)}>Convidar</button>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      {editing && <InviteEditor draft={editing} existing={[]} by={by} onClose={() => setEditing(null)} />}
    </>
  )
}
