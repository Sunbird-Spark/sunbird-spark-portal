/* eslint-disable max-lines */
import React, { useState } from 'react';
import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import {
  IDENTIFIER_REGEX,
  OTP_REGEX,
  PASSWORD_REGEX,
  maskIdentifier
} from '@/lib/auth-utils';
import { FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';

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
              </div>

              <PrimaryButton
                disabled={!isRecoverValid}
                onClick={() => setStep(2)}
                className="mt-8"
              >
                Continue
              </PrimaryButton>
            </div>
          </>
        )}

        {/* STEP 2: Delivery Option */}
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

              <div
                className={`flex items-center gap-3 p-4 border rounded-[0.625rem] cursor-pointer transition-all ${isOtpSourceSelected
                  ? 'border-[#A85236] bg-[#FFF5F2] shadow-[0_0_0_0.125rem_#fff,0_0_0_0.25rem_#A85236]'
                  : 'border-[#828282] bg-[#ffffff]'
                  }`}
                onClick={() => setIsOtpSourceSelected(!isOtpSourceSelected)}
              >
                <input
                  type="radio"
                  checked={isOtpSourceSelected}
                  onChange={() => setIsOtpSourceSelected(!isOtpSourceSelected)}
                  className="w-4 h-4 accent-[#A85236]"
                />
                <span className="text-[0.875rem] font-medium text-[#4A5568]">{maskedIdentifier}</span>
              </div>

              <PrimaryButton
                disabled={!isOtpSourceSelected}
                onClick={() => setStep(3)}
              >
                Get OTP
              </PrimaryButton>
            </div>
          </>
        )}

        {/* STEP 3: OTP Verification */}
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
                  <span>04:00 </span>
                  <button className="text-[#A85236] hover:underline font-semibold ml-1">
                    Resend OTP
                  </button>
                </div>
              </div>

              <PrimaryButton
                disabled={!isOtpValid}
                onClick={() => setStep(4)}
              >
                Confirm and Proceed
              </PrimaryButton>
            </div>
          </>
        )}

        {/* STEP 4: Reset Password */}
        {step === 4 && (
          <>
            <Header
              title="Create New Password"
              subtitle="Please choose a strong password to protect your account."
            />

            <div className="space-y-5">
              {/* New Password */}
              <div className="form-group mb-5">
                <InputLabel required>New Password</InputLabel>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter New Password"
                    className="h-12 !bg-white rounded-[0.625rem] border-[#828282] focus:border-[#A85236] focus:ring-0 focus:shadow-[0_0_0_0.125rem_#fff,0_0_0_0.25rem_#A85236] pr-12 px-4 text-[0.875rem] placeholder:text-[#B2B2B2]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#333] p-1"
                  >
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="h-[1.25rem] mt-1">
                  <p className={`passwderr text-[0.75rem] text-[#C53030] ${(!isPasswordValid && password) ? '' : 'invisible'}`}>
                    Password must be 8+ chars with upper, lower, number & special character
                  </p>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group mb-6">
                <InputLabel required>Confirm Password</InputLabel>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className="h-12 !bg-white rounded-[0.625rem] border-[#828282] focus:border-[#A85236] focus:ring-0 focus:shadow-[0_0_0_0.125rem_#fff,0_0_0_0.25rem_#A85236] pr-12 px-4 text-[0.875rem] placeholder:text-[#B2B2B2]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#333] p-1"
                  >
                    {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="h-[1.25rem] mt-1">
                  <p className={`confpasswderr text-[0.75rem] text-[#C53030] ${(confirmPassword && password !== confirmPassword) ? '' : 'invisible'}`}>
                    Passwords do not match
                  </p>
                </div>
              </div>

              <PrimaryButton
                disabled={!isPasswordValid || !isConfirmValid}
                onClick={() => setStep(5)}
                className="mt-6"
              >
                Reset Password
              </PrimaryButton>
            </div>
          </>
        )}

        {/* STEP 5: Success */}
        {
          step === 5 && (
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
                  // Redirect to Keycloak login via /home
                  window.location.href = '/home';
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
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </Button>
);
