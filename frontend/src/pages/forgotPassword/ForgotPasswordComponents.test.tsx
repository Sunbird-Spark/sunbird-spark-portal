import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header, InputLabel, PrimaryButton } from './ForgotPasswordComponents';

vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({ t: (key: string) => key }),
}));

describe('ForgotPasswordComponents', () => {
    describe('Header', () => {
        it('renders title and subtitle', () => {
            render(<Header title="Test Title" subtitle="Test Subtitle" />);
            expect(screen.getByText('Test Title')).toBeInTheDocument();
            expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
        });

        it('renders only title when subtitle is missing', () => {
            render(<Header title="Only Title" />);
            expect(screen.getByText('Only Title')).toBeInTheDocument();
            expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
        });
    });

    describe('InputLabel', () => {
        it('renders label text', () => {
            render(<InputLabel>Email Address</InputLabel>);
            expect(screen.getByText('Email Address')).toBeInTheDocument();
        });

        it('renders required star when required is true', () => {
            render(<InputLabel required>Phone Number</InputLabel>);
            expect(screen.getByText('*')).toBeInTheDocument();
        });
    });

    describe('PrimaryButton', () => {
        it('renders button text and handles click', () => {
            const handleClick = vi.fn();
            render(<PrimaryButton onClick={handleClick}>Submit</PrimaryButton>);
            const btn = screen.getByRole('button', { name: 'Submit' });
            fireEvent.click(btn);
            expect(handleClick).toHaveBeenCalled();
        });

        it('shows loading text and is disabled when loading', () => {
            render(<PrimaryButton onClick={() => { }} loading>Submit</PrimaryButton>);
            expect(screen.getByText('confirmDialog.pleaseWait')).toBeInTheDocument();
            expect(screen.getByRole('button')).toBeDisabled();
        });

        it('is disabled when disabled prop is true', () => {
            render(<PrimaryButton onClick={() => { }} disabled>Submit</PrimaryButton>);
            expect(screen.getByRole('button')).toBeDisabled();
        });
    });
});
