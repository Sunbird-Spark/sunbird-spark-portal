import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ComponentProps } from 'react';
import RatingDialog from './RatingDialog';

const { mockFeedback } = vi.hoisted(() => ({ mockFeedback: vi.fn() }));

vi.mock('@project-sunbird/telemetry-sdk', () => ({
    $t: { feedback: mockFeedback },
}));

vi.mock('@/assets/rating-popup-check.svg', () => ({ default: 'rating-popup-check.svg' }));

vi.mock('react-icons/fi', () => ({
    FiX: () => <svg data-testid="close-icon" />,
    FiStar: ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
        <svg data-testid="star-icon" className={className} style={style} />
    ),
}));

describe('RatingDialog', () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    const defaultProps: ComponentProps<typeof RatingDialog> = {
        open: true,
        onClose,
    };

    const renderDialog = (props?: Partial<ComponentProps<typeof RatingDialog>>) =>
        render(<RatingDialog {...defaultProps} {...props} />);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Visibility ──────────────────────────────────────────────────────────

    it('renders nothing when closed', () => {
        const { container } = renderDialog({ open: false });
        expect(container).toBeEmptyDOMElement();
    });

    it('renders the overlay when open', () => {
        const { container } = renderDialog();
        expect(container.querySelector('img')).toBeInTheDocument();
        expect(screen.getByText('We would love to hear from you')).toBeInTheDocument();
        expect(screen.getByText('How was your learning experience today?')).toBeInTheDocument();
    });

    // ── Static content ───────────────────────────────────────────────────────

    it('renders the seal badge image', () => {
        const { container } = renderDialog();
        const img = container.querySelector('img');
        expect(img).toHaveAttribute('src', 'rating-popup-check.svg');
        expect(img).toHaveAttribute('alt', '');
    });

    it('renders five star buttons', () => {
        renderDialog();
        const starButtons = [1, 2, 3, 4, 5].map((n) =>
            screen.getByRole('button', { name: `Rate ${n} star${n > 1 ? 's' : ''}` })
        );
        expect(starButtons).toHaveLength(5);
    });

    it('renders the submit button', () => {
        renderDialog();
        expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('renders the close button', () => {
        renderDialog();
        expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    // ── Submit disabled state ────────────────────────────────────────────────

    it('submit button is disabled when no star is selected', () => {
        renderDialog();
        expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    });

    it('submit button is enabled after selecting a star', () => {
        renderDialog();
        fireEvent.click(screen.getByRole('button', { name: 'Rate 3 stars' }));
        expect(screen.getByRole('button', { name: 'Submit' })).not.toBeDisabled();
    });

    // ── Star interaction ─────────────────────────────────────────────────────

    it('selects a star on click', () => {
        renderDialog();
        fireEvent.click(screen.getByRole('button', { name: 'Rate 4 stars' }));
        expect(screen.getByRole('button', { name: 'Submit' })).not.toBeDisabled();
    });

    it('allows changing the selected star', () => {
        renderDialog();
        fireEvent.click(screen.getByRole('button', { name: 'Rate 2 stars' }));
        fireEvent.click(screen.getByRole('button', { name: 'Rate 5 stars' }));
        // submit should still be enabled (rating changed but still set)
        expect(screen.getByRole('button', { name: 'Submit' })).not.toBeDisabled();
    });

    // ── Close behaviour ──────────────────────────────────────────────────────

    it('calls onClose when close button is clicked', () => {
        renderDialog();
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('resets rating to 0 when close button is clicked', () => {
        renderDialog({ onClose, onSubmit });
        fireEvent.click(screen.getByRole('button', { name: 'Rate 3 stars' }));
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        // Re-open: submit should be disabled again (rating reset)
        renderDialog({ onClose, onSubmit });
        expect(screen.getAllByRole('button', { name: 'Submit' })[0]).toBeDisabled();
    });

    // ── Submit behaviour ─────────────────────────────────────────────────────

    it('calls onSubmit with the selected rating', () => {
        renderDialog({ onSubmit });
        fireEvent.click(screen.getByRole('button', { name: 'Rate 4 stars' }));
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
        expect(onSubmit).toHaveBeenCalledWith(4);
    });

    it('calls onClose after submit', () => {
        renderDialog({ onSubmit });
        fireEvent.click(screen.getByRole('button', { name: 'Rate 2 stars' }));
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    // ── Telemetry feedback ───────────────────────────────────────────────────

    it('fires $t.feedback with rating and content metadata on submit', () => {
        const contentMeta = { id: 'do_123', type: 'Resource', ver: '2' };
        renderDialog({ onSubmit, contentMeta });
        fireEvent.click(screen.getByRole('button', { name: 'Rate 5 stars' }));
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
        expect(mockFeedback).toHaveBeenCalledWith(
            { edata: { rating: 5 }, object: { id: 'do_123', type: 'Resource', ver: '2' } }
        );
    });

    it('uses default type "Content" and ver "1" when not provided', () => {
        const contentMeta = { id: 'do_456' };
        renderDialog({ onSubmit, contentMeta });
        fireEvent.click(screen.getByRole('button', { name: 'Rate 3 stars' }));
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
        expect(mockFeedback).toHaveBeenCalledWith(
            { edata: { rating: 3 }, object: { id: 'do_456', type: 'Content', ver: '1' } }
        );
    });

    it('does not call $t.feedback when contentMeta is not provided', () => {
        renderDialog({ onSubmit });
        fireEvent.click(screen.getByRole('button', { name: 'Rate 1 star' }));
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
        expect(mockFeedback).not.toHaveBeenCalled();
    });

    it('does not call $t.feedback when contentMeta has no id', () => {
        renderDialog({ onSubmit, contentMeta: { id: '' } });
        fireEvent.click(screen.getByRole('button', { name: 'Rate 2 stars' }));
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
        expect(mockFeedback).not.toHaveBeenCalled();
    });
});
