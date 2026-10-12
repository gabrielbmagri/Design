import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth'
import { connectFirestoreEmulator, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const env = import.meta.env

export const firebaseConfigured = Boolean((env.VITE_FB_API_KEY && env.VITE_FB_PROJECT_ID) || env.VITE_USE_EMULATOR === '1' || env.MODE === 'demo')

export const app = initializeApp({
  apiKey: env.VITE_FB_API_KEY || 'missing',
  authDomain: env.VITE_FB_AUTH_DOMAIN,
  projectId: env.VITE_FB_PROJECT_ID || 'betina',
  storageBucket: env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FB_MESSAGING_SENDER_ID,
  appId: env.VITE_FB_APP_ID,
})

export const auth = getAuth(app)

// Cache local: se a internet do convidado oscilar, a resposta fica guardada
// no aparelho e é enviada sozinha quando a conexão voltar.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

if (env.VITE_USE_EMULATOR === '1') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

export const SITE_URL =
  env.MODE === 'demo'
    ? window.location.href.split('#')[0] + '#'
    : (env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '')

let anonPromise: Promise<unknown> | null = null
export function ensureGuestSession() {
  if (auth.currentUser) return Promise.resolve()
  anonPromise ??= signInAnonymously(auth).catch((e) => {
    anonPromise = null
    throw e
  })
  return anonPromise
}
