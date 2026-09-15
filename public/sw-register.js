if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registered:', registration.scope);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New version available');
              if (confirm('Hay una nueva versión disponible. ¿Recargar?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error);
      });

    // Listen for controller change (new SW takes over)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed');
    });
  });
}

// Expose offline status for UI
window.__OFFLINE__ = !navigator.onLine;
window.addEventListener('online', () => { window.__OFFLINE__ = false; });
window.addEventListener('offline', () => { window.__OFFLINE__ = true; });