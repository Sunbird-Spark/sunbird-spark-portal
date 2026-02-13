import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FAQSection from './FAQSection';


vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
  }),
}));


describe('FAQSection', () => {
  it('renders the FAQ title', () => {
    render(<FAQSection />);
    expect(screen.getByText('faq.title')).toBeInTheDocument();
  });

  it('renders all FAQ questions', () => {
    render(<FAQSection />);
    expect(screen.getByText(/What kind of courses are available/i)).toBeInTheDocument();
    expect(screen.getByText(/Can I learn in offline mode/i)).toBeInTheDocument();
  });

  it('renders the FAQ image', () => {
    render(<FAQSection />);
    const image = screen.getByAltText(/Student learning online/i);
    expect(image).toBeInTheDocument();
  });
});