// AutoParts Hub ERP — Service Worker
// Caches static assets for offline support

const CACHE_NAME = 'autoparts-hub-v1';
const ASSETS_TO_CACHE = [
  './autoparts-hub.html',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install — cache assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(['./autoparts-hub.html']);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', function(event) {
  // Skip Supabase API calls — always need live data
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request).then(function(response) {
      // Cache successful responses
      if (response && response.status === 200) {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, cloned);
        });
      }
      return response;
    }).catch(function() {
      // Network failed — try cache
      return caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        // Offline fallback page
        return new Response(
          '<html><body style="font-family:Arial;text-align:center;padding:60px;background:#1a2744;color:#fff">' +
          '<h2>🔧 AutoParts Hub</h2>' +
          '<p>You are offline. Please check your internet connection.</p>' +
          '<p>Data requires internet to load from Supabase.</p>' +
          '<button onclick="location.reload()" style="padding:12px 24px;margin-top:20px;border:none;border-radius:8px;background:#185FA5;color:#fff;cursor:pointer;font-size:16px">Retry</button>' +
          '</body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      });
    })
  );
});
