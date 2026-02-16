import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiSearch, FiBell, FiChevronDown } from "react-icons/fi";
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

const categories = [
    {
        title: "Login",
        description: "",
        faqCount: 10,
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
        faqCount: 26,
        slug: "course-certificates",
    },
];

const faqs = [
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

const HelpSupport = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { t, languages, currentCode, changeLanguage } = useAppI18n();
    const [activeNav, setActiveNav] = useState("help");
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsSidebarOpen(!isMobile);
    }, [isMobile]);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

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
                            <h1 className="font-['Rubik'] font-medium text-[24px] leading-[100%] tracking-[0%] text-foreground">
                                How can we assist you today?
                            </h1>
                            <button
                                className="bg-sunbird-brick text-white text-sm font-medium font-['Rubik'] px-5 py-2.5 rounded-[10px] hover:opacity-90 transition-opacity"
                            >
                                Report an Issue
                            </button>
                        </div>

                        {/* Category Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                            {categories.map((cat) => (
                                <div
                                    key={cat.title}
                                    onClick={() => navigate(`/help-support/${cat.slug}`)}
                                    className="bg-white rounded-[10px] overflow-hidden flex flex-col shadow-[2px_2px_20px_rgba(0,0,0,0.09)] hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="w-[32px] h-[12px] bg-[#CC8545] ml-[30px]" />
                                    <div className="px-5 pb-5 pt-6 flex flex-col flex-1">
                                        <h3 className="font-['Rubik'] font-medium text-[18px] leading-[100%] tracking-[0%] text-foreground mb-2">{cat.title}</h3>
                                        <p className="text-base text-foreground font-['Rubik'] leading-relaxed mb-4">
                                            {cat.description}
                                        </p>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="font-['Rubik'] font-normal text-[14px] leading-[26px] tracking-[0%] text-[#757575]">{cat.faqCount} FAQ's</span>
                                            <FiArrowRight className="w-5 h-5 text-[#A85236]" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Most Viewed FAQs */}
                        <h2 className="font-['Rubik'] font-medium text-[24px] leading-[100%] tracking-[0%] text-foreground mb-5">
                            Most Viewed FAQ's
                        </h2>

                        <Accordion type="single" collapsible defaultValue="item-0" className="space-y-3">
                            {faqs.map((faq, index) => (
                                <AccordionItem
                                    key={index}
                                    value={`item-${index}`}
                                    className="rounded-[10px] px-5 bg-white border-b-0"
                                >
                                    <AccordionTrigger className="text-left font-['Rubik'] font-medium text-[18px] leading-[100%] tracking-[0%] hover:no-underline py-4 text-foreground [&>svg]:text-[#A85236]">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="font-['Rubik'] font-normal text-[16px] leading-[26px] tracking-[0%] pb-4 text-muted-foreground">
                                        {faq.answer}
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

export default HelpSupport;
