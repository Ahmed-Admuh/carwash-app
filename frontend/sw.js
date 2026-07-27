// sw.js — deliberately minimal.
//
// A service worker with a fetch handler is one of the requirements
// browsers check before offering "Add to Home Screen" / PWA installation.
// This one intentionally does NOT cache anything — this app's data
// (bookings, prices, availability) changes constantly, and caching API
// responses here could easily show a customer stale slot availability or
// an out-of-date booking status. It just passes every request straight
// through to the network, unchanged.
//
// If real offline support is wanted later (e.g. caching the static
// shell — CSS/JS/logo — while always hitting the network for API data),
// that's a deliberate follow-up, not something to add casually.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
