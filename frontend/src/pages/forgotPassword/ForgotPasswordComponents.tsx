import React from 'react';
import { Button } from '@/components/common/Button';

export const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="login-header text-center mb-8">
        <h1 className="login-header-title">{title}</h1>
        {subtitle && <p className="login-header-subtitle">{subtitle}</p>}
    </div>
);

export const InputLabel = ({ children, htmlFor, required }: { children: React.ReactNode, htmlFor?: string, required?: boolean }) => (
    <label htmlFor={htmlFor} className="login-input-label">
        {children}
        {required && <span className="required-asterisk">*</span>}
    </label>
);

export const PrimaryButton = ({ children, onClick, disabled, loading, className = "" }: { children: React.ReactNode, onClick: () => void, disabled?: boolean, loading?: boolean, className?: string }) => (
    <Button
        className={`login-primary-button ${className}`}
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
        <div className="otp-input-container">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    className="otp-digit-input"
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
