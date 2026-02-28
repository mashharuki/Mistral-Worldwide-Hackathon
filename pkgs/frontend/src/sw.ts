/// <reference lib="WebWorker" />

export {};

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision?: string | null }>;
};

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// `injectManifest.injectionPoint` でこの値にプリキャッシュ対象が注入される。
const precacheManifest = self.__WB_MANIFEST;
void precacheManifest;
