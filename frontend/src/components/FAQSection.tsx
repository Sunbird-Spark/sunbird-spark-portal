import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/accordion";
import faqImage from "@/assets/faq-image.svg";
import { useAppI18n } from "@/hooks/useAppI18n";

type FAQSectionProps = {
    className?: string;
};

const FAQSection = ({ className }: FAQSectionProps) => {
    const { t } = useAppI18n();

    const faqs = [
        {
            question: "What kind of courses are available on this platform?",
            answer:
                "Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.",
        },
        {
            question: "What if I need help during the course?",
            answer:
                "Our dedicated support team is available 24/7 to assist you. You can reach out through our help center, community forums, or contact us directly via email.",
        },
        {
            question: "Are the courses accredited or do they offer certification?",
            answer:
                "Yes, many of our courses offer industry-recognized certifications upon completion. Check each course page for specific certification details.",
        },
        {
            question: "Can I learn in offline mode?",
            answer:
                "Absolutely! Our mobile app allows you to download course content and learn offline at your convenience.",
        },
        {
            question: "Who are the trainers?",
            answer:
                "Our trainers are industry experts with years of practical experience and are carefully vetted.",
        },
    ];

    return (
        <section className={`${className ? className : 'bg-white'} pt-2 pb-8`}>
            <div className="w-full pl-[6.75rem] pr-[5.125rem]">
                <h2 className={`${className ?? 'text-left'} text-xl md:text-2xl font-bold mb-6 text-foreground`} >
                    {t("faq.title")}
                </h2>

                {/* ✅ FAQ + IMAGE INSIDE SAME CONTAINER */}
                {/* vertically center the two columns so the image lines up with the accordion */}
                <div className="grid lg:grid-cols-[1fr_26.25rem] gap-10 items-center">

                    {/* FAQ */}
                    <Accordion
                        type="single"
                        collapsible
                        defaultValue="item-0"
                        className="space-y-3"
                    >
                        {faqs.map((faq, index) => (
                            <AccordionItem
                                key={index}
                                value={`item-${index}`}
                                className="rounded-xl px-5 border border-border/50 bg-white shadow-sm"
                            >
                                <AccordionTrigger className="py-4 text-left text-sm md:text-[0.9375rem] font-medium text-foreground hover:no-underline">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 text-[0.8125rem] leading-relaxed text-muted-foreground">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    <div className="hidden lg:flex items-center justify-center">
                        <div className="w-[28.125rem] aspect-square overflow-hidden rounded-[18px]">
                            <img
                                src={faqImage}
                                alt="Student learning online"
                                className="w-full h-full object-cover block"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
