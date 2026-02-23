import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateThumbnail } from './TemplateThumbnail';

describe('TemplateThumbnail', () => {
  it('renders the template name', () => {
    render(
      <TemplateThumbnail name="My Certificate" onClick={vi.fn()} />
    );
    expect(screen.getByText('My Certificate')).toBeInTheDocument();
  });

  it('renders preview image when previewUrl is provided', () => {
    render(
      <TemplateThumbnail
        name="My Certificate"
        previewUrl="https://example.com/cert.png"
        onClick={vi.fn()}
      />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/cert.png');
    expect(img).toHaveAttribute('alt', 'My Certificate');
  });

  it('shows "Preview" fallback text when previewUrl is absent', () => {
    render(
      <TemplateThumbnail name="My Certificate" onClick={vi.fn()} />
    );
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('shows checkmark indicator when selected is true', () => {
    const { container } = render(
      <TemplateThumbnail name="My Certificate" selected={true} onClick={vi.fn()} />
    );
    // Selected indicator div should be present (absolute positioned)
    expect(container.querySelector('.absolute')).toBeInTheDocument();
  });

  it('does not show checkmark indicator when selected is false', () => {
    const { container } = render(
      <TemplateThumbnail name="My Certificate" selected={false} onClick={vi.fn()} />
    );
    expect(container.querySelector('.absolute')).not.toBeInTheDocument();
  });

  it('applies selected border class when selected is true', () => {
    const { container } = render(
      <TemplateThumbnail name="My Certificate" selected={true} onClick={vi.fn()} />
    );
    const button = container.querySelector('button');
    expect(button?.className).toContain('border-sunbird-brick');
  });

  it('applies default border class when selected is false', () => {
    const { container } = render(
      <TemplateThumbnail name="My Certificate" selected={false} onClick={vi.fn()} />
    );
    const button = container.querySelector('button');
    expect(button?.className).toContain('border-border');
  });

  it('calls onClick when button is clicked', () => {
    const onClick = vi.fn();
    const { container } = render(
      <TemplateThumbnail name="My Certificate" onClick={onClick} />
    );
    fireEvent.click(container.querySelector('button')!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
