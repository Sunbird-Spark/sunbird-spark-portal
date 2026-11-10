import { getClient } from '../lib/http-client';
import type { EnrichmentObject } from '@/types/enrichmentTypes';

const LIST_PATH = '/object/enrichment/v4/list';
// The knowlg controller reads the filter from request.enrichmentObject.
const WRAPPER_KEY = 'enrichmentObject';
/** Longest the list may take. Callers treat it as optional (captions), so a slow or hung call must not hold the player. */
export const LIST_TIMEOUT_MS = 5000;

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Enrichment list timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

export class EnrichmentObjectService {
  /** Every non-Retired EnrichmentObject under `parentId`, optionally narrowed to one enrichmentObjectType. Rejects after LIST_TIMEOUT_MS. */
  public async list(parentId: string, enrichmentObjectType?: string): Promise<EnrichmentObject[]> {
    const res = await withTimeout(
      getClient().post<{ enrichmentObjects?: EnrichmentObject[] }>(LIST_PATH, {
        request: { [WRAPPER_KEY]: { parentId, ...(enrichmentObjectType ? { enrichmentObjectType } : {}) } },
      }),
      LIST_TIMEOUT_MS,
    );
    return res.data?.enrichmentObjects ?? [];
  }

  /** One call per type (the endpoint filters by a single type); results concatenated. */
  public async listForTypes(parentId: string, types: string[]): Promise<EnrichmentObject[]> {
    return (await Promise.all(types.map((type) => this.list(parentId, type)))).flat();
  }
}

export const enrichmentObjectService = new EnrichmentObjectService();
