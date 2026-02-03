
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { AuthLayout } from './AuthLayout';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('AuthLayout', () => {
    const defaultProps = {
        children: <div data-testid="child-content">Child Content</div>,
    };

    it('renders children and static elements correctly', () => {
        render(
            <BrowserRouter>
                <AuthLayout {...defaultProps} />
            </BrowserRouter>
        );

        expect(screen.getByTestId('child-content')).toBeInTheDocument();
        expect(screen.getByText(/Empower your future/i)).toBeInTheDocument();
        expect(screen.getByAltText('Sunbird Logo')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked and onClose prop is provided', () => {
        const onClose = vi.fn();
        render(
            <BrowserRouter>
                <AuthLayout {...defaultProps} onClose={onClose} />
            </BrowserRouter>
        );

        const closeButton = screen.getByRole('button');
        fireEvent.click(closeButton);

        expect(onClose).toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('navigates to "/" when close button is clicked and onClose prop is NOT provided', () => {
        render(
            <BrowserRouter>
                <AuthLayout {...defaultProps} />
            </BrowserRouter>
        );

        const closeButton = screen.getByRole('button');
        fireEvent.click(closeButton);

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
