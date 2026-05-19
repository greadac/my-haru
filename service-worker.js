// ============================================================
// 나의 하루 - Service Worker
// ============================================================

const CACHE_NAME = 'my-haru-v1';

// 캐시할 파일 목록
const CACHE_FILES = [
  '/my-haru/',
  '/my-haru/index.html',
];

// ── 설치: 기본 파일 캐시 ──────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

// ── 활성화: 이전 캐시 삭제 ───────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── fetch: 네트워크 우선, 실패 시 캐시 ───────────────────
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Apps Script(Google) 요청은 캐시 없이 네트워크 직접 통신
  if (url.includes('script.google.com') || url.includes('googleapis.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 나머지: 네트워크 우선, 실패 시 캐시
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 정상 응답이면 캐시에도 저장
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
