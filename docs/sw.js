var cacheName = 'wof_cache';
var appShellFiles = [
  '/wof.html',
  '/wof_res/',
  '/wof_res/BMJUA_otf.otf',
  '/wof_res/favicon_16x16.png',
  '/wof_res/favicon_32x32.png',
  '/wof_res/128x128.png',
  '/wof_res/144x144.png',
  '/wof_res/152x152.png',
  '/wof_res/192x192.png'
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
