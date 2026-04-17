import { render, screen, act } from '@testing-library/react';
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

// ── Telemetry mock ────────────────────────────────────────────────────────────
const mockInteract = vi.fn();
vi.mock('@/hooks/useTelemetry', () => ({
  useTelemetry: () => ({
    interact: mockInteract,
    impression: vi.fn(),
    isInitialized: true,
  }),
}));

// ── Accordion mock ────────────────────────────────────────────────────────────
// Captures onValueChange so tests can invoke it directly, simulating Radix accordion
// state changes without needing a real DOM interaction.
let capturedOnValueChange: ((value: string) => void) | null = null;

vi.mock('@/components/landing/Accordion', () => ({
  Accordion: ({ children, onValueChange }: any) => {
    capturedOnValueChange = onValueChange;
    return <div data-testid="accordion">{children}</div>;
  },
  AccordionItem: ({ children }: PropsWithChildren) => <div data-testid="accordion-item">{children}</div>,
  AccordionTrigger: ({ children }: PropsWithChildren) => <div data-testid="accordion-trigger">{children}</div>,
  AccordionContent: ({ children }: PropsWithChildren) => <div data-testid="accordion-content">{children}</div>,
}));

// ── Shared FAQ data ───────────────────────────────────────────────────────────
const mockFaqs = [
  { title: 'Q1', description: '<p>A1</p>' },
  { title: 'Q2', description: '<p>A2</p>' },
];

const setupWithFaqs = (faqs = mockFaqs) => {
  (useSystemSetting as Mock).mockReturnValue({
    data: { data: { response: { value: 'http://example.com/faq' } } },
  });
  (useFaqData as Mock).mockReturnValue({
    data: { general: faqs },
    loading: false,
    error: null,
  });
};

describe('FAQSection', () => {
  const mockT = vi.fn((key) => key);

  beforeEach(() => {
    vi.resetAllMocks();
    capturedOnValueChange = null;
    (useAppI18n as Mock).mockReturnValue({ t: mockT, currentCode: 'en' });
  });

  it('renders nothing when FAQ URL is not configured', () => {
    (useSystemSetting as Mock).mockReturnValue({
      data: { data: { response: { value: '' } } },
    });
    (useFaqData as Mock).mockReturnValue({ data: null, loading: false, error: null });

    const { container } = render(<FAQSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when FAQ data fetch fails', () => {
    (useSystemSetting as Mock).mockReturnValue({
      data: { data: { response: { value: 'http://example.com/faq' } } },
    });
    (useFaqData as Mock).mockReturnValue({ data: null, loading: false, error: new Error('Failed') });

    const { container } = render(<FAQSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders FAQs when data is available', () => {
    setupWithFaqs();
    render(<FAQSection />);

    expect(screen.getByText('faq.title')).toBeInTheDocument();
    expect(screen.getAllByTestId('accordion-item')).toHaveLength(2);
    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('Q2')).toBeInTheDocument();
  });

  it('filters out invalid FAQs', () => {
    setupWithFaqs([
      { title: 'Q1', description: '<p>A1</p>' },
      { title: '', description: 'A2' },
      { title: 'Q3', description: '' },
    ]);
    render(<FAQSection />);

    expect(screen.getAllByTestId('accordion-item')).toHaveLength(1);
    expect(screen.getByText('Q1')).toBeInTheDocument();
  });

  it('sanitizes HTML content', () => {
    setupWithFaqs([{ title: 'Q1', description: '<script>alert("xss")</script><p>Safe</p>' }]);
    render(<FAQSection />);
    expect(screen.getByText('Safe')).toBeInTheDocument();
    expect(screen.queryByText('alert("xss")')).not.toBeInTheDocument();
  });

  // ── Telemetry: toggle-clicked ─────────────────────────────────────────────

  describe('FAQ toggle telemetry', () => {
    beforeEach(() => {
      setupWithFaqs();
    });

    it('fires interact with subtype toggle-clicked and isOpened:true when an item opens', () => {
      render(<FAQSection />);

      act(() => { capturedOnValueChange?.('item-1'); });

      expect(mockInteract).toHaveBeenCalledTimes(1);
      expect(mockInteract).toHaveBeenCalledWith({
        edata: {
          id: 'faq',
          subtype: 'toggle-clicked',
          type: 'TOUCH',
          extra: {
            values: {
              action: 'toggle-clicked',
              position: 2, // index 1 → position 2
              value: {
                topic: 'Q2',
                description: '<p>A2</p>',
              },
              isOpened: true,
            },
          },
        },
      });
    });

    it('fires interact with isOpened:false when the open item is collapsed', () => {
      render(<FAQSection />);

      // First open item-0
      act(() => { capturedOnValueChange?.('item-0'); });
      mockInteract.mockClear();

      // Now collapse it (empty string = collapsed)
      act(() => { capturedOnValueChange?.(''); });

      expect(mockInteract).toHaveBeenCalledTimes(1);
      expect(mockInteract).toHaveBeenCalledWith(
        expect.objectContaining({
          edata: expect.objectContaining({
            extra: expect.objectContaining({
              values: expect.objectContaining({
                isOpened: false,
                position: 1,
              }),
            }),
          }),
        })
      );
    });

    it('includes correct 1-based position for each FAQ item', () => {
      setupWithFaqs([
        { title: 'First', description: '<p>Desc1</p>' },
        { title: 'Second', description: '<p>Desc2</p>' },
        { title: 'Third', description: '<p>Desc3</p>' },
      ]);
      render(<FAQSection />);

      act(() => { capturedOnValueChange?.('item-2'); }); // third item

      const edata = mockInteract.mock.calls[0]![0].edata;
      expect(edata.extra.values.position).toBe(3);
      expect(edata.extra.values.value.topic).toBe('Third');
    });

    it('does not fire interact when no previous value and empty string received', () => {
      render(<FAQSection />);
      // capturedOnValueChange starts with initial openValue="item-0" tracked in prevOpenValueRef
      // Calling with '' before any change: prevOpenValueRef is "item-0", so it WILL fire for collapse
      // Reset the scenario — call with non-existent index scenario
      // The guard `else if (prevValue)` catches empty-to-empty case:
      // This case is: prevValue="" and newValue="" → hits the else branch, returns early
      act(() => { capturedOnValueChange?.('item-0'); }); // open
      act(() => { capturedOnValueChange?.(''); });       // close (fires)
      mockInteract.mockClear();
      act(() => { capturedOnValueChange?.(''); });       // second empty — no prev value
      expect(mockInteract).not.toHaveBeenCalled();
    });
  });

  it('falls back to "en" when currentCode is falsy (line 33 || "en" branch)', () => {
    (useAppI18n as Mock).mockReturnValue({ t: mockT, currentCode: '' });
    (useSystemSetting as Mock).mockReturnValue({
      data: { data: { response: { value: 'http://example.com/faq' } } },
    });
    (useFaqData as Mock).mockReturnValue({ data: null, loading: false, error: null });

    render(<FAQSection />);
    // useFaqData should have been called with 'en' as the language fallback
    expect(useFaqData).toHaveBeenCalledWith(expect.any(String), 'en');
  });
});
