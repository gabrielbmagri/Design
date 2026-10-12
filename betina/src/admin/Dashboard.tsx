import type { AdminCtx } from './AdminApp'
import { HOST_LABEL } from '../lib/types'
import { shortDate } from '../lib/text'
import type { HostStats } from './stats'

function Kpi({ n, l, s, onClick }: { n: number | string; l: string; s?: string; onClick?: () => void }) {
  return (
    <button className="ad-card ad-kpi" style={{ textAlign: 'left', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div className="n">{n}</div>
      <div className="l">{l}</div>
      {s && <div className="s">{s}</div>}
    </button>
  )
}

function HostCard({ h, onReserves }: { h: HostStats; onReserves: () => void }) {
  const pct = (x: number) => `${Math.min(100, (x / Math.max(h.cap, 1)) * 100)}%`
  const color = h.host === 'gabriel' ? 'var(--gab)' : 'var(--lui)'
  return (
    <div className="ad-card">
      <div className="ad-row" style={{ justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, color }}>Convidados de {HOST_LABEL[h.host]}</h3>
        <b>
          {h.invited}/{h.cap}
        </b>
      </div>
      <div className="ad-bar">
        <span style={{ width: pct(h.confirmed), background: '#2f9e6a' }} />
        <span style={{ width: pct(h.maybe), background: '#e0a93a' }} />
        <span style={{ width: pct(h.waiting), background: '#c9bcc2' }} />
      </div>
      <div className="ad-legend">
        <span><i style={{ background: '#2f9e6a' }} />{h.confirmed} confirmados</span>
        <span><i style={{ background: '#e0a93a' }} />{h.maybe} talvez</span>
        <span><i style={{ background: '#c9bcc2' }} />{h.waiting} sem resposta</span>
        <span>✕ {h.declined} recusaram</span>
        {h.freeKids > 0 && <span>🧸 {h.freeKids} crianças isentas (fora da conta)</span>}
      </div>
      <div className="ad-row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 800, color: h.free > 0 ? '#1d6b47' : h.free < 0 ? '#b3333b' : undefined }}>
          {h.free > 0 ? `${h.free} vagas livres` : h.free < 0 ? `${-h.free} acima do limite` : 'Lista completa'}
        </span>
        {h.free > 0 && h.reserves > 0 && (
          <button className="ad-btn sm" onClick={onReserves}>
            Chamar reserva ({h.reserves})
          </button>
        )}
      </div>
    </div>
  )
}

export default function Dashboard({ stats, settings, go, logs }: AdminCtx) {
  const t = stats.totals
  const recent = logs.slice(0, 6)
  return (
    <>
      <div className="ad-head">
        <h1>Painel</h1>
        <span style={{ color: 'var(--muted)', fontWeight: 700 }}>
          Festa em {shortDate(settings.dateISO)} · prazo de resposta {shortDate(settings.rsvpDeadlineISO)}
        </span>
      </div>

      {(stats.reminders.length > 0 || stats.notSent.length > 0) && (
        <div className="ad-note" style={{ marginBottom: 14, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {stats.reminders.length > 0 && <span>🔔 <b>{stats.reminders.length}</b> convites precisam de lembrete.</span>}
          {stats.notSent.length > 0 && <span>✉️ <b>{stats.notSent.length}</b> convites ainda não foram enviados.</span>}
          <button className="ad-btn sm primary" onClick={() => go('lembretes')}>Ver lembretes</button>
        </div>
      )}

      <div className="ad-grid" style={{ marginBottom: 14 }}>
        <Kpi n={t.payingConfirmed} l="Confirmados (pagantes)" s={`${t.confirmed} pessoas no total`} onClick={() => go('convites', 'yes')} />
        <Kpi n={t.paying} l="Contam no limite" s={`de ${t.cap} (${settings.capPerHost} + ${settings.capPerHost})`} />
        <Kpi n={t.pending + t.maybe} l="Aguardando resposta" s={`${t.maybe} disseram talvez`} onClick={() => go('convites', 'open')} />
        <Kpi n={t.declined} l="Não vão" onClick={() => go('convites', 'no')} />
        <Kpi n={stats.kidsGoing.length} l="Lembrancinhas" s={`crianças confirmadas · ${stats.kidsExpected.length} previstas`} onClick={() => go('criancas')} />
        <Kpi n={stats.kidsFree.length} l={`Crianças até ${settings.childFreeMaxAge} anos`} s="não pagam" onClick={() => go('criancas')} />
        <Kpi n={`${t.sent}/${t.invites}`} l="Convites enviados" onClick={() => go('lembretes')} />
        <Kpi n={t.reserves} l="Na reserva" onClick={() => go('convites', 'reserve')} />
      </div>

      <div className="ad-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: 14 }}>
        {stats.hosts.map((h) => (
          <HostCard key={h.host} h={h} onReserves={() => go('convites', `reserve:${h.host}`)} />
        ))}
      </div>

      <div className="ad-card">
        <div className="ad-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Últimas respostas</h3>
          <button className="ad-btn sm" onClick={() => go('historico')}>Ver tudo</button>
        </div>
        {recent.length === 0 && <div className="ad-empty">Ninguém respondeu ainda.</div>}
        {recent.map((l) => (
          <div key={l.id} className="ad-row" style={{ padding: '6px 0', borderTop: '1px solid var(--border)' }}>
            <span className={`ad-tag st-${l.status}`}>{{ yes: 'vai', no: 'não vai', maybe: 'talvez', pending: 'limpou' }[l.status]}</span>
            <b>{l.guestName}</b>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>
              por {l.by} · {l.at?.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
