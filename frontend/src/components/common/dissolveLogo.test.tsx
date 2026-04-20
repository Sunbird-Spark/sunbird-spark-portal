import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MainLogo, GhostLogo } from './dissolveLogo';

describe('dissolveLogo', () => {
  it('renders MainLogo SVG without crashing', () => {
    const { container } = render(<MainLogo />);
    // There should be an SVG inside the container
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders GhostLogo SVG without crashing', () => {
    const { container } = render(<GhostLogo />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
