import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthLayout } from '../auth/AuthLayout';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('AuthLayout', () => {
    it('renders children correctly', () => {
        render(
            <BrowserRouter>
                <AuthLayout>
                    <div data-testid="child">Test Child</div>
                </AuthLayout>
            </BrowserRouter>
        );
        expect(screen.getByTestId('child')).toBeInTheDocument();
        expect(screen.getByAltText('Sunbird Logo')).toBeInTheDocument();
    });

    it('calls onClose when provided and close button is clicked', () => {
        const onClose = vi.fn();
        render(
            <BrowserRouter>
                <AuthLayout onClose={onClose}>
                    <div>Content</div>
                </AuthLayout>
            </BrowserRouter>
        );

        fireEvent.click(screen.getByRole('button'));
        expect(onClose).toHaveBeenCalled();
    });

    it('navigates to home when onClose is not provided and close button is clicked', () => {
        render(
            <BrowserRouter>
                <AuthLayout>
                    <div>Content</div>
                </AuthLayout>
            </BrowserRouter>
        );

        fireEvent.click(screen.getByRole('button'));
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('renders the logo with a link to home', () => {
        render(
            <BrowserRouter>
                <AuthLayout>
                    <div>Content</div>
                </AuthLayout>
            </BrowserRouter>
        );

        const logoLink = screen.getByRole('link');
        expect(logoLink).toHaveAttribute('href', '/');
    });
});
