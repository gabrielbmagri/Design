// Login de mentira para a demonstração.
export interface User {
  uid: string
  email: string | null
  displayName: string | null
  isAnonymous: boolean
}

const KEY = 'betina-demo-admin'
const ADMIN: User = { uid: 'demo-admin', email: 'demo@betina', displayName: 'Demonstração', isAnonymous: false }

function savedAdmin() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

const auth: { currentUser: User | null } = { currentUser: savedAdmin() ? ADMIN : null }
const subs = new Set<(u: User | null) => void>()
const set = (u: User | null) => {
  auth.currentUser = u
  subs.forEach((s) => s(u))
}

export const getAuth = () => auth
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
export async function signOut() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  set(null)
}
