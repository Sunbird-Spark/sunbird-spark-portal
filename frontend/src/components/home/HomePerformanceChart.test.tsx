import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePerformanceChart from './HomePerformanceChart';

describe('HomePerformanceChart', () => {
    it('renders the chart title', () => {
        render(<HomePerformanceChart />);
        expect(screen.getByText('Performance')).toBeInTheDocument();
    });

    it('renders all month labels', () => {
        render(<HomePerformanceChart />);
        expect(screen.getByText('Jan')).toBeInTheDocument();
        expect(screen.getByText('Feb')).toBeInTheDocument();
        expect(screen.getByText('Mar')).toBeInTheDocument();
        expect(screen.getByText('Apr')).toBeInTheDocument();
        expect(screen.getByText('May')).toBeInTheDocument();
        expect(screen.getByText('Jun')).toBeInTheDocument();
    });

    it('displays the productivity percentage and description', () => {
        render(<HomePerformanceChart />);
        expect(screen.getByText('40%')).toBeInTheDocument();
        expect(screen.getByText(/Your productivity is 40% higher/)).toBeInTheDocument();
    });

    it('renders the SVG chart elements', () => {
        const { container } = render(<HomePerformanceChart />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();

        // Check for specific SVG elements like path and filter
        expect(container.querySelector('path')).toBeInTheDocument();
        expect(container.querySelector('filter')).toBeInTheDocument();
    });
});
