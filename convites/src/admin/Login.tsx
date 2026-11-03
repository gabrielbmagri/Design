import { useState } from 'react'
import { GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect } from 'firebase/auth'
import { auth, firebaseConfigured } from '../lib/firebase'
import { currentThemeEmoji } from './brand'

const MSG: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'Esse e-mail não parece certo.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco ou use "Esqueci a senha".',
  'auth/network-request-failed': 'Sem internet. Tente de novo.',
}

/** Entrada do painel do cliente: e-mail e senha (a primeira senha é provisória). */
export default function Login({ error }: { error?: string }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const enter = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(''); setInfo(''); setBusy(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pw)
    } catch (err) {
      const code = (err as { code?: string }).code ?? ''
      setMsg(MSG[code] ?? 'Não foi possível entrar. ' + code)
    } finally {
      setBusy(false)
    }
  }
  const forgot = async () => {
    setMsg(''); setInfo('')
    if (!email.includes('@')) return setMsg('Digite seu e-mail acima e toque em "Esqueci a senha".')
    try {
      await sendPasswordResetEmail(auth, email.trim())
    } catch { /* não revelamos se o e-mail existe */ }
    setInfo('Se esse e-mail tiver acesso, enviamos um link para criar uma nova senha.')
  }
  const google = async () => {
    setMsg('')
    const p = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, p)
    } catch (err) {
      const code = (err as { code?: string }).code ?? ''
      if (code.includes('popup')) await signInWithRedirect(auth, p)
      else setMsg('Não foi possível entrar. ' + code)
    }
  }
  return (
    <div className="ad ad-login" style={{ display: 'grid' }}>
      <form className="ad-card" onSubmit={enter} style={{ maxWidth: 380, width: '100%', display: 'grid', gap: 12, padding: 28 }}>
        <div className="ad-brand" style={{ padding: 0, justifyContent: 'center' }}>
          <span className="logo">{currentThemeEmoji()}</span>
          <div style={{ textAlign: 'left' }}>
            <b>Painel do convite</b>
            <small>Entre para acompanhar as confirmações</small>
          </div>
        </div>
        {!firebaseConfigured && <div className="ad-note">Firebase ainda não configurado (.env.local).</div>}
        <label className="ad-field"><span>E-mail</span>
          <input className="ad-input" type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="ad-field"><span>Senha</span>
          <input className="ad-input" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        </label>
        <button className="ad-btn primary" style={{ justifyContent: 'center', height: 44 }} disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        <button type="button" className="ad-btn sm" style={{ justifyContent: 'center' }} onClick={forgot}>Esqueci a senha</button>
        <button type="button" className="ad-btn sm" style={{ justifyContent: 'center' }} onClick={google}>Entrar com Google</button>
        {(error || msg) && <div className="ad-note">{error || msg}</div>}
        {info && <div className="ad-note">{info}</div>}
      </form>
    </div>
  )
}
