import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MissionProvider } from './state/MissionContext'
import {installStaticPilot} from './data/staticPilot.js'
declare const __RASAD_LIMITED_DEMO__: boolean;
if(__RASAD_LIMITED_DEMO__)installStaticPilot();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MissionProvider><App /></MissionProvider>
  </StrictMode>,
)
