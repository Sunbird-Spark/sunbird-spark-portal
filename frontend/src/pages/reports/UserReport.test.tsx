import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import UserReport from './UserReport';

vi.mock('@/components/reports/ReportLayout', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const renderWithRoute = (userId = 'me') =>
  render(
    <MemoryRouter initialEntries={[`/reports/user/${userId}`]}>
      <Routes>
        <Route path="/reports/user/:userId" element={<UserReport />} />
      </Routes>
    </MemoryRouter>
  );

describe('UserReport', () => {
  it('renders without crashing', () => {
    renderWithRoute();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders user name in title', () => {
    renderWithRoute();
    // userReportSummary.userName from mock data
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain('User Report:');
  });

  it('renders summary cards', () => {
    renderWithRoute();
    expect(screen.getByText('Courses Completed')).toBeInTheDocument();
    expect(screen.getByText('Courses Pending')).toBeInTheDocument();
    expect(screen.getByText('Certificates Issued')).toBeInTheDocument();
    expect(screen.getByText('Content Completed')).toBeInTheDocument();
    expect(screen.getByText('Assessments Done')).toBeInTheDocument();
  });

  it('renders Course Progress section', () => {
    renderWithRoute();
    expect(screen.getByRole('region', { name: /course progress/i })).toBeInTheDocument();
  });

  it('renders Certificates section', () => {
    renderWithRoute();
    expect(screen.getByRole('region', { name: /certificates/i })).toBeInTheDocument();
  });

  it('renders Assessment History section', () => {
    renderWithRoute();
    expect(screen.getByRole('region', { name: /assessment history/i })).toBeInTheDocument();
  });

  it('renders course progress table columns', () => {
    renderWithRoute();
    // "Course" appears in multiple tables (courseColumns and certColumns both have a "Course" header)
    expect(screen.getAllByText('Course').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Progress').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Status').length).toBeGreaterThan(0);
  });

  it('renders export buttons', () => {
    renderWithRoute();
    const exportBtns = screen.getAllByRole('button', { name: /export csv/i });
    expect(exportBtns.length).toBeGreaterThanOrEqual(1);
  });
});
