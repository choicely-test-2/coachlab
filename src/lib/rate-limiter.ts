// In-memory rate limiter for MVP
// Key: userId, Value: array of request timestamps
const store = new Map<string, number[]>();

const MAX_REQUESTS = 100; // max requests per window
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetAfter: number } {
  const now = Date.now();
  let requests = store.get(userId) || [];

  // Filter to only keep timestamps within the window
  requests = requests.filter(time => now - time < WINDOW_MS);

  const remaining = Math.max(0, MAX_REQUESTS - requests.length);
  const allowed = remaining > 0;

  if (allowed) {
    requests.push(now);
    store.set(userId, requests);
  }

  // Calculate when the oldest request will expire (reset time)
  const oldest = requests.length > 0 ? requests[0] : now;
  const resetAfter = Math.max(0, Math.ceil((oldest + WINDOW_MS - now) / 1000));

  return { allowed, remaining, resetAfter };
}

// Optional: periodically clean old entries to prevent memory bloat
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamps] of store.entries()) {
    const recent = timestamps.filter(t => now - t < WINDOW_MS);
    if (recent.length === 0) {
      store.delete(userId);
    } else if (recent.length < timestamps.length) {
      store.set(userId, recent);
    }
  }
}, 60_000); // every minute
