import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './Root';
import { initInstall } from './career/install';
initInstall();
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
