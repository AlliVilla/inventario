import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// NO TOCAR EL CÓDIGO DE ABAJO

// Registrar el Service Worker para hacer la app instalable como PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado:', registration.scope);
      })
      .catch(error => {
        console.log('Error al registrar Service Worker:', error);
      });
  });
}

// Detectar cuando el usuario puede instalar la PWA
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA lista para instalar');
});

window.addEventListener('appinstalled', () => {
  console.log('PWA instalada correctamente');
});
