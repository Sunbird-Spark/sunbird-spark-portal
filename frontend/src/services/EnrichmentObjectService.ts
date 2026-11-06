import { getClient } from '../lib/http-client';
import type { EnrichmentObject } from '@/types/enrichmentTypes';

const LIST_PATH = '/object/enrichment/v4/list';
// The knowlg controller reads the filter from request.enrichmentObject.
const WRAPPER_KEY = 'enrichmentObject';

export class EnrichmentObjectService {
  /** Every non-Retired EnrichmentObject under `parentId`, optionally narrowed to one enrichmentObjectType. */
  public async list(parentId: string, enrichmentObjectType?: string): Promise<EnrichmentObject[]> {
    const res = await getClient().post<{ enrichmentObjects?: EnrichmentObject[] }>(LIST_PATH, {
      request: { [WRAPPER_KEY]: { parentId, ...(enrichmentObjectType ? { enrichmentObjectType } : {}) } },
    });
    return res.data?.enrichmentObjects ?? [];
  }

  /** One call per type (the endpoint filters by a single type); results concatenated. */
  public async listForTypes(parentId: string, types: string[]): Promise<EnrichmentObject[]> {
    return (await Promise.all(types.map((type) => this.list(parentId, type)))).flat();
  }
}

export const enrichmentObjectService = new EnrichmentObjectService();
