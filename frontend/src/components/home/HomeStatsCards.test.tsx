import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomeStatsCards from './HomeStatsCards';

describe('HomeStatsCards', () => {
    it('renders all four stats cards with correct labels and values', () => {
        render(<HomeStatsCards />);

        // Total Contents Card
        expect(screen.getByText('Total Contents')).toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument();

        // Contents in Progress Card
        expect(screen.getByText('Contents in Progress')).toBeInTheDocument();
        expect(screen.getByText('05')).toBeInTheDocument();

        // Contents Completed Card
        expect(screen.getByText('Contents Completed')).toBeInTheDocument();
        expect(screen.getByText('13')).toBeInTheDocument();

        // Certifications Earned Card
        expect(screen.getByText('Certifications Earned')).toBeInTheDocument();
        expect(screen.getByText('06')).toBeInTheDocument();
    });

    it('applies correct background classes to cards', () => {
        render(<HomeStatsCards />);

        const totalCard = screen.getByText('Total Contents').closest('.home-stat-card');
        expect(totalCard).toHaveClass('bg-sunbird-blue-light');

        const progressCard = screen.getByText('Contents in Progress').closest('.home-stat-card');
        expect(progressCard).toHaveClass('bg-sunbird-ginger');

        const completedCard = screen.getByText('Contents Completed').closest('.home-stat-card');
        expect(completedCard).toHaveClass('bg-sunbird-moss');

        const certsCard = screen.getByText('Certifications Earned').closest('.home-stat-card');
        expect(certsCard).toHaveClass('bg-sunbird-lavender');
    });

    it('renders icons for each card', () => {
        const { container } = render(<HomeStatsCards />);

        // Check for presence of SVG icons (each card has one)
        const icons = container.querySelectorAll('svg');
        expect(icons.length).toBe(4);
    });
});
