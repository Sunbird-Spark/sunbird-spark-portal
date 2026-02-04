import React from 'react';
import { Button } from '@/components/button';

export const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="fp-header-container">
        <h1 className="fp-header-title">{title}</h1>
        {subtitle && <p className="fp-header-subtitle">{subtitle}</p>}
    </div>
);

export const InputLabel = ({ children, htmlFor, required }: { children: React.ReactNode, htmlFor?: string, required?: boolean }) => (
    <label htmlFor={htmlFor} className="fp-input-label">
        {children}
        {required && <span className="text-black ml-1">*</span>}
    </label>
);

export const PrimaryButton = ({ children, onClick, disabled, className = "" }: { children: React.ReactNode, onClick: () => void, disabled?: boolean, className?: string }) => (
    <Button
        className={`fp-primary-btn ${className}`}
        disabled={disabled}
        onClick={onClick}
    >
        {children}
    </Button>
);
