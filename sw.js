// Spotlight Magazine - High Efficiency Media & Asset Service Worker
// Drastically reduces Supabase Storage egress bandwidth by caching images, panoramas, and assets locally.

const CACHE_NAME = 'spotlight-media-v1';
const STATIC_CACHE_NAME = 'spotlight-static-v1';

// Media domains and paths to cache aggressively
const MEDIA_PATTERNS = [
  'rcgtgmyiygdkbmbfspbo.supabase.co/storage/v1/object/public/',
  'images.unsplash.com',
  '/uploads/',
  'spotlight_logo'
];

self.addEventListener('install', (event) => {
  // Activate immediately without waiting
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== STATIC_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = request.url;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Check if this is a media asset from Supabase Storage, Unsplash, or local uploads
  const isMediaAsset = MEDIA_PATTERNS.some((pattern) => url.includes(pattern));
  const isRangeRequest = request.headers.has('range');

  if (isMediaAsset) {
    // For video range requests, pass through to network or let browser handle partial content
    if (isRangeRequest) {
      return;
    }

    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        // 1. Try local cache first (Cache-First strategy)
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // 2. Fetch from network, clone, and cache for all future visits
        try {
          const networkResponse = await fetch(request);
          // Only cache successful standard 200 responses
          if (networkResponse && networkResponse.status === 200) {
            // Store a clone in CacheStorage
            cache.put(request, networkResponse.clone()).catch((err) => {
              console.warn('[SW] Cache put failed:', err);
            });
          }
          return networkResponse;
        } catch (fetchErr) {
          // If network failed and we have any matching URL in cache
          const fallback = await cache.match(url);
          if (fallback) return fallback;
          throw fetchErr;
        }
      })
    );
    return;
  }

  // Static fonts, scripts, and stylesheets: Stale-While-Revalidate
  const isStatic = url.endsWith('.css') || url.endsWith('.js') || url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com');
  if (isStatic && !url.includes('server.js') && !url.includes('sw.js')) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            cache.put(request, networkRes.clone()).catch(() => {});
          }
          return networkRes;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
  }
});
