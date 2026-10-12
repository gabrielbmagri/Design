// Firestore de mentira para a versão de demonstração: guarda tudo no navegador.
type Data = Record<string, unknown>

export class Timestamp {
  constructor(private ms: number) {}
  static now() {
    return new Timestamp(Date.now())
  }
  static fromMillis(ms: number) {
    return new Timestamp(ms)
  }
  toMillis() {
    return this.ms
  }
  toDate() {
    return new Date(this.ms)
  }
  toJSON() {
    return { __ts: this.ms }
  }
}

const KEY = 'betina-demo-db'
let mem: Record<string, Record<string, Data>> = {}

function revive(_k: string, v: unknown) {
  if (v && typeof v === 'object' && '__ts' in (v as object)) return new Timestamp((v as { __ts: number }).__ts)
  return v
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    mem = raw ? JSON.parse(raw, revive) : {}
  } catch {
    /* sem armazenamento: fica só na memória */
  }
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(mem))
  } catch {
    /* ignore */
  }
}
load()

export function __resetDemo() {
  mem = {}
  persist()
}
export function __isEmpty() {
  return !Object.keys(mem).length
}

const listeners = new Set<() => void>()
function notify() {
  persist()
  listeners.forEach((l) => l())
}
try {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      load()
      listeners.forEach((l) => l())
    }
  })
} catch {
  /* ignore */
}

// ---- referências ----
export interface ColRef { kind: 'col'; name: string }
export interface DocRef { kind: 'doc'; col: string; id: string }
type Constraint =
  | { t: 'where'; f: string; op: string; v: unknown }
  | { t: 'limit'; n: number }
  | { t: 'orderBy'; f: string; dir: 'asc' | 'desc' }
export interface Query { kind: 'query'; col: string; cs: Constraint[] }

const rid = () => Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12)

export function initializeFirestore() {
  return {}
}
export const persistentLocalCache = () => ({})
export const persistentMultipleTabManager = () => ({})
export const connectFirestoreEmulator = () => {}
export const getFirestore = () => ({})

export function collection(_db: unknown, name: string): ColRef {
  return { kind: 'col', name }
}

export function doc(a: unknown, b?: string, c?: string): DocRef {
  const ref = a as ColRef
  if (ref && ref.kind === 'col') return { kind: 'doc', col: ref.name, id: b ?? rid() }
  return { kind: 'doc', col: b!, id: c! }
}

export const where = (f: string, op: string, v: unknown): Constraint => ({ t: 'where', f, op, v })
export const limit = (n: number): Constraint => ({ t: 'limit', n })
export const orderBy = (f: string, dir: 'asc' | 'desc' = 'asc'): Constraint => ({ t: 'orderBy', f, dir })
export function query(col: ColRef, ...cs: Constraint[]): Query {
  return { kind: 'query', col: col.name, cs }
}

// ---- valores especiais ----
const SV = '__sv'
export const serverTimestamp = () => ({ [SV]: 'ts' })
export const increment = (n: number) => ({ [SV]: 'inc', n })
export const deleteField = () => ({ [SV]: 'del' })

function resolve(prev: Data | undefined, patch: Data) {
  const out: Data = { ...(prev ?? {}) }
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && SV in (v as object)) {
      const s = v as { __sv: string; n?: number }
      if (s.__sv === 'ts') out[k] = Timestamp.now()
      else if (s.__sv === 'inc') out[k] = (Number(out[k]) || 0) + (s.n ?? 0)
      else if (s.__sv === 'del') delete out[k]
    } else out[k] = v
  }
  return out
}

// ---- snapshots ----
function snap(col: string, id: string) {
  const d = mem[col]?.[id]
  return {
    id,
    ref: { kind: 'doc', col, id },
    exists: () => !!d,
    data: () => (d ? { ...d } : undefined),
    get: (f: string) => d?.[f],
  }
}

function run(q: Query | ColRef) {
  const col = q.kind === 'col' ? q.name : q.col
  const cs = q.kind === 'query' ? q.cs : []
  let ids = Object.keys(mem[col] ?? {})
  for (const c of cs) {
    if (c.t !== 'where') continue
    ids = ids.filter((id) => {
      const v = mem[col][id][c.f]
      if (c.op === '==') return v === c.v
      if (c.op === 'array-contains') return Array.isArray(v) && v.includes(c.v)
      return true
    })
  }
  for (const c of cs) {
    if (c.t !== 'orderBy') continue
    const val = (id: string) => {
      const v = mem[col][id][c.f]
      return v instanceof Timestamp ? v.toMillis() : (v as number)
    }
    ids.sort((a, b) => (val(a) > val(b) ? 1 : -1) * (c.dir === 'desc' ? -1 : 1))
  }
  const lim = cs.find((c) => c.t === 'limit') as { n: number } | undefined
  if (lim) ids = ids.slice(0, lim.n)
  const docs = ids.map((id) => snap(col, id))
  return { docs, empty: !docs.length, size: docs.length }
}

const tick = () => new Promise((r) => setTimeout(r, 120))

export async function getDoc(ref: DocRef) {
  await tick()
  return snap(ref.col, ref.id)
}
export async function getDocs(q: Query | ColRef) {
  await tick()
  return run(q)
}

export function onSnapshot(target: DocRef | Query | ColRef, cb: (s: never) => void) {
  const emit = () => cb((target.kind === 'doc' ? snap(target.col, target.id) : run(target)) as never)
  listeners.add(emit)
  setTimeout(emit, 0)
  return () => listeners.delete(emit)
}

// ---- escrita ----
function write(ref: DocRef, data: Data, mode: 'set' | 'merge' | 'update' | 'delete') {
  mem[ref.col] ??= {}
  const prev = mem[ref.col][ref.id]
  if (mode === 'delete') delete mem[ref.col][ref.id]
  else if (mode === 'update' && !prev) throw new Error('documento não existe')
  else mem[ref.col][ref.id] = resolve(mode === 'set' ? undefined : prev, data)
}

export async function setDoc(ref: DocRef, data: Data, opts?: { merge?: boolean }) {
  write(ref, data, opts?.merge ? 'merge' : 'set')
  notify()
}
export async function updateDoc(ref: DocRef, data: Data) {
  write(ref, data, 'update')
  notify()
}
export async function deleteDoc(ref: DocRef) {
  write(ref, {}, 'delete')
  notify()
}
export async function addDoc(col: ColRef, data: Data) {
  const ref = doc(col)
  write(ref, data, 'set')
  notify()
  return ref
}

export function writeBatch() {
  const ops: (() => void)[] = []
  const b = {
    set(ref: DocRef, data: Data, opts?: { merge?: boolean }) {
      ops.push(() => write(ref, data, opts?.merge ? 'merge' : 'set'))
      return b
    },
    update(ref: DocRef, data: Data) {
      ops.push(() => write(ref, data, 'update'))
      return b
    },
    delete(ref: DocRef) {
      ops.push(() => write(ref, {}, 'delete'))
      return b
    },
    async commit() {
      await tick()
      ops.forEach((o) => o())
      notify()
    },
  }
  return b
}
