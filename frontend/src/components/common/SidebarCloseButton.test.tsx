import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import SidebarCloseButton from './SidebarCloseButton';

const { mockDir } = vi.hoisted(() => ({ mockDir: { value: 'ltr' } }));

vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({
        t: (key: string) => key,
        dir: mockDir.value,
    }),
}));

describe('SidebarCloseButton', () => {
    const mockClick = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockDir.value = 'ltr';
    });

    it('calls onClick when button is clicked', () => {
        render(<SidebarCloseButton onClick={mockClick} />);
        fireEvent.click(screen.getByRole('button'));
        expect(mockClick).toHaveBeenCalledTimes(1);
    });

    describe('LTR rotation', () => {
        it('applies rotate-180 when collapsed=true in LTR', () => {
            const { container } = render(<SidebarCloseButton onClick={mockClick} collapsed={true} />);
            const svg = container.querySelector('svg');
            expect(svg?.className).toContain('rotate-180');
        });

        it('applies rotate-0 when collapsed=false in LTR', () => {
            const { container } = render(<SidebarCloseButton onClick={mockClick} collapsed={false} />);
            const svg = container.querySelector('svg');
            expect(svg?.className).toContain('rotate-0');
        });

        it('defaults to collapsed=false (rotate-0) when collapsed is not provided', () => {
            const { container } = render(<SidebarCloseButton onClick={mockClick} />);
            const svg = container.querySelector('svg');
            expect(svg?.className).toContain('rotate-0');
        });
    });

    describe('RTL rotation (line 18)', () => {
        beforeEach(() => {
            mockDir.value = 'rtl';
        });

        it('applies rotate-0 when collapsed=true in RTL', () => {
            const { container } = render(<SidebarCloseButton onClick={mockClick} collapsed={true} />);
            const svg = container.querySelector('svg');
            expect(svg?.className).toContain('rotate-0');
        });

        it('applies rotate-180 when collapsed=false in RTL', () => {
            const { container } = render(<SidebarCloseButton onClick={mockClick} collapsed={false} />);
            const svg = container.querySelector('svg');
            expect(svg?.className).toContain('rotate-180');
        });
    });

    describe('aria-label', () => {
        it('uses sidebar.expand label when collapsed', () => {
            render(<SidebarCloseButton onClick={mockClick} collapsed={true} />);
            expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'sidebar.expand');
        });

        it('uses sidebar.collapse label when not collapsed', () => {
            render(<SidebarCloseButton onClick={mockClick} collapsed={false} />);
            expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'sidebar.collapse');
        });
    });
});
