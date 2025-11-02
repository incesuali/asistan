import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Rate limiting için basit bir cache
interface RateLimitCache {
  [key: string]: number[];
}

const rateLimitCache: RateLimitCache = {};

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 60,
  windowMs: number = 60000 // 1 dakika
): boolean {
  const now = Date.now();
  const requests = rateLimitCache[identifier] || [];

  // Eski istekleri temizle
  const recentRequests = requests.filter((timestamp) => now - timestamp < windowMs);

  if (recentRequests.length >= maxRequests) {
    return false; // Rate limit aşıldı
  }

  recentRequests.push(now);
  rateLimitCache[identifier] = recentRequests;
  return true; // İstek kabul edildi
}

