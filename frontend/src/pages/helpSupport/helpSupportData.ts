/**
 * Types and helpers for the Help & Support pages.
 * Data is fetched dynamically from the portalFaqURL endpoint.
 */

// ── UI types used by components ──────────────────────────────────────────────

export interface HelpCategory {
    title: string;
    description: string;
    faqCount: number;
    slug: string;
}

export interface FaqItem {
    question: string;
    answer: string;
}

export interface CategoryFaqData {
    title: string;
    faqs: FaqItem[];
}

// ── API response types ───────────────────────────────────────────────────────

export interface ApiFaqItem {
    topic: string;
    description: string;
}

export interface ApiFaqCategory {
    name: string;
    faqs: ApiFaqItem[];
    videos?: any[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a category name to a URL-friendly slug. */
export const slugify = (name: string): string =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");





/** Build the category card data from the API categories array. */
export const buildHelpCategories = (categories: ApiFaqCategory[]): HelpCategory[] =>
    categories.map((cat) => ({
        title: cat.name,
        description: "",
        faqCount: cat.faqs?.length ?? 0,
        slug: slugify(cat.name),
    }));

/** Build a slug → CategoryFaqData map for the detail page. */
export const buildCategoryFaqsMap = (
    categories: ApiFaqCategory[]
): Record<string, CategoryFaqData> => {
    const map: Record<string, CategoryFaqData> = {};
    for (const cat of categories) {
        const slug = slugify(cat.name);
        map[slug] = {
            title: `${cat.name} FAQs`,
            faqs: (cat.faqs ?? []).map((faq) => ({
                question: faq.topic,
                answer: faq.description,
            })),
        };
    }
    return map;
};


