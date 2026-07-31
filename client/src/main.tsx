import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import QueryProvider from "./app/providers/QueryProvider";
import './styles/globals.css';
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryProvider>
        <App />
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
          }}
        />
    </QueryProvider>
  </React.StrictMode>,
);