import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiSearch, FiBell, FiChevronDown } from "react-icons/fi";
import { Input } from "@/components/common/Input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/common/DropdownMenu";
import { Sheet, SheetContent, SheetTitle } from "@/components/home/Sheet";
import Footer from "@/components/home/Footer";
import HomeSidebar from "@/components/home/HomeSidebar";
import PageLoader from "@/components/common/PageLoader";
import { useAppI18n, LanguageCode } from "@/hooks/useAppI18n";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/landing/Accordion";

import sunbirdLogo from "@/assets/sunbird-logo.svg";
import translationIcon from "@/assets/translation_icon.svg";
import "../profile/profile.css";

const categoryFaqs: Record<string, { title: string; faqs: { question: string; answer: string }[] }> = {
    login: {
        title: "Login FAQ's",
        faqs: [
            { question: "How do I create an account?", answer: "Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups." },
            { question: "I forgot my password. How can I reset it?", answer: "You can reset your password by clicking the 'Forgot Password' link on the login page. A reset link will be sent to your registered email address." },
            { question: "Can I log in using my social media accounts?", answer: "Yes, we support login via Google and other social media platforms. Look for the social login options on the sign-in page." },
            { question: "Why am I unable to log in?", answer: "Please ensure your credentials are correct. If you continue to face issues, try clearing your browser cache or contact our support team." },
            { question: "How do I change my login email?", answer: "You can update your login email from the Profile settings page after logging in to your account." },
        ],
    },
    profile: {
        title: "Profile FAQ's",
        faqs: [
            { question: "How do I update my profile information?", answer: "Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups." },
            { question: "Can I change my profile picture?", answer: "Yes, navigate to your Profile page and click on the avatar/photo section to upload a new profile picture." },
            { question: "How do I update my phone number?", answer: "Go to Profile > Personal Information > Edit. Update your phone number and verify it using the OTP sent to the new number." },
            { question: "Is my personal information secure?", answer: "Absolutely. We use industry-standard encryption and security measures to protect all your personal data." },
            { question: "How do I delete my account?", answer: "To delete your account, please contact our support team through the Help and Support section. Account deletion is permanent and cannot be undone." },
        ],
    },
    "course-certificates": {
        title: "Course & Certificate FAQ's",
        faqs: [
            { question: "What kind of courses are available on this platform?", answer: "Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups." },
            { question: "What if I need help during the course?", answer: "Our dedicated support team is available 24/7 to assist you. You can reach out through our help center, community forums, or contact us directly via email." },
            { question: "Are the courses accredited or do they offer certification?", answer: "Yes, many of our courses offer industry-recognized certifications upon completion. Check each course page for specific certification details." },
            { question: "Can I learn in offline mode?", answer: "Absolutely! Our mobile app allows you to download course content and learn offline at your convenience. Perfect for learning on the go." },
            { question: "Who are the trainers?", answer: "Our trainers are industry experts with years of practical experience. Each trainer is carefully vetted to ensure high-quality instruction." },
        ],
    },
};

