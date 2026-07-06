/* 별사탕 테트리스 - 서비스워커: 앱 설치 & 오프라인 실행 지원
   v2: index.html은 네트워크 우선 → 서버에 새 파일을 올리면 사용자가 다음 실행 때 바로 새 버전 수신 */
const CACHE="starcandy-v2";
const FILES=["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).catch(()=>{})); self.skipWaiting(); });
self.addEventListener("activate",e=>{ e.waitUntil(
  caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>clients.claim())
); });
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const url=new URL(e.request.url);
  const isPage = e.request.mode==="navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");
  if(isPage){ // 게임 본체: 네트워크 우선, 오프라인이면 캐시로 대체
    e.respondWith(
      fetch(e.request).then(res=>{ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{}); return res; })
      .catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html")))
    );
    return;
  }
  // 아이콘 등 정적 리소스: 캐시 우선
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
    const copy=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{}); return res;
  }).catch(()=>caches.match("./index.html"))));
});
