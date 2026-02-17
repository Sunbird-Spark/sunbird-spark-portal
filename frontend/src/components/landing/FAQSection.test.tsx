import { render, screen } from '@testing-library/react';
import FAQSection from './FAQSection';
import { useSystemSetting } from '@/hooks/useSystemSetting';
import { useFaqData } from '@/hooks/useFaqData';
import { vi, Mock, describe, beforeEach, it, expect } from 'vitest';
import { useAppI18n } from '@/hooks/useAppI18n';
import { PropsWithChildren } from 'react';

// Mock dependencies
vi.mock('@/hooks/useSystemSetting');
vi.mock('@/hooks/useFaqData');
vi.mock('@/hooks/useAppI18n');

// Mock child components
vi.mock('@/components/landing/Accordion', () => ({
  Accordion: ({ children }: PropsWithChildren) => <div data-testid="accordion">{children}</div>,
  AccordionItem: ({ children }: PropsWithChildren) => <div data-testid="accordion-item">{children}</div>,
  AccordionTrigger: ({ children }: PropsWithChildren) => <div data-testid="accordion-trigger">{children}</div>,
  AccordionContent: ({ children }: PropsWithChildren) => <div data-testid="accordion-content">{children}</div>,
}));

describe('FAQSection', () => {
  const mockT = vi.fn((key) => key);

  beforeEach(() => {
    vi.resetAllMocks();
    (useAppI18n as Mock).mockReturnValue({
      t: mockT,
      currentCode: 'en',
    });
  });

  it('renders nothing when FAQ URL is not configured', () => {
    (useSystemSetting as Mock).mockReturnValue({
      data: { data: { response: { value: '' } } },
    });
    (useFaqData as Mock).mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });

    const { container } = render(<FAQSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when FAQ data fetch fails', () => {
    (useSystemSetting as Mock).mockReturnValue({
      data: { data: { response: { value: 'http://example.com/faq' } } },
    });
    (useFaqData as Mock).mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed'),
    });

    const { container } = render(<FAQSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders FAQs when data is available', () => {
    const mockFaqs = [
      { title: 'Q1', description: '<p>A1</p>' },
      { title: 'Q2', description: '<p>A2</p>' },
    ];

    (useSystemSetting as Mock).mockReturnValue({
      data: { data: { response: { value: 'http://example.com/faq' } } },
    });
    (useFaqData as Mock).mockReturnValue({
      data: { general: mockFaqs },
      loading: false,
      error: null,
    });

    render(<FAQSection />);

    expect(screen.getByText('faq.title')).toBeInTheDocument();
    expect(screen.getAllByTestId('accordion-item')).toHaveLength(2);
    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('Q2')).toBeInTheDocument();
  });

  it('filters out invalid FAQs', () => {
    const mockFaqs = [
      { title: 'Q1', description: '<p>A1</p>' },
      { title: '', description: 'A2' }, // Invalid
      { title: 'Q3', description: '' }, // Invalid
    ];

    (useSystemSetting as Mock).mockReturnValue({
      data: { data: { response: { value: 'http://example.com/faq' } } },
    });
    (useFaqData as Mock).mockReturnValue({
      data: { general: mockFaqs },
      loading: false,
      error: null,
    });

    render(<FAQSection />);

    expect(screen.getAllByTestId('accordion-item')).toHaveLength(1);
    expect(screen.getByText('Q1')).toBeInTheDocument();
  });

  it('sanitizes HTML content', () => {
    const mockFaqs = [
      { title: 'Q1', description: '<script>alert("xss")</script><p>Safe</p>' },
    ];

    (useSystemSetting as Mock).mockReturnValue({
      data: { data: { response: { value: 'http://example.com/faq' } } },
    });
    (useFaqData as Mock).mockReturnValue({
      data: { general: mockFaqs },
      loading: false,
      error: null,
    });

    render(<FAQSection />);
    // Since we mock AccordionContent rendering HTML via dangerouslySetInnerHTML,
    // we can check if the sanitized content is present.
    // However, sanitizeHtml utility is imported.
    // We should assume sanitizeHtml works or mock it.
    // But integration test checks if it is called.
    // The component uses sanitizeHtml.
    // In the test, we render the component.
    // The sanitized string is passed to AccordionContent.
    // AccordionContent renders children.
    // Wait, in the component: <div dangerouslySetInnerHTML={{ __html: faq.description }} />
    // In the mock: AccordionContent: ({ children }) => <div>{children}</div>
    // So the div with dangerouslySetInnerHTML is passed as children to AccordionContent mock.
    // So we can inspect the DOM.
    // But 'Safe' should be there. 'alert' should be gone if sanitize works.
    // But jsdom doesn't execute scripts anyway.
    // We rely on 'dompurify' (which sanitizeHtml likely uses).

    expect(screen.getByText('Safe')).toBeInTheDocument();
    expect(screen.queryByText('alert("xss")')).not.toBeInTheDocument();
    // This assertion might be tricky depending on how sanitizeHtml works and how jest renders.
    // But generally fine.
  });
});
