import React from 'react';
import ReactDOM from 'react-dom';
import './static/css/application.css';
import App from './App';
// import reportWebVitals from './reportWebVitals';
import { StoreProvider } from "./store/StoreContext";

// Add this in your component file

ReactDOM.render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
