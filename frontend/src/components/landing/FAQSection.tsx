import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/landing/Accordion";
import faqImage from "@/assets/faq-image.svg";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useMemo } from "react";
import { useSystemSetting } from "@/hooks/useSystemSetting";
import { useFaqData } from "@/hooks/useFaqData";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

interface FAQ {
    title: string;
    description: string;
}

const FAQSection = () => {
    const { t, currentCode } = useAppI18n();

    // Fetch FAQ base URL
    const { data: settingResponse } = useSystemSetting("portalFaqURL");
    const faqUrl = settingResponse?.data?.response?.value || settingResponse?.data?.value;

    // Fetch FAQ data based on language
    const { data: faqData } = useFaqData(faqUrl, currentCode || 'en');

    // Extract FAQs from response
    const generalData = (faqData as any)?.general;
    const faqs: FAQ[] = Array.isArray(generalData) ? generalData : [];

    // Sanitize FAQs and filter out invalid entries
    const sanitizedFaqs = useMemo(() => {
        return faqs
            .filter(faq => faq.title && faq.description) // Filter out FAQs with empty title or description
            .map(faq => ({
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
