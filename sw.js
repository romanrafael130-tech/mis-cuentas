// Mis Cuentas: permite abrir la app sin internet.
// Si cambias index.html, sube también este archivo cambiando el número de VERSION.
const VERSION = "mis-cuentas-v2";
const FILES = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Tipos de letra de Google: se guardan la primera vez para usarlos sin conexión
  if (url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.open(VERSION + "-fonts").then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }).catch(() => hit))));
    return;
  }
  if (url.origin !== location.origin) return;
  // La app: primero intenta internet (para tener siempre la última versión) y si no hay, usa la guardada
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; }
      // Si la web no responde bien (por ejemplo, error 404), abre la versión guardada en el móvil
      return caches.match(req).then(hit => hit || caches.match("index.html")).then(hit => hit || res);
    }).catch(() => caches.match(req).then(hit => hit || caches.match("index.html")))
  );
});
