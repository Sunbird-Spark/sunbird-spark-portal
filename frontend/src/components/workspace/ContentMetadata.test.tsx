import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContentMetadata from './ContentMetadata';

describe('ContentMetadata', () => {
  const mockProps = {
    name: 'Test Content',
    description: 'This is a test description',
    creator: 'John Doe',
    lastUpdatedOn: '2024-01-15T10:30:00Z',
    primaryCategory: 'Learning Resource',
    contentType: 'Resource',
    createdOn: '2024-01-01T08:00:00Z',
  };

  it('should render description when provided', () => {
    render(<ContentMetadata {...mockProps} />);
    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('should not render description section when description is not provided', () => {
    const { container } = render(<ContentMetadata {...mockProps} description={undefined} />);
    expect(container.querySelector('.content-review-description')).not.toBeInTheDocument();
  });

  it('should render creator name', () => {
    render(<ContentMetadata {...mockProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render "Unknown" when creator is not provided', () => {
    render(<ContentMetadata {...mockProps} creator={undefined} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('should render formatted last updated date', () => {
    render(<ContentMetadata {...mockProps} />);
    expect(screen.getByText(/January 15, 2024/i)).toBeInTheDocument();
  });

  it('should render formatted created date', () => {
    render(<ContentMetadata {...mockProps} />);
    expect(screen.getByText(/January 1, 2024/i)).toBeInTheDocument();
  });

  it('should render "N/A" for dates when not provided', () => {
    render(<ContentMetadata {...mockProps} lastUpdatedOn={undefined} createdOn={undefined} />);
    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThanOrEqual(2);
  });

  it('should render primary category when provided', () => {
    render(<ContentMetadata {...mockProps} />);
    expect(screen.getByText('Learning Resource')).toBeInTheDocument();
  });

  it('should render content type when primary category is not provided', () => {
    render(<ContentMetadata {...mockProps} primaryCategory={undefined} />);
    expect(screen.getByText('Resource')).toBeInTheDocument();
  });

  it('should render "N/A" when neither primary category nor content type is provided', () => {
    render(<ContentMetadata {...mockProps} primaryCategory={undefined} contentType={undefined} />);
    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should render all metadata labels', () => {
    render(<ContentMetadata {...mockProps} />);
    expect(screen.getByText('Created By')).toBeInTheDocument();
    expect(screen.getByText('Last Updated')).toBeInTheDocument();
    expect(screen.getByText('Content Type')).toBeInTheDocument();
    expect(screen.getByText('Created On')).toBeInTheDocument();
  });
});
