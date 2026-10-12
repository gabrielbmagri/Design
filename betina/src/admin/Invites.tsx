import { useEffect, useMemo, useState } from 'react'
import type { AdminCtx } from './AdminApp'
import type { Guest, Host, Invite, Status } from '../lib/types'
import { HOST_LABEL, STATUS_LABEL } from '../lib/types'
import { normalize } from '../lib/text'
import { clearSent, markSent, parseBulk, saveInvite, setArchived, setGuestStatus, setReserve, type InviteDraft } from './ops'
import { inviteLink, inviteWa } from './messages'
import { isFreeChild } from './stats'

type F = 'all' | 'gabriel' | 'luiza' | 'yes' | 'no' | 'open' | 'reserve' | 'notsent' | 'archived'

const FILTERS: { id: F; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'gabriel', label: 'Gabriel' },
  { id: 'luiza', label: 'Luiza' },
  { id: 'open', label: 'Sem resposta' },
  { id: 'yes', label: 'Confirmados' },
  { id: 'no', label: 'Não vão' },
  { id: 'notsent', label: 'Não enviados' },
  { id: 'reserve', label: 'Reservas' },
  { id: 'archived', label: 'Arquivados' },
]

export default function Invites(ctx: AdminCtx) {
  const { invites, guests, settings, user, filter } = ctx
  const [f, setF] = useState<F>('all')
  const [host, setHost] = useState<Host | ''>('')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<InviteDraft | null>(null)
  const [bulk, setBulk] = useState(false)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    if (!filter) return
    const [a, b] = filter.split(':')
    setF(a as F)
    setHost((b as Host) || '')
  }, [filter])

  const membersOf = useMemo(() => {
    const m = new Map<string, Guest[]>()
    for (const g of guests) {
      if (g.removed) continue
      if (!m.has(g.inviteId)) m.set(g.inviteId, [])
      m.get(g.inviteId)!.push(g)
    }
    for (const l of m.values()) l.sort((a, b) => a.order - b.order)
    return m
  }, [guests])

  const list = useMemo(() => {
    const nq = normalize(q)
    return invites
      .filter((i) => {
        const mem = membersOf.get(i.id) ?? []
        if (f === 'archived') { if (!i.archived) return false }
        else if (i.archived) return false
        if (f === 'reserve') { if (!i.reserve) return false }
        else if (f !== 'all' && f !== 'archived' && i.reserve) return false
        if (host && i.host !== host) return false
        if (f === 'gabriel' || f === 'luiza') if (i.host !== f) return false
        if (f === 'yes' && !mem.some((g) => g.status === 'yes')) return false
        if (f === 'no' && !mem.some((g) => g.status === 'no')) return false
        if (f === 'open' && !mem.some((g) => g.status === 'pending' || g.status === 'maybe')) return false
        if (f === 'notsent' && i.sentAt) return false
        if (nq && !normalize(i.label + ' ' + mem.map((g) => g.name).join(' ') + ' ' + i.phone + ' ' + (i.tags ?? []).join(' ')).includes(nq)) return false
        return true
      })
      .sort((a, b) => Number(a.reserve) - Number(b.reserve) || a.label.localeCompare(b.label, 'pt-BR'))
  }, [invites, membersOf, f, host, q])

  const openNew = () =>
    setEditing({ label: '', host: host || 'gabriel', phone: '', notes: '', tags: [], reserve: f === 'reserve', members: [{ name: '', isChild: false, age: null, phone: '' }] })

  const openEdit = (i: Invite) =>
    setEditing({
      id: i.id, label: i.label, host: i.host, phone: i.phone ?? '', notes: i.notes ?? '', tags: i.tags ?? [], reserve: i.reserve,
      members: (membersOf.get(i.id) ?? []).map((g) => ({ id: g.id, name: g.name, isChild: g.isChild, age: g.age, phone: i.memberPhones?.[g.id] ?? '', status: g.status })),
    })

  const copy = async (i: Invite) => {
    await navigator.clipboard.writeText(inviteLink(i.id))
    setCopied(i.id)
    setTimeout(() => setCopied(''), 1500)
  }

  const by = user.displayName || user.email || 'admin'

  return (
    <>
      <div className="ad-head">
        <h1>Convites</h1>
        <div className="ad-row">
          <button className="ad-btn" onClick={() => setBulk(true)}>Importar lista</button>
          <button className="ad-btn primary" onClick={openNew}>+ Novo convite</button>
        </div>
      </div>

      <div className="ad-filters">
        <input className="ad-input" style={{ maxWidth: 280 }} placeholder="Buscar nome, telefone, etiqueta…" value={q} onChange={(e) => setQ(e.target.value)} />
        {FILTERS.map((x) => (
          <button key={x.id} className={`ad-chip ${f === x.id ? 'on' : ''}`} onClick={() => { setF(x.id); setHost('') }}>
            {x.label}
          </button>
        ))}
        {host && <button className="ad-chip on" onClick={() => setHost('')}>{HOST_LABEL[host]} ✕</button>}
      </div>

      <div style={{ color: 'var(--muted)', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
        {list.length} convites · {list.reduce((n, i) => n + (membersOf.get(i.id)?.length ?? 0), 0)} pessoas
      </div>

      <div className="ad-list">
        {list.length === 0 && <div className="ad-empty">Nenhum convite aqui.</div>}
        {list.map((i) => {
          const mem = membersOf.get(i.id) ?? []
          return (
            <div key={i.id} className="ad-inv">
              <div className="ad-inv-top">
                <b>{i.label}</b>
                <span className={`ad-tag ${i.host}`}>{HOST_LABEL[i.host]}</span>
                {i.reserve && <span className="ad-tag reserve">reserva</span>}
                {(i.tags ?? []).map((t) => <span key={t} className="ad-tag">{t}</span>)}
                <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 13 }}>
                  {i.phone || 'sem telefone'}
                  {i.sentAt ? ` · enviado ${i.sentAt.toDate().toLocaleDateString('pt-BR')}` : !i.reserve ? ' · não enviado' : ''}
                  {i.reminderCount ? ` · ${i.reminderCount} lembrete(s)` : ''}
                </span>
              </div>
              <div className="ad-people">
                {mem.map((g) => (
                  <span key={g.id} className={`ad-person st-${g.status}`}>
                    {g.name}
                    {g.isChild && (
                      <small title={isFreeChild(g, settings) ? 'não paga' : ''}>
                        🧸{g.age != null ? `${g.age}a` : '?'}{isFreeChild(g, settings) ? ' isenta' : ''}
                      </small>
                    )}
                    <select
                      value={g.status}
                      aria-label={`Status de ${g.name}`}
                      onChange={(e) => setGuestStatus(g, e.target.value as Status, by)}
                    >
                      {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </span>
                ))}
              </div>
              {i.notes && <div style={{ fontSize: 13, color: 'var(--muted)' }}>📝 {i.notes}</div>}
              <div className="ad-row">
                {!i.reserve && !i.archived && (
                  <a className="ad-btn sm wa" href={inviteWa(settings, i, mem)} target="_blank" rel="noreferrer" onClick={() => !i.sentAt && markSent(i)}>
                    {i.sentAt ? 'Reenviar no WhatsApp' : 'Enviar no WhatsApp'}
                  </a>
                )}
                {!i.sentAt && !i.reserve && !i.archived && <button className="ad-btn sm" onClick={() => markSent(i)}>Marcar como enviado</button>}
                {i.sentAt && <button className="ad-btn sm" onClick={() => confirm('Desmarcar envio?') && clearSent(i)}>Desmarcar envio</button>}
                <button className="ad-btn sm" onClick={() => copy(i)}>{copied === i.id ? 'Copiado!' : 'Copiar link'}</button>
                <button className="ad-btn sm" onClick={() => openEdit(i)}>Editar</button>
                {i.reserve ? (
                  <button className="ad-btn sm primary" onClick={() => setReserve(i, mem, false)}>Convidar (sair da reserva)</button>
                ) : (
                  !i.archived && <button className="ad-btn sm" onClick={() => setReserve(i, mem, true)}>Mover p/ reserva</button>
                )}
                {i.archived ? (
                  <button className="ad-btn sm" onClick={() => setArchived(i, mem, false)}>Restaurar</button>
                ) : (
                  <button className="ad-btn sm danger" onClick={() => confirm(`Arquivar "${i.label}"? Nada é apagado; dá pra restaurar depois.`) && setArchived(i, mem, true)}>Arquivar</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {editing && (
        <InviteEditor
          draft={editing}
          existing={editing.id ? guests.filter((g) => g.inviteId === editing.id && !g.removed) : []}
          by={by}
          onClose={() => setEditing(null)}
        />
      )}
      {bulk && <BulkImport by={by} onClose={() => setBulk(false)} />}
    </>
  )
}

function InviteEditor({ draft, existing, by, onClose }: { draft: InviteDraft; existing: Guest[]; by: string; onClose: () => void }) {
  const [d, setD] = useState<InviteDraft>(draft)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = <K extends keyof InviteDraft>(k: K, v: InviteDraft[K]) => setD((x) => ({ ...x, [k]: v }))
  const setM = (idx: number, patch: Partial<InviteDraft['members'][number]>) =>
    setD((x) => ({ ...x, members: x.members.map((m, i) => (i === idx ? { ...m, ...patch } : m)) }))

  const save = async () => {
    if (!d.members.some((m) => m.name.trim())) return setErr('Coloque pelo menos um nome.')
    const removed = existing.filter((g) => !d.members.some((m) => m.id === g.id) && g.status !== 'pending')
    if (removed.length && !confirm(`${removed.map((g) => g.name).join(', ')} já respondeu. Tirar do convite mesmo assim? (A resposta fica guardada no histórico.)`)) return
    setBusy(true)
    try {
      await saveInvite(d, existing, by)
      onClose()
    } catch (e) {
      setErr('Erro ao salvar: ' + (e as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="ad-modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ad-modal">
        <h2>{d.id ? 'Editar convite' : 'Novo convite'}</h2>

        <div className="ad-row">
          {(['gabriel', 'luiza'] as Host[]).map((h) => (
            <button key={h} className={`ad-chip ${d.host === h ? 'on' : ''}`} onClick={() => set('host', h)}>
              Convidado de {HOST_LABEL[h]}
            </button>
          ))}
          <label className="ad-row" style={{ gap: 6, fontWeight: 700, marginLeft: 'auto' }}>
            <input type="checkbox" checked={d.reserve} onChange={(e) => set('reserve', e.target.checked)} /> Reserva
          </label>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <b style={{ fontSize: 13, color: 'var(--muted)' }}>PESSOAS DO CONVITE</b>
          {d.members.map((m, idx) => (
            <div key={m.id ?? idx} className="ad-member">
              <input className="ad-input" placeholder="Nome e sobrenome" value={m.name} onChange={(e) => setM(idx, { name: e.target.value })} autoFocus={idx === d.members.length - 1 && !m.name} />
              <button className="ad-btn sm danger" onClick={() => setD((x) => ({ ...x, members: x.members.filter((_, i) => i !== idx) }))} aria-label="Remover">✕</button>
              <div className="ad-row" style={{ gridColumn: '1 / -1' }}>
                <label className="ad-row" style={{ gap: 6, fontWeight: 700 }}>
                  <input type="checkbox" checked={m.isChild} onChange={(e) => setM(idx, { isChild: e.target.checked })} /> Criança
                </label>
                {m.isChild && (
                  <input className="ad-input" style={{ width: 150 }} type="number" min={0} max={17} placeholder="Idade (opcional)" value={m.age ?? ''}
                    onChange={(e) => setM(idx, { age: e.target.value === '' ? null : Math.max(0, Math.min(17, Number(e.target.value))) })} />
                )}
                {m.isChild && m.age == null && <small style={{ color: 'var(--muted)' }}>em branco = perguntamos ao convidado</small>}
                <input className="ad-input" style={{ width: 180, marginLeft: 'auto' }} placeholder="Celular (opcional)" inputMode="tel" value={m.phone} onChange={(e) => setM(idx, { phone: e.target.value })} />
              </div>
            </div>
          ))}
          <button className="ad-btn" onClick={() => setD((x) => ({ ...x, members: [...x.members, { name: '', isChild: false, age: null, phone: '' }] }))}>
            + Adicionar pessoa
          </button>
        </div>

        <label className="ad-field">
          <span>WhatsApp principal do convite (para enviar e lembrar)</span>
          <input className="ad-input" inputMode="tel" placeholder="(11) 99999-0000" value={d.phone} onChange={(e) => set('phone', e.target.value)} />
        </label>
        <label className="ad-field">
          <span>Nome do convite (opcional — ex.: "Família Silva")</span>
          <input className="ad-input" placeholder="Automático: nomes das pessoas" value={d.label} onChange={(e) => set('label', e.target.value)} />
        </label>
        <label className="ad-field">
          <span>Etiquetas (separe por vírgula — ex.: família, trabalho, escola)</span>
          <input className="ad-input" value={d.tags.join(', ')} onChange={(e) => set('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))} />
        </label>
        <label className="ad-field">
          <span>Observações (só vocês veem)</span>
          <textarea className="ad-textarea" value={d.notes} onChange={(e) => set('notes', e.target.value)} />
        </label>

        {err && <div className="ad-note">{err}</div>}
        <div className="ad-row" style={{ justifyContent: 'flex-end' }}>
          <button className="ad-btn" onClick={onClose}>Cancelar</button>
          <button className="ad-btn primary" disabled={busy} onClick={save}>{busy ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}

function BulkImport({ by, onClose }: { by: string; onClose: () => void }) {
  const [text, setText] = useState('')
  const [host, setHost] = useState<Host>('gabriel')
  const [reserve, setReserveFlag] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(0)
  const parsed = parseBulk(text)

  const run = async () => {
    setBusy(true)
    for (const p of parsed) {
      await saveInvite({ ...p, host, reserve }, [], by)
      setDone((n) => n + 1)
    }
    onClose()
  }

  return (
    <div className="ad-modal-bg" onClick={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="ad-modal">
        <h2>Importar lista</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Uma linha por convite. Separe as pessoas com vírgula ou "e", e o telefone com ponto e vírgula. Marque crianças com
          <code> (criança)</code> ou <code>(criança 3)</code>.
        </p>
        <textarea
          className="ad-textarea"
          style={{ minHeight: 200, fontFamily: 'ui-monospace, monospace', fontSize: 14 }}
          placeholder={'Maria Silva e João Silva ; 11 99999-0000\nAna Souza, Pedro (criança 3), Lia (criança) ; 21988887777\nTia Rosa'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="ad-row">
          {(['gabriel', 'luiza'] as Host[]).map((h) => (
            <button key={h} className={`ad-chip ${host === h ? 'on' : ''}`} onClick={() => setHost(h)}>Convidados de {HOST_LABEL[h]}</button>
          ))}
          <label className="ad-row" style={{ gap: 6, fontWeight: 700 }}>
            <input type="checkbox" checked={reserve} onChange={(e) => setReserveFlag(e.target.checked)} /> Entram como reserva
          </label>
        </div>
        {parsed.length > 0 && (
          <div className="ad-note">
            {parsed.length} convites, {parsed.reduce((n, p) => n + p.members.length, 0)} pessoas
            ({parsed.reduce((n, p) => n + p.members.filter((m) => m.isChild).length, 0)} crianças).
          </div>
        )}
        <div className="ad-row" style={{ justifyContent: 'flex-end' }}>
          <button className="ad-btn" disabled={busy} onClick={onClose}>Cancelar</button>
          <button className="ad-btn primary" disabled={busy || !parsed.length} onClick={run}>
            {busy ? `Importando ${done}/${parsed.length}…` : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  )
}

