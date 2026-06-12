// ============================================================
// Sentry frontend - conditional initialization
// Activer : npm i @sentry/react puis ajouter VITE_SENTRY_DSN=...
// ============================================================
import { useEffect } from 'react';

let initialized = false;

export const initSentry = async () => {
  if (initialized) return;
  initialized = true;

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return; // no-op

  try {
    // Import dynamique via variable pour empecher Rollup/Vite d'analyser
    // statiquement le module au build (optional dependency).
    const moduleName = '@sentry/react';
    const Sentry = await import(/* @vite-ignore */ moduleName);
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
    });
    return Sentry;
  } catch {
    // @sentry/react non installe : silencieux
  }
};

// Erreurs UI runtime non capturees par les ErrorBoundary React
export const useGlobalErrorHandler = () => {
  useEffect(() => {
    const handler = (event) => {
      if (import.meta.env.DEV) console.error('[UI]', event.error || event.message);
    };
    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', handler);
    return () => {
      window.removeEventListener('error', handler);
      window.removeEventListener('unhandledrejection', handler);
    };
  }, []);
};
