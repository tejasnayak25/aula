const CACHE_NAME = 'aula-cache-v1.0.2'; // Update cache name to reflect version change
const urlsToCache = [
    '/', 
    '/css/input.css', '/css/output.css', '/css/style.css',
    '/css/uicons-solid-rounded/css/uicons-solid-rounded.css', '/css/uicons-solid-rounded/webfonts/uicons-solid-rounded.woff2', '/css/uicons-solid-rounded/webfonts/uicons-solid-rounded.woff', '/css/uicons-solid-rounded/webfonts/uicons-solid-rounded.eot',
    '/css/uicons-bold-rounded/css/uicons-bold-rounded.css', '/css/uicons-bold-rounded/webfonts/uicons-bold-rounded.woff2', '/css/uicons-bold-rounded/webfonts/uicons-bold-rounded.woff', '/css/uicons-bold-rounded/webfonts/uicons-bold-rounded.eot',
    "/images/logo.png",
    'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js',
    'https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js',
    'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js',
    "/js/account.js","/js/utils.js"
];

// Install the service worker and cache initial assets
self.addEventListener('install', event => {
    self.skipWaiting(); // Activate new SW immediately
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event to serve cached content and cache new requests dynamically
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);
  
    // // Skip requests for JavaScript files
    // if (requestUrl.pathname.endsWith('.js')) {
    //     return;  // Don't handle or intercept JS files
    // }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return the response
                if (response) {
                    return response;
                }

                // Clone the request
                let fetchRequest = event.request.clone();

                return fetch(fetchRequest, {cache: "no-store"}).then(
                    response => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        return response;
                    }
                ).catch(err => {
                    console.log(err);
                });
            })
    );
});

// Activate event to update the service worker
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    return self.clients.claim(); // Take control of the clients immediately
});
