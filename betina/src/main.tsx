import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom'
import GuestApp from './guest/GuestApp'
const AdminApp = React.lazy(() => import('./admin/AdminApp'))
import './styles/base.css'

const DEMO = import.meta.env.MODE === 'demo'
// Na demonstração (página do claude.ai) o endereço não muda: #admin abre o painel.
const Router = DEMO
  ? ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={[location.hash === '#admin' ? '/admin' : '/']}>{children}</MemoryRouter>
    )
  : BrowserRouter
const DemoBar = React.lazy(() => import('./demo/DemoBar'))

async function start() {
  if (DEMO) {
    // a página de demonstração não mostra janelas de confirmação
    window.confirm = () => true
    await (await import('./demo/seed')).seedDemo()
  }
  ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      {DEMO && <React.Suspense fallback={null}><DemoBar /></React.Suspense>}
      <Routes>
        <Route path="/admin/*" element={<React.Suspense fallback={null}><AdminApp /></React.Suspense>} />
        <Route path="/c/:inviteId" element={<GuestApp />} />
        <Route path="*" element={<GuestApp />} />
      </Routes>
    </Router>
  </React.StrictMode>,
  )
}
start()
