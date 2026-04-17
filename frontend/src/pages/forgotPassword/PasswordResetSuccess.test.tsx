import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PasswordResetSuccess from './PasswordResetSuccess';

// Mock AuthLayout — expose onClose via a test button
vi.mock('@/components/auth/AuthLayout', () => ({
    AuthLayout: ({ children, onClose }: any) => (
        <div data-testid="auth-layout">
            <button data-testid="close-btn" onClick={onClose}>Close</button>
            {children}
        </div>
    ),
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
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(window, 'location', {
            value: { href: '' },
            writable: true,
        });
    });

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

    it('clicking Proceed to Login sets window.location.href (line 13)', () => {
        render(<PasswordResetSuccess />);
        fireEvent.click(screen.getByTestId('primary-button'));
        // getSafeRedirectUrl is mocked to return '/portal/login?prompt=none'
        expect(window.location.href).toBe('/portal/login?prompt=none');
    });

    it('AuthLayout onClose sets window.location.href (line 17)', () => {
        render(<PasswordResetSuccess />);
        fireEvent.click(screen.getByTestId('close-btn'));
        expect(window.location.href).toBe('/portal/login?prompt=none');
    });
});
