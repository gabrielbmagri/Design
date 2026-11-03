// Login de mentira para a demonstração.
export interface User {
  uid: string
  email: string | null
  displayName: string | null
  isAnonymous: boolean
}

const KEY = 'convite-demo-admin'
const ADMIN: User = { uid: 'demo-admin', email: 'demo@convite', displayName: 'Demonstração', isAnonymous: false }

const EMAIL_KEY = 'convite-demo-email'
const userFor = (email: string): User => ({ uid: 'demo-' + email, email, displayName: null, isAnonymous: false })

function savedUser(): User | null {
  try {
    const e = localStorage.getItem(EMAIL_KEY)
    if (e) return userFor(e)
    return localStorage.getItem(KEY) === '1' ? ADMIN : null
  } catch {
    return null
  }
}

const auth: { currentUser: User | null } = { currentUser: savedUser() ?? (/^#(admin|super)/.test(location.hash) ? ADMIN : null) }
const subs = new Set<(u: User | null) => void>()
const set = (u: User | null) => {
  auth.currentUser = u
  subs.forEach((s) => s(u))
}

export const getAuth = () => auth
/** Atalho da demonstração: entra direto nos painéis, sem clicar em "Entrar com Google". */
export function demoLogin() {
  try { localStorage.setItem(KEY, '1') } catch { /* ignore */ }
  set(ADMIN)
}
export const connectAuthEmulator = () => {}
export class GoogleAuthProvider {
  static credential() {
    return {}
  }
}
export function onAuthStateChanged(_a: unknown, cb: (u: User | null) => void) {
  subs.add(cb)
  setTimeout(() => cb(auth.currentUser), 0)
  return () => subs.delete(cb)
}
export async function signInAnonymously() {
  if (!auth.currentUser) set({ uid: 'demo-guest', email: null, displayName: null, isAnonymous: true })
  return { user: auth.currentUser }
}
export async function signInWithPopup() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    /* ignore */
  }
  set(ADMIN)
  return { user: ADMIN }
}
export const signInWithRedirect = signInWithPopup
export const signInWithCredential = signInWithPopup
// ---- e-mail e senha (na demonstração as senhas ficam no navegador) ----
const pwKey = (email: string) => 'convite-demo-pw:' + email.toLowerCase()
const DEMO_PASSWORD = 'Convite123'
const authErr = (code: string) => Object.assign(new Error(code), { code })
export async function signInWithEmailAndPassword(_a: unknown, email: string, password: string) {
  const e = email.trim().toLowerCase()
  let pw = DEMO_PASSWORD
  try { pw = localStorage.getItem(pwKey(e)) ?? DEMO_PASSWORD } catch { /* ignore */ }
  if (!e.includes('@') || password !== pw) throw authErr('auth/invalid-credential')
  try { localStorage.setItem(EMAIL_KEY, e) } catch { /* ignore */ }
  const u = userFor(e)
  set(u)
  return { user: u }
}
export async function updatePassword(user: User, password: string) {
  try { localStorage.setItem(pwKey(user.email ?? ''), password) } catch { /* ignore */ }
}
export async function sendPasswordResetEmail() {
  /* demonstração: não envia e-mail */
}

export async function signOut() {
  try {
    localStorage.removeItem(EMAIL_KEY)
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  set(null)
}
