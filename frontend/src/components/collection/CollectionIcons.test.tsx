import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { VideoIcon, DocumentIcon, CheckIcon } from './CollectionIcons';

describe('CollectionIcons', () => {
  it('VideoIcon renders without error', () => {
    const { container } = render(<VideoIcon />);
    expect(container.firstChild).toBeInTheDocument();
    const span = container.querySelector('span[aria-hidden="true"]');
    expect(span).toBeInTheDocument();
  });

  it('DocumentIcon renders without error', () => {
    const { container } = render(<DocumentIcon />);
    expect(container.firstChild).toBeInTheDocument();
    const span = container.querySelector('span[aria-hidden="true"]');
    expect(span).toBeInTheDocument();
  });

  it('CheckIcon renders svg', () => {
    const { container } = render(<CheckIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 16 16');
  });
});
