import PageLoader from "@/components/common/PageLoader";
import HomeDiscoverSections from "@/components/home/HomeDiscoverSections";
import HomeStatsCards from "@/components/home/HomeStatsCards";
import HomeContinueLearning from "@/components/home/HomeContinueLearning";
import HomeInProgressGrid from "@/components/home/HomeInProgressGrid";
import HomeRecommendedSection from "@/components/home/HomeRecommendedSection";
import HomeTvetJourney from "@/components/home/HomeTvetJourney";
import { useAppI18n } from '@/hooks/useAppI18n';
import { useIsAdmin } from '@/hooks/useUser';

interface HomeDashboardContentProps {
    loading: boolean;
    error?: string;
    enrolledCount: number;
    onRetry: () => void;
}

const HomeDashboardContent = ({ loading, error, enrolledCount, onRetry }: HomeDashboardContentProps) => {
    const { t } = useAppI18n();
    const isAdmin = useIsAdmin();
    if (loading) return <PageLoader message={t('myLearning.loading')} fullPage={false} />;
    if (error) return <PageLoader message={t('myLearning.errorLoading')} fullPage={false} error={error} onRetry={onRetry} />;
    if (enrolledCount === 0) return <HomeDiscoverSections />;

    return (
        <>
            <HomeStatsCards />
            {!isAdmin && <HomeTvetJourney />}
            <HomeContinueLearning />
            {enrolledCount > 1 && <HomeInProgressGrid />}
            <HomeRecommendedSection />
        </>
    );
};

export default HomeDashboardContent;
