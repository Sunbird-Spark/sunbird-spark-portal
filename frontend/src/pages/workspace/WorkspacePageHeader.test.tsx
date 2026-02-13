import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WorkspacePageHeader from './WorkspacePageHeader';

vi.mock('@/components/common/DropdownMenu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onSelect,
  }: {
    children: React.ReactNode;
    onSelect?: () => void;
  }) => <div onClick={onSelect}>{children}</div>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockChangeLanguage = vi.fn();
vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
    languages: [
      { code: 'en', label: 'English' },
      { code: 'hi', label: 'Hindi' },
    ],
    currentCode: 'en',
    changeLanguage: mockChangeLanguage,
  }),
}));

describe('WorkspacePageHeader', () => {
  const defaultProps = {
    isMobile: false,
    isSidebarOpen: true,
    onMenuOpen: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderHeader = (props = defaultProps) =>
    render(
      <MemoryRouter>
        <WorkspacePageHeader {...props} />
      </MemoryRouter>
    );

  it('renders Sunbird logo when desktop and sidebar open', () => {
    renderHeader();
    expect(screen.getByAltText('Sunbird')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'workspace' })).not.toBeInTheDocument();
  });

  it('renders menu toggle button when desktop and sidebar closed and calls onMenuOpen when clicked', () => {
    renderHeader({ ...defaultProps, isSidebarOpen: false });
    const expandBtn = screen.getByRole('button', { name: 'Open sidebar' });
    expect(expandBtn).toBeInTheDocument();
    fireEvent.click(expandBtn);
    expect(defaultProps.onMenuOpen).toHaveBeenCalledTimes(1);
  });

  it('renders workspace heading and Open Menu button when mobile', () => {
    renderHeader({ ...defaultProps, isMobile: true });
    expect(screen.getByRole('heading', { name: 'workspace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Menu' })).toBeInTheDocument();
  });

  it('calls onMenuOpen when Open Menu is clicked on mobile', () => {
    const onMenuOpen = vi.fn();
    renderHeader({ ...defaultProps, isMobile: true, onMenuOpen });
    fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
    expect(onMenuOpen).toHaveBeenCalledTimes(1);
  });

  it('navigates to /search when search area is clicked on desktop', () => {
    renderHeader();
    const searchContainer = screen.getByPlaceholderText('header.search').closest('button');
    expect(searchContainer).toBeInTheDocument();
    fireEvent.click(searchContainer!);
    expect(mockNavigate).toHaveBeenCalledWith('/search');
  });

  it('navigates to /search when search button is clicked on mobile', () => {
    renderHeader({ ...defaultProps, isMobile: true });
    const searchBtn = screen.getByRole('button', { name: 'Search' });
    fireEvent.click(searchBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/search');
  });

  it('opens language dropdown and calls changeLanguage when option selected', () => {
    renderHeader();
    const langTrigger = screen.getByAltText('Translate').closest('button');
    fireEvent.click(langTrigger!);
    const hindiOption = screen.getByText('Hindi');
    fireEvent.click(hindiOption);
    expect(mockChangeLanguage).toHaveBeenCalledWith('hi');
  });
});
