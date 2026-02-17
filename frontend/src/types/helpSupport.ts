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
