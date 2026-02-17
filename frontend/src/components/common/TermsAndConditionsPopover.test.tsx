import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TermsAndConditionsPopover } from './TermsAndConditionsPopover';

// Mock react-icons
vi.mock('react-icons/fi', () => ({
    FiX: () => <div data-testid="x-icon" />
}));

describe('TermsAndConditionsPopover', () => {
    const defaultProps = {
        children: <button>Open Terms</button>,
        termsUrl: 'https://example.com/terms',
    };

    it('renders trigger element', () => {
        render(<TermsAndConditionsPopover {...defaultProps} />);
        expect(screen.getByText('Open Terms')).toBeInTheDocument();
    });

    it('opens dialog when trigger is clicked', async () => {
        render(<TermsAndConditionsPopover {...defaultProps} />);
        
        const trigger = screen.getByText('Open Terms');
        fireEvent.click(trigger);

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
    });

    it('displays default title', async () => {
        render(<TermsAndConditionsPopover {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            expect(screen.getByText('Terms and Conditions')).toBeInTheDocument();
        });
    });

    it('displays custom title when provided', async () => {
        render(
            <TermsAndConditionsPopover 
                {...defaultProps} 
                title="Custom Terms Title"
            />
        );
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            expect(screen.getByText('Custom Terms Title')).toBeInTheDocument();
        });
    });

    it('renders iframe with correct src', async () => {
        render(<TermsAndConditionsPopover {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            const iframe = screen.getByTitle('Terms and Conditions');
            expect(iframe).toBeInTheDocument();
            expect(iframe).toHaveAttribute('src', 'https://example.com/terms');
        });
    });

    it('iframe has correct sandbox attributes', async () => {
        render(<TermsAndConditionsPopover {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            const iframe = screen.getByTitle('Terms and Conditions');
            expect(iframe).toHaveAttribute('sandbox', 'allow-same-origin allow-scripts');
        });
    });

    it('closes dialog when close button is clicked', async () => {
        render(<TermsAndConditionsPopover {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        const closeButton = screen.getByLabelText('Close');
        fireEvent.click(closeButton);

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });

    it('calls onOpenChange when dialog state changes', async () => {
        const onOpenChange = vi.fn();
        render(
            <TermsAndConditionsPopover 
                {...defaultProps} 
                onOpenChange={onOpenChange}
            />
        );
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            expect(onOpenChange).toHaveBeenCalledWith(true);
        });
    });

    it('can be controlled with open prop', async () => {
        const { rerender } = render(
            <TermsAndConditionsPopover 
                {...defaultProps} 
                open={false}
            />
        );

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        rerender(
            <TermsAndConditionsPopover 
                {...defaultProps} 
                open={true}
            />
        );

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
    });

    it('renders close icon', async () => {
        render(<TermsAndConditionsPopover {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            expect(screen.getByTestId('x-icon')).toBeInTheDocument();
        });
    });

    it('has accessible description', async () => {
        render(<TermsAndConditionsPopover {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            expect(screen.getByText('View and read the terms and conditions document')).toBeInTheDocument();
        });
    });
});
