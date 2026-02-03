
import { useState } from 'react';
import { AuthLayout } from '@/components/AuthLayout';
import {
  IDENTIFIER_REGEX,
  OTP_REGEX,
  PASSWORD_REGEX,
  maskIdentifier
} from '@/lib/auth-utils';
import {
  StepIdentification,
  StepDeliveryOption
} from './ForgotPasswordIdentity';
import {
  StepOtpVerification,
  StepResetPassword,
  StepSuccess
} from './ForgotPasswordSecurity';

const ForgotPassword = () => {

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isOtpSourceSelected, setIsOtpSourceSelected] = useState(false);

  const maskedIdentifier = maskIdentifier(identifier.trim());

  const isRecoverValid =
    IDENTIFIER_REGEX.test(identifier.trim()) && name.trim().length > 0;

  const isOtpValid = OTP_REGEX.test(otp.join(''));

  const isPasswordValid = PASSWORD_REGEX.test(password);
  const isConfirmValid = password === confirmPassword && confirmPassword.length > 0;

  return (
    <AuthLayout>
      <div className="w-full font-rubik">

        {/* STEP 1: Identification */}
        {step === 1 && (
          <StepIdentification
            identifier={identifier}
            setIdentifier={setIdentifier}
            name={name}
            setName={setName}
            handleContinue={() => setStep(2)}
            isRecoverValid={isRecoverValid}
          />
        )}

        {/* STEP 2: Delivery Option */}
        {step === 2 && (
          <StepDeliveryOption
            isOtpSourceSelected={isOtpSourceSelected}
            setIsOtpSourceSelected={setIsOtpSourceSelected}
            maskedIdentifier={maskedIdentifier}
            handleGetOtp={() => setStep(3)}
          />
        )}

        {/* STEP 3: OTP Verification */}
        {step === 3 && (
          <StepOtpVerification
            otp={otp}
            setOtp={setOtp}
            isOtpValid={isOtpValid}
            handleConfirm={() => setStep(4)}
          />
        )}

        {/* STEP 4: Reset Password */}
        {step === 4 && (
          <StepResetPassword
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            isPasswordValid={isPasswordValid}
            isConfirmValid={isConfirmValid}
            handleReset={() => setStep(5)}
          />
        )}

        {/* STEP 5: Success */}
        {
          step === 5 && (
            <StepSuccess
              handleProceed={() => {
                // Redirect to Keycloak login via /home
                window.location.href = '/home';
              }}
            />
          )
        }

      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
