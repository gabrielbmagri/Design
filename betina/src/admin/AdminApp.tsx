import { useEffect, useMemo, useState } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithPopup, signInWithRedirect, signOut, type User } from 'firebase/auth'
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { auth, db, firebaseConfigured } from '../lib/firebase'
import { guestsCol, invitesCol, logCol, watchSettings } from '../lib/data'
import { DEFAULT_SETTINGS } from '../lib/defaults'
import type { EventSettings, Guest, Host, Invite, RsvpLog } from '../lib/types'
import { computeStats } from './stats'
import Dashboard from './Dashboard'
import Invites from './Invites'
import Reminders from './Reminders'
import Kids from './Kids'
import History from './History'
import SettingsView from './SettingsView'
import '../styles/admin.css'

export interface AdminCtx {
  user: User
  invites: Invite[]
  guests: Guest[]
  logs: RsvpLog[]
  settings: EventSettings
  stats: ReturnType<typeof computeStats>
  admins: { email: string; host?: Host }[]
  myHost?: Host
  go: (tab: Tab, filter?: string) => void
  filter: string
}

export type Tab = 'painel' | 'convites' | 'lembretes' | 'criancas' | 'historico' | 'festa'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'painel', icon: '📊', label: 'Painel' },
  { id: 'convites', icon: '💌', label: 'Convites' },
  { id: 'lembretes', icon: '🔔', label: 'Lembretes' },
  { id: 'criancas', icon: '🧸', label: 'Crianças' },
  { id: 'historico', icon: '🕓', label: 'Histórico' },
  { id: 'festa', icon: '⚙️', label: 'Festa' },
]

// Só nos testes locais com emulador: login falso de Google.
if (import.meta.env.VITE_USE_EMULATOR === '1')
  Object.assign(window, {
    __testLogin: (email: string) =>
      signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true }))),
  })

function Login({ error }: { error?: string }) {
  const [msg, setMsg] = useState('')
  const login = async () => {
    setMsg('')
    const p = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, p)
    } catch (e) {
      const code = (e as { code?: string }).code ?? ''
      if (code.includes('popup')) await signInWithRedirect(auth, p)
      else setMsg('Não foi possível entrar. ' + code)
    }
  }
  return (
    <div className="ad ad-login" style={{ display: 'grid' }}>
      <div className="ad-card" style={{ maxWidth: 380, textAlign: 'center', display: 'grid', gap: 14, padding: 28 }}>
        <div className="ad-brand" style={{ padding: 0 }}>
          Betina · 1 ano<small>Painel dos anfitriões</small>
        </div>
        {!firebaseConfigured && <div className="ad-note">Firebase ainda não configurado (.env.local).</div>}
        <button className="ad-btn primary" style={{ justifyContent: 'center', padding: 12 }} onClick={login}>
          Entrar com Google
        </button>
        {(error || msg) && <div className="ad-note">{error || msg}</div>}
      </div>
    </div>
  )
}

export default function AdminApp() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [allowed, setAllowed] = useState<boolean | undefined>(undefined)
  const [invites, setInvites] = useState<Invite[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [logs, setLogs] = useState<RsvpLog[]>([])
  const [admins, setAdmins] = useState<{ email: string; host?: Host }[]>([])
  const [settings, setSettings] = useState<EventSettings>(DEFAULT_SETTINGS)
  const [tab, setTab] = useState<Tab>('painel')
  const [filter, setFilter] = useState('')

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u && !u.isAnonymous ? u : null)), [])

  useEffect(() => {
    setAllowed(undefined)
    if (!user?.email) return
    getDoc(doc(db, 'admins', user.email))
      .then((d) => setAllowed(d.exists()))
      .catch(() => setAllowed(false))
  }, [user])

  useEffect(() => {
    if (!allowed) return
    const offs = [
      onSnapshot(invitesCol, (s) => setInvites(s.docs.map((d) => ({ id: d.id, memberPhones: {}, tags: [], ...d.data() }) as unknown as Invite))),
      onSnapshot(guestsCol, (s) => setGuests(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Guest))),
      onSnapshot(query(logCol, orderBy('at', 'desc'), limit(400)), (s) =>
        setLogs(s.docs.map((d) => ({ id: d.id, ...d.data() }) as RsvpLog)),
      ),
      onSnapshot(collection(db, 'admins'), (s) => setAdmins(s.docs.map((d) => ({ email: d.id, host: d.get('host') as Host | undefined })))),
      watchSettings(setSettings),
    ]
    return () => offs.forEach((f) => f())
  }, [allowed])

  const stats = useMemo(() => computeStats(invites, guests, settings), [invites, guests, settings])

  useEffect(() => {
    document.title = 'Painel · Betina'
  }, [])

  if (user === undefined) return <div className="ad ad-login">Carregando…</div>
  if (!user) return <Login />
  if (allowed === undefined) return <div className="ad ad-login">Verificando acesso…</div>
  if (!allowed)
    return (
      <div className="ad ad-login" style={{ display: 'grid' }}>
        <div className="ad-card" style={{ maxWidth: 420, display: 'grid', gap: 12 }}>
          <b>Sem acesso para {user.email}</b>
          <p style={{ margin: 0 }}>
            Peça para um administrador te adicionar em <b>Festa → Administradores</b>. No primeiro acesso, crie o
            documento <code>admins/{user.email}</code> no console do Firestore.
          </p>
          <button className="ad-btn" onClick={() => signOut(auth)}>
            Sair
          </button>
        </div>
      </div>
    )

  const go = (t: Tab, f = '') => {
    setTab(t)
    setFilter(f)
    window.scrollTo({ top: 0 })
  }
  const myHost = admins.find((a) => a.email === user.email)?.host
  const ctx: AdminCtx = { user, invites, guests, logs, settings, stats, admins, myHost, go, filter }
  const badge: Partial<Record<Tab, number>> = {
    lembretes: stats.reminders.length + stats.notSent.length,
    criancas: stats.kidsNoAge.length,
  }

  return (
    <div className="ad">
      <aside className="ad-side">
        <div className="ad-brand">
          Betina · 1 ano<small>Painel dos anfitriões</small>
        </div>
        {TABS.map((t) => (
          <button key={t.id} className={`ad-nav ${tab === t.id ? 'on' : ''}`} onClick={() => go(t.id)}>
            <span>{t.icon}</span>
            {t.label}
            {!!badge[t.id] && <span className="badge">{badge[t.id]}</span>}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <a className="ad-nav" href="/" target="_blank" rel="noreferrer">
          🌐 Ver site
        </a>
        <button className="ad-nav" onClick={() => signOut(auth)}>
          ↩ Sair <small style={{ marginLeft: 'auto', fontSize: 11 }}>{user.email?.split('@')[0]}</small>
        </button>
      </aside>
      <main className="ad-main">
        {tab === 'painel' && <Dashboard {...ctx} />}
        {tab === 'convites' && <Invites {...ctx} />}
        {tab === 'lembretes' && <Reminders {...ctx} />}
        {tab === 'criancas' && <Kids {...ctx} />}
        {tab === 'historico' && <History {...ctx} />}
        {tab === 'festa' && <SettingsView {...ctx} />}
      </main>
      <nav className="ad-mobile-nav">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => go(t.id)}>
            <span>{t.icon}</span>
            {t.label}
            {!!badge[t.id] && <i className="badge">{badge[t.id]}</i>}
          </button>
        ))}
      </nav>
    </div>
  )
}
