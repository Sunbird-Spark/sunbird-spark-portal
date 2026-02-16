import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/landing/Accordion";
import faqImage from "@/assets/faq-image.svg";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useState, useEffect, useMemo } from "react";
import { SystemSettingService } from "@/services/SystemSettingService";
import axios from "axios";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

interface FAQ {
    title: string;
    description: string;
}

const DEFAULT_FAQS: FAQ[] = [
    {
        title: "What kind of courses are available on this platform?",
        description: "Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.",
    },
    {
        title: "What if I need help during the course?",
        description: "Our dedicated support team is available 24/7 to assist you. You can reach out through our help center, community forums, or contact us directly via email.",
    },
    {
        title: "Are the courses accredited or do they offer certification?",
        description: "Yes, many of our courses offer industry-recognized certifications upon completion. Check each course page for specific certification details.",
    },
    {
        title: "Can I learn in offline mode?",
        description: "Absolutely! Our mobile app allows you to download course content and learn offline at your convenience.",
    },
    {
        title: "Who are the trainers?",
        description: "Our trainers are industry experts with years of practical experience and are carefully vetted.",
    },
];

const FAQSection = () => {
    const { t, currentCode } = useAppI18n();
    const [faqUrl, setFaqUrl] = useState<string>("");
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch FAQ base URL from API
    useEffect(() => {
        const fetchFaqUrl = async () => {
            try {
                const service = new SystemSettingService();
                const apiResponse = await service.read<any>("portalFaqURL");
                
                const faqUrlValue = apiResponse.data?.response?.value || apiResponse.data?.value;
                
                if (faqUrlValue) {
                    setFaqUrl(faqUrlValue);
                }
            } catch (error) {
                console.error("Failed to fetch FAQ URL:", error);
            }
        };
        fetchFaqUrl();
    }, []);

    // Fetch FAQ data based on language
    useEffect(() => {
        if (!faqUrl) return;

        const fetchFaqData = async () => {
            setIsLoading(true);
            const langCode = currentCode || 'en';
            
            try {
                // Fetch directly from blob storage
                const faqJsonUrl = `${faqUrl}/faq-${langCode}.json`;
                const response = await axios.get<any>(faqJsonUrl);
                
                // Read from the 'general' array which has title and description
                if (response.data?.general && Array.isArray(response.data.general)) {
                    setFaqs(response.data.general);
                }
            } catch (error) {
                // Fallback to English
                try {
                    const fallbackUrl = `${faqUrl}/faq-en.json`;
                    const response = await axios.get<any>(fallbackUrl);
                    
                    if (response.data?.general && Array.isArray(response.data.general)) {
                        setFaqs(response.data.general);
                    }
                } catch (fallbackError) {
                    console.error("Failed to fetch FAQ data:", fallbackError);
                    // Keep default FAQs
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchFaqData();
    }, [faqUrl, currentCode]);

    // Sanitize FAQs
    const sanitizedFaqs = useMemo(() => {
        return faqs.map(faq => ({
            title: faq.title,
            description: sanitizeHtml(faq.description),
        }));
    }, [faqs]);

    // Don't render the section if there are no FAQs
    if (sanitizedFaqs.length === 0) {
        return null;
    }

    return (
        <section className="bg-white pt-8 pb-8 lg:pt-[3.75rem] lg:pb-[3.75rem]">
            <div className="w-full px-4 lg:pl-[7.9375rem] lg:pr-[7.9375rem]">
                <h2 className="font-rubik font-medium text-[1.625rem] leading-[1.625rem] tracking-normal mb-6 text-foreground">
                    {t("faq.title")}
                </h2>

                <div className="grid lg:grid-cols-[1fr_auto] gap-10">
                    <Accordion
                        type="single"
                        collapsible
                        defaultValue="item-0"
                        className="flex flex-col gap-[1.25rem] pt-[0.9375rem]"
                    >
                        {sanitizedFaqs.map((faq, index) => (
                            <AccordionItem
                                key={index}
                                value={`item-${index}`}
                                className="rounded-[1rem] py-[1.1875rem] px-[1.25rem] border border-border/50 bg-white shadow-sm w-full"
                            >
                                <AccordionTrigger className="py-0 text-left font-rubik font-medium text-[1.125rem] leading-[100%] tracking-normal text-foreground hover:no-underline">
                                    {faq.title}
                                </AccordionTrigger>
                                <AccordionContent className="!pb-0 pt-5 font-rubik font-normal text-[1rem] leading-[1.625rem] tracking-normal text-[#757575]">
                                    <div dangerouslySetInnerHTML={{ __html: faq.description }} />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    <div className="hidden lg:block">
                        <div className="w-[23.125rem] h-[28rem] overflow-hidden rounded-[1.125rem]">
                            <img
                                src={faqImage}
                                alt="Student learning online"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
