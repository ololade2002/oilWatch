import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Dashboard from './components/pages/Dashboard.jsx'
import Alerts from './components/pages/Alerts.jsx'
import Forecast from './components/pages/Forecast.jsx'
import HomePage from './components/pages/HomePage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* App acts as the parent layout & auth gate wrapper for everything */}
        <Route path="/" element={<App />}>
          
          <Route index element={<Navigate to="/home" replace />} />
          {/* These are the child pages that will load inside App's workspace wrapper */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="home" element={<HomePage />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="forecast" element={<Forecast />} />
        </Route>

        {/* Fallback: If they type a weird URL path, bounce them back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)