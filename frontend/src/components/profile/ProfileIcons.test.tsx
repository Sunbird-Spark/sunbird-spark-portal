import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  TimeSpentIcon,
  TotalContentsIcon,
  InProgressIcon,
  BadgesIcon,
  ContentsCompletedIcon,
  CertificationsIcon,
  ProgressRing,
} from './ProfileIcons';

describe('TimeSpentIcon', () => {
  it('renders an SVG', () => {
    const { container } = render(<TimeSpentIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has correct dimensions', () => {
    const { container } = render(<TimeSpentIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '26');
    expect(svg).toHaveAttribute('height', '26');
  });
});

describe('TotalContentsIcon', () => {
  it('renders an SVG', () => {
    const { container } = render(<TotalContentsIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has correct dimensions', () => {
    const { container } = render(<TotalContentsIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '25');
    expect(svg).toHaveAttribute('height', '28');
  });
});

describe('InProgressIcon', () => {
  it('renders an SVG', () => {
    const { container } = render(<InProgressIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has correct dimensions', () => {
    const { container } = render(<InProgressIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });
});

describe('BadgesIcon', () => {
  it('renders an SVG', () => {
    const { container } = render(<BadgesIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has correct dimensions', () => {
    const { container } = render(<BadgesIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '27');
    expect(svg).toHaveAttribute('height', '27');
  });
});

describe('ContentsCompletedIcon', () => {
  it('renders an SVG', () => {
    const { container } = render(<ContentsCompletedIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has correct dimensions', () => {
    const { container } = render(<ContentsCompletedIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '23');
    expect(svg).toHaveAttribute('height', '25');
  });
});

describe('CertificationsIcon', () => {
  it('renders an SVG', () => {
    const { container } = render(<CertificationsIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has correct dimensions', () => {
    const { container } = render(<CertificationsIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });
});

describe('ProgressRing', () => {
  it('renders an SVG with two circles (line 66+)', () => {
    const { container } = render(<ProgressRing progress={50} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(2);
  });

  it('has correct SVG dimensions', () => {
    const { container } = render(<ProgressRing progress={0} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '26');
    expect(svg).toHaveAttribute('height', '26');
  });

  it('calculates strokeDashoffset for 0% progress (full offset)', () => {
    const { container } = render(<ProgressRing progress={0} />);
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1]; // second circle is the progress circle
    const circumference = 2 * Math.PI * 10;
    expect(progressCircle).toHaveAttribute(
      'stroke-dashoffset',
      String(circumference)
    );
  });

  it('calculates strokeDashoffset for 100% progress (zero offset)', () => {
    const { container } = render(<ProgressRing progress={100} />);
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    expect(progressCircle).toHaveAttribute('stroke-dashoffset', '0');
  });

  it('calculates strokeDashoffset for 50% progress', () => {
    const { container } = render(<ProgressRing progress={50} />);
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    const circumference = 2 * Math.PI * 10;
    const expectedOffset = circumference * 0.5;
    expect(progressCircle).toHaveAttribute(
      'stroke-dashoffset',
      String(expectedOffset)
    );
  });

  it('has -rotate-90 class for CSS rotation (line 72)', () => {
    const { container } = render(<ProgressRing progress={25} />);
    const svg = container.querySelector('svg');
    expect(svg?.className).toContain('-rotate-90');
  });
});
