import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRead } from '@/hooks/useUserRead';
import { useFormRead } from '@/hooks/useForm';
import { OnboardingFormData } from '@/types/formTypes';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children }) => {
  const isAuthenticated = userAuthInfoService.isUserAuthenticated();

  const { data: formApiData, isLoading: formLoading } = useFormRead({
    request: { type: 'user', subType: 'onboarding', action: 'workflow', component: 'portal' },
  });

  const { data: userReadData, isLoading: userLoading, isFetching, isError: userReadError } = useUserRead();

  // Anonymous users are never redirected to onboarding.
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const onboardingFormData = (formApiData?.data as { form?: { data?: OnboardingFormData } })?.form?.data;
  const isOnboardingEnabled = onboardingFormData?.isEnabled ?? false;

  const userProfile = userReadData?.data?.response as Record<string, any> | undefined;
  const onboardingDetails = userProfile?.framework?.onboardingDetails;
  const hasCompletedOnboarding = Array.isArray(onboardingDetails)
    ? onboardingDetails.length > 0
    : onboardingDetails != null;

  // Wait for initial load, or for background refetch when stale cache shows incomplete.
  // Prevents a redirect loop after the user finishes onboarding and navigates home.
  if (formLoading || userLoading || (isFetching && !hasCompletedOnboarding)) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <span className="onboarding-spinner" />
      </div>
    );
  }

  // Fail open: if the user profile API failed, let the user through rather than
  // blocking them from the app due to a temporary backend issue.
  if (isOnboardingEnabled && !hasCompletedOnboarding && !userReadError) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default OnboardingGuard;
