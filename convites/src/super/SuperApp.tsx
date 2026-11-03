import { useEffect, useMemo, useState } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithPopup, signInWithRedirect, signOut, type User } from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { auth, db, firebaseConfigured } from '../lib/firebase'
import Icon, { type IconName } from '../lib/Icon'
import { DEFAULT_OWNER, clientsCol, ownerSettingsRef, type Client, type OwnerSettings } from './model'
import { ClientsView, FinanceView, OverviewView, PipelineView, SettingsViewOwner, ThemesView } from './views'
import '../styles/admin.css'
import '../styles/super.css'

export interface SuperCtx {
  user: User
  clients: Client[]
  owner: OwnerSettings
  go: (t: Tab, filter?: string) => void
  filter: string
}

export type Tab = 'visao' | 'clientes' | 'funil' | 'financeiro' | 'temas' | 'config'
const NAV: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'visao', label: 'Visão geral', icon: 'home' },
  { id: 'clientes', label: 'Clientes', icon: 'users' },
  { id: 'funil', label: 'Funil de pedidos', icon: 'inbox' },
  { id: 'financeiro', label: 'Financeiro', icon: 'gift' },
  { id: 'temas', label: 'Temas', icon: 'sparkle' },
  { id: 'config', label: 'Configurações', icon: 'settings' },
]

// Só nos testes locais com emulador: login falso de Google.
if (import.meta.env.VITE_USE_EMULATOR === '1')
  Object.assign(window, {
    __testLoginOwner: (email: string) =>
      signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true }))),
  })

function Login() {
  const [msg, setMsg] = useState('')
  const login = async () => {
    const p = new GoogleAuthProvider()
    try { await signInWithPopup(auth, p) } catch (e) {
      const code = (e as { code?: string }).code ?? ''
      if (code.includes('popup')) await signInWithRedirect(auth, p)
      else setMsg('Não foi possível entrar. ' + code)
    }
  }
  return (
    <div className="ad ad-login" style={{ display: 'grid' }}>
      <div className="ad-card" style={{ maxWidth: 380, textAlign: 'center', display: 'grid', gap: 14, padding: 28 }}>
        <div className="ad-brand" style={{ padding: 0, justifyContent: 'center' }}>
          <span className="logo">★</span>
          <div style={{ textAlign: 'left' }}><b>Meu painel</b><small>Clientes, pedidos e financeiro</small></div>
        </div>
        {!firebaseConfigured && <div className="ad-note">Firebase ainda não configurado (.env.local).</div>}
        <button className="ad-btn primary" style={{ justifyContent: 'center', height: 44 }} onClick={login}>Entrar com Google</button>
        {msg && <div className="ad-note">{msg}</div>}
      </div>
    </div>
  )
}

export default function SuperApp() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [allowed, setAllowed] = useState<boolean | undefined>(undefined)
  const [clients, setClients] = useState<Client[]>([])
  const [owner, setOwner] = useState<OwnerSettings>(DEFAULT_OWNER)
  const [tab, setTab] = useState<Tab>('visao')
  const [filter, setFilter] = useState('')

  useEffect(() => { document.title = 'Meu painel · Convites' }, [])
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u && !u.isAnonymous ? u : null)), [])
  useEffect(() => {
    setAllowed(undefined)
    if (!user?.email) return
    getDoc(doc(db, 'owners', user.email)).then((d) => setAllowed(d.exists())).catch(() => setAllowed(false))
  }, [user])
  useEffect(() => {
    if (!allowed) return
    const offs = [
      onSnapshot(clientsCol, (s) => setClients(s.docs.map((d) => ({ id: d.id, payments: [], ...d.data() }) as unknown as Client))),
      onSnapshot(ownerSettingsRef, (s) => setOwner({ ...DEFAULT_OWNER, ...((s.data() as Partial<OwnerSettings>) ?? {}) })),
    ]
    return () => offs.forEach((f) => f())
  }, [allowed])
  const live = useMemo(() => clients.filter((c) => !c.archived), [clients])

  if (user === undefined) return <div className="ad ad-login">Carregando…</div>
  if (!user) return <Login />
  if (allowed === undefined) return <div className="ad ad-login">Verificando acesso…</div>
  if (!allowed)
    return (
      <div className="ad ad-login" style={{ display: 'grid' }}>
        <div className="ad-card" style={{ maxWidth: 420, display: 'grid', gap: 12 }}>
          <b>Este painel é só para o dono do produto ({user.email}).</b>
          <button className="ad-btn" onClick={() => signOut(auth)}>Sair</button>
        </div>
      </div>
    )

  const go = (t: Tab, f = '') => { setTab(t); setFilter(f); window.scrollTo({ top: 0 }) }
  const ctx: SuperCtx = { user, clients: live, owner, go, filter }
  const name = user.displayName?.split(' ')[0] || user.email?.split('@')[0] || ''
  return (
    <div className="ad">
      <aside className="ad-side">
        <div className="ad-brand"><span className="logo">★</span><div><b>Meu painel</b><small>Convites digitais</small></div></div>
        {NAV.map((t) => (
          <button key={t.id} className={`ad-nav ${tab === t.id ? 'on' : ''}`} onClick={() => go(t.id)}>
            <Icon name={t.icon} size={18} /> {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div className="ad-me">
          <span className="av">{name[0]?.toUpperCase()}</span>
          <div><b>{name}</b><small>Dono</small></div>
          <button className="ad-icon-btn" title="Sair" aria-label="Sair" onClick={() => signOut(auth)}><Icon name="logout" size={18} /></button>
        </div>
      </aside>
      <header className="ad-mobile-top">
        <div className="ad-brand" style={{ padding: 0 }}><span className="logo" style={{ width: 30, height: 30, fontSize: 15 }}>★</span><b>{NAV.find((t) => t.id === tab)?.label}</b></div>
        <button className="ad-icon-btn" aria-label="Sair" onClick={() => signOut(auth)}><Icon name="logout" size={18} /></button>
      </header>
      <main className="ad-main">
        {tab === 'visao' && <OverviewView {...ctx} />}
        {tab === 'clientes' && <ClientsView {...ctx} />}
        {tab === 'funil' && <PipelineView {...ctx} />}
        {tab === 'financeiro' && <FinanceView {...ctx} />}
        {tab === 'temas' && <ThemesView {...ctx} />}
        {tab === 'config' && <SettingsViewOwner {...ctx} />}
      </main>
      <nav className="ad-mobile-nav">
        {NAV.slice(0, 4).map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => go(t.id)}><Icon name={t.icon} size={20} />{t.label.split(' ')[0]}</button>
        ))}
        <button className={tab === 'temas' || tab === 'config' ? 'on' : ''} onClick={() => go(tab === 'temas' ? 'config' : 'temas')}><Icon name="menu" size={20} />Mais</button>
      </nav>
    </div>
  )
}
