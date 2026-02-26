import { useUserEnrolledCollections } from "@/hooks/useUserEnrolledCollections";
import { useUserCertificates } from "@/hooks/useCertificate";

import { TotalContentsIcon, InProgressIcon, ContentsCompletedIcon, CertificationsIcon } from "./ProfileIcons";

const ProfileStatsCards = () => {
    const { data: enrolledCollections, isLoading: enrollmentsLoading } = useUserEnrolledCollections();
    const { data: certificatesData, isLoading: certificatesLoading } = useUserCertificates();
    const courses = enrolledCollections?.data?.courses || [];

    const isLoading = enrollmentsLoading || certificatesLoading;

    // Total leaf-node contents across all enrolled courses
    const totalContents = courses.reduce((acc, course) => acc + (course.leafNodesCount || 0), 0);

    // Count individual contents by status from contentStatus map (1 = in progress, 2 = completed)
    const contentsInProgress = courses.reduce((acc, course) => {
        const statuses = Object.values(course.contentStatus || {});
        return acc + statuses.filter(s => s === 1).length;
    }, 0);
    const contentsCompleted = courses.reduce((acc, course) => {
        const statuses = Object.values(course.contentStatus || {});
        return acc + statuses.filter(s => s === 2).length;
    }, 0);

    // Get certificate count from the certificate search API
    // The API returns an array of certificates directly
    const certificatesEarned = Array.isArray(certificatesData?.data)
        ? certificatesData.data.length
        : 0;

    const statsData = [
        {
            id: "total",
            value: totalContents === 0 ? '00' : totalContents.toString().padStart(2, '0'),
            label: "Total Contents",
            icon: TotalContentsIcon,
        },
        {
            id: "progress",
            value: contentsInProgress === 0 ? '00' : contentsInProgress.toString().padStart(2, '0'),
            label: "Contents in Progress",
            icon: InProgressIcon,
        },
        {
            id: "completed",
            value: contentsCompleted === 0 ? '00' : contentsCompleted.toString().padStart(2, '0'),
            label: "Contents Completed",
            icon: ContentsCompletedIcon,
        },
        {
            id: "certs",
            value: certificatesEarned === 0 ? '00' : certificatesEarned.toString().padStart(2, '0'),
            label: "Certifications Earned",
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
