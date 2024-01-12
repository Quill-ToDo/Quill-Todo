import React from 'react';
import { createRoot } from 'react-dom/client';
import './components/DefaultHomeComponents/application.css';
import App from './components/DefaultHomeComponents/App';
// import reportWebVitals from './reportWebVitals';


const root = createRoot(document.getElementById('root')); // createRoot(container!) if you use TypeScript
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
root.render(<App tab="home" />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
