import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PlayerView from './views/PlayerView'
import LedwallView from './views/LedwallView'
import AdminDashboard from './views/AdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="/app" element={<PlayerView />} />
        <Route path="/ledwall" element={<LedwallView />} />
        <Route path="/regia" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
