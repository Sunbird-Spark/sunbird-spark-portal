import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  WavePatternSVG,
  BlobPatternSVG,
  OrbPatternSVG,
  DiamondPatternSVG,
} from './CardThumbnailPatterns';
import type { CardTheme } from '@/services/workspace/contentDisplayConfig';

const mockTheme: CardTheme = {
  id: 'test-theme',
  bgLight: '#ffffff',
  bgLighter: '#f0f0f0',
  accent: '#ff6600',
  accentDark: '#cc4400',
  iconColor: '#000000',
};

describe('WavePatternSVG', () => {
  it('renders an SVG element', () => {
    const { container } = render(<WavePatternSVG theme={mockTheme} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('uses theme id in gradient ids', () => {
    const { container } = render(<WavePatternSVG theme={mockTheme} />);
    const svg = container.querySelector('svg');
    expect(svg?.innerHTML).toContain('test-theme-bg');
    expect(svg?.innerHTML).toContain('test-theme-g1');
    expect(svg?.innerHTML).toContain('test-theme-g2');
  });

  it('is aria-hidden', () => {
    const { container } = render(<WavePatternSVG theme={mockTheme} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses the theme accent color in path fill', () => {
    const { container } = render(<WavePatternSVG theme={mockTheme} />);
    const html = container.innerHTML;
    expect(html).toContain(mockTheme.accent);
    expect(html).toContain(mockTheme.accentDark);
  });
});

describe('BlobPatternSVG', () => {
  it('renders an SVG element', () => {
    const { container } = render(<BlobPatternSVG theme={mockTheme} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('uses theme id in gradient ids', () => {
    const { container } = render(<BlobPatternSVG theme={mockTheme} />);
    const svg = container.querySelector('svg');
    expect(svg?.innerHTML).toContain('test-theme-bg');
  });

  it('is aria-hidden', () => {
    const { container } = render(<BlobPatternSVG theme={mockTheme} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses the theme accent color', () => {
    const { container } = render(<BlobPatternSVG theme={mockTheme} />);
    expect(container.innerHTML).toContain(mockTheme.accent);
  });
});

describe('OrbPatternSVG', () => {
  it('renders an SVG element', () => {
    const { container } = render(<OrbPatternSVG theme={mockTheme} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('uses theme id in gradient ids', () => {
    const { container } = render(<OrbPatternSVG theme={mockTheme} />);
    expect(container.innerHTML).toContain('test-theme-bg');
  });

  it('is aria-hidden', () => {
    const { container } = render(<OrbPatternSVG theme={mockTheme} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders orb circles using theme accent', () => {
    const { container } = render(<OrbPatternSVG theme={mockTheme} />);
    expect(container.innerHTML).toContain(mockTheme.accent);
    expect(container.innerHTML).toContain(mockTheme.accentDark);
  });
});

describe('DiamondPatternSVG', () => {
  it('renders an SVG element', () => {
    const { container } = render(<DiamondPatternSVG theme={mockTheme} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('uses theme id in gradient ids', () => {
    const { container } = render(<DiamondPatternSVG theme={mockTheme} />);
    expect(container.innerHTML).toContain('test-theme-bg');
  });

  it('is aria-hidden', () => {
    const { container } = render(<DiamondPatternSVG theme={mockTheme} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders diamond paths using theme accent', () => {
    const { container } = render(<DiamondPatternSVG theme={mockTheme} />);
    expect(container.innerHTML).toContain(mockTheme.accent);
  });
});

describe('All patterns render correctly with different themes', () => {
  const anotherTheme: CardTheme = {
    id: 'blue-theme',
    bgLight: '#ffffff',
    bgLighter: '#f0f0f0',
    accent: '#0000ff',
    accentDark: '#00008b',
    iconColor: '#000000',
  };

  it('WavePatternSVG works with a different theme', () => {
    const { container } = render(<WavePatternSVG theme={anotherTheme} />);
    expect(container.innerHTML).toContain('blue-theme-bg');
    expect(container.innerHTML).toContain('#0000ff');
  });

  it('BlobPatternSVG works with a different theme', () => {
    const { container } = render(<BlobPatternSVG theme={anotherTheme} />);
    expect(container.innerHTML).toContain('blue-theme-bg');
  });

  it('OrbPatternSVG works with a different theme', () => {
    const { container } = render(<OrbPatternSVG theme={anotherTheme} />);
    expect(container.innerHTML).toContain('blue-theme-bg');
  });

  it('DiamondPatternSVG works with a different theme', () => {
    const { container } = render(<DiamondPatternSVG theme={anotherTheme} />);
    expect(container.innerHTML).toContain('blue-theme-bg');
  });
});

describe('SVG viewBox and preserveAspectRatio', () => {
  it('WavePatternSVG has correct viewBox', () => {
    const { container } = render(<WavePatternSVG theme={mockTheme} />);
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 400 225');
    expect(container.querySelector('svg')).toHaveAttribute('preserveAspectRatio', 'xMidYMid slice');
  });

  it('BlobPatternSVG has correct viewBox', () => {
    const { container } = render(<BlobPatternSVG theme={mockTheme} />);
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 400 225');
  });

  it('OrbPatternSVG has correct viewBox', () => {
    const { container } = render(<OrbPatternSVG theme={mockTheme} />);
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 400 225');
  });

  it('DiamondPatternSVG has correct viewBox', () => {
    const { container } = render(<DiamondPatternSVG theme={mockTheme} />);
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 400 225');
  });
});
