import { useState, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useImpression from "@/hooks/useImpression";
import useInteract from "@/hooks/useInteract";
import { navigationHelperService } from "@/services/NavigationHelperService";
import { FaArrowLeftLong } from "react-icons/fa6";
import PageLoader from "@/components/common/PageLoader";
import { useHelpFaqData } from "@/hooks/useFaqData";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/landing/Accordion";

import { buildCategoryFaqsMap } from "../../services/HelpSupportService";
import { useSystemSetting } from "@/hooks/useSystemSetting";
import { useAppI18n } from "@/hooks/useAppI18n";

import "../profile/profile.css";
import ReportIssueDialog from "@/components/help/ReportIssueDialog";

const HelpCategoryDetail = () => {
    const { t } = useAppI18n();
    const { categoryId } = useParams<{ categoryId: string }>();
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState<Record<number, "yes" | "no" | "submitted" | null>>({});
    const [feedbackText, setFeedbackText] = useState<Record<number, string>>({});
    const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);
    const [openValue, setOpenValue] = useState<string>("item-0");
    const prevOpenValueRef = useRef<string>("item-0");

    const { interact } = useInteract();
    useImpression({ type: 'view', pageid: 'help-category-detail', object: { id: categoryId || '', type: 'HelpCategory' } });

    const { data: appNameSetting } = useSystemSetting("sunbird");
    const appName = appNameSetting?.data?.response?.value || appNameSetting?.data?.value || " ";

    const { categories: allCategories, loading, error, refetch } = useHelpFaqData();

    const category = useMemo(() => {
        if (!allCategories || !Array.isArray(allCategories)) return null;

        const categoryMap = buildCategoryFaqsMap(allCategories);
        const rawCategory = categoryMap?.[categoryId || ""];

        if (!rawCategory) return null;

        return {
            ...rawCategory,
            title: rawCategory.title.replace(/{{APP_NAME}}/g, appName) || "",
            faqs: (rawCategory.faqs || []).map(faq => ({
                ...faq,
                question: faq.question.replace(/{{APP_NAME}}/g, appName) || ""
            }))
        };
    }, [allCategories, categoryId, appName]);

    const sanitizedFaqs = useMemo(
        () => (category?.faqs ?? []).map((faq) => ({
            ...faq,
            answer: sanitizeHtml(faq.answer).replace(/{{APP_NAME}}/g, appName)
        })),
        [category, appName]
    );

    const handleAccordionChange = (newValue: string) => {
        const prevValue = prevOpenValueRef.current;
        let targetIndex: number;
        let isOpened: boolean;

        if (newValue) {
            targetIndex = parseInt(newValue.replace("item-", ""), 10);
            isOpened = true;
        } else if (prevValue) {
            targetIndex = parseInt(prevValue.replace("item-", ""), 10);
            isOpened = false;
        } else {
            prevOpenValueRef.current = newValue;
            setOpenValue(newValue);
            return;
        }

        const faq = sanitizedFaqs[targetIndex];
        if (faq) {
            interact({
                id: 'faq', subtype: 'toggle-clicked', type: 'TOUCH',
                extra: { values: {
                    action: 'toggle-clicked', position: targetIndex + 1,
                    value: { topic: faq.question, description: faq.answer }, isOpened,
                } },
            });
        }

        prevOpenValueRef.current = newValue;
        setOpenValue(newValue);
    };

    const handleFeedback = (index: number, value: "yes" | "no") => {
        setFeedback((prev) => ({ ...prev, [index]: value }));
    };

    const handleSubmitFeedback = async (index: number) => {
        const text = feedbackText[index] ?? "";
        const faq = sanitizedFaqs[index];
        interact({
            id: 'faq', subtype: 'submit-clicked', type: 'TOUCH',
            extra: { values: {
                action: 'submit-clicked', position: index + 1,
                value: { topic: faq?.question || String(index), description: faq?.answer || '', knowMoreText: text },
            } },
        });
        setFeedback((prev) => ({ ...prev, [index]: "submitted" }));
        setFeedbackText((prev) => ({ ...prev, [index]: "" }));
    };

    return (
        <main className="profile-main-content">
            <div className="profile-content-wrapper">
                <div className="flex items-center justify-between mb-[2rem]">
                    <button
                        onClick={() => { if (navigationHelperService.shouldProcessNavigationClick()) navigate("/help-support"); }}
                        className="flex items-center gap-[0.5rem] text-sunbird-brick font-medium font-['Rubik'] text-sm hover:opacity-80 transition-opacity"
                        data-edataid="help-category-go-back"
                        data-pageid="help-category-detail"
                    >
                        <FaArrowLeftLong className="w-[1rem] h-[1rem]" />
                        {t('button.goBack')}
                    </button>
                    <button
                        onClick={() => setIsReportIssueOpen(true)}
                        className="w-[9.375rem] h-[2.25rem] bg-sunbird-brick text-sunbird-base-white text-sm font-medium font-['Rubik'] rounded-[0.625rem] hover:opacity-90 transition-opacity flex items-center justify-center"
                        aria-label={t('help.reportContentIssue')}
                        data-edataid="help-report-issue-open"
                        data-pageid="help-category-detail"
                    >
                        {t('help.reportIssueBtn')}
                    </button>
                </div>

                {loading ? (
                    <PageLoader message={t('loading')} fullPage={false} />
                ) : error ? (
                    <PageLoader
                        message={t('loading')}
                        error={t('help.failedToLoadFaq')}
                        onRetry={refetch}
                        fullPage={false}
                    />
                ) : !category ? (
                    <PageLoader
                        message={t('loading')}
                        error={t('help.categoryNotFound')}
                        onRetry={() => navigate("/help-support")}
                        fullPage={false}
                    />
                ) : sanitizedFaqs.length === 0 ? (
                    <PageLoader
                        message={t('loading')}
                        error={t('help.noFaqs')}
                        onRetry={() => navigate("/help-support")}
                        fullPage={false}
                    />
                ) : (
                    <>
                        <h1 className="font-['Rubik'] font-medium text-[1.5rem] leading-[100%] tracking-[0%] text-foreground mb-[1.5rem] pt-[1.25rem]">{category.title}</h1>

                        <Accordion type="single" collapsible value={openValue} onValueChange={handleAccordionChange} className="space-y-[0.75rem]">
                            {sanitizedFaqs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`} className="rounded-[0.625rem] bg-sunbird-base-white border-b-0">
                                    <AccordionTrigger
                                        className="text-left font-['Rubik'] font-medium text-[1.125rem] leading-[100%] tracking-[0%] hover:no-underline py-[1rem] px-[1.25rem] text-foreground [&>svg]:text-sunbird-brick"
                                    >
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="font-['Rubik'] font-normal text-[1rem] leading-[1.625rem] tracking-[0%] pb-0 text-muted-foreground px-0">
                                        <div className="mb-[1rem] px-[1.25rem]" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                                        <div className="py-[0.625rem] border-sunbird-gray-e5 shadow-[0_-0.0625rem_0.25rem_rgba(0,0,0,0.06)] px-[1.25rem]">
                                            {(feedback[index] === "yes" || feedback[index] === "submitted") ? (
                                                <p className="text-sm font-medium text-sunbird-brick font-['Rubik'] py-[0.5rem]">
                                                    {t('help.feedbackThanks')}
                                                </p>
                                            ) : feedback[index] === "no" ? (
                                                <div className="py-[0.5rem] space-y-[0.75rem]">
                                                    <p className="text-sm font-semibold text-foreground font-['Rubik']">{t('help.sorry')}</p>
                                                    <p className="text-sm font-semibold text-foreground font-['Rubik']">{t('help.whatMore')}</p>
                                                    <textarea
                                                        placeholder={t('help.typeHere')}
                                                        value={feedbackText[index] || ""}
                                                        onChange={(e) => setFeedbackText((prev) => ({ ...prev, [index]: e.target.value }))}
                                                        className="w-full border border-sunbird-gray-d9 rounded-lg p-[0.75rem] text-sm font-['Rubik'] resize-none h-[5rem] focus:outline-none focus:border-sunbird-brick"
                                                        aria-label={t('help.additionalFeedback')}
                                                        aria-required="true"
                                                    />
                                                    <div className="flex justify-end gap-[0.75rem]">
                                                        <button
                                                            onClick={() => setFeedback((prev) => ({ ...prev, [index]: null }))}
                                                            data-edataid="faq-feedback-cancel"
                                                            data-pageid="help-category-detail"
                                                            className="text-sm font-medium font-['Rubik'] text-muted-foreground hover:opacity-80 transition-opacity px-[1.25rem] py-[0.5rem]"
                                                        >
                                                            {t('cancel')}
                                                        </button>
                                                        <button
                                                            onClick={() => handleSubmitFeedback(index)}
                                                            disabled={!feedbackText[index]?.trim()}
                                                            data-edataid="faq-feedback-submit"
                                                            data-pageid="help-category-detail"
                                                            className={`text-sunbird-base-white text-sm font-medium font-['Rubik'] px-[1.25rem] py-[0.5rem] rounded-[0.625rem] transition-all ${!feedbackText[index]?.trim()
                                                                ? "bg-sunbird-gray-75 opacity-50 cursor-not-allowed"
                                                                : "bg-sunbird-brick hover:opacity-90"
                                                                }`}
                                                        >
                                                            {t('help.submitFeedback')}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-[0.75rem]">
                                                    <span className="text-sm text-muted-foreground font-['Rubik']">{t('help.didThisHelp')}</span>
                                                    <button
                                                        onClick={() => handleFeedback(index, "no")}
                                                        className="text-sm font-medium font-['Rubik'] text-sunbird-brick hover:opacity-80 transition-opacity"
                                                        data-edataid="faq-feedback-no"
                                                        data-pageid="help-category-detail"
                                                        data-cdata={JSON.stringify([{ id: String(index), type: 'FAQIndex' }])}
                                                    >
                                                        {t('no')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleFeedback(index, "yes")}
                                                        className="text-sm font-medium font-['Rubik'] text-sunbird-brick hover:opacity-80 transition-opacity"
                                                        data-edataid="faq-feedback-yes"
                                                        data-pageid="help-category-detail"
                                                        data-cdata={JSON.stringify([{ id: String(index), type: 'FAQIndex' }])}
                                                    >
                                                        {t('yes')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </>
                )}
            </div>
            <ReportIssueDialog open={isReportIssueOpen} onOpenChange={setIsReportIssueOpen} />
        </main>
    );
};

export default HelpCategoryDetail;
