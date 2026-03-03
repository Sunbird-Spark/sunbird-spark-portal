import React, { useState, useEffect } from 'react';
import { useSystemSetting } from '@/hooks/useSystemSetting';
import { useAcceptTnc, useTncCheck } from '@/hooks/useTnc';
import { useUserRead } from '@/hooks/useUserRead';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { useAppI18n } from '@/hooks/useAppI18n';
import { TncAcceptancePopup } from './TncAcceptancePopup';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';

interface TncCheckWrapperProps {
  children?: React.ReactNode;
  userProfile?: any;
}

export const TncCheckWrapper: React.FC<TncCheckWrapperProps> = ({
  children,
  userProfile: userProfileProp
}) => {
  const { t } = useAppI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAuthenticated = userAuthInfoService.isUserAuthenticated();

  const { data: userReadData, isLoading: isUserLoading } = useUserRead();
  const userProfile = userProfileProp || userReadData?.data?.response;

  const [showPopup, setShowPopup] = useState(false);
  // Tracks whether the user dismissed the popup this session without accepting.
  // The popup will reappear on the next login since the backend TNC state is unchanged.
  const [dismissedForSession, setDismissedForSession] = useState(false);

  const { data: tncConfig, isLoading: isTncLoading } = useSystemSetting('tncConfig');
  const { needsTncAcceptance, termsUrl } = useTncCheck(userProfile, tncConfig);
  const acceptTncMutation = useAcceptTnc();

  const finalTermsUrl = termsUrl;

  // Wait for both data sources to settle before deciding whether to show the popup,
  // preventing a flash if userProfile loads before tncConfig.
  const isDataLoading = isUserLoading || isTncLoading;

  useEffect(() => {
    if (!isDataLoading && needsTncAcceptance && finalTermsUrl && userProfile && !dismissedForSession) {
      setShowPopup(true);
    } else {
      setShowPopup(false);
    }
  }, [isDataLoading, needsTncAcceptance, finalTermsUrl, userProfile, dismissedForSession]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // User closed without accepting — suppress for this session only.
      setDismissedForSession(true);
    }
    setShowPopup(open);
  };

  const handleAccept = () => {
     if (!tncConfig || !userProfile) {
      toast({
        title: t('tncPopup.errorTitle'),
        description: t('tncPopup.errorDescription'),
        variant: 'destructive',
      });
      return;
    }
    acceptTncMutation.mutate(
      { tncConfig },
      {
        onSuccess: async () => {
          setShowPopup(false);
          setDismissedForSession(false);
          toast({
            title: t('tncPopup.acceptedTitle'),
            description: t('tncPopup.acceptedDescription'),
            variant: 'default',
          });
          try {
            await queryClient.invalidateQueries({ queryKey: ['userRead'] });
          } catch (error) {
            console.error('Failed to refresh user profile after T&C acceptance', error);
            toast({
              title: t('tncPopup.refreshErrorTitle'),
              description: t('tncPopup.refreshErrorDescription'),
              variant: 'destructive',
            });
          }
        },
        onError: () => {
          toast({
            title: t('tncPopup.errorTitle'),
            description: t('tncPopup.errorDescription'),
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <>
      {children}
      {isAuthenticated && finalTermsUrl && (
        <TncAcceptancePopup
          open={showPopup}
          onOpenChange={handleOpenChange}
          termsUrl={finalTermsUrl}
          onAccept={handleAccept}
          isAccepting={acceptTncMutation.isPending}
          showCloseButton={true}
        />
      )}
    </>
  );
};
