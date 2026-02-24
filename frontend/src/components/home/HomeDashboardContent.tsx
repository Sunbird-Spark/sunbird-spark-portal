import PageLoader from "@/components/common/PageLoader";
import HomeDiscoverSections from "@/components/home/HomeDiscoverSections";
import HomeStatsCards from "@/components/home/HomeStatsCards";
import HomeContinueLearning from "@/components/home/HomeContinueLearning";
import HomeInProgressGrid from "@/components/home/HomeInProgressGrid";
import HomeRecommendedSection from "@/components/home/HomeRecommendedSection";

interface HomeDashboardContentProps {
    loading: boolean;
    error?: string;
    enrolledCount: number;
    onRetry: () => void;
}

const HomeDashboardContent = ({ loading, error, enrolledCount, onRetry }: HomeDashboardContentProps) => {
    if (loading) return <PageLoader message="Loading your dashboard..." fullPage={false} />;
    if (error) return <PageLoader message="Loading your dashboard..." fullPage={false} error={error} onRetry={onRetry} />;
    if (enrolledCount === 0) return <HomeDiscoverSections />;

    return (
        <>
            <HomeStatsCards />
            <div className="home-continue-section">
                <h3 className="home-continue-section-title">Continue from where you left</h3>
                <div className="home-continue-grid">
                    <div className="w-full lg:w-[65%]">
                        <HomeContinueLearning />
                    </div>
                </div>
            </div>
            {enrolledCount > 1 && <HomeInProgressGrid />}
            <HomeRecommendedSection />
        </>
    );
};

export default HomeDashboardContent;
