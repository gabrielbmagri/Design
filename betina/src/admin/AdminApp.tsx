import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithPopup, signInWithRedirect, signOut, type User } from 'firebase/auth'
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { auth, db, firebaseConfigured } from '../lib/firebase'
import { guestsCol, invitesCol, logCol, watchSettings } from '../lib/data'
import { DEFAULT_SETTINGS } from '../lib/defaults'
import type { EventSettings, Guest, Host, Invite, RsvpLog } from '../lib/types'
import { computeStats } from './stats'
import Dashboard from './Dashboard'
import People from './People'
import Reserves from './Reserves'
import Access from './Access'
import Icon, { type IconName } from '../lib/Icon'
import { HOST_LABEL } from '../lib/types'
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

export type Tab = 'inicio' | 'convites' | 'pessoas' | 'reservas' | 'criancas' | 'lembretes' | 'historico' | 'festa' | 'acesso'

const NAV: { group: string; items: { id: Tab; icon: IconName; label: string }[] }[] = [
  { group: '', items: [{ id: 'inicio', icon: 'home', label: 'Visão geral' }] },
  {
    group: 'Convidados',
    items: [
      { id: 'convites', icon: 'mail', label: 'Convites' },
      { id: 'pessoas', icon: 'users', label: 'Pessoas' },
      { id: 'reservas', icon: 'inbox', label: 'Reservas' },
      { id: 'criancas', icon: 'baby', label: 'Crianças' },
    ],
  },
  {
    group: 'Comunicação',
    items: [
      { id: 'lembretes', icon: 'bell', label: 'Envios e lembretes' },
      { id: 'historico', icon: 'history', label: 'Histórico' },
    ],
  },
  {
    group: 'Configurações',
    items: [
      { id: 'festa', icon: 'settings', label: 'Festa' },
      { id: 'acesso', icon: 'shield', label: 'Acesso e backup' },
    ],
  },
]
const ALL = NAV.flatMap((g) => g.items)
const MOBILE: Tab[] = ['inicio', 'convites', 'lembretes', 'pessoas']

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
        <div className="ad-brand" style={{ padding: 0, justifyContent: 'center' }}>
          <span className="logo">1</span>
          <div style={{ textAlign: 'left' }}>
            <b>Betina · 1 ano</b>
            <small>Painel dos anfitriões</small>
          </div>
        </div>
        {!firebaseConfigured && <div className="ad-note">Firebase ainda não configurado (.env.local).</div>}
        <button className="ad-btn primary" style={{ justifyContent: 'center', height: 44 }} onClick={login}>
          Entrar com Google
        </button>
        {(error || msg) && <div className="ad-note">{error || msg}</div>}
      </div>
    </div>
  )
}

