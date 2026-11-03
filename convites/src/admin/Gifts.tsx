import { useState } from 'react'
import { deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import type { AdminCtx } from './AdminApp'
import { giftClaimsCol, giftsCol } from '../lib/data'
import type { Gift } from '../lib/types'
import Icon from '../lib/Icon'
import { download } from './ops'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const when = (g: Gift) => (g.at?.toDate ? g.at.toDate().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '')

export default function Gifts({ gifts, settings }: AdminCtx) {
  const [f, setF] = useState<'all' | 'declared' | 'confirmed'>('all')
  const list = [...gifts].filter((g) => f === 'all' || g.status === f).sort((a, b) => (b.at?.toMillis?.() ?? 0) - (a.at?.toMillis?.() ?? 0))
  const money = gifts.filter((g) => g.amount > 0)
  const sum = (st: Gift['status']) => money.filter((g) => g.status === st).reduce((s, g) => s + g.amount, 0)

  const confirm = (g: Gift, ok: boolean) =>
    updateDoc(doc(giftsCol, g.id), ok ? { status: 'confirmed', confirmedAt: serverTimestamp() } : { status: 'declared', confirmedAt: null })
  const remove = async (g: Gift) => {
    if (!confirm_('Apagar este registro? Se for um presente reservado, ele volta a ficar disponível.')) return
    await deleteDoc(doc(giftsCol, g.id))
    if (g.amount === 0) await deleteDoc(doc(giftClaimsCol, g.itemId)).catch(() => undefined)
  }
  const csv = () => {
    const rows = [['Data', 'Quem', 'Presente', 'Valor', 'Situação', 'Recado'], ...gifts.map((g) => [when(g), g.anonymous ? `${g.from} (não aparecer)` : g.from, g.itemTitle, String(g.amount), g.status === 'confirmed' ? 'Confirmado' : 'Informado', g.message])]
    download('presentes.csv', '﻿' + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n'), 'text/csv')
  }

  return (
    <>
      <div className="ad-head">
        <div>
          <h1>{settings.giftsTitle || 'Presentes'}</h1>
          <p>
            {settings.giftsEnabled
              ? 'O Pix cai direto na sua conta. Quando o convidado avisa que enviou, o presente aparece aqui para você conferir no banco e confirmar.'
              : 'A loja de presentes está desligada. Ative em Festa → Presentes.'}
          </p>
        </div>
        <button className="ad-btn" onClick={csv}><Icon name="download" size={16} /> Baixar planilha</button>
      </div>

      <div className="ad-kpis" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        <div className="ad-card ad-kpi"><span className="l">Confirmado</span><span className="n">{brl(sum('confirmed'))}</span></div>
        <div className="ad-card ad-kpi"><span className="l">Informado, a conferir</span><span className="n">{brl(sum('declared'))}</span></div>
        <div className="ad-card ad-kpi"><span className="l">Presentes</span><span className="n">{gifts.length}</span></div>
      </div>

      <div className="ad-filters" style={{ marginTop: 14 }}>
        {([['all', 'Todos'], ['declared', 'A conferir'], ['confirmed', 'Confirmados']] as const).map(([id, l]) => (
          <button key={id} className={`ad-chip ${f === id ? 'on' : ''}`} onClick={() => setF(id)}>{l}</button>
        ))}
      </div>

      <div className="ad-list">
        {list.length === 0 && <div className="ad-empty">Nenhum presente por aqui ainda.</div>}
        {list.map((g) => (
          <div className="ad-inv" key={g.id}>
            <div className="ad-inv-top">
              <b>{g.from}</b>
              {g.anonymous && <span className="ad-tag">não quer aparecer</span>}
              <span className={`ad-tag ${g.status === 'confirmed' ? '' : 'late'}`}>{g.status === 'confirmed' ? 'Confirmado' : 'A conferir'}</span>
              <span className="ad-meta">{when(g)}</span>
            </div>
            <div style={{ fontSize: 14 }}>
              {g.itemTitle} · <b>{g.amount > 0 ? brl(g.amount) : 'presente reservado'}</b>
            </div>
            {g.message && <div style={{ fontSize: 14, color: 'var(--muted)' }}>“{g.message}”</div>}
            <div className="ad-row">
              {g.status === 'declared' ? (
                <button className="ad-btn sm primary" onClick={() => confirm(g, true)}>{g.amount > 0 ? 'Pix recebido' : 'Confirmar'}</button>
              ) : (
                <button className="ad-btn sm" onClick={() => confirm(g, false)}>Desfazer</button>
              )}
              <button className="ad-btn sm" onClick={() => remove(g)}><Icon name="x" size={14} /> Apagar</button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// o painel da demonstração não mostra janelas; aqui usamos a mesma função do navegador
const confirm_ = (t: string) => window.confirm(t)
