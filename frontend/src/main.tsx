import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
console.log('CLIENT ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log('ALL ENV:', import.meta.env);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
