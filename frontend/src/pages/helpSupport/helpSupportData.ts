/**
 * Static data for the Help & Support pages.
 */

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

/** Top-level help categories shown on the main Help & Support page. */
export const categories: HelpCategory[] = [
    {
        title: "Login",
        description: "",
        faqCount: 5,
        slug: "login",
    },
    {
        title: "Profile",
        description: "",
        faqCount: 5,
        slug: "profile",
    },
    {
        title: "Course & Certificates",
        description: "",
        faqCount: 5,
        slug: "course-certificates",
    },
];

/** Most-viewed FAQs shown on the main Help & Support page. */
export const faqs: FaqItem[] = [
    {
        question: "What kind of courses are available on this platform?",
        answer: "Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.",
    },
    {
        question: "What if I need help during the course?",
        answer: "Our dedicated support team is available 24/7 to assist you. You can reach out through our help center, community forums, or contact us directly via email.",
    },
    {
        question: "Are the courses accredited or do they offer certification?",
        answer: "Yes, many of our courses offer industry-recognized certifications upon completion. Check each course page for specific certification details.",
    },
    {
        question: "Can I learn in offline mode?",
        answer: "Absolutely! Our mobile app allows you to download course content and learn offline at your convenience. Perfect for learning on the go.",
    },
    {
        question: "Who are the trainers?",
        answer: "Our trainers are industry experts with years of practical experience. Each trainer is carefully vetted to ensure high-quality instruction.",
    },
];

/** Per-category FAQ data for the Help Category Detail page. */
export const categoryFaqs: Record<string, CategoryFaqData> = {
    login: {
        title: "Login FAQs",
        faqs: [
            { question: "How do I create an account?", answer: "Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups." },
            { question: "I forgot my password. How can I reset it?", answer: "You can reset your password by clicking the 'Forgot Password' link on the login page. A reset link will be sent to your registered email address." },
            { question: "Can I log in using my social media accounts?", answer: "Yes, we support login via Google and other social media platforms. Look for the social login options on the sign-in page." },
            { question: "Why am I unable to log in?", answer: "Please ensure your credentials are correct. If you continue to face issues, try clearing your browser cache or contact our support team." },
            { question: "How do I change my login email?", answer: "You can update your login email from the Profile settings page after logging in to your account." },
        ],
    },
    profile: {
        title: "Profile FAQs",
        faqs: [
            { question: "How do I update my profile information?", answer: "Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups." },
            { question: "Can I change my profile picture?", answer: "Yes, navigate to your Profile page and click on the avatar/photo section to upload a new profile picture." },
            { question: "How do I update my phone number?", answer: "Go to Profile > Personal Information > Edit. Update your phone number and verify it using the OTP sent to the new number." },
            { question: "Is my personal information secure?", answer: "Absolutely. We use industry-standard encryption and security measures to protect all your personal data." },
            { question: "How do I delete my account?", answer: "To delete your account, please contact our support team through the Help and Support section. Account deletion is permanent and cannot be undone." },
        ],
    },
    "course-certificates": {
        title: "Course & Certificate FAQs",
        faqs: [
            { question: "What kind of courses are available on this platform?", answer: "Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups." },
            { question: "What if I need help during the course?", answer: "Our dedicated support team is available 24/7 to assist you. You can reach out through our help center, community forums, or contact us directly via email." },
            { question: "Are the courses accredited or do they offer certification?", answer: "Yes, many of our courses offer industry-recognized certifications upon completion. Check each course page for specific certification details." },
            { question: "Can I learn in offline mode?", answer: "Absolutely! Our mobile app allows you to download course content and learn offline at your convenience. Perfect for learning on the go." },
            { question: "Who are the trainers?", answer: "Our trainers are industry experts with years of practical experience. Each trainer is carefully vetted to ensure high-quality instruction." },
        ],
    },
};
