import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle benign HMR/WebSocket rejections in container sandbox environment
window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason;
  const reasonStr = typeof reason === 'string' 
    ? reason 
    : (reason?.message || reason?.toString() || '');

  if (
    reasonStr.includes('WebSocket') ||
    reasonStr.includes('websocket') ||
    reasonStr.includes('vite') ||
    reasonStr.includes('ws://') ||
    reasonStr.includes('wss://')
  ) {
    event.preventDefault();
    event.stopPropagation();
  }
});

window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (msg.includes('WebSocket') || msg.includes('websocket') || msg.includes('vite')) {
    event.preventDefault();
    event.stopPropagation();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

