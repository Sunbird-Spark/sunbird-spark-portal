import { FrameworkService } from '../FrameworkService';

export interface FwCategoryDetail {
  code: string;
  label: string;
}

export interface FwCategoryMeta {
  contentFields: string;
  fwCategoryDetails: FwCategoryDetail[];
}

const frameworkService = new FrameworkService();

/**
 * Fetch framework categories and derive contentFields and fwCategoryDetails.
 * Returns empty defaults when framework is not provided or the fetch fails.
 */
export async function fetchFwCategoryMeta(
  framework: string | undefined
): Promise<FwCategoryMeta> {
  const empty: FwCategoryMeta = { contentFields: '', fwCategoryDetails: [] };

  if (!framework) return empty;

  try {
    const fwResponse = await frameworkService.read(framework);
    const categories = (fwResponse as any)?.data?.framework?.categories;
    if (!Array.isArray(categories)) return empty;

    const fwCategoryDetails: FwCategoryDetail[] = categories.map(
      (cat: any) => ({
        code: cat.code,
        label: cat.name,
      })
    );
    const contentFields = fwCategoryDetails.map((c) => c.code).join(',');

    return { contentFields, fwCategoryDetails };
  } catch (error) {
    console.warn('Failed to fetch framework categories:', error);
    return empty;
  }
}
