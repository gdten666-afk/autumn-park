// lib/cache.ts — Simple LRU cache for hot photos
// Avoids repeated Turso round-trips for frequently accessed images

interface CacheEntry<T> {
  key: string;
  value: T;
  size: number;
  prev: string | null;
  next: string | null;
}

export class LRUCache<T> {
  private map = new Map<string, CacheEntry<T>>();
  private head: string | null = null;
  private tail: string | null = null;
  private currentSize = 0;

  constructor(private maxSize: number) {}

  get(key: string): T | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    this.moveToHead(entry);
    return entry.value;
  }

  set(key: string, value: T, size: number): void {
    // Evict until there's room
    while (this.currentSize + size > this.maxSize && this.tail) {
      const tail = this.map.get(this.tail);
      if (!tail) break;
      this.map.delete(tail.key);
      this.currentSize -= tail.size;
      this.tail = tail.prev;
      if (this.tail) {
        const prev = this.map.get(this.tail);
        if (prev) prev.next = null;
      }
    }

    // If item won't fit individually, don't cache it
    if (size > this.maxSize) return;

    // Remove existing entry with same key
    const existing = this.map.get(key);
    if (existing) {
      this.currentSize -= existing.size;
      this.removeNode(existing);
    }

    const entry: CacheEntry<T> = { key, value, size, prev: null, next: this.head };
    if (this.head) {
      const head = this.map.get(this.head);
      if (head) head.prev = key;
    }
    this.head = key;
    if (!this.tail) this.tail = key;
    this.map.set(key, entry);
    this.currentSize += size;
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  getStats() {
    return { entries: this.map.size, size: this.currentSize, max: this.maxSize };
  }

  delete(key: string): void {
    const entry = this.map.get(key);
    if (!entry) return;
    this.currentSize -= entry.size;
    this.removeNode(entry);
    this.map.delete(key);
  }

  private moveToHead(entry: CacheEntry<T>): void {
    if (entry.key === this.head) return;
    this.removeNode(entry);
    entry.prev = null;
    entry.next = this.head;
    if (this.head) {
      const head = this.map.get(this.head);
      if (head) head.prev = entry.key;
    }
    this.head = entry.key;
    if (!this.tail) this.tail = entry.key;
  }

  private removeNode(entry: CacheEntry<T>): void {
    if (entry.prev) {
      const prev = this.map.get(entry.prev);
      if (prev) prev.next = entry.next;
    }
    if (entry.next) {
      const next = this.map.get(entry.next);
      if (next) next.prev = entry.prev;
    }
    if (entry.key === this.head) this.head = entry.next;
    if (entry.key === this.tail) this.tail = entry.prev;
  }
}

// Global caches
// Full images: up to 200MB (about 20-30 photos)
export const fullImageCache = new LRUCache<any>(64 * 1024 * 1024);
// Thumbnails: up to 10MB (hundreds of photos — they're tiny)
export const thumbCache = new LRUCache<any>(10 * 1024 * 1024);

// --- Short-TTL cache for public JSON APIs ---
// 公开数据（照片列表/留言/统计/天气）在内存里缓存几秒到几十秒，
// 避免每个访客都跨洋打一次 Turso；写操作会主动失效。
interface TtlEntry {
  expires: number;
  value: unknown;
}

const ttlStore = new Map<string, TtlEntry>();

export function apiCacheGet<T>(key: string): T | undefined {
  const entry = ttlStore.get(key);
  if (!entry) return undefined;
  if (entry.expires < Date.now()) {
    ttlStore.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function apiCacheSet(key: string, value: unknown, ttlMs: number): void {
  if (ttlStore.size > 200) {
    const now = Date.now();
    for (const [k, v] of [...ttlStore]) {
      if (v.expires < now) ttlStore.delete(k);
    }
    if (ttlStore.size > 200) ttlStore.clear();
  }
  ttlStore.set(key, { expires: Date.now() + ttlMs, value });
}

export function apiCacheClear(prefix: string): void {
  for (const key of [...ttlStore.keys()]) {
    if (key.startsWith(prefix)) ttlStore.delete(key);
  }
}
