import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminPage from './AdminPage';
import WorkspacePage from './WorkspacePage';
import ReportsPage from './ReportsPage';
import CreateContentPage from './CreateContentPage';

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
      render(<WorkspacePage />);
      expect(screen.getByRole('heading', { name: 'Workspace' })).toBeInTheDocument();
      expect(screen.getByText(/accessible to users with/i)).toBeInTheDocument();
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
