import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CourseReportContent from './CourseReportContent';

// Mock recharts to avoid canvas errors in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  FunnelChart: ({ children }: { children: React.ReactNode }) => <div data-testid="funnel-chart">{children}</div>,
  Funnel: () => null,
  LabelList: () => null,
}));

describe('CourseReportContent', () => {
  it('renders with data-testid', () => {
    render(<CourseReportContent />);
    expect(screen.getByTestId('course-report-content')).toBeInTheDocument();
  });

  it('renders summary cards', () => {
    render(<CourseReportContent />);
    expect(screen.getByText('Total Enrolled')).toBeInTheDocument();
    expect(screen.getByText('Total Completed')).toBeInTheDocument();
    expect(screen.getByText('Certificates Issued')).toBeInTheDocument();
    expect(screen.getByText('Avg Score')).toBeInTheDocument();
  });

  it('renders chart cards', () => {
    render(<CourseReportContent />);
    expect(screen.getByText('Enrollment vs Completion')).toBeInTheDocument();
    expect(screen.getByText('Pending Completion Buckets')).toBeInTheDocument();
    expect(screen.getByText('Score Distribution')).toBeInTheDocument();
  });

  it('renders Learner Progress tab', () => {
    render(<CourseReportContent />);
    expect(screen.getByRole('tab', { name: /learner progress/i })).toBeInTheDocument();
  });

  it('renders Assessments tab', () => {
    render(<CourseReportContent />);
    expect(screen.getByRole('tab', { name: /assessments/i })).toBeInTheDocument();
  });

  it('renders learner progress table by default', () => {
    render(<CourseReportContent />);
    expect(screen.getByText('Learner Name')).toBeInTheDocument();
  });

  it('switches to assessments tab on click', async () => {
    const user = userEvent.setup();
    render(<CourseReportContent />);
    const assessTab = screen.getByRole('tab', { name: /assessments/i });
    await user.click(assessTab);
    // After clicking, the assessments tab should be selected
    expect(assessTab).toHaveAttribute('data-state', 'active');
  });

  it('renders search input in learner progress tab', () => {
    render(<CourseReportContent />);
    expect(screen.getByPlaceholderText(/search learners/i)).toBeInTheDocument();
  });

  it('renders Export CSV button for learner progress', () => {
    render(<CourseReportContent />);
    expect(screen.getAllByRole('button', { name: /export csv/i })[0]).toBeInTheDocument();
  });

  it('accepts courseId and batchId props without crashing', () => {
    render(<CourseReportContent courseId="course-123" batchId="batch-456" />);
    expect(screen.getByTestId('course-report-content')).toBeInTheDocument();
  });

  it('filters learners by search text', () => {
    render(<CourseReportContent />);
    const search = screen.getByPlaceholderText(/search learners/i);
    // Type a search term that matches no one in mock data
    fireEvent.change(search, { target: { value: 'zzznomatch' } });
    expect(screen.getByText('No data available.')).toBeInTheDocument();
  });
});
