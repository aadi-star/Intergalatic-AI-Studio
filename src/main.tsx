import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully handle benign HMR websocket connection warnings in sandboxed preview environments
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason || '');
    if (msg.toLowerCase().includes('websocket') || msg.toLowerCase().includes('vite')) {
      event.preventDefault();
      console.debug('⚡ Suppressed benign sandboxed socket rejection:', msg);
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (msg.toLowerCase().includes('websocket') || msg.toLowerCase().includes('vite')) {
      event.preventDefault();
      console.debug('⚡ Suppressed benign sandboxed socket error:', msg);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