export default function AdminApp() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [allowed, setAllowed] = useState<boolean | undefined>(undefined)
  const [invites, setInvites] = useState<Invite[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [logs, setLogs] = useState<RsvpLog[]>([])
  const [admins, setAdmins] = useState<{ email: string; host?: Host }[]>([])
  const [settings, setSettings] = useState<EventSettings>(DEFAULT_SETTINGS)
  const [tab, setTab] = useState<Tab>('inicio')
  const [filter, setFilter] = useState('')
  const [more, setMore] = useState(false)

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
          <p style={{ margin: 0 }}>Peça para um administrador te adicionar em <b>Acesso e backup</b>.</p>
          <button className="ad-btn" onClick={() => signOut(auth)}>Sair</button>
        </div>
      </div>
    )

  const go = (t: Tab, f = '') => {
    setTab(t)
    setFilter(f)
    setMore(false)
    window.scrollTo({ top: 0 })
  }
  const myHost = admins.find((a) => a.email === user.email)?.host
  const ctx: AdminCtx = { user, invites, guests, logs, settings, stats, admins, myHost, go, filter }
  const badge: Partial<Record<Tab, number>> = {
    lembretes: stats.reminders.length + stats.notSent.length,
    criancas: stats.kidsNoAge.length,
  }
  const name = user.displayName?.split(' ')[0] || user.email?.split('@')[0] || ''
  const demo = import.meta.env.MODE === 'demo'
  const siteLink = demo ? (
    <button className="ad-nav" onClick={() => navigate('/')}><Icon name="external" size={18} /> Ver site</button>
  ) : (
    <a className="ad-nav" href="/" target="_blank" rel="noreferrer"><Icon name="external" size={18} /> Ver site</a>
  )

  const navButton = (t: (typeof ALL)[number]) => (
    <button key={t.id} className={`ad-nav ${tab === t.id ? 'on' : ''}`} onClick={() => go(t.id)}>
      <Icon name={t.icon} size={18} />
      {t.label}
      {!!badge[t.id] && <span className="badge">{badge[t.id]}</span>}
    </button>
  )

  return (
    <div className="ad">
      <aside className="ad-side">
        <div className="ad-brand">
          <span className="logo">1</span>
          <div>
            <b>Betina · 1 ano</b>
            <small>Painel dos anfitriões</small>
          </div>
        </div>
        {NAV.map((g) => (
          <div key={g.group} style={{ display: 'grid', gap: 2 }}>
            {g.group && <div className="ad-group">{g.group}</div>}
            {g.items.map(navButton)}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        {siteLink}
        <div className="ad-me">
          <span className="av">{name[0]?.toUpperCase()}</span>
          <div>
            <b>{name}</b>
            <small>{myHost ? `Convidados ${myHost === 'gabriel' ? 'do' : 'da'} ${HOST_LABEL[myHost]}` : 'Administrador'}</small>
          </div>
          <button className="ad-icon-btn" title="Sair" aria-label="Sair" onClick={() => signOut(auth)}>
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>

      <header className="ad-mobile-top">
        <div className="ad-brand" style={{ padding: 0 }}>
          <span className="logo" style={{ width: 30, height: 30, fontSize: 15 }}>1</span>
          <b>{ALL.find((t) => t.id === tab)?.label}</b>
        </div>
        <button className="ad-icon-btn" aria-label="Sair" onClick={() => signOut(auth)}>
          <Icon name="logout" size={18} />
        </button>
      </header>

      <main className="ad-main">
        {tab === 'inicio' && <Dashboard {...ctx} />}
        {tab === 'convites' && <Invites {...ctx} />}
        {tab === 'pessoas' && <People {...ctx} />}
        {tab === 'reservas' && <Reserves {...ctx} />}
        {tab === 'criancas' && <Kids {...ctx} />}
        {tab === 'lembretes' && <Reminders {...ctx} />}
        {tab === 'historico' && <History {...ctx} />}
        {tab === 'festa' && <SettingsView {...ctx} />}
        {tab === 'acesso' && <Access {...ctx} />}
      </main>

      <nav className="ad-mobile-nav">
        {MOBILE.map((id) => {
          const t = ALL.find((x) => x.id === id)!
          return (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => go(id)}>
              <Icon name={t.icon} size={20} />
              {id === 'lembretes' ? 'Lembretes' : id === 'inicio' ? 'Início' : t.label}
              {!!badge[id] && <i className="badge">{badge[id]}</i>}
            </button>
          )
        })}
        <button className={!MOBILE.includes(tab) ? 'on' : ''} onClick={() => setMore(true)}>
          <Icon name="menu" size={20} />
          Mais
        </button>
      </nav>

      {more && (
        <>
          <div className="ad-sheet-bg" onClick={() => setMore(false)} />
          <div className="ad-sheet">
            {NAV.map((g) => (
              <div key={g.group} style={{ display: 'grid', gap: 2 }}>
                {g.group && <div className="ad-group">{g.group}</div>}
                {g.items.map(navButton)}
              </div>
            ))}
            <div className="ad-group" />
            {siteLink}
          </div>
        </>
      )}
    </div>
  )
}
