import { useUserRead } from "@/hooks/useUserRead";
import { useUserEnrolledCollections } from "@/hooks/useUserEnrolledCollections";
import HomeDashboardContent from "@/components/home/HomeDashboardContent";
import { useAppI18n } from "@/hooks/useAppI18n";
import useImpression from "@/hooks/useImpression";

import "./home.css";

const Home = () => {
    const { t } = useAppI18n();
    const { data: userReadData, isLoading: userLoading, error, refetch } = useUserRead();
    const userProfile = userReadData?.data?.response;
    const {
        data: enrolledCollections,
        isLoading: enrollmentsLoading,
        error: enrollmentsError
    } = useUserEnrolledCollections();
    const enrolledCount = enrolledCollections?.data?.courses?.length ?? 0;

    useImpression({ type: 'view', pageid: 'home', env: 'home' });

    return (
        <main className="home-main-content">
            <div className="home-content-wrapper">
                {/* Welcome Section */}
                <div className="mb-6 md:mb-8">
                    <h2 className="home-welcome-title">
                        {[userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(' ')
                            ? t('homePage.hiUser', { name: [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(' ') })
                            : t('homePage.hiGuest')}
                    </h2>
                    <p className="home-welcome-subtitle">
                        {enrolledCount === 0
                            ? t('homePage.journeyStart')
                            : t('homePage.welcomeMessage')}
                    </p>
                </div>

                <HomeDashboardContent
                    loading={userLoading || enrollmentsLoading}
                    error={error?.message || enrollmentsError?.message}
                    enrolledCount={enrolledCount}
                    onRetry={refetch}
                />
            </div>
        </main>
    );
};


export default Home;
