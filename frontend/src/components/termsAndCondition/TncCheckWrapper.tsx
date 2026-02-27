import React, { useState, useEffect } from 'react';
import { useSystemSetting } from '@/hooks/useSystemSetting';
import { useAcceptTnc, useTncCheck, useGetTncUrl } from '@/hooks/useTnc';
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
  const { data: resolvedTermsUrl } = useGetTncUrl(tncConfig);
  const acceptTncMutation = useAcceptTnc();

  const finalTermsUrl = resolvedTermsUrl || userProfile?.tncLatestVersionUrl || '';

  // Simple check: compare tncAcceptedVersion with tncLatestVersion
  // Show popup if: no accepted version OR accepted version doesn't match latest
  const needsTncAcceptance = !userProfile?.tncAcceptedVersion ||
    userProfile?.tncAcceptedVersion !== userProfile?.tncLatestVersion;

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
    if (!tncConfig || !userProfile) return;
    const identifier = userProfile.email || userProfile.phone || userProfile.userName || '';
    acceptTncMutation.mutate(
      { tncConfig, identifier },
      {
        onSuccess: () => {
          setShowPopup(false);
          toast({
            title: t('tncPopup.acceptedTitle'),
            description: t('tncPopup.acceptedDescription'),
            variant: 'default',
          });
          queryClient.invalidateQueries({ queryKey: ['userRead'] });
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
        />
      )}
    </>
  );
};
