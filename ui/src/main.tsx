import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { XtermProvider } from './components/Xterm/Provider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <XtermProvider>
      <App />
    </XtermProvider>
  </StrictMode>,
)
