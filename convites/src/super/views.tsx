import { useMemo, useState } from 'react'
import type { SuperCtx } from './SuperApp'
import Icon from '../lib/Icon'
import { fillTemplate, parseISODate, plural, shortDate, waLink } from '../lib/text'
import { THEMES } from '../themes'
import {
  STATUS, STATUS_LABEL, archiveClient, balanceOf, blankClient, money, paidOf, saveClient, saveOwnerSettings, setClientStatus, todayISO,
  type Client, type ClientStatus, type OwnerSettings, type Payment,
} from './model'

const DAY = 864e5
const daysTo = (iso: string) => (iso ? Math.ceil((parseISODate(iso).getTime() - Date.now()) / DAY) : NaN)
const active = (c: Client) => c.status !== 'concluido' && c.status !== 'cancelado'
const themeName = (id: string) => (id === 'novo' ? 'Tema sob encomenda' : THEMES.find((t) => t.id === id)?.name ?? id)
const monthKey = (iso: string) => iso.slice(0, 7)
const monthLabel = (k: string) => {
  const [y, m] = k.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '')
}
const h3: React.CSSProperties = { fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', margin: '18px 0 10px' }

function Head({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="ad-head">
      <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      {children && <div className="ad-row">{children}</div>}
    </div>
  )
}

function Kpi({ label, n, sub, onClick }: { label: string; n: string | number; sub?: string; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className="ad-card ad-kpi" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <span className="l">{label}</span><span className="n">{n}</span>{sub && <span className="s">{sub}</span>}
    </Tag>
  )
}

function Bars({ rows, fmt = (n: number) => String(n) }: { rows: [string, number][]; fmt?: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r[1]))
  return (
    <div className="sp-bars">
      {rows.map(([l, v]) => (
        <div className="sp-bar" key={l}>
          <span>{l}</span>
          <div className="sp-track"><i style={{ width: `${(v / max) * 100}%` }} /></div>
          <b>{fmt(v)}</b>
        </div>
      ))}
    </div>
  )
}

const csv = (name: string, rows: (string | number)[][]) => {
  const body = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + body], { type: 'text/csv' }))
  a.download = name
  a.click()
}

const wa = (c: Client, tpl: string, extra: Record<string, string> = {}) =>
  waLink(c.phone, fillTemplate(tpl, { nome: c.name.split(' ')[0], saldo: money(balanceOf(c)), convite: c.inviteUrl || '(link do convite)', painel: c.adminUrl || '(link do painel)', ...extra }))

