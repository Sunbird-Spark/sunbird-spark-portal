import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PublishWarningDialog from './PublishWarningDialog';

vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('./PublishWarningDialog.css', () => ({}));

describe('PublishWarningDialog', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
    };

    it('returns null when isOpen is false', () => {
        const { container } = render(
            <PublishWarningDialog
                isOpen={false}
                onClose={vi.fn()}
                onConfirm={vi.fn()}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders title, content, and buttons when isOpen is true', () => {
        render(<PublishWarningDialog {...defaultProps} />);

        expect(screen.getByText('workspace.review.confirmPublish')).toBeInTheDocument();
        expect(screen.getByText('workspace.review.publishWarningText')).toBeInTheDocument();
        expect(screen.getByText('workspace.review.publishWarningQuestion')).toBeInTheDocument();
        expect(screen.getByText('no')).toBeInTheDocument();
        expect(screen.getByText('yes')).toBeInTheDocument();
    });

    it('calls onClose when No button is clicked', () => {
        const onClose = vi.fn();
        render(<PublishWarningDialog {...defaultProps} onClose={onClose} />);

        fireEvent.click(screen.getByText('no'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when Yes button is clicked', () => {
        const onConfirm = vi.fn();
        render(<PublishWarningDialog {...defaultProps} onConfirm={onConfirm} />);

        fireEvent.click(screen.getByText('yes'));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('disables both buttons when isLoading is true', () => {
        render(<PublishWarningDialog {...defaultProps} isLoading={true} />);

        const noBtn = screen.getByText('no').closest('button')!;
        const yesBtn = screen.getByText('workspace.review.processing').closest('button')!;

        expect(noBtn).toBeDisabled();
        expect(yesBtn).toBeDisabled();
    });

    it('shows "processing" text on Yes button when isLoading is true', () => {
        render(<PublishWarningDialog {...defaultProps} isLoading={true} />);

        expect(screen.getByText('workspace.review.processing')).toBeInTheDocument();
        expect(screen.queryByText('yes')).not.toBeInTheDocument();
    });

    it('shows "yes" text on Yes button when isLoading is false', () => {
        render(<PublishWarningDialog {...defaultProps} isLoading={false} />);

        expect(screen.getByText('yes')).toBeInTheDocument();
        expect(screen.queryByText('workspace.review.processing')).not.toBeInTheDocument();
    });
});
