
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
        if (!cat) return null;
        return {
            title: cat.name || "",
            description: cat.description || "",
            faqCount: Array.isArray(cat.faqs) ? cat.faqs.length : 0,
            slug: cat.id || slugify(cat.name || ""),
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
        map[slug] = {
            title: `${cat.name || "Unknown"} FAQs`,
            faqs: (Array.isArray(cat.faqs) ? cat.faqs : []).map((faq) => {
                if (!faq) return { question: "", answer: "" };
                return {
                    question: faq.topic || "",
                    answer: faq.description || "",
                };
            }),
        };
    }
    return map;
};


