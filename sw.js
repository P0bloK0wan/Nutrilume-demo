// Somente arquivos da demonstração. Contas e dados clínicos nunca usam cache offline.
const CACHE='nutrilume-demo-v3',FILES=['demo.html','app.js','icon-192.png','icon-512.png','logo.png','avatar-logo.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||!FILES.includes(u.pathname.split('/').pop()))return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});
