const C='pf-v2',F=['./','index.html','style.css','app.js','i18n.js','seed.js','manifest.webmanifest','lib/chart.js','lib/xlsx.js','lib/Vazirmatn-Regular.woff2','lib/Vazirmatn-Bold.woff2','icons/i192.png','icons/i512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request))));
