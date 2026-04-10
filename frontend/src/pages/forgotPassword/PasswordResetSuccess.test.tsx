import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import PasswordResetSuccess from './PasswordResetSuccess';

// Mock AuthLayout
vi.mock('@/components/auth/AuthLayout', () => ({
    AuthLayout: ({ children }: any) => <div data-testid="auth-layout">{children}</div>,
}));

// Mock ForgotPasswordComponents
vi.mock('./ForgotPasswordComponents', () => ({
    Header: ({ title, subtitle }: any) => (
        <div data-testid="header">
            <span data-testid="header-title">{title}</span>
            <span data-testid="header-subtitle">{subtitle}</span>
        </div>
    ),
    PrimaryButton: ({ children, onClick }: any) => (
        <button data-testid="primary-button" onClick={onClick}>{children}</button>
    ),
}));

// Mock forgotPasswordUtils
vi.mock('@/utils/forgotPasswordUtils', () => ({
    getSafeRedirectUrl: vi.fn(() => '/portal/login?prompt=none'),
    isMobileApp: vi.fn(() => false),
}));

// Mock useAppI18n with translated strings
const mockT = vi.fn((key: string, opts?: { defaultValue?: string }) => {
    const translations: Record<string, string> = {
        'passwordReset.congratulations': 'Félicitations !',
        'passwordReset.successMessage': 'Votre mot de passe a été réinitialisé avec succès.',
        'passwordReset.proceedToLogin': 'Passer à la connexion',
    };
    return translations[key] ?? opts?.defaultValue ?? key;
});

vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({
        t: mockT,
        dir: 'ltr',
        isRTL: false,
    }),
}));

describe('PasswordResetSuccess', () => {
    it('renders translated strings via t()', () => {
        render(<PasswordResetSuccess />);

        expect(screen.getByTestId('header-title')).toHaveTextContent('Félicitations !');
        expect(screen.getByTestId('header-subtitle')).toHaveTextContent('Votre mot de passe a été réinitialisé avec succès.');
        expect(screen.getByTestId('primary-button')).toHaveTextContent('Passer à la connexion');
    });

    it('calls t() with the correct i18n keys', () => {
        render(<PasswordResetSuccess />);

        expect(mockT).toHaveBeenCalledWith('passwordReset.congratulations', expect.any(Object));
        expect(mockT).toHaveBeenCalledWith('passwordReset.successMessage', expect.any(Object));
        expect(mockT).toHaveBeenCalledWith('passwordReset.proceedToLogin', expect.any(Object));
    });
});
