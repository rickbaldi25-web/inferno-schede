const CACHE_NAME = 'inferno-v1';

// Quando l'app viene installata, non fa nulla di speciale per ora
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Ascolta le richieste di rete per permettere l'installazione della PWA
self.addEventListener('fetch', (event) => {
    // Per ora lasciamo passare tutto normalmente
    event.respondWith(fetch(event.request));
});