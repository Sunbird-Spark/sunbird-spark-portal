
import {
    ApiFaqCategory,
    CategoryFaqData,
    HelpCategory,
} from "../types/helpSupport";

/** Convert a category name to a URL-friendly slug. */
export const slugify = (name: string): string => {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    if (!slug || slug.length === 0) {
        return name.trim().replace(/\s+/g, "-");
    }
    return slug;
};

/** Build the category card data from the API categories array. */
export const buildHelpCategories = (categories: ApiFaqCategory[]): HelpCategory[] => {
    if (!Array.isArray(categories)) return [];

    return categories.map((cat) => {
        if (!cat) {
            console.warn("buildHelpCategories: encountered null or undefined category, skipping.");
            return null;
        }
        const slug = cat.id || slugify(cat.name || "");
        if (!slug) {
            console.warn("buildHelpCategories: Skipping category with empty slug", cat);
            return null;
        }

        return {
            title: cat.name || "",
            description: cat.description || "",
            faqCount: Array.isArray(cat.faqs) ? cat.faqs.length : 0,
            slug,
        };
    }).filter((cat): cat is HelpCategory => cat !== null);
};

/** Build a slug → CategoryFaqData map for the detail page. */
export const buildCategoryFaqsMap = (
    categories: ApiFaqCategory[]
): Record<string, CategoryFaqData> => {
    const map: Record<string, CategoryFaqData> = {};
    if (!Array.isArray(categories)) return map;

    for (const cat of categories) {
        if (!cat) continue;
        const slug = cat.id || slugify(cat.name || "");
        if (!slug) {
            console.warn("Skipping category: Unable to generate slug (missing id and name)", cat);
            continue;
        }
        if (map[slug]) {
            console.warn(`Skipping duplicate category slug: "${slug}"`, cat);
            continue;
        }

        map[slug] = {
            title: `${cat.name || "Unknown"} FAQs`,
            faqs: (Array.isArray(cat.faqs) ? cat.faqs : [])
                .filter((faq) => !!faq)
                .map((faq) => ({
                    question: faq.topic || "",
                    answer: faq.description || "",
                })),
        };
    }
    return map;
};


