import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRead } from "@/hooks/useUserRead";

// Fetches fresh user data on mount. If the server confirms the user has
// already completed or skipped onboarding, redirects them to /home.
// Covers: existing users landing on /onboarding directly, and the
// post-submission redirect loop from the 1500ms cache invalidation delay.
export const useOnboardingRedirect = () => {
  const navigate = useNavigate();
  const { data: userReadData } = useUserRead({ refetchOnMount: 'always' });
  const onboardingDetails = (userReadData?.data?.response as Record<string, any> | undefined)
    ?.framework?.onboardingDetails;
  const hasCompletedOnboarding = Array.isArray(onboardingDetails)
    ? onboardingDetails.length > 0
    : onboardingDetails != null;

  useEffect(() => {
    if (hasCompletedOnboarding) {
      navigate("/home", { replace: true });
    }
  }, [hasCompletedOnboarding, navigate]);
};
