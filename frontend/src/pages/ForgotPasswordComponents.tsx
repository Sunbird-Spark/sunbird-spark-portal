import React from 'react';
import { Button } from '@/components/button';

export const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="login-header text-center mb-8">
        <h1 className="welcome-title !font-rubik text-[1.875rem] font-semibold text-[#222222] leading-[1.875rem] mb-2">{title}</h1>
        {subtitle && <p className="welcome-subtitle text-[0.875rem] font-normal text-[#757575] leading-relaxed mx-auto max-w-[20rem]">{subtitle}</p>}
    </div>
);

export const InputLabel = ({ children, htmlFor, required }: { children: React.ReactNode, htmlFor?: string, required?: boolean }) => (
    <label htmlFor={htmlFor} className="block text-[0.875rem] font-medium text-[#333] mb-2">
        {children}
        {required && <span className="text-black ml-1">*</span>}
    </label>
);

export const PrimaryButton = ({ children, onClick, disabled, loading, className = "" }: { children: React.ReactNode, onClick: () => void, disabled?: boolean, loading?: boolean, className?: string }) => (
    <Button
        className={`login-button w-full h-[3.25rem] bg-[#A85236] !bg-[#A85236] text-white text-[1rem] font-medium rounded-[0.625rem] shadow-none border-none transition-all ${className}`}
        onClick={onClick}
        disabled={disabled || loading}
    >
        {loading ? 'Please wait…' : children}
    </Button>
);

interface OTPInputProps {
    otp: string[];
    setOtp: (otp: string[]) => void;
}

export const OTPInput: React.FC<OTPInputProps> = ({ otp, setOtp }) => {
    return (
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
    );
};
