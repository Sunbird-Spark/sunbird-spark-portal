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

  const { data: userReadData } = useUserRead();
  const userProfile = userProfileProp || userReadData?.data?.response;

  const [showPopup, setShowPopup] = useState(false);

  const { data: tncConfig } = useSystemSetting('tncConfig');
  const { needsTncAcceptance, termsUrl } = useTncCheck(userProfile, tncConfig);
  const acceptTncMutation = useAcceptTnc();

  // Prefer the URL resolved from tncConfig; fall back to the user profile URL if needed.
  const finalTermsUrl = termsUrl || userProfile?.tncLatestVersionUrl || '';

  useEffect(() => {
    if (needsTncAcceptance && finalTermsUrl && userProfile) {
      setShowPopup(true);
    } else {
      setShowPopup(false);
    }
  }, [needsTncAcceptance, finalTermsUrl, userProfile]);

  const handleOpenChange = (open: boolean) => {
    // Prevent closing if TNC still needs acceptance
    if (!open && needsTncAcceptance) {
      return;
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
    const identifier = userProfile.email || userProfile.phone || userProfile.userName || '';
    acceptTncMutation.mutate(
      { tncConfig, identifier },
      {
        onSuccess: async () => {
          setShowPopup(false);
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
          showCloseButton={!needsTncAcceptance}
        />
      )}
    </>
  );
};
