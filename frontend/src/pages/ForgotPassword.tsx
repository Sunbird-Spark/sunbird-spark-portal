import React, { useRef, useState, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { FiCheck } from 'react-icons/fi';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/button';
import { Input } from '@/components/input';

import {
  IDENTIFIER_REGEX,
  OTP_REGEX,
  maskIdentifier
} from '@/lib/auth-utils';

import { useLearnerFuzzySearch, useGenerateOtp, useVerifyOtp, useResetPassword } from '@/hooks/useLearner';

type Step = 1 | 2 | 3 | 4;
type IdentifierStatus = '' | 'MATCHED' | 'NOT_MATCHED' | 'VALIDATING_FAILED';
type OtpIdentifier = {
  id: string;
  type: string;
  value: string;
};

const ForgotPassword: React.FC = () => {
  const { mutateAsync: searchUser } = useLearnerFuzzySearch();
  const { mutateAsync: generateOtp } = useGenerateOtp();
  const { mutateAsync: verifyOtp } = useVerifyOtp();
  const { mutateAsync: resetPassword } = useResetPassword();
  const [step, setStep] = useState<Step>(1);

  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [identifierStatus, setIdentifierStatus] =
    useState<IdentifierStatus>('');

  const [loading, setLoading] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  /* -------------------- Step 2 State -------------------- */
  const [validIdentifiers, setValidIdentifiers] = useState<OtpIdentifier[]>([]);
  const [selectedIdentifier, setSelectedIdentifier] =
    useState<OtpIdentifier | null>(null);

  /* -------------------- OTP / Password ------------------ */
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [otpError, setOtpError] = useState('');
  const [disableResendOtp, setDisableResendOtp] = useState(false);
  const [counter, setCounter] = useState(20);
  const [resendOtpCounter, setResendOtpCounter] = useState(1);
  const maxResendTry = 4;

  useEffect(() => {
    if (step !== 3) return;

    setDisableResendOtp(true);
    setCounter(20);

    const interval = setInterval(() => {
      setCounter(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setDisableResendOtp(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, resendOtpCounter]);

  /* -------------------- Captcha ------------------------- */
  const captchaRefP1 = useRef<ReCAPTCHA>(null);
  const captchaRefP2 = useRef<ReCAPTCHA>(null);

  // Use Google ReCAPTCHA v2 Test Key for development/localhost to avoid "Captcha encountered an error"
  const googleCaptchaSiteKey = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';


  /* -------------------- Validators ---------------------- */
  const isRecoverValid =
    IDENTIFIER_REGEX.test(identifier.trim()) && name.trim().length > 0;

  const isOtpValid = OTP_REGEX.test(otp.join(''));

  const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="login-header text-center mb-8">
      <h1 className="welcome-title !font-rubik text-[1.875rem] font-semibold text-[#222222] leading-[1.875rem] mb-2">{title}</h1>
      {subtitle && <p className="welcome-subtitle text-[0.875rem] font-normal text-[#757575] leading-relaxed mx-auto max-w-[20rem]">{subtitle}</p>}
    </div>
  );

  const InputLabel = ({ children, htmlFor, required }: { children: React.ReactNode, htmlFor?: string, required?: boolean }) => (
    <label htmlFor={htmlFor} className="block text-[0.875rem] font-medium text-[#333] mb-2">
      {children}
      {required && <span className="text-black ml-1">*</span>}
    </label>
  );

  const PrimaryButton = ({ children, onClick, disabled, className = "" }: { children: React.ReactNode, onClick: () => void, disabled?: boolean, className?: string }) => (
    <Button
      className={`login-button w-full h-[3.25rem] bg-[#A85236] !bg-[#A85236] text-white text-[1rem] font-medium rounded-[0.625rem] shadow-none border-none transition-all ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? 'Please wait…' : children}
    </Button>
  );
  /* ------------------------------------------------------------------ */
  /* Helpers */
  /* ------------------------------------------------------------------ */

  const buildValidIdentifiers = (results: any[]): OtpIdentifier[] => {
    const keys = [
      'phone',
      'email',
      'prevUsedEmail',
      'prevUsedPhone',
      'recoveryEmail',
      'recoveryPhone'
    ];

    const list: OtpIdentifier[] = [];

    results.forEach(user => {
      keys.forEach(key => {
        if (user[key]) {
          list.push({
            id: user.id,
            type: key,
            value: user[key]
          });
        }
      });
    });

    return list;
  };

  const redirectWithError = (message: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('error_message', message);
    const errorCallback = params.get('error_callback');
    if (errorCallback) {
      window.location.href = `${errorCallback}?${params.toString()}`;
    }
  };

  /* ------------------------------------------------------------------ */
  /* STEP 1 – Identify */
  /* ------------------------------------------------------------------ */

  const handleSubmitIdentify = () => {
    setIdentifierStatus('');
    if (googleCaptchaSiteKey) {
      console.log('handleSubmitIdentify');
      captchaRefP1.current?.execute();
    } else {
      initiateFuzzySearch();
    }
  };

  const initiateFuzzySearch = async (captchaResponse?: string) => {
    console.log('initiateFuzzySearch');
    setLoading(true);
    try {
      const isPhone = /^[6-9]\d{9}$/.test(identifier.trim());

      const payload: any = {
        request: {
          filters: {
            isDeleted: 'false',
            fuzzy: {
              firstName: name.trim(),
            },
            $or: {},
          },
        },
      };

      if (isPhone) {
        payload.request.filters.$or = {
          phone: identifier.trim(),
          prevUsedPhone: identifier.trim(),
        };
      } else {
        payload.request.filters.$or = {
          email: identifier.trim(),
          prevUsedEmail: identifier.trim(),
        };
      }

      const response = await searchUser({
        request: payload,
        captchaResponse
      });

      const users = response?.data?.response?.content || [];
      const identifiers = buildValidIdentifiers(users);

      if (response.status === 418) {
        setIdentifierStatus('VALIDATING_FAILED');
        captchaRefP1.current?.reset();
        return;
      }

      if (!identifiers.length) {
        setIdentifierStatus('NOT_MATCHED');
        captchaRefP1.current?.reset();
        return;
      }

      setValidIdentifiers(identifiers);
      setStep(2);
    } catch (error: any) {
      handleIdentifyError(error);
      captchaRefP1.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  const handleIdentifyError = (error: any) => {
    setErrorCount(prev => prev + 1);

    if (error?.response?.status === 418) {
      setIdentifierStatus('VALIDATING_FAILED');
    } else {
      setIdentifierStatus('NOT_MATCHED');
    }

    if (errorCount + 1 >= 2) {
      redirectWithError('You have exceeded maximum retry. Please try after some time');
    }
  };

  /* ------------------------------------------------------------------ */
  /* STEP 2 – Generate OTP */
  /* ------------------------------------------------------------------ */

  const submitGenerateOtp = () => {
    if (googleCaptchaSiteKey) {
      captchaRefP2.current?.execute();
    } else {
      handleGenerateOtp();
    }
  };

  const handleGenerateOtp = async (captchaResponse?: string) => {
    if (!selectedIdentifier) return;

    try {
      setLoading(true);

      const res = await generateOtp({
        request: {
          request: {
            type: selectedIdentifier.type,
            key: selectedIdentifier.value,
            userId: selectedIdentifier.id,
            templateId: "resetPasswordWithOtp"
          }
        },
        captchaResponse: captchaResponse || ''
      });

      if (res.status !== 200) {
        throw new Error('Generate OTP failed');
      }

      setStep(3);
    } catch (error: any) {
      if (error?.response?.status === 429) {
        redirectWithError(error?.response?.data?.params?.errmsg || 'Too many requests. Please try again later.');
        return;
      }

      setErrorCount(prev => prev + 1);

      if (errorCount + 1 >= 2) {
        redirectWithError('Generate OTP failed. Please try again later');
      }
      captchaRefP2.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* STEP 3 – Verify OTP */
  /* ------------------------------------------------------------------ */

  const handleVerifyOtp = async () => {
    if (!selectedIdentifier) return;

    setLoading(true);
    setOtpError('');

    try {
      const verifyRes = await verifyOtp({
        request: {
          request: {
            type: selectedIdentifier.type,
            key: selectedIdentifier.value,
            otp: otp.join(''),
            userId: selectedIdentifier.id
          }
        }
      });

      const resetRes = await resetPassword({
        request: {
          request: {
            type: selectedIdentifier.type,
            key: selectedIdentifier.value,
            userId: selectedIdentifier.id,
            reqData: verifyRes?.data?.result?.reqData
          }
        }
      });

      if (resetRes?.data?.link) {
        window.location.href = resetRes.data.link;
        return;
      }

      throw new Error('Reset password failed');
    } catch (err: any) {
      const remaining = err?.response?.data?.result?.remainingAttempt;

      if (remaining === 0) {
        redirectWithError('You have exceeded maximum retry. Please login again.');
      } else if (remaining) {
        setOtpError(`Invalid OTP. You have ${remaining} attempt(s) remaining.`);
      } else {
        setOtpError('Invalid OTP. Please try again.');
      }

      setOtp(new Array(6).fill(''));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    if (!selectedIdentifier) return;

    if (resendOtpCounter >= maxResendTry) {
      setOtpError('OTP resend maximum retry reached.');
      return;
    }

    if (googleCaptchaSiteKey) {
      captchaRefP2.current?.execute();
    } else {
      executeResendOtp();
    }
  };

  const executeResendOtp = async (captchaResponse?: string) => {
    if (!selectedIdentifier) return;

    setDisableResendOtp(true);

    try {
      await generateOtp({
        request: {
          request: {
            type: selectedIdentifier.type,
            key: selectedIdentifier.value,
            userId: selectedIdentifier.id,
            templateId: 'resetPasswordWithOtp'
          }
        },
        captchaResponse: captchaResponse || ''
      });

      setResendOtpCounter(prev => prev + 1);
    } catch (error: any) {
      if (error?.response?.status === 429) {
        setOtpError(error?.response?.data?.params?.errmsg || 'Too many requests. Please try again later.');
      } else {
        setOtpError('Resend OTP failed. Please try again.');
      }
      captchaRefP2.current?.reset();
      setDisableResendOtp(false);
    }
  };

  return (
    <AuthLayout onClose={() => window.location.href = '/home'}>
      <div className="w-full font-rubik">

        {/* STEP 1 – Identify */}
        {step === 1 && (
          <>
            <Header
              title="Forgot Password?"
              subtitle="Don’t worry! Share your details and we will send you a code to reset your password."
            />

            <div className="space-y-5">
              <div className="form-group mb-5">
                <InputLabel required>Email ID / Mobile Number</InputLabel>
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter Email ID / Mobile Number"
                  className="h-12 !bg-white rounded-[0.625rem] border-[#828282] focus:border-[#A85236] focus:ring-0 focus:shadow-[0_0_0_0.125rem_#fff,0_0_0_0.25rem_#A85236] px-4 text-[0.875rem] placeholder:text-[#B2B2B2]"
                />
                <p className="text-[0.75rem] text-[#757575] mt-1">
                  Email (e.g. user@example.com) or Mobile Number (10 digits starting with 6-9)
                </p>
              </div>

              <div className="form-group mb-5">
                <InputLabel required>Name (as registered)</InputLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name"
                  className="h-12 !bg-white rounded-[0.625rem] border-[#828282] focus:border-[#A85236] focus:ring-0 focus:shadow-[0_0_0_0.125rem_#fff,0_0_0_0.25rem_#A85236] px-4 text-[0.875rem] placeholder:text-[#B2B2B2]"
                />
                {identifierStatus && (
                  <p className="text-red-600 text-sm mt-2">
                    {identifierStatus === 'NOT_MATCHED' &&
                      'Email / mobile number or name does not match'}
                    {identifierStatus === 'MATCHED' &&
                      'Name does not match our records'}
                    {identifierStatus === 'VALIDATING_FAILED' &&
                      'Captcha validation failed'}
                  </p>
                )}
              </div>

              <PrimaryButton
                onClick={handleSubmitIdentify}
                disabled={!isRecoverValid}
                className="mt-8"
              >
                Continue
              </PrimaryButton>

              {googleCaptchaSiteKey && (
                <ReCAPTCHA
                  ref={captchaRefP1}
                  sitekey={googleCaptchaSiteKey}
                  size="invisible"
                  onChange={token => token && initiateFuzzySearch(token)}
                />
              )}
            </div>
          </>
        )}

        {/* STEP 2 – OTP Delivery */}
        {step === 2 && (
          <>
            <Header
              title="Forgot Password"
              subtitle="You will receive an OTP. After you validate it, you can recover your account."
            />

            <div className="space-y-5">
              <p className="text-[0.875rem] font-medium text-center text-[#222222]">
                Where would you like to receive the OTP?
              </p>
              {validIdentifiers.map(identifier => (
                <div
                  key={`${identifier.type}-${identifier.value}`}
                  className={`flex items-center gap-3 p-4 border rounded-[0.625rem] cursor-pointer
                    ${selectedIdentifier?.value === identifier.value
                      ? 'border-[#A85236] bg-[#FFF5F2] shadow-[0_0_0_0.125rem_#fff,0_0_0_0.25rem_#A85236]'
                      : 'border-[#828282] bg-[#ffffff]'}`}
                  onClick={() => setSelectedIdentifier(identifier)}
                >
                  <input
                    type="radio"
                    checked={selectedIdentifier?.value === identifier.value}
                    readOnly
                    className="w-4 h-4 accent-[#A85236]"
                  />
                  <span className="text-[0.875rem] font-medium text-[#4A5568]">{maskIdentifier(identifier.value)}</span>
                </div>
              ))}

              <PrimaryButton
                disabled={!selectedIdentifier || loading}
                onClick={submitGenerateOtp}
              >
                Get OTP
              </PrimaryButton>

              {googleCaptchaSiteKey && (
                <ReCAPTCHA
                  ref={captchaRefP2}
                  sitekey={googleCaptchaSiteKey}
                  size="invisible"
                  onChange={token => token && handleGenerateOtp(token)}
                />
              )}
            </div>
          </>
        )}

        {/* STEP 3 – OTP */}
        {step === 3 && (
          <>
            <Header
              title="Enter the code"
              subtitle="Enter the 6 digit code sent to your phone number and complete the verification"
            />

            <div className="space-y-5">
              <div className="space-y-6">
                <p className="otp-validity-text text-center text-[0.85rem] text-[#4A5568]">
                  OTP is valid for 30 minutes
                </p>

                <div className="otp-container flex justify-between gap-2 max-w-[25rem] mx-auto">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      className="otp-input w-[3.25rem] h-[3.25rem] border-2 border-[#A85236] !bg-white rounded-[0.25rem] text-center text-[1.25rem] focus:outline-none focus:shadow-[0_0_0_0.125rem_rgba(167,58,36,0.2)]"
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        // If deleting
                        if (!val && !e.target.value) {
                          const newOtp = [...otp];
                          newOtp[index] = '';
                          setOtp(newOtp);
                          return;
                        }

                        if (val) {
                          const newOtp = [...otp];
                          newOtp[index] = val;
                          setOtp(newOtp);
                          if (index < 5) {
                            document.getElementById(`otp-${index + 1}`)?.focus();
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[index] && index > 0) {
                          document.getElementById(`otp-${index - 1}`)?.focus();
                        }
                      }}
                    />
                  ))}
                </div>

                <div className="resend-otp-container text-center text-[0.875rem] font-medium text-[#4A5568] mt-6">
                  <button
                    disabled={disableResendOtp}
                    onClick={handleResendOtp}
                    className={`text-[#A85236] font-semibold ml-1 ${disableResendOtp ? 'opacity-50 cursor-not-allowed' : 'hover:underline'
                      }`}
                  >
                    Resend OTP {counter > 0 && `(${counter})`}
                  </button>
                </div>
              </div>

              <PrimaryButton
                disabled={!isOtpValid || loading}
                onClick={handleVerifyOtp}
              >
                Submit OTP
              </PrimaryButton>

              {otpError && (
                <p className="text-red-600 text-sm text-center mt-2">
                  {otpError}
                </p>
              )}

              {googleCaptchaSiteKey && (
                <ReCAPTCHA
                  ref={captchaRefP2}
                  sitekey={googleCaptchaSiteKey}
                  size="invisible"
                  onChange={token => token && executeResendOtp(token)}
                />
              )}
            </div>
          </>
        )}

        {/* STEP 4: Success */}
        {
          step === 4 && (
            <div className="flex flex-col items-center">

              <Header
                title="Congratulations!"
                subtitle="Your password has been successfully reset."
              />

              <div className="flex justify-center mb-10">
                <div className="success-icon w-[4.5rem] h-[4.5rem] rounded-full bg-[#2ECC71] flex items-center justify-center shadow-md">
                  <FiCheck className="text-white text-4xl" />
                </div>
              </div>

              <PrimaryButton
                onClick={() => {
                  window.location.href = '/login';
                }}
              >
                Proceed to Login
              </PrimaryButton>
            </div>
          )
        }

      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;