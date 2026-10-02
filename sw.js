
const CACHE_NAME = "castillo-luna-v1";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Instalar el servicio y guardar los archivos básicos
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
  );
});

// Activar el servicio y eliminar cachés antiguos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(nombres => {
      return Promise.all(
        nombres
          .filter(nombre => nombre !== CACHE_NAME)
          .map(nombre => caches.delete(nombre))
      );
    }).then(() => self.clients.claim())
  );
});

// Gestionar las peticiones
self.addEventListener("fetch", event => {
  const peticion = event.request;

  // Solo gestionar peticiones de la propia web
  if (new URL(peticion.url).origin !== self.location.origin) {
    return;
  }

  // Para la página principal, intentar primero la red
  if (peticion.mode === "navigate") {
    event.respondWith(
      fetch(peticion)
        .then(respuesta => {
          const copia = respuesta.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put("./index.html", copia));
          return respuesta;
        })
        .catch(() => {
          return caches.match("./index.html");
        })
    );
    return;
  }

  // Para el resto de archivos, utilizar la caché si está disponible
  event.respondWith(
    caches.match(peticion).then(respuesta => {
      return respuesta || fetch(peticion);
    })
  );
});

