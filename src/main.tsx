import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import {initializeThemes} from './theme';
import {initializeUsdDisplay} from './currency';
import './styles.css';
import './accessibility.css';
import './final-polish.css';
import './themes.css';
import './release-polish.css';
import './usd.css';
import './theme-layout.css';

initializeThemes();
initializeUsdDisplay();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><ErrorBoundary><App/></ErrorBoundary></React.StrictMode>
);
