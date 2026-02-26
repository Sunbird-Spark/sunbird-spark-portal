import React, { useState } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useLearnerFuzzySearch, useResetPassword } from '@/hooks/useUser';
import { useGenerateOtp, useVerifyOtp } from '@/hooks/useOtp';
import { Step, OtpIdentifier } from '../../types/forgotPasswordTypes';
import { IdentifyUser } from './IdentifyUser';
import { SelectOTPDelivery } from './SelectOTPDelivery';
import { VerifyOTP } from './VerifyOTP';
import { useSystemSetting } from '@/hooks/useSystemSetting';

const ForgotPassword: React.FC = () => {
  const { mutateAsync: searchUser } = useLearnerFuzzySearch();
  const { mutateAsync: generateOtp } = useGenerateOtp();
  const { mutateAsync: verifyOtp } = useVerifyOtp();
  const { mutateAsync: resetPassword } = useResetPassword();

  const [step, setStep] = useState<Step>(1);
  const [validIdentifiers, setValidIdentifiers] = useState<OtpIdentifier[]>([]);
  const [selectedIdentifier, setSelectedIdentifier] = useState<OtpIdentifier | null>(null);

  const { data: captchaSiteKeyData } = useSystemSetting('portal_google_recaptcha_site_key');
  const googleCaptchaSiteKey = (captchaSiteKeyData?.data as any)?.response?.value || '';

  const handleIdentifySuccess = (identifiers: OtpIdentifier[]) => {
    setValidIdentifiers(identifiers);
    setStep(2);
  };

  const handleOtpDeliverySuccess = (identifier: OtpIdentifier) => {
    setSelectedIdentifier(identifier);
    setStep(3);
  };

  return (
    <AuthLayout onClose={() => window.location.href = '/portal/login'} isOtpPage={step === 3}>
      <div className="w-full font-rubik">
        {step === 1 && (
          <IdentifyUser
            googleCaptchaSiteKey={googleCaptchaSiteKey}
            searchUser={searchUser}
            onSuccess={handleIdentifySuccess}
          />
        )}

        {step === 2 && (
          <SelectOTPDelivery
            validIdentifiers={validIdentifiers}
            googleCaptchaSiteKey={googleCaptchaSiteKey}
            generateOtp={generateOtp}
            onSuccess={handleOtpDeliverySuccess}
          />
        )}

        {step === 3 && selectedIdentifier && (
          <VerifyOTP
            selectedIdentifier={selectedIdentifier}
            googleCaptchaSiteKey={googleCaptchaSiteKey}
            verifyOtp={verifyOtp}
            resetPassword={resetPassword}
            generateOtp={generateOtp}
          />
        )}

      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;