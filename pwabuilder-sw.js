self.addEventListener('install', (e) => {
  console.log('Service Worker: Installed');
});

self.addEventListener('fetch', (e) => {
  // Default: just fetch from network
  e.respondWith(fetch(e.request));
});