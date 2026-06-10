import { useIsAuthenticated } from "@/hooks/useAuthInfo";
import PageLoader from "@/components/common/PageLoader";
import PageLayout from "@/components/layout/PageLayout";
import OnboardingGuard from "@/rbac/OnboardingGuard";
import DeleteAccount from "./DeleteAccount";
import DeleteAccountLanding from "./DeleteAccountLanding";

const DeleteAccountGate = () => {
    const { isAuthenticated, isLoading } = useIsAuthenticated();

    if (isLoading) {
        return (
            <main className="profile-main-content delete-account-main bg-white">
                <PageLoader fullPage={false} />
            </main>
        );
    }

    if (!isAuthenticated) {
        return <DeleteAccountLanding />;
    }

    return (
        <OnboardingGuard>
            <PageLayout>
                <DeleteAccount />
            </PageLayout>
        </OnboardingGuard>
    );
};

export default DeleteAccountGate;
