import '@telegram-apps/telegram-ui/dist/styles.css';
import './theme.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { mockEnvForDev } from './mockEnv.js';
import { init } from './init.js';
import { App } from './App.js';
import { EnvUnsupported } from './components/EnvUnsupported.js';

// Must run before init() so a browser launch has a mocked environment.
mockEnvForDev();

const container = document.getElementById('root');
if (!container) throw new Error('Root container #root not found');
const root = createRoot(container);

try {
  init(import.meta.env.DEV);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (err) {
  console.error('[tma-shop] init failed:', err);
  root.render(<EnvUnsupported detail={err instanceof Error ? err.message : String(err)} />);
}
