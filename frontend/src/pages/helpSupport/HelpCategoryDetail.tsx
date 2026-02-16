import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeftLong } from "react-icons/fa6";
import { Sheet, SheetContent, SheetTitle } from "@/components/home/Sheet";
import Footer from "@/components/home/Footer";
import HomeSidebar from "@/components/home/HomeSidebar";
import PageLoader from "@/components/common/PageLoader";
import Header from "@/components/home/Header";

import { useIsMobile } from "@/hooks/use-mobile";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/landing/Accordion";

import SidebarCloseButton from "./SidebarCloseButton";
import { categoryFaqs } from "./helpSupportData";

import "../profile/profile.css";

const HelpCategoryDetail = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [activeNav, setActiveNav] = useState("help");
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<Record<number, "yes" | "no" | "submitted" | null>>({});
    const [feedbackText, setFeedbackText] = useState<Record<number, string>>({});

    useEffect(() => {
        setIsSidebarOpen(!isMobile);
    }, [isMobile]);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 400);
        return () => clearTimeout(timer);
    }, []);

    const resolvedCategory = categoryFaqs[categoryId || ""];
    if (!resolvedCategory && categoryId) {
        console.warn(
            `HelpCategoryDetail: Invalid categoryId "${categoryId}" provided, falling back to "course-certificates".`
        );
    }
    const category = (resolvedCategory || categoryFaqs["course-certificates"])!;

    const handleFeedback = (index: number, value: "yes" | "no") => {
        setFeedback((prev) => ({ ...prev, [index]: value }));
    };

    const handleSubmitFeedback = async (index: number) => {
        const wasHelpful = feedback[index] === "yes";
        const text = feedbackText[index] ?? "";

        try {
            await fetch("/api/help-support/feedback", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    categoryId,
                    questionIndex: index,
                    wasHelpful,
                    feedbackText: text,
                }),
            });
        } catch (error) {
            console.error("Failed to submit help category feedback", error);
        } finally {
            setFeedback((prev) => ({ ...prev, [index]: "submitted" }));
            setFeedbackText((prev) => ({ ...prev, [index]: "" }));
        }
    };

    if (isLoading) return <PageLoader message="Loading..." />;

    return (
        <div className="profile-container">
            {/* Top Header */}
            <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(true)} />

            <div className="flex flex-1 relative transition-all">
                {/* Sidebar - Mobile */}
                {isMobile ? (
                    <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                        <SheetContent side="left" className="w-[17.5rem] pt-[2.5rem] px-0 pb-0">
                            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                            <HomeSidebar
                                activeNav={activeNav}
                                onNavChange={(nav) => {
                                    setActiveNav(nav);
                                    setIsSidebarOpen(false);
                                }}
                            />
                        </SheetContent>
                    </Sheet>
                ) : (
                    /* Sidebar - Desktop */
                    <div className="relative shrink-0 sticky top-[4.5rem] self-start z-[20]">
                        {isSidebarOpen && (
                            <>
                                <HomeSidebar activeNav={activeNav} onNavChange={setActiveNav} />
                                <SidebarCloseButton onClick={() => setIsSidebarOpen(false)} />
                            </>
                        )}
                    </div>
                )}

                {/* Main Content Area */}
                <main className="profile-main-content">
                    <div className="profile-content-wrapper">
                        {/* Header row */}
                        <div className="flex items-center justify-between mb-[2rem]">
                            <button
                                onClick={() => navigate("/help-support")}
                                className="flex items-center gap-[0.5rem] text-sunbird-brick font-medium font-['Rubik'] text-sm hover:opacity-80 transition-opacity"
                            >
                                <FaArrowLeftLong className="w-[1rem] h-[1rem]" />
                                Go Back
                            </button>
                            <button
                                className="w-[9.375rem] h-[2.25rem] bg-sunbird-brick text-sunbird-base-white text-sm font-medium font-['Rubik'] pl-[0.9375rem] pr-[0.875rem] py-[0.625rem] rounded-[0.625rem] hover:opacity-90 transition-opacity flex items-center justify-center"
                            >
                                Report an Issue
                            </button>
                        </div>

                        {/* Category Title */}
                        <h1 className="font-['Rubik'] font-medium text-[1.5rem] leading-[100%] tracking-[0%] text-foreground mb-[1.5rem] pt-[1.25rem]">
                            {category.title}
                        </h1>

                        {/* FAQ Accordion */}
                        <Accordion type="single" collapsible defaultValue="item-0" className="space-y-[0.75rem]">
                            {category.faqs.map((faq, index) => (
                                <AccordionItem
                                    key={index}
                                    value={`item-${index}`}
                                    className="rounded-[0.625rem] bg-sunbird-base-white border-b-0"
                                >
                                    <AccordionTrigger className="text-left font-['Rubik'] font-medium text-[1.125rem] leading-[100%] tracking-[0%] hover:no-underline py-[1rem] px-[1.25rem] text-foreground [&>svg]:text-sunbird-brick">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="font-['Rubik'] font-normal text-[1rem] leading-[1.625rem] tracking-[0%] pb-0 text-muted-foreground px-0">
                                        <p className="mb-[1rem] px-[1.25rem]">{faq.answer}</p>
                                        <div className="py-[0.625rem] border-sunbird-gray-e5 shadow-[0_-0.0625rem_0.25rem_rgba(0,0,0,0.06)] px-[1.25rem]">
                                            {/* Thank you state */}
                                            {(feedback[index] === "yes" || feedback[index] === "submitted") ? (
                                                <p className="text-sm font-medium text-sunbird-brick font-['Rubik'] py-[0.5rem]">
                                                    Thank you for your feedback!
                                                </p>
                                            ) : feedback[index] === "no" ? (
                                                /* Feedback form */
                                                <div className="py-[0.5rem] space-y-[0.75rem]">
                                                    <p className="text-sm font-semibold text-foreground font-['Rubik']">Sorry about that!</p>
                                                    <p className="text-sm font-semibold text-foreground font-['Rubik']">What more would you like to know?</p>
                                                    <textarea
                                                        placeholder="Type Here..."
                                                        value={feedbackText[index] || ""}
                                                        onChange={(e) => setFeedbackText((prev) => ({ ...prev, [index]: e.target.value }))}
                                                        className="w-full border border-sunbird-gray-d9 rounded-lg p-[0.75rem] text-sm font-['Rubik'] resize-none h-[5rem] focus:outline-none focus:border-sunbird-brick"
                                                        aria-label="Additional feedback about this answer"
                                                        aria-required="true"
                                                    />
                                                    <div className="flex justify-end">
                                                        <button
                                                            onClick={() => handleSubmitFeedback(index)}
                                                            disabled={!feedbackText[index]?.trim()}
                                                            className={`text-sunbird-base-white text-sm font-medium font-['Rubik'] px-[1.25rem] py-[0.5rem] rounded-[0.625rem] transition-all ${!feedbackText[index]?.trim()
                                                                ? "bg-sunbird-gray-75 opacity-50 cursor-not-allowed"
                                                                : "bg-sunbird-brick hover:opacity-90"
                                                                }`}
                                                        >
                                                            Submit feedback
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Default Yes/No buttons */
                                                <div className="flex items-center gap-[0.75rem]">
                                                    <span className="text-sm text-muted-foreground font-['Rubik']">Did this answer help you?</span>
                                                    <button
                                                        onClick={() => handleFeedback(index, "no")}
                                                        className="text-sm font-medium font-['Rubik'] text-sunbird-brick hover:opacity-80 transition-opacity"
                                                    >
                                                        No
                                                    </button>
                                                    <button
                                                        onClick={() => handleFeedback(index, "yes")}
                                                        className="text-sm font-medium font-['Rubik'] text-sunbird-brick hover:opacity-80 transition-opacity"
                                                    >
                                                        Yes
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </main>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default HelpCategoryDetail;
