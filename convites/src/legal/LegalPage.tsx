import { useNavigate } from 'react-router-dom'
import { LEGAL_TITLE, LegalBody, type LegalDoc } from './content'
import '../styles/legal.css'

export default function LegalPage({ doc }: { doc: LegalDoc }) {
  const nav = useNavigate()
  return (
    <main className="lg">
      <button className="lg-back" onClick={() => (history.length > 1 ? nav(-1) : nav('/'))}>← Voltar</button>
      <h1>{LEGAL_TITLE[doc]}</h1>
      <LegalBody doc={doc} />
    </main>
  )
}
