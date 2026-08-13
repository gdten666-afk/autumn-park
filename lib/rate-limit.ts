// lib/rate-limit.ts — small in-memory sliding-window rate limiter.
// Suitable for single-instance deployments (Fly/Render hobby); for multi-instance
// setups move this to an external store (Upstash/Redis).

const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function clientIp(req: Request): string {
  // 优先取可信代理（Fly/Render）注入的头，避免攻击者伪造 X-Forwarded-For 绕过限流。
  return (
    req.headers.get('fly-client-ip') ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}

// Periodically drop expired buckets so the map does not grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now >= bucket.reset) buckets.delete(key);
  }
}, 5 * 60_000).unref?.();
