import { useState } from 'react'
import { signOut, updatePassword, type User } from 'firebase/auth'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth } from '../lib/firebase'
import { accountsCol } from '../lib/data'

/** Primeiro acesso: troca da senha provisória. */
export default function ChangePassword({ user, onDone }: { user: User; onDone: () => void }) {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    if (a.length < 8) return setMsg('A nova senha precisa ter pelo menos 8 caracteres.')
    if (!/[A-Za-z]/.test(a) || !/\d/.test(a)) return setMsg('Use letras e números na senha.')
    if (a.toLowerCase() === 'convite123') return setMsg('Escolha uma senha diferente da provisória.')
    if (a !== b) return setMsg('As duas senhas não são iguais.')
    setBusy(true)
    try {
      await updatePassword(user, a)
      await updateDoc(doc(accountsCol, user.email!), { mustChange: false, changedAt: serverTimestamp() })
      onDone()
    } catch (err) {
      const code = (err as { code?: string }).code ?? ''
      setMsg(code === 'auth/requires-recent-login' ? 'Por segurança, saia e entre de novo para trocar a senha.' : 'Não foi possível salvar. ' + code)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="ad ad-login" style={{ display: 'grid' }}>
      <form className="ad-card" onSubmit={save} style={{ maxWidth: 400, width: '100%', display: 'grid', gap: 12, padding: 28 }}>
        <b style={{ fontSize: 18 }}>Crie a sua senha</b>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
          Você entrou com a senha provisória. Escolha uma senha só sua para continuar ({user.email}).
        </p>
        <label className="ad-field"><span>Nova senha</span>
          <input className="ad-input" type="password" autoComplete="new-password" value={a} onChange={(e) => setA(e.target.value)} required />
        </label>
        <label className="ad-field"><span>Repita a nova senha</span>
          <input className="ad-input" type="password" autoComplete="new-password" value={b} onChange={(e) => setB(e.target.value)} required />
        </label>
        {msg && <div className="ad-note">{msg}</div>}
        <button className="ad-btn primary" style={{ justifyContent: 'center', height: 44 }} disabled={busy}>{busy ? 'Salvando…' : 'Salvar e entrar'}</button>
        <button type="button" className="ad-btn sm" style={{ justifyContent: 'center' }} onClick={() => signOut(auth)}>Sair</button>
      </form>
    </div>
  )
}
