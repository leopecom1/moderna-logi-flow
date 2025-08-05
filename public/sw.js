// Service Worker para notificaciones push
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Escuchar mensajes push
self.addEventListener('push', (event) => {
  console.log('Push message received:', event);

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Notificación', body: event.data?.text() || 'Nueva notificación' };
  }

  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: '/favicon.ico',
    badge: '/badge-icon.png',
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Descartar',
        icon: '/icons/dismiss.png'
      }
    ],
    requireInteraction: data.priority === 'high',
    silent: data.silent || false,
    tag: data.tag || 'default',
    timestamp: Date.now(),
    vibrate: data.vibrate || [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notificación', options)
  );
});

// Manejar clics en las notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Manejar diferentes tipos de notificaciones
  const data = event.notification.data;
  let url = '/';

  if (data.order_id) {
    url = `/orders/${data.order_id}`;
  } else if (data.delivery_id) {
    url = '/deliveries';
  } else if (data.route_id) {
    url = `/routes/${data.route_id}`;
  } else if (data.incident_id) {
    url = '/incidents';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Intentar enfocar una ventana existente
      for (const client of clientList) {
        if (client.url.includes(url.split('/')[1]) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Abrir nueva ventana si no hay ninguna abierta
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // Opcional: Enviar evento de tracking
  // analytics.track('notification_closed', event.notification.data);
});

// Sincronización en segundo plano
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event);
  
  if (event.tag === 'background-notification-sync') {
    event.waitUntil(
      // Sincronizar notificaciones pendientes
      syncPendingNotifications()
    );
  }
});

// Función para sincronizar notificaciones pendientes
async function syncPendingNotifications() {
  try {
    // Aquí se sincronizarían las notificaciones pendientes
    // cuando la conexión se restablezca
    console.log('Syncing pending notifications...');
  } catch (error) {
    console.error('Error syncing notifications:', error);
  }
}

// Manejar mensajes desde la aplicación principal
self.addEventListener('message', (event) => {
  console.log('Message received in SW:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(
      event.data.title,
      {
        body: event.data.body,
        icon: '/favicon.ico',
        data: event.data.data
      }
    );
  }
});