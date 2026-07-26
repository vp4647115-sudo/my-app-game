import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle benign HMR/WebSocket rejections in container sandbox environment
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason &&
    (event.reason.toString().includes('WebSocket') ||
      event.reason.toString().includes('vite'))
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

