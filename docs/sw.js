var cacheName = 'wof_cache';
var appShellFiles = [
  '/wof.html',
  '/res/',
  '/res/BMJUA_otf.otf',
  '/res/favicon_16x16.png',
  '/res/favicon_32x32.png',
  '/res/128x128.png',
  '/res/144x144.png',
  '/res/152x152.png',
  '/res/192x192.png'
];

self.addEventListener('install', function(e) {
    console.log('[Service Worker] Install');
    e.waitUntil(
        caches.open(cacheName).then(function(cache) {
              console.log('[Service Worker] Caching all: app shell and content');
          return cache.addAll(appShellFiles);
        })
      );
    
});
