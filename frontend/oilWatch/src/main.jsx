import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DataEntry from './components/pages/DataEntry.jsx'
import Forecast from './components/pages/Forecast.jsx'
import { Toaster } from "@/components/ui/sonner"
import Alerts from './components/pages/Alerts'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App/>
      <Routes>
        <Route path='/' element={<DataEntry/>}/>
        <Route path='/forecast' element={<Forecast/>}/>
        <Route path='/alerts' element={<Alerts/>} />       
      </Routes>
    </BrowserRouter>
    <Toaster richColors position="top-right" />
  </StrictMode>
)
