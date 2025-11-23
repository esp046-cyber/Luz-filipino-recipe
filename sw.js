/**
 * Service Worker for Filipino Recipe PWA
 * Provides offline functionality and caching strategies
 */

const CACHE_NAME = 'filipino-recipes-v3.0.0';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('🎌 Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('🎌 Service Worker: Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('🎌 Service Worker: Installation complete');
                return self.skipWaiting(); // Force activate immediately
            })
            .catch((error) => {
                console.error('🎌 Service Worker: Installation failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🎌 Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🎌 Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('🎌 Service Worker: Activation complete');
            return self.clients.claim(); // Take control of all pages
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip Chrome extension requests
    if (event.request.url.startsWith('chrome-extension://')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                if (response) {
                    console.log('🎌 Service Worker: Serving from cache', event.request.url);
                    return response;
                }
                
                console.log('🎌 Service Worker: Fetching from network', event.request.url);
                
                return fetch(event.request)
                    .then((response) => {
                        // Check if valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response
                        const responseToCache = response.clone();
                        
                        // Cache the fetched resource
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch((error) => {
                        console.error('🎌 Service Worker: Fetch failed', error);
                        
                        // Return offline page for navigation requests
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                        
                        // For other requests, return a simple offline response
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Background sync for future features
self.addEventListener('sync', (event) => {
    console.log('🎌 Service Worker: Background sync', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Perform background tasks when connection is restored
            console.log('🎌 Service Worker: Performing background sync')
        );
    }
});

// Push notifications (future feature)
self.addEventListener('push', (event) => {
    console.log('🎌 Service Worker: Push received', event);
    
    const options = {
        body: 'New Filipino recipes available!',
        icon: './icons/icon-192x192.png',
        badge: './icons/icon-96x96.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View Recipes',
                icon: './icons/icon-96x96.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: './icons/icon-96x96.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Filipino Recipes', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('🎌 Service Worker: Notification click received');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('./')
        );
    }
});

console.log('🎌 Service Worker: Filipino Recipe PWA loaded');