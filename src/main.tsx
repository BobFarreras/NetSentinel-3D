import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Importem els estils globals aquí perquè afectin a tota l'app
import './ui/styles/index.css'; 
import { I18nProvider } from './ui/i18n';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>,
);
