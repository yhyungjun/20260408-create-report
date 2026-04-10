import { createHash } from 'crypto';
import type { ReportFields, ExtractMetadata } from './report-schema';

interface CachedResult {
  fields: ReportFields;
  metadata: ExtractMetadata;
  cachedAt: number;
}

const MAX_CACHE_SIZE = 50;
const cache = new Map<string, CachedResult>();

export function computeCacheKey(
  meetingNotes: string,
  surveyFields: Partial<ReportFields> | null,
): string {
  const payload = JSON.stringify({ meetingNotes, surveyFields });
  return createHash('sha256').update(payload).digest('hex');
}

export function getCached(key: string): CachedResult | undefined {
  return cache.get(key);
}

export function setCached(
  key: string,
  fields: ReportFields,
  metadata: ExtractMetadata,
): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value!;
    cache.delete(oldestKey);
  }
  cache.set(key, { fields, metadata, cachedAt: Date.now() });
}
