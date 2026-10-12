import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { findInvites, loadInvite, watchSettings, type InviteMatch } from '../lib/data'
import { DEFAULT_SETTINGS } from '../lib/defaults'
import { firebaseConfigured } from '../lib/firebase'
import type { EventSettings, Guest, Status } from '../lib/types'
import Welcome from './Welcome'
import Pick from './Pick'
import Rsvp from './Rsvp'
import Immersion from './Immersion'
import Hub from './Hub'
import '../styles/guest.css'

export type Step = 'welcome' | 'pick' | 'rsvp' | 'immersion' | 'hub'
export type Outcome = 'yes' | 'no' | 'maybe' | 'none'

const STORE = 'betina.me'

interface Saved {
  inviteId: string
  guestId: string
  name: string
}

function readSaved(): Saved | null {
  try {
    return JSON.parse(localStorage.getItem(STORE) || 'null')
  } catch {
    return null
  }
}

function writeSaved(s: Saved | null) {
  try {
    if (s) localStorage.setItem(STORE, JSON.stringify(s))
    else localStorage.removeItem(STORE)
  } catch {
    /* modo anônimo do navegador */
  }
}

export function outcomeOf(guests: { status: Status; isPlusOne?: boolean }[]): Outcome {
  const st = guests.filter((g) => !g.isPlusOne).map((g) => g.status)
  if (st.includes('yes')) return 'yes'
  if (st.length && st.every((s) => s === 'no')) return 'no'
  if (st.includes('maybe')) return 'maybe'
  return 'none'
}

export default function GuestApp() {
  const { inviteId: linkInvite } = useParams()
  const navigate = useNavigate()
  const [settings, setSettings] = useState<EventSettings>(DEFAULT_SETTINGS)
  const [step, setStep] = useState<Step>('welcome')
  const [matches, setMatches] = useState<InviteMatch[]>([])
  const [invite, setInvite] = useState<InviteMatch | null>(null)
  const [me, setMe] = useState<Guest | null>(null)
  const [saved, setSaved] = useState<Saved | null>(readSaved)
  const [outcome, setOutcome] = useState<Outcome>('none')
  const [hubSection, setHubSection] = useState('convite')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => watchSettings(setSettings), [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  // Link pessoal do convite (/c/<id>) → pula a busca por nome
  useEffect(() => {
    if (!linkInvite || !firebaseConfigured) return
    setBusy(true)
    loadInvite(linkInvite)
      .then((inv) => {
        if (inv) {
          setMatches([{ ...inv, matchedIds: inv.guests.map((g) => g.id) }])
          setStep('pick')
        }
      })
      .catch(() => setError('Não conseguimos abrir o convite. Digite seu nome abaixo.'))
      .finally(() => setBusy(false))
  }, [linkInvite])

  const search = useCallback(async (name: string) => {
    setError('')
    if (!firebaseConfigured) {
      setError('O site ainda está sendo configurado. Tente novamente mais tarde.')
      return
    }
    setBusy(true)
    try {
      const res = await findInvites(name)
      if (!res.length) {
        setError('Não encontramos esse nome. Tente só o primeiro nome, ou o nome e o sobrenome.')
        return
      }
      setMatches(res)
      setStep('pick')
    } catch {
      setError('Ops, a internet falhou. Confira a conexão e toque de novo.')
    } finally {
      setBusy(false)
    }
  }, [])

  const choose = (inv: InviteMatch, guest: Guest) => {
    setInvite(inv)
    setMe(guest)
    const s = { inviteId: inv.inviteId, guestId: guest.id, name: guest.name }
    writeSaved(s)
    setSaved(s)
    setStep('rsvp')
  }

  const continueSaved = async (to: Step = 'hub') => {
    if (!saved) return
    setBusy(true)
    setError('')
    try {
      const inv = await loadInvite(saved.inviteId)
      const g = inv?.guests.find((x) => x.id === saved.guestId)
      if (!inv || !g) {
        writeSaved(null)
        setSaved(null)
        setError('Não achamos mais seu convite. Digite seu nome, por favor.')
        return
      }
      setInvite(inv)
      setMe(g)
      setOutcome(outcomeOf(inv.guests))
      setStep(to)
    } catch {
      setError('Ops, a internet falhou. Confira a conexão e toque de novo.')
    } finally {
      setBusy(false)
    }
  }

  const forget = () => {
    writeSaved(null)
    setSaved(null)
    setInvite(null)
    setMe(null)
    setMatches([])
    if (linkInvite) navigate('/', { replace: true })
    setStep('welcome')
  }

  const afterRsvp = (inv: InviteMatch, o: Outcome) => {
    setInvite(inv)
    setMe(inv.guests.find((g) => g.id === me?.id) ?? me)
    setOutcome(o)
    setStep('immersion')
  }

  const openHub = (section = 'convite') => {
    setHubSection(section)
    setStep('hub')
  }

  const manageRsvp = () => {
    if (invite && me) setStep('rsvp')
    else if (saved) continueSaved('rsvp')
    else setStep('welcome')
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.35 }}
      >
        {step === 'welcome' && (
          <Welcome
            settings={settings}
            busy={busy}
            error={error}
            saved={saved}
            onSearch={search}
            onContinue={() => continueSaved('hub')}
            onForget={forget}
            onVisitor={() => {
              setOutcome('none')
              setStep('immersion')
            }}
          />
        )}
        {step === 'pick' && (
          <Pick
            matches={matches}
            onChoose={choose}
            onBack={() => {
              if (linkInvite) navigate('/', { replace: true })
              setStep('welcome')
            }}
          />
        )}
        {step === 'rsvp' && invite && me && (
          <Rsvp
            settings={settings}
            invite={invite}
            me={me}
            onDone={afterRsvp}
            onLater={() => {
              setOutcome(outcomeOf(invite.guests))
              setStep('immersion')
            }}
            onNotMe={forget}
          />
        )}
        {step === 'immersion' && (
          <Immersion settings={settings} outcome={outcome} me={me} invite={invite} onFinish={() => openHub()} />
        )}
        {step === 'hub' && (
          <Hub
            settings={settings}
            invite={invite}
            me={me}
            section={hubSection}
            onSection={setHubSection}
            onManage={manageRsvp}
            onReplay={() => setStep('immersion')}
            onExit={forget}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