const HelpCategoryDetail = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { t, languages, currentCode, changeLanguage } = useAppI18n();
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

    const category = (categoryFaqs[categoryId || ""] || categoryFaqs["course-certificates"])!;

    const handleFeedback = (index: number, value: "yes" | "no") => {
        setFeedback((prev) => ({ ...prev, [index]: value }));
    };

    const handleSubmitFeedback = (index: number) => {
        setFeedback((prev) => ({ ...prev, [index]: "submitted" }));
        setFeedbackText((prev) => ({ ...prev, [index]: "" }));
    };

    if (isLoading) return <PageLoader message="Loading..." />;

    return (
        <div className="profile-container">
            {/* Top Header — same as Profile */}
            <header className={`profile-header ${isMobile ? 'mobile' : ''}`}>
                <div className="profile-header-container">
                    {/* Left: Sunbird Logo + Align with Sidebar */}
                    <div className={`profile-logo-container ${!isMobile && isSidebarOpen ? 'w-[13.25rem]' : 'w-auto'} ${isMobile ? 'pl-0' : 'pl-[1.875rem]'}`}>
                        {!isMobile && isSidebarOpen && (
                            <div className="w-full">
                                <img
                                    src={sunbirdLogo}
                                    alt="Sunbird"
                                    className="h-[2.4375rem] w-auto"
                                    style={{ height: '2.4375rem' }}
                                />
                            </div>
                        )}
                        {/* Sidebar Toggle */}
                        {isMobile ? (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="text-sunbird-brick hover:text-sunbird-brick/90 transition-colors p-1"
                                aria-label="Open Menu"
                            >
                                <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M1 7H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M1 13H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        ) : (
                            !isSidebarOpen && (
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="text-sunbird-brick hover:text-sunbird-brick/90 transition-colors p-1"
                                >
                                    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 1H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        <path d="M1 7H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        <path d="M1 13H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            )
                        )}
                    </div>

                    {/* Right: Search + Language */}
                    <div className="profile-header-actions">
                        {isMobile ? (
                            <button
                                onClick={() => navigate('/search')}
                                className="profile-search-btn-mobile"
                                aria-label="Search"
                            >
                                <FiSearch className="h-5 w-5" />
                            </button>
                        ) : (
                            <div
                                className="profile-search-container"
                                onClick={() => navigate('/search')}
                            >
                                <Input
                                    placeholder={t("header.search")}
                                    readOnly
                                    className="pl-4 pr-10 bg-white border-border focus:border-sunbird-ginger focus:ring-sunbird-ginger/20 rounded-[0.5625rem] h-[2.875rem] text-base cursor-pointer placeholder:text-sunbird-obsidian pointer-events-none"
                                />
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-sunbird-brick hover:text-sunbird-brick/80">
                                    <FiSearch className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        {/* Notifications */}
                        <button className="profile-action-btn" aria-label="Notifications">
                            <FiBell className="profile-action-icon" aria-hidden="true" />
                        </button>

                        {/* Language Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="profile-lang-btn">
                                    <img src={translationIcon} alt="Language" className="profile-action-icon" />
                                    <FiChevronDown className="w-4 h-4 text-sunbird-brick" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="profile-dropdown-content w-40">
                                {languages.map((lng) => (
                                    <DropdownMenuItem
                                        key={lng.code}
                                        className={`profile-dropdown-item ${currentCode === lng.code ? 'active' : ''}`}
                                        onSelect={() => changeLanguage(lng.code as LanguageCode)}
                                    >
                                        <span>{lng.label}</span>
                                        {currentCode === lng.code && (
                                            <div className="profile-dropdown-indicator" />
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                    </div>
                </div>
            </header>

            <div className="flex flex-1 relative transition-all">
                {/* Sidebar - Mobile */}
                {isMobile ? (
                    <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                        <SheetContent side="left" className="w-[17.5rem] pt-10 px-0 pb-0">
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
                    <div className="relative shrink-0 sticky top-[4.5rem] self-start z-20">
                        {isSidebarOpen && (
                            <>
                                <HomeSidebar activeNav={activeNav} onNavChange={setActiveNav} />
                                <div className="absolute -right-3 top-2 z-20">
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="w-6 h-6 bg-[#EFEFEF] rounded-full flex items-center justify-center shadow-sm text-sunbird-brick hover:opacity-80 transition-opacity"
                                    >
                                        <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Main Content Area */}
                <main className="profile-main-content">
                    <div className="profile-content-wrapper">
                        {/* Header row */}
                        <div className="flex items-center justify-between mb-8">
                            <button
                                onClick={() => navigate("/help-support")}
                                className="flex items-center gap-2 text-[#A85236] font-medium font-['Rubik'] text-sm hover:opacity-80 transition-opacity"
                            >
                                <FiArrowLeft className="w-4 h-4" />
                                Go Back
                            </button>
                            <button
                                className="bg-[#A85236] text-white text-sm font-medium font-['Rubik'] px-5 py-2.5 rounded-[10px] hover:opacity-90 transition-opacity"
                            >
                                Report an Issue
                            </button>
                        </div>

                        {/* Category Title */}
                        <h1 className="font-['Rubik'] font-medium text-[24px] leading-[100%] tracking-[0%] text-foreground mb-6">
                            {category.title}
                        </h1>

                        {/* FAQ Accordion */}
                        <Accordion type="single" collapsible defaultValue="item-0" className="space-y-3">
                            {category.faqs.map((faq, index) => (
                                <AccordionItem
                                    key={index}
                                    value={`item-${index}`}
                                    className="rounded-[10px] px-5 bg-white border-b-0"
                                >
                                    <AccordionTrigger className="text-left font-['Rubik'] font-medium text-[18px] leading-[100%] tracking-[0%] hover:no-underline py-4 text-foreground [&>svg]:text-[#A85236]">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="font-['Rubik'] font-normal text-[16px] leading-[26px] tracking-[0%] pb-2 text-muted-foreground">
                                        <p className="mb-4">{faq.answer}</p>
                                        <div className="py-[10px] border-t border-[hsl(0,0%,90%)] shadow-[0_-1px_4px_rgba(0,0,0,0.06)]">
                                            {/* Thank you state (Yes clicked or form submitted) */}
                                            {(feedback[index] === "yes" || feedback[index] === "submitted") ? (
                                                <p className="text-sm font-medium text-[#A85236] font-['Rubik'] py-2">
                                                    Thank you for your feedback!
                                                </p>
                                            ) : feedback[index] === "no" ? (
                                                /* No clicked — show feedback form */
                                                <div className="py-2 space-y-3">
                                                    <p className="text-sm font-semibold text-foreground font-['Rubik']">Sorry about that!</p>
                                                    <p className="text-sm font-semibold text-foreground font-['Rubik']">What more would you like to know?</p>
                                                    <textarea
                                                        placeholder="Type Here..."
                                                        value={feedbackText[index] || ""}
                                                        onChange={(e) => setFeedbackText((prev) => ({ ...prev, [index]: e.target.value }))}
                                                        className="w-full border border-[hsl(0,0%,83%)] rounded-lg p-3 text-sm font-['Rubik'] resize-none h-20 focus:outline-none focus:border-sunbird-brick"
                                                    />
                                                    <div className="flex justify-end">
                                                        <button
                                                            onClick={() => handleSubmitFeedback(index)}
                                                            className="bg-sunbird-brick text-white text-sm font-medium font-['Rubik'] px-5 py-2 rounded-[10px] hover:opacity-90 transition-opacity"
                                                        >
                                                            Submit feedback
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Default state — show Yes/No buttons */
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-muted-foreground font-['Rubik']">Did this answer help you?</span>
                                                    <button
                                                        onClick={() => handleFeedback(index, "no")}
                                                        className="text-sm font-medium font-['Rubik'] text-[#A85236] hover:opacity-80 transition-opacity"
                                                    >
                                                        No
                                                    </button>
                                                    <button
                                                        onClick={() => handleFeedback(index, "yes")}
                                                        className="text-sm font-medium font-['Rubik'] text-[#A85236] hover:opacity-80 transition-opacity"
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
