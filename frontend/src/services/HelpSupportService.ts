
import {
    ApiFaqCategory,
    CategoryFaqData,
    HelpCategory,
} from "../types/helpSupport";

/** Convert a category name to a URL-friendly slug. */
/** Convert a category name to a URL-friendly slug. */
export const slugify = (name: string): string => {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    if (!slug || slug.length === 0) {
        return name.trim().replace(/\s+/g, '-');
    }
    return slug;
};

/** Build the category card data from the API categories array. */
export const buildHelpCategories = (categories: ApiFaqCategory[]): HelpCategory[] =>
    categories.map((cat) => ({
        title: cat.name,
        description: cat.description || "",
        faqCount: cat.faqs?.length ?? 0,
        slug: cat.id || slugify(cat.name),
    }));

/** Build a slug → CategoryFaqData map for the detail page. */
export const buildCategoryFaqsMap = (
    categories: ApiFaqCategory[]
): Record<string, CategoryFaqData> => {
    const map: Record<string, CategoryFaqData> = {};
    for (const cat of categories) {
        const slug = cat.id || slugify(cat.name);
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


