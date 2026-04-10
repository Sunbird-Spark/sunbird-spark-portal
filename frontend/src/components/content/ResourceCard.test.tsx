import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResourceCard from './ResourceCard';
import type { ContentSearchItem } from '@/types/workspaceTypes';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, opts?: any) => opts?.defaultValue ?? key,
  }),
}));

vi.mock('@/utils/getPlaceholderImage', () => ({
  getPlaceholderImage: (id: string) => `https://placeholder.com/${id}.png`,
}));

const makeItem = (overrides: Partial<ContentSearchItem> = {}): ContentSearchItem => ({
  identifier: 'content-123',
  name: 'Test Resource',
  mimeType: 'application/pdf',
  posterImage: '',
  appIcon: '',
  ...overrides,
} as ContentSearchItem);

const renderCard = (item: ContentSearchItem, props: any = {}) =>
  render(
    <MemoryRouter>
      <ResourceCard item={item} {...props} />
    </MemoryRouter>
  );

describe('ResourceCard', () => {
  it('renders the item name', () => {
    renderCard(makeItem({ name: 'My PDF Resource' }));
    expect(screen.getAllByText('My PDF Resource').length).toBeGreaterThan(0);
  });

  it('renders Untitled when name is missing (line 67)', () => {
    renderCard(makeItem({ name: '' }));
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('renders PDF badge for application/pdf (line 26)', () => {
    renderCard(makeItem({ mimeType: 'application/pdf' }));
    expect(screen.getAllByText('PDF').length).toBeGreaterThan(0);
  });

  it('renders Video badge for video/x-youtube (line 20)', () => {
    renderCard(makeItem({ mimeType: 'video/x-youtube' }));
    expect(screen.getAllByText('Video').length).toBeGreaterThan(0);
  });

  it('renders Video badge for video/mp4 (line 22)', () => {
    renderCard(makeItem({ mimeType: 'video/mp4' }));
    expect(screen.getAllByText('Video').length).toBeGreaterThan(0);
  });

  it('renders Video badge for video/webm (line 21)', () => {
    renderCard(makeItem({ mimeType: 'video/webm' }));
    expect(screen.getAllByText('Video').length).toBeGreaterThan(0);
  });

  it('renders HTML badge for html-archive (line 27)', () => {
    renderCard(makeItem({ mimeType: 'application/vnd.ekstep.html-archive' }));
    expect(screen.getAllByText('HTML').length).toBeGreaterThan(0);
  });

  it('renders EPUB badge for application/epub (line 28)', () => {
    renderCard(makeItem({ mimeType: 'application/epub' }));
    expect(screen.getAllByText('EPUB').length).toBeGreaterThan(0);
  });

  it('renders ECML badge for ecml-archive (line 29)', () => {
    renderCard(makeItem({ mimeType: 'application/vnd.ekstep.ecml-archive' }));
    expect(screen.getAllByText('ECML').length).toBeGreaterThan(0);
  });

  it('renders H5P badge for h5p-archive (line 30)', () => {
    renderCard(makeItem({ mimeType: 'application/vnd.ekstep.h5p-archive' }));
    expect(screen.getAllByText('H5P').length).toBeGreaterThan(0);
  });

  it('renders View badge for unknown mimeType (default case, line 32)', () => {
    renderCard(makeItem({ mimeType: 'application/unknown' }));
    expect(screen.getAllByText('View').length).toBeGreaterThan(0);
  });

  it('renders View badge when mimeType is undefined', () => {
    renderCard(makeItem({ mimeType: undefined }));
    expect(screen.getAllByText('View').length).toBeGreaterThan(0);
  });

  it('links to /content/{identifier}', () => {
    renderCard(makeItem({ identifier: 'abc-123' }));
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/content/abc-123');
  });

  it('uses posterImage as img src when available', () => {
    renderCard(makeItem({ posterImage: 'https://poster.png', appIcon: '' }));
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://poster.png');
  });

  it('falls back to appIcon when posterImage is missing', () => {
    renderCard(makeItem({ posterImage: '', appIcon: 'https://icon.png' }));
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://icon.png');
  });

  it('falls back to placeholder image when both posterImage and appIcon are missing', () => {
    renderCard(makeItem({ identifier: 'xyz', posterImage: '', appIcon: '' }));
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://placeholder.com/xyz.png');
  });

  it('passes heightClass when provided', () => {
    const { container } = renderCard(makeItem(), { heightClass: 'h-64' });
    const div = container.querySelector('.resource-card-container');
    expect(div?.className).toContain('h-64');
  });

  it('uses default height when heightClass not provided', () => {
    const { container } = renderCard(makeItem());
    const div = container.querySelector('.resource-card-container');
    expect(div?.className).not.toContain('undefined');
  });

  it('has correct data attributes for telemetry', () => {
    renderCard(makeItem({ identifier: 'tel-id' }));
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('data-edataid', 'resource-card-click');
    expect(link).toHaveAttribute('data-objectid', 'tel-id');
    expect(link).toHaveAttribute('data-objecttype', 'Content');
  });
});
