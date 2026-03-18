import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRightLong } from "react-icons/fa6";
import PageLoader from "@/components/common/PageLoader";
import { useHelpFaqData } from "@/hooks/useFaqData";
import { useSystemSetting } from "@/hooks/useSystemSetting";
import { useAppI18n } from "@/hooks/useAppI18n";
import useImpression from "@/hooks/useImpression";

import {
    buildHelpCategories,
} from "../../services/HelpSupportService";

import "../profile/profile.css";
import ReportIssueDialog from "@/components/help/ReportIssueDialog";

const HelpSupport = () => {
    const { t } = useAppI18n();
    const navigate = useNavigate();
    const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);

    useImpression({ type: 'view', pageid: 'help-support' });

    const { data: appNameSetting } = useSystemSetting("sunbird");
    const appName = appNameSetting?.data?.response?.value || appNameSetting?.data?.value || " ";

    const { categories: allCategories, loading, error, refetch } = useHelpFaqData();

    const categories = useMemo(
        () => {
            try {
                if (!allCategories || !Array.isArray(allCategories)) return [];

                return buildHelpCategories(allCategories).map(cat => ({
                    ...cat,
                    title: cat.title.replace(/{{APP_NAME}}/g, appName) || "",
                    description: cat.description.replace(/{{APP_NAME}}/g, appName) || ""
                }));
            } catch (err) {
                console.error("Error processing help categories:", err);
                throw err;
            }
        },
        [allCategories, appName]
    );


    return (
        <main className="profile-main-content">
            <div className="profile-content-wrapper">
                {/* Header row */}
                <div className="flex items-center justify-between mb-[2rem]">
                    <h1 className="font-['Rubik'] font-medium text-[1.5rem] leading-[100%] tracking-[0%] text-foreground">
                        {t('help.assistPrompt')}
                    </h1>
                    <button
                        onClick={() => setIsReportIssueOpen(true)}
                        aria-label={t('help.reportAppIssue')}
                        data-edataid="help-report-issue-open"
                        data-pageid="help-support"
                        className="w-[9.375rem] h-[2.25rem] bg-sunbird-brick text-sunbird-base-white text-sm font-medium font-['Rubik'] rounded-[0.625rem] hover:opacity-90 transition-opacity flex items-center justify-center">
                        {t('help.reportIssueBtn')}
                    </button>
                </div>

                {loading ? (
                    <PageLoader message={t('loading')} fullPage={false} />
                ) : error ? (
                    <PageLoader
                        message={t('loading')}
                        error={error?.message || t('help.failedToLoadFaq')}
                        onRetry={refetch}
                        fullPage={false}
                    />
                ) : categories.length === 0 ? (
                    <PageLoader
                        message={t('loading')}
                        error={t('help.noCategories')}
                        onRetry={refetch}
                        fullPage={false}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-[1.25rem] mb-[2.5rem] pt-[1.25rem]">
                        {categories.map((cat) => (
                            <div
                                key={cat.slug}
                                onClick={() => navigate(`/help-support/${cat.slug}`)}
                                className="bg-sunbird-base-white rounded-[0.625rem] overflow-hidden flex flex-col shadow-[0.125rem_0.125rem_1.25rem_rgba(0,0,0,0.09)] hover:shadow-md transition-shadow cursor-pointer"
                                data-edataid="help-category-click"
                                data-pageid="help-support"
                                data-objectid={cat.slug}
                                data-objecttype="HelpCategory"
                            >
                                <div className="w-[2rem] h-[0.75rem] bg-sunbird-ginger ml-[1.875rem]" />
                                <div className="px-[1.25rem] pb-[1.25rem] pt-[1.5rem] flex flex-col flex-1">
                                    <h3 className="font-['Rubik'] font-medium text-[1.125rem] leading-[100%] tracking-[0%] text-foreground mb-[0.5rem]">{cat.title}</h3>
                                    <p className="text-base text-foreground font-['Rubik'] leading-relaxed mb-[1rem]">
                                        {cat.description}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="font-['Rubik'] font-normal text-[0.875rem] leading-[1.625rem] tracking-[0%] text-sunbird-gray-75">{t('help.faqCount', { count: cat.faqCount })}</span>
                                        <FaArrowRightLong className="w-[1.25rem] h-[1.25rem] text-sunbird-brick" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
                }


            </div>
            <ReportIssueDialog open={isReportIssueOpen} onOpenChange={setIsReportIssueOpen} />
        </main>
    );
};

export default HelpSupport;