/* ------------------------------------------------------------ visão geral */
export function OverviewView({ clients, go }: SuperCtx) {
  const paid = clients.reduce((s, c) => s + paidOf(c), 0)
  const toReceive = clients.reduce((s, c) => s + balanceOf(c), 0)
  const month = monthKey(todayISO())
  const paidMonth = clients.flatMap((c) => c.payments ?? []).filter((p) => monthKey(p.dateISO) === month).reduce((s, p) => s + p.amount, 0)
  const sold = clients.filter((c) => c.status !== 'lead' && c.status !== 'cancelado')
  const ticket = sold.length ? sold.reduce((s, c) => s + c.price, 0) / sold.length : 0
  const act = clients.filter(active)

  const months = useMemo(() => {
    const out: [string, number][] = []
    const d = new Date()
    for (let k = 5; k >= 0; k--) {
      const x = new Date(d.getFullYear(), d.getMonth() - k, 1)
      const key = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`
      out.push([monthLabel(key), clients.flatMap((c) => c.payments ?? []).filter((p) => monthKey(p.dateISO) === key).reduce((s, p) => s + p.amount, 0)])
    }
    return out
  }, [clients])

  const alerts: { text: string; tab: 'clientes' | 'financeiro' | 'funil'; level: 'late' | 'warn' }[] = []
  for (const c of act) {
    const d = daysTo(c.eventDateISO)
    if (!Number.isNaN(d) && d >= 0 && d <= 14 && c.status !== 'entregue') alerts.push({ text: `${c.name}: evento em ${plural(d, 'dia')} e o convite ainda está "${STATUS_LABEL[c.status]}"`, tab: 'funil', level: 'late' })
    if (c.status === 'briefing' && (Date.now() - parseISODate(c.updatedISO || c.createdISO).getTime()) / DAY > 3) alerts.push({ text: `${c.name}: briefing sem resposta há mais de 3 dias`, tab: 'clientes', level: 'warn' })
    if (c.status === 'entregue' && balanceOf(c) > 0) alerts.push({ text: `${c.name}: convite entregue com saldo de ${money(balanceOf(c))}`, tab: 'financeiro', level: 'warn' })
  }
  const next = [...act].filter((c) => !Number.isNaN(daysTo(c.eventDateISO)) && daysTo(c.eventDateISO) >= 0).sort((a, b) => a.eventDateISO.localeCompare(b.eventDateISO)).slice(0, 5)
  return (
    <>
      <Head title="Visão geral" sub="Tudo do seu negócio de convites em um só lugar." />
      <div className="sp-grid">
        <Kpi label="Clientes ativos" n={act.length} sub={`${clients.length} no total`} onClick={() => go('clientes')} />
        <Kpi label="Recebido" n={money(paid)} sub={`${money(paidMonth)} neste mês`} onClick={() => go('financeiro')} />
        <Kpi label="A receber" n={money(toReceive)} onClick={() => go('financeiro')} />
        <Kpi label="Ticket médio" n={money(ticket)} sub={`${sold.length} vendas`} />
      </div>

      <h3 style={h3}>Precisa de atenção · {alerts.length}</h3>
      <div className="ad-list">
        {alerts.length === 0 && <div className="ad-empty">Nada pendente. Tudo em dia.</div>}
        {alerts.map((a, i) => (
          <button key={i} className="ad-card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => go(a.tab)}>
            <span className={`sp-pill ${a.level}`}>{a.level === 'late' ? 'Urgente' : 'Pendente'}</span> {a.text}
          </button>
        ))}
      </div>

      <div className="sp-grid" style={{ marginTop: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="ad-card">
          <b>Funil</b>
          <Bars rows={STATUS.filter((s) => s.id !== 'cancelado').map((s) => [s.label, clients.filter((c) => c.status === s.id).length])} />
        </div>
        <div className="ad-card">
          <b>Receita por mês</b>
          <Bars rows={months} fmt={money} />
        </div>
      </div>

      <h3 style={h3}>Próximos eventos</h3>
      <div className="ad-list">
        {next.length === 0 && <div className="ad-empty">Nenhum evento marcado.</div>}
        {next.map((c) => (
          <div className="ad-card ad-row" key={c.id} style={{ justifyContent: 'space-between' }}>
            <span><b>{c.eventTitle || c.name}</b> · {themeName(c.themeId)} · {shortDate(c.eventDateISO)}</span>
            <span className="sp-pill">{plural(daysTo(c.eventDateISO), 'dia')} · {STATUS_LABEL[c.status]}</span>
          </div>
        ))}
      </div>
    </>
  )
}

/* ---------------------------------------------------------------- clientes */
export function ClientsView({ clients, owner, filter }: SuperCtx) {
  const [q, setQ] = useState('')
  const [st, setSt] = useState<ClientStatus | ''>((filter as ClientStatus) || '')
  const [editing, setEditing] = useState<(Omit<Client, 'id'> & { id?: string }) | null>(null)
  const list = clients
    .filter((c) => (!st || c.status === st) && (!q || `${c.name} ${c.eventTitle} ${c.phone}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (b.updatedISO || '').localeCompare(a.updatedISO || ''))
  return (
    <>
      <Head title="Clientes" sub="Cada cliente é um convite: dados, pagamento, links e conversa.">
        <button className="ad-btn primary" onClick={() => setEditing(blankClient())}><Icon name="plus" size={16} /> Novo cliente</button>
      </Head>
      <div className="ad-filters">
        <label className="ad-search"><Icon name="search" size={16} /><input className="ad-input" placeholder="Buscar cliente ou evento" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <button className={`ad-chip ${st === '' ? 'on' : ''}`} onClick={() => setSt('')}>Todos</button>
        {STATUS.map((s) => <button key={s.id} className={`ad-chip ${st === s.id ? 'on' : ''}`} onClick={() => setSt(s.id)}>{s.label}</button>)}
      </div>
      <div className="ad-list">
        {list.length === 0 && <div className="ad-empty">Nenhum cliente aqui ainda.</div>}
        {list.map((c) => {
          const bal = balanceOf(c)
          return (
            <div className="ad-inv" key={c.id}>
              <div className="ad-inv-top">
                <b>{c.name}</b>
                <span className="ad-tag">{STATUS_LABEL[c.status]}</span>
                <span className="ad-tag">{themeName(c.themeId)}</span>
                {bal > 0 && <span className="sp-pill warn">Saldo {money(bal)}</span>}
                {bal === 0 && c.price > 0 && c.status !== 'cancelado' && <span className="sp-pill ok">Pago</span>}
                <span className="ad-meta">{c.phone}</span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>
                {c.eventTitle || 'Sem evento'}{c.eventDateISO && ` · ${shortDate(c.eventDateISO)}`} · {money(c.price)} ({money(paidOf(c))} pago)
              </div>
              <div className="ad-row">
                <a className="ad-btn sm wa" href={wa(c, owner.briefingMessage)} target="_blank" rel="noreferrer" onClick={() => c.status === 'lead' && setClientStatus(c, 'briefing')}>Enviar briefing</a>
                <a className="ad-btn sm wa" href={wa(c, owner.deliveryMessage)} target="_blank" rel="noreferrer">Enviar links</a>
                {bal > 0 && <a className="ad-btn sm wa" href={wa(c, owner.chargeMessage)} target="_blank" rel="noreferrer">Cobrar saldo</a>}
                {c.inviteUrl && <a className="ad-btn sm" href={c.inviteUrl} target="_blank" rel="noreferrer">Abrir convite</a>}
                <button className="ad-btn sm" onClick={() => setEditing({ ...c })}><Icon name="edit" size={14} /> Editar</button>
              </div>
            </div>
          )
        })}
      </div>
      {editing && <ClientEditor draft={editing} owner={owner} onClose={() => setEditing(null)} />}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="ad-field"><span>{label}</span>{children}</label>
}

function ClientEditor({ draft, owner, onClose }: { draft: Omit<Client, 'id'> & { id?: string }; owner: OwnerSettings; onClose: () => void }) {
  const [d, setD] = useState(draft)
  const [pay, setPay] = useState({ amount: '', method: 'pix' as Payment['method'], dateISO: todayISO(), note: '' })
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((x) => ({ ...x, [k]: v }))
  const save = async () => { if (!d.name.trim()) return; await saveClient(d); onClose() }
  const addPay = () => {
    const amount = Number(pay.amount.replace(',', '.'))
    if (!amount) return
    set('payments', [...(d.payments ?? []), { id: String(Date.now()), dateISO: pay.dateISO, amount, method: pay.method, note: pay.note }])
    setPay({ ...pay, amount: '', note: '' })
  }
  return (
    <div className="ad-modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ad-modal">
        <h2>{d.id ? 'Editar cliente' : 'Novo cliente'}</h2>
        <div className="ad-grid2">
          <Field label="Nome do cliente"><input className="ad-input" value={d.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="WhatsApp"><input className="ad-input" value={d.phone} onChange={(e) => set('phone', e.target.value)} placeholder="21 99999-0000" /></Field>
          <Field label="Evento"><input className="ad-input" value={d.eventTitle} onChange={(e) => set('eventTitle', e.target.value)} placeholder="Ex.: Théo faz 1 ano" /></Field>
          <Field label="Data do evento"><input className="ad-input" type="date" value={d.eventDateISO} onChange={(e) => set('eventDateISO', e.target.value)} /></Field>
          <Field label="Tema">
            <select className="ad-input" value={d.themeId} onChange={(e) => { const t = THEMES.find((x) => x.id === e.target.value); setD((x) => ({ ...x, themeId: e.target.value, kind: t?.kind ?? x.kind })) }}>
              {THEMES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              <option value="novo">Tema sob encomenda (criar)</option>
            </select>
          </Field>
          <Field label="Situação">
            <select className="ad-input" value={d.status} onChange={(e) => set('status', e.target.value as ClientStatus)}>
              {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Pacote">
            <select className="ad-input" value={d.pkg} onChange={(e) => { const p = owner.packages.find((x) => x.id === e.target.value); setD((x) => ({ ...x, pkg: e.target.value, price: p ? p.price : x.price })) }}>
              {owner.packages.map((p) => <option key={p.id} value={p.id}>{p.name} · {money(p.price)}</option>)}
            </select>
          </Field>
          <Field label="Valor combinado (R$)"><input className="ad-input" type="number" value={d.price} onChange={(e) => set('price', Number(e.target.value))} /></Field>
          <Field label="Como chegou"><input className="ad-input" value={d.source} onChange={(e) => set('source', e.target.value)} placeholder="Indicação, Instagram…" /></Field>
        </div>
        <Field label="Link do convite"><input className="ad-input" value={d.inviteUrl} onChange={(e) => set('inviteUrl', e.target.value)} placeholder="https://" /></Field>
        <Field label="Link do painel do cliente"><input className="ad-input" value={d.adminUrl} onChange={(e) => set('adminUrl', e.target.value)} placeholder="https://…/admin" /></Field>
        <Field label="O que o cliente imagina (briefing)"><textarea className="ad-input" rows={3} value={d.brief} onChange={(e) => set('brief', e.target.value)} /></Field>
        <Field label="Anotações internas"><textarea className="ad-input" rows={2} value={d.notes} onChange={(e) => set('notes', e.target.value)} /></Field>

        <h3 style={h3}>Pagamentos · {money((d.payments ?? []).reduce((s, p) => s + p.amount, 0))} de {money(d.price)}</h3>
        {(d.payments ?? []).map((p) => (
          <div className="sp-pay" key={p.id}>
            <span>{shortDate(p.dateISO)}</span><span>{p.method}{p.note && ` · ${p.note}`}</span>
            <span><b>{money(p.amount)}</b> <button className="ad-icon-btn" aria-label="Remover" onClick={() => set('payments', d.payments.filter((x) => x.id !== p.id))}><Icon name="x" size={14} /></button></span>
          </div>
        ))}
        <div className="ad-row" style={{ marginTop: 8 }}>
          <input className="ad-input" style={{ width: 110 }} placeholder="Valor" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
          <select className="ad-input" style={{ width: 110 }} value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value as Payment['method'] })}>
            <option value="pix">Pix</option><option value="cartao">Cartão</option><option value="dinheiro">Dinheiro</option><option value="outro">Outro</option>
          </select>
          <input className="ad-input" style={{ width: 150 }} type="date" value={pay.dateISO} onChange={(e) => setPay({ ...pay, dateISO: e.target.value })} />
          <button className="ad-btn sm" onClick={addPay}>Registrar</button>
        </div>

        <div className="ad-row" style={{ marginTop: 16, justifyContent: 'space-between' }}>
          {d.id ? <button className="ad-btn sm" onClick={async () => { await archiveClient({ ...(d as Client) }, true); onClose() }}><Icon name="archive" size={14} /> Arquivar</button> : <span />}
          <div className="ad-row"><button className="ad-btn" onClick={onClose}>Cancelar</button><button className="ad-btn primary" onClick={save}>Salvar</button></div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- funil */
export function PipelineView({ clients }: SuperCtx) {
  const cols = STATUS.filter((s) => s.id !== 'cancelado')
  const move = (c: Client, dir: -1 | 1) => {
    const i = cols.findIndex((s) => s.id === c.status)
    const to = cols[i + dir]
    if (to) setClientStatus(c, to.id)
  }
  return (
    <>
      <Head title="Funil de pedidos" sub="Do primeiro contato ao evento realizado. Use as setas para andar com o pedido." />
      <div className="sp-kanban">
        {cols.map((s) => {
          const list = clients.filter((c) => c.status === s.id)
          return (
            <div className="sp-col" key={s.id}>
              <h4><span>{s.label}</span><span>{list.length}</span></h4>
              {s.hint && <small style={{ color: 'var(--muted)' }}>{s.hint}</small>}
              {list.map((c) => (
                <div className="sp-card" key={c.id}>
                  <b>{c.name}</b>
                  <span>{c.eventTitle || '—'}</span>
                  <span>{themeName(c.themeId)}{c.eventDateISO && ` · ${shortDate(c.eventDateISO)}`}</span>
                  <span>{money(c.price)}{balanceOf(c) > 0 ? ` · saldo ${money(balanceOf(c))}` : ' · pago'}</span>
                  <div className="ad-row">
                    <button className="ad-btn sm" aria-label="Voltar etapa" disabled={s.id === cols[0].id} onClick={() => move(c, -1)}><Icon name="arrowLeft" size={14} /></button>
                    <button className="ad-btn sm" aria-label="Avançar etapa" disabled={s.id === cols[cols.length - 1].id} onClick={() => move(c, 1)}><Icon name="arrowRight" size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}

/* -------------------------------------------------------------- financeiro */
export function FinanceView({ clients, owner }: SuperCtx) {
  const pays = clients.flatMap((c) => (c.payments ?? []).map((p) => ({ ...p, client: c }))).sort((a, b) => b.dateISO.localeCompare(a.dateISO))
  const paid = pays.reduce((s, p) => s + p.amount, 0)
  const owing = clients.filter((c) => balanceOf(c) > 0).sort((a, b) => balanceOf(b) - balanceOf(a))
  const byMonth = new Map<string, number>()
  pays.forEach((p) => byMonth.set(monthKey(p.dateISO), (byMonth.get(monthKey(p.dateISO)) ?? 0) + p.amount))
  const byPkg = owner.packages.map((p) => [p.name, clients.filter((c) => c.pkg === p.id).reduce((s, c) => s + paidOf(c), 0)] as [string, number])
  const byTheme = THEMES.map((t) => [t.name, clients.filter((c) => c.themeId === t.id).reduce((s, c) => s + paidOf(c), 0)] as [string, number]).concat([['Sob encomenda', clients.filter((c) => c.themeId === 'novo').reduce((s, c) => s + paidOf(c), 0)]])
  return (
    <>
      <Head title="Financeiro" sub="Recebimentos, saldos e o que mais vende.">
        <button className="ad-btn" onClick={() => csv('financeiro.csv', [['Data', 'Cliente', 'Evento', 'Forma', 'Valor'], ...pays.map((p) => [p.dateISO, p.client.name, p.client.eventTitle, p.method, p.amount])])}>
          <Icon name="download" size={16} /> Baixar planilha
        </button>
      </Head>
      <div className="sp-grid">
        <Kpi label="Recebido" n={money(paid)} />
        <Kpi label="A receber" n={money(owing.reduce((s, c) => s + balanceOf(c), 0))} sub={`${owing.length} clientes`} />
        <Kpi label="Previsto no total" n={money(clients.filter((c) => c.status !== 'cancelado').reduce((s, c) => s + c.price, 0))} />
      </div>
      <div className="sp-grid" style={{ marginTop: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="ad-card"><b>Por mês</b><Bars rows={[...byMonth.entries()].sort().map(([k, v]) => [monthLabel(k), v] as [string, number])} fmt={money} /></div>
        <div className="ad-card"><b>Por pacote</b><Bars rows={byPkg} fmt={money} /></div>
        <div className="ad-card"><b>Por tema</b><Bars rows={byTheme.filter((r) => r[1] > 0)} fmt={money} /></div>
      </div>

      <h3 style={h3}>Saldos em aberto · {owing.length}</h3>
      <div className="ad-list">
        {owing.length === 0 && <div className="ad-empty">Ninguém devendo.</div>}
        {owing.map((c) => (
          <div className="ad-card ad-row" key={c.id} style={{ justifyContent: 'space-between' }}>
            <span><b>{c.name}</b> · {c.eventTitle} · <b>{money(balanceOf(c))}</b></span>
            <a className="ad-btn sm wa" href={wa(c, owner.chargeMessage)} target="_blank" rel="noreferrer">Cobrar no WhatsApp</a>
          </div>
        ))}
      </div>

      <h3 style={h3}>Últimos pagamentos</h3>
      <div className="ad-card">
        {pays.length === 0 && <div className="ad-empty">Nenhum pagamento ainda.</div>}
        {pays.slice(0, 40).map((p) => (
          <div className="sp-pay" key={p.id + p.client.id}><span>{shortDate(p.dateISO)}</span><span>{p.client.name} · {p.method}</span><b>{money(p.amount)}</b></div>
        ))}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------- temas */
export function ThemesView({ clients, go }: SuperCtx) {
  const orders = clients.filter((c) => c.themeId === 'novo' && active(c))
  return (
    <>
      <Head title="Temas" sub="A biblioteca cresce a cada pedido: criado uma vez, fica disponível para todos." />
      <div className="sp-themes">
        {THEMES.map((t) => {
          const n = clients.filter((c) => c.themeId === t.id)
          return (
            <div className="ad-card" key={t.id} style={{ display: 'grid', gap: 8 }}>
              <div className="ad-row" style={{ justifyContent: 'space-between' }}>
                <b>{t.name}</b><span className="sp-pill">{t.kind === 'kids' ? 'Infantil' : 'Casamento'}</span>
              </div>
              <div className="sp-swatch">{t.swatch.map((c) => <i key={c} style={{ background: c }} />)}</div>
              <div className="sp-emojis">{t.emojis.slice(0, 6).join(' ')}</div>
              <small style={{ color: 'var(--muted)' }}>{plural(n.length, 'cliente')} · {money(n.reduce((s, c) => s + paidOf(c), 0))} recebidos</small>
            </div>
          )
        })}
      </div>

      <h3 style={h3}>Pedidos de tema novo · {orders.length}</h3>
      <div className="ad-list">
        {orders.length === 0 && <div className="ad-empty">Nenhum pedido de tema sob encomenda.</div>}
        {orders.map((c) => (
          <div className="ad-inv" key={c.id}>
            <div className="ad-inv-top"><b>{c.name}</b><span className="ad-tag">{STATUS_LABEL[c.status]}</span><span className="ad-meta">{c.eventTitle}</span></div>
            <div style={{ fontSize: 14 }}>{c.brief || 'Sem descrição ainda: peça cores, símbolos e estilo no briefing.'}</div>
            <div className="ad-row"><button className="ad-btn sm" onClick={() => go('clientes')}>Ver cliente</button></div>
          </div>
        ))}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 16 }}>
        Para criar um tema novo: copie um bloco em <code>src/themes.ts</code> e troque cores, símbolos e fonte. Ele passa a aparecer aqui e no cadastro de clientes.
      </p>
    </>
  )
}

/* ------------------------------------------------------------ configurações */
export function SettingsViewOwner({ owner }: SuperCtx) {
  const [s, setS] = useState(owner)
  const [saved, setSaved] = useState(false)
  const setPkg = (i: number, k: 'name' | 'price' | 'includes', v: string) =>
    setS({ ...s, packages: s.packages.map((p, j) => (j === i ? { ...p, [k]: k === 'price' ? Number(v) : v } : p)) })
  return (
    <>
      <Head title="Configurações" sub="Pacotes, preços e as mensagens que você manda aos clientes.">
        <button className="ad-btn primary" onClick={async () => { await saveOwnerSettings(s); setSaved(true); setTimeout(() => setSaved(false), 2000) }}>{saved ? 'Salvo ✓' : 'Salvar'}</button>
      </Head>
      <h3 style={h3}>Pacotes (valores de exemplo: ajuste aos seus)</h3>
      <div className="ad-list">
        {s.packages.map((p, i) => (
          <div className="ad-card" key={p.id} style={{ display: 'grid', gap: 8 }}>
            <div className="ad-row">
              <input className="ad-input" style={{ width: 160 }} value={p.name} onChange={(e) => setPkg(i, 'name', e.target.value)} />
              <input className="ad-input" style={{ width: 120 }} type="number" value={p.price} onChange={(e) => setPkg(i, 'price', e.target.value)} />
            </div>
            <textarea className="ad-input" rows={2} value={p.includes} onChange={(e) => setPkg(i, 'includes', e.target.value)} />
          </div>
        ))}
      </div>
      <h3 style={h3}>Mensagens (use {'{nome} {saldo} {convite} {painel}'})</h3>
      <Field label="Briefing: o formulário que você envia pelo WhatsApp"><textarea className="ad-input" rows={12} value={s.briefingMessage} onChange={(e) => setS({ ...s, briefingMessage: e.target.value })} /></Field>
      <Field label="Entrega dos links"><textarea className="ad-input" rows={6} value={s.deliveryMessage} onChange={(e) => setS({ ...s, deliveryMessage: e.target.value })} /></Field>
      <Field label="Cobrança do saldo"><textarea className="ad-input" rows={3} value={s.chargeMessage} onChange={(e) => setS({ ...s, chargeMessage: e.target.value })} /></Field>
    </>
  )
}
