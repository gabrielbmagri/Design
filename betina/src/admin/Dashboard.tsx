import type { AdminCtx } from './AdminApp'
import { HOST_LABEL, STATUS_LABEL } from '../lib/types'
import { firstName, parseISODate, shortDate } from '../lib/text'
import Icon, { type IconName } from '../lib/Icon'
import type { HostStats } from './stats'

const DAY = 864e5
const daysUntil = (iso: string) => Math.ceil((parseISODate(iso).getTime() - Date.now()) / DAY)

function Kpi({ label, n, of, sub, onClick }: { label: string; n: number | string; of?: string; sub?: string; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className="ad-card ad-kpi" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <span className="l">{label}</span>
      <span className="n">
        {n}
        {of && <small> {of}</small>}
      </span>
      {sub && <span className="s">{sub}</span>}
    </Tag>
  )
}

function HostRow({ h }: { h: HostStats }) {
  const pct = (x: number) => `${Math.min(100, (x / Math.max(h.cap, 1)) * 100)}%`
  const color = h.host === 'gabriel' ? 'var(--gab)' : 'var(--lui)'
  return (
    <div style={{ padding: '6px 0' }}>
      <div className="ad-row" style={{ justifyContent: 'space-between' }}>
        <b style={{ color }}>{HOST_LABEL[h.host]}</b>
        <span style={{ color: 'var(--muted)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {h.invited} de {h.cap} · {h.free >= 0 ? `${h.free} vagas` : `${-h.free} acima`}
        </span>
      </div>
      <div className="ad-bar">
        <span style={{ width: pct(h.confirmed), background: 'var(--ok)' }} />
        <span style={{ width: pct(h.maybe), background: 'var(--gold)' }} />
        <span style={{ width: pct(h.waiting), background: '#d9cdd2' }} />
      </div>
      <div className="ad-legend">
        <span><i style={{ background: 'var(--ok)' }} />{h.confirmed} confirmados</span>
        <span><i style={{ background: 'var(--gold)' }} />{h.maybe} talvez</span>
        <span><i style={{ background: '#d9cdd2' }} />{h.waiting} sem resposta</span>
        {h.declined > 0 && <span>{h.declined} não vão</span>}
      </div>
    </div>
  )
}

export default function Dashboard({ stats, settings, go, logs, user }: AdminCtx) {
  const t = stats.totals
  const toParty = daysUntil(settings.dateISO)
  const toDeadline = daysUntil(settings.rsvpDeadlineISO)
  const answered = t.people ? Math.round(((t.confirmed + t.declined) / t.people) * 100) : 0
  const name = firstName(user.displayName || '')

  const actions: { icon: IconName; title: string; sub: string; onClick: () => void }[] = []
  if (stats.reminders.length)
    actions.push({ icon: 'bell', title: `Lembrar ${stats.reminders.length} convite(s)`, sub: `Sem resposta há mais de ${settings.reminderDays} dias`, onClick: () => go('lembretes') })
  if (stats.notSent.length)
    actions.push({ icon: 'mail', title: `Enviar ${stats.notSent.length} convite(s)`, sub: 'Ainda não foram mandados pelo WhatsApp', onClick: () => go('lembretes') })
  for (const h of stats.hosts)
    if (h.free > 0 && h.reserves > 0)
      actions.push({ icon: 'inbox', title: `${HOST_LABEL[h.host]} tem ${h.free} vaga(s) livre(s)`, sub: `${h.reserves} pessoa(s) na reserva para chamar`, onClick: () => go('reservas') })
  if (stats.kidsNoAge.length)
    actions.push({ icon: 'baby', title: `${stats.kidsNoAge.length} criança(s) sem idade`, sub: 'Define quem paga e a contagem de lembrancinhas', onClick: () => go('criancas') })

  return (
    <>
      <div className="ad-head">
        <div>
          <h1>{name ? `Oi, ${name}` : 'Olá'}</h1>
          <p>
            {toParty > 0 ? `Faltam ${toParty} dias para a festa` : toParty === 0 ? 'A festa é hoje!' : 'A festa já passou'}
            {toDeadline >= 0 && ` · prazo de resposta em ${toDeadline} dias (${shortDate(settings.rsvpDeadlineISO)})`}
          </p>
        </div>
        <button className="ad-btn primary" onClick={() => go('convites', 'new')}>
          <Icon name="plus" size={16} /> Novo convite
        </button>
      </div>

      <div className="ad-grid" style={{ marginBottom: 16 }}>
        <Kpi label="Confirmados" n={t.payingConfirmed} of={`/ ${t.cap}`} sub={`${t.confirmed} pessoas, contando crianças`} onClick={() => go('pessoas', 'yes')} />
        <Kpi label="Aguardando resposta" n={t.pending + t.maybe} sub={t.maybe ? `${t.maybe} disseram talvez` : undefined} onClick={() => go('pessoas', 'open')} />
        <Kpi label="Não vão" n={t.declined} onClick={() => go('pessoas', 'no')} />
        <Kpi label="Responderam" n={`${answered}%`} sub={`${t.sent} de ${t.invites} convites enviados`} />
      </div>

      <div className="ad-cols">
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="ad-card">
            <div className="ad-card-head">
              <h3>Próximas ações</h3>
            </div>
            <div className="ad-actions">
              {actions.length === 0 && (
                <div className="ad-action" style={{ cursor: 'default' }}>
                  <span className="ic ok"><Icon name="check" size={18} /></span>
                  <div>
                    <b>Tudo em dia</b>
                    <small>Nenhum lembrete ou envio pendente agora.</small>
                  </div>
                </div>
              )}
              {actions.map((a) => (
                <button key={a.title} className="ad-action" onClick={a.onClick}>
                  <span className="ic"><Icon name={a.icon} size={18} /></span>
                  <div>
                    <b>{a.title}</b>
                    <small>{a.sub}</small>
                  </div>
                  <Icon name="chevronRight" size={18} />
                </button>
              ))}
            </div>
          </div>

          <div className="ad-card">
            <div className="ad-card-head">
              <h3>Divisão de convidados</h3>
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>crianças até {settings.childFreeMaxAge} anos não contam</span>
            </div>
            {stats.hosts.map((h) => <HostRow key={h.host} h={h} />)}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="ad-card">
            <div className="ad-card-head">
              <h3>Crianças</h3>
              <button className="ad-btn sm" onClick={() => go('criancas')}>Ver</button>
            </div>
            <div className="ad-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="ad-kpi"><span className="l">Lembrancinhas</span><span className="n">{stats.kidsGoing.length}</span><span className="s">{stats.kidsExpected.length} previstas</span></div>
              <div className="ad-kpi"><span className="l">Não pagam</span><span className="n">{stats.kidsFree.length}</span><span className="s">até {settings.childFreeMaxAge} anos</span></div>
            </div>
          </div>

          <div className="ad-card">
            <div className="ad-card-head">
              <h3>Últimas respostas</h3>
              <button className="ad-btn sm" onClick={() => go('historico')}>Histórico</button>
            </div>
            {logs.length === 0 && <div className="ad-empty" style={{ padding: 12 }}>Ninguém respondeu ainda.</div>}
            {logs.slice(0, 6).map((l) => (
              <div key={l.id} className="ad-row" style={{ padding: '8px 0', borderTop: '1px solid var(--border)', flexWrap: 'nowrap' }}>
                <span className={`ad-tag st-${l.status}`}>{STATUS_LABEL[l.status]}</span>
                <b style={{ fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.guestName}</b>
                <span style={{ color: 'var(--muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {l.at?.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
