// ============================================================
//  🔔 SERVICE WORKER — Loja Clube (PCT)
//  Offline + RECEÇÃO DE PUSH (balões Android/iPhone)
// ============================================================

var CACHE = 'loja-pct-v3';

// 🔧 SUBSTITUI pelo teu ONE SIGNAL APP ID (Settings → Keys & IDs)
var ONESIGNAL_APP_ID = 'COLA_AQUI_O_APP_ID';

self.addEventListener('install', function (e) {
  self.skipWaiting(); // ativa a versão nova imediatamente
});
self.addEventListener('activate', function (e) {
  // Limpa caches de versões antigas
  e.waitUntil(
    caches.keys().then(function (chaves) {
      return Promise.all(chaves.filter(function (c) { return c !== CACHE; })
        .map(function (c) { return caches.delete(c); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// 🔄 AUTO-ATUALIZAÇÃO: verifica se há SW novo a cada 60 minutos
setInterval(function () {
  self.registration.update().catch(function () {});
}, 60 * 60 * 1000);

self.addEventListener('fetch', function (e) {
  e.respondWith(fetch(e.request).catch(function () {
    return caches.match(e.request).then(function (r) {
      return r || new Response('Offline', { status: 503 });
    });
  }));
});

self.addEventListener('message', function (e) {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

// ============================================================
// 🔔 RECEBER PUSH (funciona mesmo com a app fechada)
// ============================================================

self.addEventListener('push', function (e) {
  var dados = {};
  try { dados = e.data ? e.data.json() : {}; } catch (err) { dados = {}; }

  // OneSignal manda os textos dentro de custom → pt/en
  var custom = (dados.custom || {});
  var titulo = (dados.headings && (dados.headings.pt || dados.headings.en)) || '';
  var corpo = (dados.contents && (dados.contents.pt || dados.contents.en)) || '';

  // Formato "notification" simples (se enviarmos direto do OneSignal)
  if (!titulo && dados.title) titulo = dados.title;
  if (!corpo && dados.body) corpo = dados.body;

  e.waitUntil(self.registration.showNotification(titulo || 'Patinagem Clube Tavira', {
    body: corpo,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [200, 100, 200],
    tag: custom.tag || undefined,
    data: { url: custom.url || dados.url || './' }
  }));
});

// Ao tocar no balão → abre a app/loja
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (lista) {
      // Se a loja já está aberta, foca-a
      for (var i = 0; i < lista.length; i++) {
        if (lista[i].url.indexOf('script.google.com') !== -1) { return lista[i].focus(); }
      }
      return clients.openWindow(url);
    })
  );
});
