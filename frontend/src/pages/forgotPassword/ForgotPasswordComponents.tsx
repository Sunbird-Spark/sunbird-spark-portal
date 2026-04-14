import React from 'react';
import { Button } from '@/components/common/Button';
import { useAppI18n } from '@/hooks/useAppI18n';

export const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="login-header text-center mb-4">
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

export const PrimaryButton = ({ children, onClick, disabled, loading, className = "", ...props }: { children: React.ReactNode, onClick: () => void, disabled?: boolean, loading?: boolean, className?: string, [key: string]: any }) => {
    const { t } = useAppI18n();
    return (
        <Button
            className={`login-primary-button ${className}`}
            onClick={onClick}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? t('confirmDialog.pleaseWait') : children}
        </Button>
    );
};

