/* Service Worker - 图像编辑器
 * 策略：网络优先、缓存兜底（保证部署更新即时生效，离线时可用缓存）
 */
const CACHE_NAME = 'pstool-v2';
const CORE_ASSETS = [
	'/',
	'/editor',
	'/dist/bundle.js',
	'/manifest.json',
	'/images/manifest/icon-192x192.png',
	'/images/manifest/icon-512x512.png',
];

self.addEventListener('install', function (event) {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(function (cache) {
				return Promise.all(CORE_ASSETS.map(function (url) {
					return cache.add(url).catch(function () { /* 单个失败不阻塞安装 */ });
				}));
			})
			.then(function () { return self.skipWaiting(); })
	);
});

self.addEventListener('activate', function (event) {
	event.waitUntil(
		caches.keys()
			.then(function (keys) {
				return Promise.all(keys.filter(function (key) {
					return key !== CACHE_NAME;
				}).map(function (key) {
					return caches.delete(key);
				}));
			})
			.then(function () { return self.clients.claim(); })
	);
});

self.addEventListener('fetch', function (event) {
	var request = event.request;
	if (request.method !== 'GET') {
		return;
	}
	var url = new URL(request.url);
	if (url.origin !== location.origin) {
		return;
	}
	event.respondWith(
		fetch(request).then(function (response) {
			if (response && response.status === 200 && response.type === 'basic') {
				var copy = response.clone();
				caches.open(CACHE_NAME).then(function (cache) {
					cache.put(request, copy);
				});
			}
			return response;
		}).catch(function () {
			return caches.match(request, { ignoreSearch: true }).then(function (hit) {
				return hit || caches.match('/');
			});
		})
	);
});
