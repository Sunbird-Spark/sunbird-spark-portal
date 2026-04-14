import { useUserEnrolledCollections } from "@/hooks/useUserEnrolledCollections";
import { useUserCertificates } from "@/hooks/useCertificate";
import { useAppI18n } from "@/hooks/useAppI18n";

import { TotalContentsIcon, InProgressIcon, ContentsCompletedIcon, CertificationsIcon } from "./ProfileIcons";

const ProfileStatsCards = () => {
    const { t } = useAppI18n();
    const { data: enrolledCollections, isLoading: enrollmentsLoading } = useUserEnrolledCollections();
    const { data: certificatesData, isLoading: certificatesLoading } = useUserCertificates();
    const courses = enrolledCollections?.data?.courses || [];

    const isLoading = enrollmentsLoading || certificatesLoading;

    // Course-level stats using course status (1 = in progress, 2 = completed)
    const totalCourses = courses.length;
    const coursesInProgress = courses.filter(course => course.status === 1 && !(course.completionPercentage >= 100)).length;
    const coursesCompleted = courses.filter(course => course.status === 2 || course.completionPercentage >= 100).length;

    // Get certificate count from the certificate search API
    // The API returns an array of certificates directly
    const certificatesEarned = Array.isArray(certificatesData?.data)
        ? certificatesData.data.length
        : 0;

    const statsData = [
        {
            id: "total",
            value: totalCourses === 0 ? '0' : totalCourses.toString().padStart(2, '0'),
            label: t("statsCards.totalCourses"),
            icon: TotalContentsIcon,
        },
        {
            id: "progress",
            value: coursesInProgress === 0 ? '0' : coursesInProgress.toString().padStart(2, '0'),
            label: t("statsCards.inProgress"),
            icon: InProgressIcon,
        },
        {
            id: "completed",
            value: coursesCompleted === 0 ? '0' : coursesCompleted.toString().padStart(2, '0'),
            label: t("statsCards.completed"),
            icon: ContentsCompletedIcon,
        },
        {
            id: "certs",
            value: certificatesEarned === 0 ? '0' : certificatesEarned.toString().padStart(2, '0'),
            label: t("statsCards.certificationsEarned"),
            icon: CertificationsIcon,
        },
    ];

    const getStatClass = (id: string) => {
        switch (id) {
            case "total": return "stat-card-time-spent";
            case "progress": return "stat-card-badges";
            case "completed": return "stat-card-completed";
            case "certs": return "stat-card-certs";
            default: return "";
        }
    };

    if (isLoading) {
        return (
            <div className="profile-stats-grid">
                {statsData.map((stat) => {
                    const IconComponent = stat.icon;
                    return (
                        <div
                            key={stat.id}
                            className={`stat-card ${getStatClass(stat.id)} animate-pulse`}
                        >
                            <div className="stat-icon-container">
                                <IconComponent />
                            </div>
                            <div className="stat-value opacity-50">
                                --
                            </div>
                            <div className="stat-label">
                                {stat.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="profile-stats-grid">
            {statsData.map((stat) => {
                const IconComponent = stat.icon;
                return (
                    <div
                        key={stat.id}
                        className={`stat-card ${getStatClass(stat.id)}`}
                    >
                        {/* Icon in top-right */}
                        <div className="stat-icon-container">
                            <IconComponent />
                        </div>

                        {/* Value */}
                        <div className="stat-value">
                            {stat.value}
                        </div>

                        {/* Label */}
                        <div className="stat-label">
                            {stat.label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ProfileStatsCards;
