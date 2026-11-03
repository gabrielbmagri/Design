import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { addDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { ensureGuestSession } from '../lib/firebase'
import { giftClaimsCol, giftsCol } from '../lib/data'
import { pixPayload } from '../lib/pix'
import type { EventSettings, GiftItem } from '../lib/types'
import { HOST_LABEL } from '../lib/types'
import Icon from '../lib/Icon'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const giftKey = (g: GiftItem, i: number) => g.id || `i${i}`

function savedName() {
  try {
    const raw = localStorage.getItem('convite.me')
    if (!raw) return ''
    const v = JSON.parse(raw) as { name?: string }
    return v.name ?? ''
  } catch {
    return ''
  }
}

/** Loja de presentes: itens físicos (um escolhe) e cotas via Pix. O dinheiro vai direto para a conta de quem recebe. */
export default function GiftShop({ settings }: { settings: EventSettings }) {
  const [claimed, setClaimed] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<{ item: GiftItem; key: string } | null>(null)
  useEffect(() => onSnapshot(giftClaimsCol, (s) => setClaimed(new Set(s.docs.map((d) => d.id))), () => undefined), [])

  const groups = useMemo(() => {
    const out: { name: string; items: { g: GiftItem; key: string }[] }[] = []
    settings.gifts.forEach((g, i) => {
      const name = g.group || ''
      let grp = out.find((x) => x.name === name)
      if (!grp) out.push((grp = { name, items: [] }))
      grp.items.push({ g, key: giftKey(g, i) })
    })
    return out
  }, [settings.gifts])

  return (
    <div className="im-gifts">
      {groups.map((grp) => (
        <div key={grp.name}>
          {grp.name && <h4 className="im-gift-group">{grp.name}</h4>}
          {grp.items.map(({ g, key }) => {
            const item = g.kind !== 'cota'
            const taken = item && claimed.has(key)
            return (
              <div className={`im-gift gs-gift ${taken ? 'taken' : ''}`} key={key}>
                <span className="im-icon"><Icon name="gift" size={18} /></span>
                <div style={{ flex: 1 }}>
                  <b>{g.title}</b>
                  {g.detail && <span>{g.detail}</span>}
                  {g.amount ? <span className="gs-amount">{brl(g.amount)}</span> : null}
                  {g.link && (
                    <div>
                      <a href={g.link} target="_blank" rel="noreferrer" style={{ color: 'var(--rose-deep)', fontWeight: 700, fontSize: 14 }}>Ver sugestão</a>
                    </div>
                  )}
                </div>
                <button className="g-btn sm gs-btn" disabled={taken} onClick={() => setOpen({ item: g, key })}>
                  {taken ? 'Já escolhido' : item ? 'Vou dar este' : g.amount ? 'Presentear' : 'Contribuir'}
                </button>
              </div>
            )
          })}
        </div>
      ))}
      <p className="gs-legal">
        Os presentes são uma doação voluntária aos anfitriões. O Pix vai direto para a conta deles; este site só mostra os dados e não processa nem guarda pagamentos.
      </p>
      {open && <GiftSheet settings={settings} item={open.item} itemKey={open.key} onClose={() => setOpen(null)} />}
    </div>
  )
}

function GiftSheet({ settings, item, itemKey, onClose }: { settings: EventSettings; item: GiftItem; itemKey: string; onClose: () => void }) {
  const isItem = item.kind !== 'cota'
  const [name, setName] = useState(savedName())
  const [anon, setAnon] = useState(false)
  const [msg, setMsg] = useState('')
  const [value, setValue] = useState(item.amount ? String(item.amount) : '')
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  const [state, setState] = useState<'form' | 'pix' | 'done' | 'busy' | 'error'>('form')
  const [err, setErr] = useState('')
  const amount = Number(value.replace(',', '.')) || 0
  const code = useMemo(
    () => (isItem ? '' : pixPayload({ key: settings.pix, name: settings.pixName || settings.hostAName, city: settings.pixCity, amount: amount > 0 ? amount : undefined })),
    [isItem, settings, amount],
  )
  useEffect(() => {
    if (state !== 'pix' || !code) return
    QRCode.toDataURL(code, { margin: 1, width: 300, errorCorrectionLevel: 'M' }).then(setQr).catch(() => setQr(''))
  }, [state, code])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* o campo abaixo permite copiar à mão */
    }
  }

  const finish = async () => {
    if (!name.trim() && !anon) return setErr('Diga quem está presenteando (ou marque "prefiro não aparecer").')
    setState('busy'); setErr('')
    try {
      await ensureGuestSession()
      if (isItem) await setDoc(doc(giftClaimsCol, itemKey), { at: serverTimestamp() })
      await addDoc(giftsCol, {
        itemId: itemKey,
        itemTitle: item.title.slice(0, 120),
        amount: isItem ? 0 : amount,
        from: (name.trim() || 'Convidado').slice(0, 80),
        message: msg.slice(0, 400),
        anonymous: anon,
        status: 'declared',
        at: serverTimestamp(),
      })
      setState('done')
    } catch {
      setErr(isItem ? 'Alguém acabou de escolher este presente. Escolha outro, por favor.' : 'Não foi possível avisar agora. Seu Pix continua válido; tente informar de novo em instantes.')
      setState('error')
    }
  }

  const noPix = !isItem && !settings.pix
  return (
    <div className="gs-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gs-sheet" role="dialog" aria-modal="true" aria-label={item.title}>
        <button className="gs-x" aria-label="Fechar" onClick={onClose}><Icon name="x" size={20} /></button>
        <h3>{item.title}</h3>

        {state === 'done' ? (
          <>
            <p className="gs-ok">Obrigado{name && !anon ? `, ${name.split(' ')[0]}` : ''}! 💗</p>
            <p>Avisamos {HOST_LABEL.gabriel} e {HOST_LABEL.luiza} do seu carinho. {isItem ? 'O presente ficou reservado para você.' : 'Assim que o Pix for conferido, eles agradecem de coração.'}</p>
            <button className="g-btn" onClick={onClose}>Fechar</button>
          </>
        ) : state === 'pix' ? (
          <>
            <p className="gs-who">Pix para <b>{settings.pixName || HOST_LABEL.gabriel}</b>{amount > 0 && <> · <b>{brl(amount)}</b></>}</p>
            {qr && <img className="gs-qr" src={qr} alt="QR Code do Pix" />}
            <button className="g-btn" onClick={copy}>{copied ? 'Código copiado ✓' : 'Copiar Pix copia e cola'}</button>
            <input className="g-input gs-code" readOnly value={code} onFocus={(e) => e.currentTarget.select()} aria-label="Pix copia e cola" />
            <p className="gs-hint">Abra o app do seu banco, escolha Pix → "Pix copia e cola" (ou leia o QR Code). Confira se o nome do recebedor é <b>{settings.pixName || 'dos anfitriões'}</b> antes de pagar.</p>
            <button className="g-btn outline" onClick={finish}>Já enviei o Pix</button>
            {err && <p className="gs-err">{err}</p>}
          </>
        ) : (
          <>
            {!isItem && !item.amount && (
              <label className="g-field"><span className="g-label">Valor (R$)</span>
                <input className="g-input" inputMode="decimal" placeholder="Ex.: 100" value={value} onChange={(e) => setValue(e.target.value)} />
              </label>
            )}
            {!isItem && item.amount ? <p className="gs-who">Valor: <b>{brl(item.amount)}</b></p> : null}
            <label className="g-field"><span className="g-label">Seu nome</span>
              <input className="g-input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="g-field"><span className="g-label">Recado (opcional)</span>
              <textarea className="g-input" rows={2} maxLength={400} value={msg} onChange={(e) => setMsg(e.target.value)} />
            </label>
            <label className="gs-check"><input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} /> Prefiro não aparecer na lista de presenteados</label>
            {err && <p className="gs-err">{err}</p>}
            {noPix ? (
              <p className="gs-err">Os anfitriões ainda não cadastraram a chave Pix.</p>
            ) : isItem ? (
              <button className="g-btn" onClick={finish} disabled={state === 'busy'}>{state === 'busy' ? 'Reservando…' : 'Reservar este presente'}</button>
            ) : (
              <button className="g-btn" disabled={amount <= 0} onClick={() => (name.trim() || anon ? setState('pix') : setErr('Diga quem está presenteando (ou marque "prefiro não aparecer").'))}>
                Continuar para o Pix
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
