import { createRoot } from 'react-dom/client';
import { SDKProvider } from '@telegram-apps/sdk-react';
import App from './App';

const root = createRoot(document.getElementById('root')!);

root.render(
  <SDKProvider>
    <App />
  </SDKProvider>
);