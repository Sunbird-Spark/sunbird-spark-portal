import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/index/Accordion";
import faqImage from "@/assets/faq-image.svg";
import { useAppI18n } from "@/hooks/useAppI18n";

const FAQSection = () => {
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
        <section className="bg-white pt-[60px] pb-[60px]">
            <div className="w-full pl-[127px] pr-[127px]">
                <h2 className="font-rubik font-medium text-[26px] leading-[100%] mb-6 text-foreground">
                    {t("faq.title")}
                </h2>

                {/* ✅ FAQ + IMAGE INSIDE SAME CONTAINER */}
                <div className="grid lg:grid-cols-[1fr_auto] gap-10 h-[448px]">

                    {/* FAQ */}
                    <Accordion
                        type="single"
                        collapsible
                        defaultValue="item-0"
                        className="flex flex-col gap-[20px] overflow-y-auto pt-[15px]"
                    >
                        {faqs.map((faq, index) => (
                            <AccordionItem
                                key={index}
                                value={`item-${index}`}
                                className="rounded-xl py-[19px] px-[20px] border border-border/50 bg-white shadow-sm w-[757px]"
                            >
                                <AccordionTrigger className="py-0 text-left font-rubik font-medium text-[18px] leading-[100%] text-foreground hover:no-underline">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="!pb-0 font-rubik font-normal text-[16px] leading-[26px] text-[#757575]">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    <div className="hidden lg:block">
                        <div className="w-[370px] h-[448px] overflow-hidden rounded-[18px]">
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
