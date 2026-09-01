import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import {initializeThemes} from './theme';
import './themes.css';
import './app-v2.css';
import './accessibility.css';
import './polish.css';

initializeThemes();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><ErrorBoundary><App/></ErrorBoundary></React.StrictMode>
);
