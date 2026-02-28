import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TermsAndConditionsDialog } from './TermsAndConditionsDialog';

// Mock react-icons
vi.mock('react-icons/fi', () => ({
    FiX: () => <div data-testid="x-icon" />,
    FiCheck: () => <div data-testid="check-icon" />,
    FiLoader: () => <div data-testid="loader-icon" />,
}));

vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({ t: (key: string) => key }),
}));

describe('TermsAndConditionsDialog', () => {
    const defaultProps = {
        children: <button>Open Terms</button>,
        termsUrl: 'https://example.com/terms',
    };

    it('renders trigger element', () => {
        render(<TermsAndConditionsDialog {...defaultProps} />);
        expect(screen.getByText('Open Terms')).toBeInTheDocument();
    });

    it('opens dialog when trigger is clicked', async () => {
        render(<TermsAndConditionsDialog {...defaultProps} />);
        
        const trigger = screen.getByText('Open Terms');
        fireEvent.click(trigger);

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
    });

    it('displays default title', async () => {
        render(<TermsAndConditionsDialog {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            expect(screen.getByText('footer.terms')).toBeInTheDocument();
        });
    });

    it('displays custom title when provided', async () => {
        render(
            <TermsAndConditionsDialog 
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
        render(<TermsAndConditionsDialog {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            const iframe = screen.getByTitle('footer.terms');
            expect(iframe).toBeInTheDocument();
            expect(iframe).toHaveAttribute('src', 'https://example.com/terms');
        });
    });

    it('iframe has correct sandbox attributes', async () => {
        render(<TermsAndConditionsDialog {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            const iframe = screen.getByTitle('footer.terms');
            expect(iframe).toHaveAttribute('sandbox', 'allow-same-origin allow-scripts');
        });
    });

    it('closes dialog when close button is clicked', async () => {
        render(<TermsAndConditionsDialog {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        const closeButton = screen.getByLabelText('close');
        fireEvent.click(closeButton);

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });

    it('calls onOpenChange when dialog state changes', async () => {
        const onOpenChange = vi.fn();
        render(
            <TermsAndConditionsDialog 
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
            <TermsAndConditionsDialog 
                {...defaultProps} 
                open={false}
            />
        );

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        rerender(
            <TermsAndConditionsDialog 
                {...defaultProps} 
                open={true}
            />
        );

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
    });

    it('renders close icon', async () => {
        render(<TermsAndConditionsDialog {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            expect(screen.getByTestId('x-icon')).toBeInTheDocument();
        });
    });

    it('has accessible description', async () => {
        render(<TermsAndConditionsDialog {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            expect(screen.getByText('termsDialog.description')).toBeInTheDocument();
        });
    });

    it('does not render checkbox and accept button when onAccept is not provided', async () => {
        render(<TermsAndConditionsDialog {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
    });

    it('renders checkbox and accept button when onAccept is provided', async () => {
        const onAccept = vi.fn();
        render(
            <TermsAndConditionsDialog 
                {...defaultProps} 
                onAccept={onAccept}
            />
        );
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        expect(screen.getByRole('checkbox')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('has accept button disabled when checkbox is unchecked', async () => {
        const onAccept = vi.fn();
        render(
            <TermsAndConditionsDialog 
                {...defaultProps} 
                onAccept={onAccept}
            />
        );
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        const continueButton = screen.getByRole('button', { name: /continue/i });
        expect(continueButton).toBeDisabled();
    });

    it('enables accept button when checkbox is checked', async () => {
        const onAccept = vi.fn();
        render(
            <TermsAndConditionsDialog 
                {...defaultProps} 
                onAccept={onAccept}
            />
        );
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);

        const continueButton = screen.getByRole('button', { name: /continue/i });
        expect(continueButton).not.toBeDisabled();
    });

    it('calls onAccept when accept button is clicked with checkbox checked', async () => {
        const onAccept = vi.fn();
        render(
            <TermsAndConditionsDialog 
                {...defaultProps} 
                onAccept={onAccept}
            />
        );
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);

        const continueButton = screen.getByRole('button', { name: /continue/i });
        fireEvent.click(continueButton);

        expect(onAccept).toHaveBeenCalledTimes(1);
    });

    it('does not call onAccept when accept button is clicked without checkbox', async () => {
        const onAccept = vi.fn();
        render(
            <TermsAndConditionsDialog 
                {...defaultProps} 
                onAccept={onAccept}
            />
        );
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        const continueButton = screen.getByRole('button', { name: /continue/i });
        expect(continueButton).toBeDisabled();
        
        // Try to click disabled button
        fireEvent.click(continueButton);
        expect(onAccept).not.toHaveBeenCalled();
    });

    it('shows loading state when isAccepting is true', async () => {
        const onAccept = vi.fn();
        render(
            <TermsAndConditionsDialog 
                {...defaultProps} 
                onAccept={onAccept}
                accepting={true}
            />
        );
        
        fireEvent.click(screen.getByText('Open Terms'));

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
        expect(screen.getByText('Accepting…')).toBeInTheDocument();
        
        const continueButton = screen.getByRole('button', { name: /accepting/i });
        expect(continueButton).toBeDisabled();
    });
});
