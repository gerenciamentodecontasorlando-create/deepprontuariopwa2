const CACHE_NAME = 'medsystem-v2.0';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
  'https://cdn.jsdelivr.net/npm/flatpickr',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de requisições
self.addEventListener('fetch', event => {
  // Ignora requisições para APIs externas
  if (event.request.url.includes('api.') || 
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('gstatic.com')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - retorna a resposta do cache
        if (response) {
          return response;
        }

        // Clona a requisição porque ela é um stream
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Verifica se recebemos uma resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clona a resposta porque ela é um stream
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              // Adiciona a resposta ao cache
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Fallback para offline
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
          
          // Fallback para ícones
          if (event.request.url.includes('fontawesome')) {
            return new Response('', { 
              headers: { 'Content-Type': 'text/css' } 
            });
          }
        });
      })
  );
});

// Sincronização em background
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Notificações push
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do MedSystem',
    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAEySURBVHgB7Zc9TsNAEIZnHKXkCCm5SA6Q0iVXyA1CipDR9yxv4PWm3Y89s7ZUiU+asP44DvwzXgkAAAAAAByRzHlv8WW8JC7o3OO29hJ7+4dE14nUjVb8ZPP73qj/L0D5ryu7R6X8ywKdZzwt2fl1Q0sXTgA+C6zA2Wdnpr+3d7Yl57/jBYKRFSyS1n9IwQpe31yP43CMfASeON/5KEL6Zy6gOX+SDn2nFKA5f5IOTZtSgOb8STq0tSkF6M+5n5QCOOd+UgrgnPtJKYBz7ielAM65n5QCOOd+UgrgnPtJKYBz7ielAM65n5QCOOd+UgrgnPtJKYBz7ielAM65n5QCOOd+UgrgnPtJKYBz7ielAM65n5QCOOd+UgrgnPtJKYBz7iUDAADwX0nZ53pYvLPcfQAAAABJRU5ErkJggg==',
    badge: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAEySURBVHgB7Zc9TsNAEIZnHKXkCCm5SA6Q0iVXyA1CipDR9yxv4PWm3Y89s7ZUiU+asP44DvwzXgkAAAAAAByRzHlv8WW8JC7o3OO29hJ7+4dE14nUjVb8ZPP73qj/L0D5ryu7R6X8ywKdZzwt2fl1Q0sXTgA+C6zA2Wdnpr+3d7Yl57/jBYKRFAwRFP8k8UvJPM/j0Uj6PwBEF2CW9/5KQY2P+HwEqBrqUKOdcAAAAASUVORK5CYII=',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir aplicativo'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('MedSystem', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        for (let client of windowClients) {
          if (client.url === './' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('./');
        }
      })
    );
  }
});

// Função de sincronização
function syncData() {
  // Aqui você implementaria a sincronização com um backend
  console.log('Sincronizando dados em background...');
  return Promise.resolve();
}

// Mensagens do cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
