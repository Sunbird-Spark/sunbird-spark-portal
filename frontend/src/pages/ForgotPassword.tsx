import React, { useState } from 'react';
import { AuthLayout } from '@/components/AuthLayout';
import { useLearnerFuzzySearch, useGenerateOtp, useVerifyOtp, useResetPassword } from '@/hooks/useLearner';
import { Step, OtpIdentifier } from './forgotPasswordTypes';
import { IdentifyUser } from './IdentifyUser';
import { SelectOTPDelivery } from './SelectOTPDelivery';
import { VerifyOTP } from './VerifyOTP';
import { PasswordResetSuccess } from './PasswordResetSuccess';

const ForgotPassword: React.FC = () => {
  const { mutateAsync: searchUser } = useLearnerFuzzySearch();
  const { mutateAsync: generateOtp } = useGenerateOtp();
  const { mutateAsync: verifyOtp } = useVerifyOtp();
  const { mutateAsync: resetPassword } = useResetPassword();

  const [step, setStep] = useState<Step>(1);
  const [validIdentifiers, setValidIdentifiers] = useState<OtpIdentifier[]>([]);
  const [selectedIdentifier, setSelectedIdentifier] = useState<OtpIdentifier | null>(null);

  const googleCaptchaSiteKey = '';

  const handleIdentifySuccess = (identifiers: OtpIdentifier[]) => {
    setValidIdentifiers(identifiers);
    setStep(2);
  };

  const handleOtpDeliverySuccess = (identifier: OtpIdentifier) => {
    setSelectedIdentifier(identifier);
    setStep(3);
  };

  return (
    <AuthLayout onClose={() => window.location.href = '/home'}>
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

        {step === 4 && (
          <PasswordResetSuccess
            onProceedToLogin={() => window.location.href = '/login'}
          />
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;