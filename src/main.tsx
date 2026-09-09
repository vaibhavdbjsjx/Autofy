import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Lenis from 'lenis';
import App from './App';
import './index.css';
import { initNative } from './lib/native';

// Boot native (Capacitor) integrations — no-op in the browser.
initNative();

// Lenis owns the marketing site's document scroll. Dashboard content uses its
// own native viewport, which must be allowed to receive wheel and touch input.
const lenis = new Lenis({
  duration: 1.15,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  touchMultiplier: 1.5,
  prevent: (node: HTMLElement) => node.id === "dashboard-scroll-viewport",
});

function raf(time: number) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
