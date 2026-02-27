import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlatformReports from './PlatformReports';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
}));

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

const renderPage = () =>
  render(
    <MemoryRouter>
      <PlatformReports />
    </MemoryRouter>
  );

describe('PlatformReports', () => {
  it('renders page title', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Platform Reports' })).toBeInTheDocument();
  });

  it('renders Content Overview section', () => {
    renderPage();
    expect(screen.getByRole('region', { name: /content overview/i })).toBeInTheDocument();
  });

  it('renders User Analytics section', () => {
    renderPage();
    expect(screen.getByRole('region', { name: /user analytics/i })).toBeInTheDocument();
  });

  it('renders Admin Course Summary section', () => {
    renderPage();
    expect(screen.getByRole('region', { name: /admin course summary/i })).toBeInTheDocument();
  });

  it('renders Content by Status chart card', () => {
    renderPage();
    expect(screen.getByText('Content by Status')).toBeInTheDocument();
  });

  it('renders User Growth Trend chart card', () => {
    renderPage();
    expect(screen.getByText('User Growth Trend')).toBeInTheDocument();
  });

  it('renders Total Users summary card', () => {
    renderPage();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
  });

  it('renders course search filter', () => {
    renderPage();
    expect(screen.getByPlaceholderText(/search courses/i)).toBeInTheDocument();
  });

  it('renders Admin Course Summary table headers', () => {
    renderPage();
    expect(screen.getByText('Course Name')).toBeInTheDocument();
    expect(screen.getByText('Enrolled')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders export button for course summary', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
  });

  it('filters courses by search text', () => {
    renderPage();
    const search = screen.getByPlaceholderText(/search courses/i);
    fireEvent.change(search, { target: { value: 'zzznomatch' } });
    expect(screen.getByText('No data available.')).toBeInTheDocument();
  });

  it('renders content grouping select', () => {
    renderPage();
    expect(screen.getByText('Content by Grouping')).toBeInTheDocument();
  });
});
