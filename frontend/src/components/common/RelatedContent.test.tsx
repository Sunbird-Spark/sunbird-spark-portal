import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RelatedContent from './RelatedContent';
import type { ContentSearchItem } from '@/types/workspaceTypes';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
    languages: [{ code: 'en', label: 'English' }],
    currentLanguage: { code: 'en', label: 'English' },
    changeLanguage: vi.fn(),
    dir: 'ltr',
  }),
}));

const mockItems: ContentSearchItem[] = [
  {
    identifier: 'item-1',
    name: 'First Item',
    appIcon: 'https://example.com/icon1.png',
    mimeType: 'video/mp4',
    primaryCategory: 'Resource',
  },
  {
    identifier: 'item-2',
    name: 'Second Item',
    appIcon: 'https://example.com/icon2.png',
    mimeType: 'application/pdf',
    primaryCategory: 'Resource',
  },
  {
    identifier: 'item-3',
    name: 'Third Item',
    appIcon: 'https://example.com/icon3.png',
    primaryCategory: 'Collection',
  },
];

type RenderProps = {
  items?: ContentSearchItem[];
  cardType: 'collection' | 'resource';
  title?: string;
  limit?: number;
};

const renderRelatedContent = (props: RenderProps) => {
  return render(
    <BrowserRouter>
      <RelatedContent
        items={props.items}
        cardType={props.cardType}
        title={props.title}
        limit={props.limit}
      />
    </BrowserRouter>
  );
};

describe('RelatedContent', () => {
  it('renders nothing when items is undefined', () => {
    renderRelatedContent({
      items: undefined,
      cardType: 'resource',
    });
    expect(screen.queryByText('courseDetails.relatedContent')).not.toBeInTheDocument();
    expect(document.querySelector('section')).not.toBeInTheDocument();
  });

  it('renders nothing when items is empty array', () => {
    renderRelatedContent({
      items: [],
      cardType: 'resource',
    });
    expect(screen.queryByText('courseDetails.relatedContent')).not.toBeInTheDocument();
    expect(document.querySelector('section')).not.toBeInTheDocument();
  });

  it('renders section with default translation key when title is not provided', () => {
    renderRelatedContent({
      items: mockItems,
      cardType: 'resource',
    });
    expect(screen.getByText('courseDetails.relatedContent')).toBeInTheDocument();
  });

  it('renders custom title when provided', () => {
    renderRelatedContent({
      items: mockItems,
      cardType: 'resource',
      title: 'More Like This',
    });
    expect(screen.getByText('More Like This')).toBeInTheDocument();
    expect(screen.queryByText('courseDetails.relatedContent')).not.toBeInTheDocument();
  });

  it('renders resource cards when cardType is resource', () => {
    renderRelatedContent({
      items: mockItems,
      cardType: 'resource',
    });
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/content/item-1');
    expect(links[1]).toHaveAttribute('href', '/content/item-2');
    expect(links[2]).toHaveAttribute('href', '/content/item-3');
  });

  it('renders collection cards when cardType is collection', () => {
    renderRelatedContent({
      items: mockItems,
      cardType: 'collection',
    });
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/collection/item-1');
    expect(links[1]).toHaveAttribute('href', '/collection/item-2');
    expect(links[2]).toHaveAttribute('href', '/collection/item-3');
  });

  it('limits displayed items to default of 3', () => {
    const fiveItems = [...mockItems, { ...mockItems[0], identifier: 'item-4', name: 'Fourth' }, { ...mockItems[0], identifier: 'item-5', name: 'Fifth' }];
    renderRelatedContent({
      items: fiveItems,
      cardType: 'resource',
    });
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(screen.getByText('First Item')).toBeInTheDocument();
    expect(screen.getByText('Second Item')).toBeInTheDocument();
    expect(screen.getByText('Third Item')).toBeInTheDocument();
    expect(screen.queryByText('Fourth')).not.toBeInTheDocument();
    expect(screen.queryByText('Fifth')).not.toBeInTheDocument();
  });

  it('limits displayed items to custom limit', () => {
    renderRelatedContent({
      items: mockItems,
      cardType: 'resource',
      limit: 2,
    });
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(screen.getByText('First Item')).toBeInTheDocument();
    expect(screen.getByText('Second Item')).toBeInTheDocument();
    expect(screen.queryByText('Third Item')).not.toBeInTheDocument();
  });

  it('renders all items when limit is greater than items length', () => {
    renderRelatedContent({
      items: mockItems,
      cardType: 'resource',
      limit: 10,
    });
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
  });

  it('renders section with correct structure', () => {
    renderRelatedContent({
      items: mockItems,
      cardType: 'resource',
    });
    const section = document.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(document.querySelector('.content-player-related-header')).toBeInTheDocument();
    expect(document.querySelector('.content-player-related-grid')).toBeInTheDocument();
  });
});
