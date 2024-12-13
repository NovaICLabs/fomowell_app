import { AppThemeProvider } from './themes/AppThemeProvider';
import ReactDOM from 'react-dom/client';
// import 'babel-polyfill';
import { Provider } from 'react-redux';
import store from './app/store';
import React from 'react';
import App from './App';
import './main.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />,
  // <React.StrictMode>
  //   <Provider store={store}>
  //     <AppThemeProvider>
  //       <App />
  //     </AppThemeProvider>
  //   </Provider>
  // </React.StrictMode>,
);
