import '@ant-design/v5-patch-for-react-19';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
import App from './App.tsx'

// zTools exposes the uTools-compatible API as `ztools`.
// Keep the rest of the renderer platform-agnostic by normalizing it once at startup.
const pluginWindow = window as typeof window & { ztools?: typeof window.utools }
if (!pluginWindow.utools && pluginWindow.ztools) {
  pluginWindow.utools = pluginWindow.ztools
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
