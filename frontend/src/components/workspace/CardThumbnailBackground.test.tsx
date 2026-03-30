import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import CardThumbnailBackground from './CardThumbnailBackground';

/* ─── Mock the SVG pattern components ─── */
vi.mock('./CardThumbnailPatterns', () => ({
    WavePatternSVG: (props: { theme: { id: string } }) => (
        <div data-testid="wave-pattern" data-theme-id={props.theme.id} />
    ),
    BlobPatternSVG: (props: { theme: { id: string } }) => (
        <div data-testid="blob-pattern" data-theme-id={props.theme.id} />
    ),
    OrbPatternSVG: (props: { theme: { id: string } }) => (
        <div data-testid="orb-pattern" data-theme-id={props.theme.id} />
    ),
    DiamondPatternSVG: (props: { theme: { id: string } }) => (
        <div data-testid="diamond-pattern" data-theme-id={props.theme.id} />
    ),
}));

describe('CardThumbnailBackground', () => {
    /* ─── Pattern selection by type ─── */

    describe('pattern selection', () => {
        it('renders WavePatternSVG for course type', () => {
            const { getByTestId, queryByTestId } = render(
                <CardThumbnailBackground type="course" />
            );
            expect(getByTestId('wave-pattern')).toBeInTheDocument();
            expect(queryByTestId('blob-pattern')).not.toBeInTheDocument();
        });

        it('renders BlobPatternSVG for content type', () => {
            const { getByTestId, queryByTestId } = render(
                <CardThumbnailBackground type="content" />
            );
            expect(getByTestId('blob-pattern')).toBeInTheDocument();
            expect(queryByTestId('wave-pattern')).not.toBeInTheDocument();
        });

        it('renders OrbPatternSVG for quiz type', () => {
            const { getByTestId, queryByTestId } = render(
                <CardThumbnailBackground type="quiz" />
            );
            expect(getByTestId('orb-pattern')).toBeInTheDocument();
            expect(queryByTestId('diamond-pattern')).not.toBeInTheDocument();
        });

        it('renders DiamondPatternSVG for collection type', () => {
            const { getByTestId, queryByTestId } = render(
                <CardThumbnailBackground type="collection" />
            );
            expect(getByTestId('diamond-pattern')).toBeInTheDocument();
            expect(queryByTestId('orb-pattern')).not.toBeInTheDocument();
        });
    });

    /* ─── Theme application ─── */

    describe('theme application', () => {
        it('passes course theme to pattern SVG when type is course', () => {
            const { getByTestId } = render(
                <CardThumbnailBackground type="course" />
            );
            // Fallback for course type uses the 'course' theme with id 'crs'
            expect(getByTestId('wave-pattern').getAttribute('data-theme-id')).toBe('crs');
        });

        it('uses primaryCategory theme when provided', () => {
            const { getByTestId } = render(
                <CardThumbnailBackground type="content" primaryCategory="Learning Resource" />
            );
            // 'Learning Resource' maps to theme id 'lrs'
            expect(getByTestId('blob-pattern').getAttribute('data-theme-id')).toBe('lrs');
        });

        it('falls back to type theme when primaryCategory is unknown', () => {
            const { getByTestId } = render(
                <CardThumbnailBackground type="quiz" primaryCategory="Unknown Category" />
            );
            // Fallback for quiz uses 'Practice Question Set' theme id 'pqs'
            expect(getByTestId('orb-pattern').getAttribute('data-theme-id')).toBe('pqs');
        });

        it('uses Digital Textbook theme when primaryCategory is "Digital Textbook"', () => {
            const { getByTestId } = render(
                <CardThumbnailBackground type="course" primaryCategory="Digital Textbook" />
            );
            expect(getByTestId('wave-pattern').getAttribute('data-theme-id')).toBe('dtb');
        });

        it('uses eTextbook theme when primaryCategory is "eTextbook"', () => {
            const { getByTestId } = render(
                <CardThumbnailBackground type="content" primaryCategory="eTextbook" />
            );
            expect(getByTestId('blob-pattern').getAttribute('data-theme-id')).toBe('etb');
        });

        it('uses Content Playlist theme for collection type fallback', () => {
            const { getByTestId } = render(
                <CardThumbnailBackground type="collection" />
            );
            expect(getByTestId('diamond-pattern').getAttribute('data-theme-id')).toBe('cpl');
        });
    });

    /* ─── Icon rendering ─── */

    describe('icon rendering', () => {
        it('renders an icon element inside the component', () => {
            const { container } = render(
                <CardThumbnailBackground type="content" primaryCategory="Learning Resource" />
            );
            // The icon should be rendered with the z-10 class via cn()
            const iconEl = container.querySelector('.relative.z-10');
            expect(iconEl).toBeInTheDocument();
        });

        it('applies large icon size classes by default', () => {
            const { container } = render(
                <CardThumbnailBackground type="course" />
            );
            const iconEl = container.querySelector('.relative.z-10');
            expect(iconEl).toHaveClass('w-12', 'h-12');
        });

        it('applies small icon size classes when iconSize="sm"', () => {
            const { container } = render(
                <CardThumbnailBackground type="course" iconSize="sm" />
            );
            const iconEl = container.querySelector('.relative.z-10');
            expect(iconEl).toHaveClass('w-4', 'h-4');
        });

        it('applies theme iconColor to the icon style', () => {
            const { container } = render(
                <CardThumbnailBackground type="course" />
            );
            const iconEl = container.querySelector('.relative.z-10') as HTMLElement;
            expect(iconEl).toBeTruthy();
            // Course fallback theme has iconColor using Sunbird ink color
            expect(iconEl.style.color).toBe('hsl(var(--sunbird-ink))');
        });

        it('applies opacity and drop-shadow filter to icon', () => {
            const { container } = render(
                <CardThumbnailBackground type="content" />
            );
            const iconEl = container.querySelector('.relative.z-10') as HTMLElement;
            expect(iconEl.style.opacity).toBe('0.7');
            expect(iconEl.style.filter).toContain('drop-shadow');
        });
    });

    /* ─── Container structure ─── */

    describe('container structure', () => {
        it('wraps content in a group-hover container with transition', () => {
            const { container } = render(
                <CardThumbnailBackground type="course" />
            );
            const wrapper = container.firstElementChild as HTMLElement;
            expect(wrapper).toHaveClass('relative', 'w-full', 'h-full');
            expect(wrapper.className).toContain('group-hover:scale-105');
            expect(wrapper.className).toContain('transition-transform');
        });

        it('centers the icon within the overlay', () => {
            const { container } = render(
                <CardThumbnailBackground type="content" />
            );
            const centering = container.querySelector('.absolute.inset-0.flex.items-center.justify-center');
            expect(centering).toBeInTheDocument();
        });
    });

    /* ─── primaryCategory case insensitivity ─── */

    describe('primaryCategory case insensitivity', () => {
        afterEach(() => cleanup());

        it('matches primaryCategory regardless of case', () => {
            const { getByTestId } = render(
                <CardThumbnailBackground type="course" primaryCategory="course" />
            );
            const lowerId = getByTestId('wave-pattern').getAttribute('data-theme-id');
            cleanup();

            const { getByTestId: getById2 } = render(
                <CardThumbnailBackground type="course" primaryCategory="Course" />
            );
            const upperId = getById2('wave-pattern').getAttribute('data-theme-id');

            expect(lowerId).toBe(upperId);
        });
    });
});
