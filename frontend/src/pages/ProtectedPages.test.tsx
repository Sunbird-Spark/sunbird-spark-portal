import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import AdminPage from './admin/AdminPage';
import WorkspacePage from './workspace/WorkspacePage';
import ReportsPage from './reports/ReportsPage';
import CreateContentPage from './content/CreateContentPage';

vi.mock('@/hooks/useContent', () => ({
  useContentSearch: vi.fn(() => ({
    data: { data: { content: [], QuestionSet: [] } },
    isLoading: false,
    refetch: vi.fn(),
  })),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Protected Pages', () => {
  describe('AdminPage', () => {
    it('should render admin dashboard', () => {
      render(<AdminPage />);
      expect(screen.getByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument();
      expect(screen.getByText(/only accessible to users with the/i)).toBeInTheDocument();
    });
  });

  describe('WorkspacePage', () => {
    it('should render workspace', () => {
      renderWithProviders(<WorkspacePage />);
      expect(screen.getByRole('button', { name: 'Workspace' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'All 0' })).toBeInTheDocument();
    });
  });

  describe('ReportsPage', () => {
    it('should render reports', () => {
      render(<ReportsPage />);
      expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument();
      expect(screen.getByText(/only accessible to users with the/i)).toBeInTheDocument();
    });
  });

  describe('CreateContentPage', () => {
    it('should render create content page', () => {
      render(<CreateContentPage />);
      expect(screen.getByRole('heading', { name: 'Create Content' })).toBeInTheDocument();
      expect(screen.getByText(/only accessible to users with the/i)).toBeInTheDocument();
    });
  });
});
