const CACHE_NAME = 'bokki-flashcard-v1'

// キャッシュする静的アセット
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// インストール時：静的アセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// フェッチ時の戦略
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // APIリクエスト（/api/）はネットワーク優先、失敗時はキャッシュ
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone))
          return res
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // 静的アセット・ページはキャッシュ優先、なければネットワーク
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((res) => {
        // GETリクエストのみキャッシュ
        if (event.request.method === 'GET' && res.status === 200) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone))
        }
        return res
      })
    })
  )
})
