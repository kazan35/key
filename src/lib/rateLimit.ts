// Rate limiter simples em memória — funciona para a maioria dos casos no Vercel.
// Para escala maior, substitua por upstash/redis.

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

const store = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
  blockMs?: number; // tempo de bloqueio após exceder (progressivo)
}

export function rateLimit({ key, limit, windowMs, blockMs }: RateLimitOptions): {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
} {
  const now = Date.now();
  const entry = store.get(key);

  if (entry) {
    // Está bloqueado?
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return { allowed: false, remaining: 0, retryAfterMs: entry.blockedUntil - now };
    }

    // Reset da janela expirou?
    if (now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1 };
    }

    // Ainda na janela
    entry.count += 1;

    if (entry.count > limit) {
      // Bloqueio progressivo: multiplica por quantas vezes excedeu
      const times = Math.min(entry.count - limit, 5);
      const block = blockMs ? blockMs * times : windowMs;
      entry.blockedUntil = now + block;
      return { allowed: false, remaining: 0, retryAfterMs: block };
    }

    return { allowed: true, remaining: limit - entry.count };
  }

  // Primeira requisição
  store.set(key, { count: 1, resetAt: now + windowMs });
  return { allowed: true, remaining: limit - 1 };
}

// Limpa entradas expiradas periodicamente para não vazar memória
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (now > v.resetAt && (!v.blockedUntil || now > v.blockedUntil)) {
      store.delete(k);
    }
  }
}, 60_000);
