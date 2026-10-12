import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import GuestApp from './guest/GuestApp'
const AdminApp = React.lazy(() => import('./admin/AdminApp'))
import './styles/base.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<React.Suspense fallback={null}><AdminApp /></React.Suspense>} />
        <Route path="/c/:inviteId" element={<GuestApp />} />
        <Route path="*" element={<GuestApp />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
