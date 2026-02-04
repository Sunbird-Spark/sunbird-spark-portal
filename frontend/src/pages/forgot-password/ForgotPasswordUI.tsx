import React from 'react';
import { Button } from '@/components/button';

export const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="login-header text-center mb-8">
        <h1 className="welcome-title !font-rubik text-[1.875rem] font-semibold text-sunbird-ink leading-[1.875rem] mb-2">{title}</h1>
        {subtitle && <p className="welcome-subtitle text-[0.875rem] font-normal text-sunbird-ink leading-relaxed mx-auto max-w-[20rem]">{subtitle}</p>}
    </div>
);

export const InputLabel = ({ children, htmlFor, required }: { children: React.ReactNode, htmlFor?: string, required?: boolean }) => (
    <label htmlFor={htmlFor} className="block text-[0.875rem] font-medium text-sunbird-ink mb-2">
        {children}
        {required && <span className="text-black ml-1">*</span>}
    </label>
);

export const PrimaryButton = ({ children, onClick, disabled, className = "" }: { children: React.ReactNode, onClick: () => void, disabled?: boolean, className?: string }) => (
    <Button
        className={`login-button w-full h-[3.25rem] bg-sunbird-brick !bg-sunbird-brick text-white text-[1rem] font-medium rounded-[0.625rem] shadow-none border-none transition-all ${className}`}
        disabled={disabled}
        onClick={onClick}
    >
        {children}
    </Button>
);
