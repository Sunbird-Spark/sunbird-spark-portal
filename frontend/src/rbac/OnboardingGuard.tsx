import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRead } from '@/hooks/useUserRead';
import { useFormRead } from '@/hooks/useForm';
import { OnboardingFormData } from '@/types/formTypes';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children }) => {
  const { data: formApiData, isLoading: formLoading } = useFormRead({
    request: { type: 'user', subType: 'onboarding', action: 'workflow', component: 'portal' },
  });

  const { data: userReadData, isLoading: userLoading, isFetching } = useUserRead();

  const onboardingFormData = (formApiData?.data as { form?: { data?: OnboardingFormData } })?.form?.data;
  const isOnboardingEnabled = onboardingFormData?.isEnabled ?? false;

  const userProfile = userReadData?.data?.response as Record<string, any> | undefined;
  const onboardingDetails = userProfile?.framework?.onboardingDetails;
  const hasCompletedOnboarding = Array.isArray(onboardingDetails)
    ? onboardingDetails.length > 0
    : onboardingDetails != null;

  // Wait for initial load, or for background refetch when stale cache shows incomplete.
  // This prevents a redirect loop after the user finishes onboarding and navigates home.
  if (formLoading || userLoading || (isFetching && !hasCompletedOnboarding)) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <span className="onboarding-spinner" />
      </div>
    );
  }

  if (isOnboardingEnabled && !hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default OnboardingGuard;
