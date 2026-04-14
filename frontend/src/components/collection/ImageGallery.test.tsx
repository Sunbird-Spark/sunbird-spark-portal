import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageGallery } from './ImageGallery';

const sampleImages = [
  { identifier: 'img-1', name: 'Logo One', url: 'https://example.com/logo1.png' },
  { identifier: 'img-2', name: 'Logo Two', url: 'https://example.com/logo2.png' },
  { identifier: 'img-3', name: 'Logo Three', url: 'https://example.com/logo3.png' },
];

describe('ImageGallery', () => {
  it('shows loading spinner when loading is true', () => {
    const { container } = render(
      <ImageGallery
        loading={true}
        images={[]}
        emptyMessage="No images"
        selectedUrl={null}
        onSelect={vi.fn()}
      />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not render images grid when loading', () => {
    render(
      <ImageGallery
        loading={true}
        images={sampleImages}
        emptyMessage="No images"
        selectedUrl={null}
        onSelect={vi.fn()}
      />
    );
    expect(screen.queryByTitle('Logo One')).not.toBeInTheDocument();
  });

  it('shows empty message when images array is empty', () => {
    render(
      <ImageGallery
        loading={false}
        images={[]}
        emptyMessage="No images uploaded yet."
        selectedUrl={null}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('No images uploaded yet.')).toBeInTheDocument();
  });

  it('renders image buttons when images are provided', () => {
    render(
      <ImageGallery
        loading={false}
        images={sampleImages}
        emptyMessage="No images"
        selectedUrl={null}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByTitle('Logo One')).toBeInTheDocument();
    expect(screen.getByTitle('Logo Two')).toBeInTheDocument();
    expect(screen.getByTitle('Logo Three')).toBeInTheDocument();
  });

  it('calls onSelect with image url when a button is clicked', () => {
    const onSelect = vi.fn();
    render(
      <ImageGallery
        loading={false}
        images={sampleImages}
        emptyMessage="No images"
        selectedUrl={null}
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByTitle('Logo One'));
    expect(onSelect).toHaveBeenCalledWith('https://example.com/logo1.png');
  });

  it('applies selected border class to the selected image', () => {
    render(
      <ImageGallery
        loading={false}
        images={sampleImages}
        emptyMessage="No images"
        selectedUrl="https://example.com/logo2.png"
        onSelect={vi.fn()}
      />
    );
    const selectedBtn = screen.getByTitle('Logo Two');
    expect(selectedBtn.className).toContain('border-sunbird-brick');
  });

  it('does not apply selected class to non-selected images', () => {
    render(
      <ImageGallery
        loading={false}
        images={sampleImages}
        emptyMessage="No images"
        selectedUrl="https://example.com/logo2.png"
        onSelect={vi.fn()}
      />
    );
    const unselectedBtn = screen.getByTitle('Logo One');
    expect(unselectedBtn.className).toContain('border-transparent');
  });

  it('renders each image with correct src and alt', () => {
    render(
      <ImageGallery
        loading={false}
        images={sampleImages}
        emptyMessage="No images"
        selectedUrl={null}
        onSelect={vi.fn()}
      />
    );
    const imgs = screen.getAllByRole('img');
    expect(imgs[0]).toHaveAttribute('src', 'https://example.com/logo1.png');
    expect(imgs[0]).toHaveAttribute('alt', 'Logo One');
  });
});
