import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FAQSection from './FAQSection';
import { SystemSettingService } from '@/services/SystemSettingService';
import axios from 'axios';

// Mock dependencies
vi.mock('@/services/SystemSettingService');
vi.mock('axios');
vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
    currentCode: 'en',
    changeLanguage: vi.fn(),
    languages: [],
  }),
}));

describe('FAQSection', () => {
  const mockFaqUrl = 'https://example.com/faqs';
  const mockFaqData = {
    general: [
      {
        title: 'Test Question 1',
        description: '<b>Bold answer</b> with <i>italic</i> text',
      },
      {
        title: 'Test Question 2',
        description: 'Simple answer',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing when no FAQs are available', async () => {
    // Mock empty FAQ response
    vi.mocked(SystemSettingService.prototype.read).mockResolvedValue({
      data: { response: { value: mockFaqUrl } },
      status: 200,
      headers: {},
    });

    vi.mocked(axios.get).mockResolvedValue({
      data: { general: [] },
    });

    const { container } = render(<FAQSection />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should fetch and display FAQs from blob storage', async () => {
    // Mock API responses
    vi.mocked(SystemSettingService.prototype.read).mockResolvedValue({
      data: { response: { value: mockFaqUrl } },
      status: 200,
      headers: {},
    });

    vi.mocked(axios.get).mockResolvedValue({
      data: mockFaqData,
    });

    render(<FAQSection />);

    await waitFor(() => {
      expect(screen.getByText('Test Question 1')).toBeInTheDocument();
      expect(screen.getByText('Test Question 2')).toBeInTheDocument();
    });
  });

  it('should sanitize HTML content in FAQ descriptions', async () => {
    const maliciousData = {
      general: [
        {
          title: 'Security Test',
          description: '<b>Safe</b> <script>alert("XSS")</script>',
        },
      ],
    };

    vi.mocked(SystemSettingService.prototype.read).mockResolvedValue({
      data: { response: { value: mockFaqUrl } },
      status: 200,
      headers: {},
    });

    vi.mocked(axios.get).mockResolvedValue({
      data: maliciousData,
    });

    render(<FAQSection />);

    await waitFor(() => {
      expect(screen.getByText('Security Test')).toBeInTheDocument();
      // Script tag should be removed by DOMPurify
      expect(screen.queryByText(/alert/)).not.toBeInTheDocument();
    });
  });

  it('should fallback to English when language-specific FAQ is not available', async () => {
    vi.mocked(SystemSettingService.prototype.read).mockResolvedValue({
      data: { response: { value: mockFaqUrl } },
      status: 200,
      headers: {},
    });

    // First call fails (language-specific), second succeeds (English fallback)
    vi.mocked(axios.get)
      .mockRejectedValueOnce(new Error('404'))
      .mockResolvedValueOnce({
        data: mockFaqData,
      });

    render(<FAQSection />);

    await waitFor(() => {
      expect(screen.getByText('Test Question 1')).toBeInTheDocument();
    });

    // Verify axios was called twice (once for language, once for fallback)
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(SystemSettingService.prototype.read).mockRejectedValue(
      new Error('API Error')
    );

    const { container } = render(<FAQSection />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should render FAQ section title', async () => {
    vi.mocked(SystemSettingService.prototype.read).mockResolvedValue({
      data: { response: { value: mockFaqUrl } },
      status: 200,
      headers: {},
    });

    vi.mocked(axios.get).mockResolvedValue({
      data: mockFaqData,
    });

    render(<FAQSection />);

    await waitFor(() => {
      expect(screen.getByText('faq.title')).toBeInTheDocument();
    });
  });

  it('should handle missing general array in response', async () => {
    vi.mocked(SystemSettingService.prototype.read).mockResolvedValue({
      data: { response: { value: mockFaqUrl } },
      status: 200,
      headers: {},
    });

    vi.mocked(axios.get).mockResolvedValue({
      data: { categories: [] }, // No general array
    });

    const { container } = render(<FAQSection />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should handle FAQ URL not being set', async () => {
    vi.mocked(SystemSettingService.prototype.read).mockResolvedValue({
      data: { response: { value: '' } },
      status: 200,
      headers: {},
    });

    const { container } = render(<FAQSection />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });

    // Axios should not be called if FAQ URL is not set
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('should handle different API response structures for FAQ URL', async () => {
    // Test with value directly in data (not nested in response)
    vi.mocked(SystemSettingService.prototype.read).mockResolvedValue({
      data: { value: mockFaqUrl },
      status: 200,
      headers: {},
    });

    vi.mocked(axios.get).mockResolvedValue({
      data: mockFaqData,
    });

    render(<FAQSection />);

    await waitFor(() => {
      expect(screen.getByText('Test Question 1')).toBeInTheDocument();
    });
  });

  it('should use current language code when fetching FAQs', async () => {
    vi.mocked(SystemSettingService.prototype.read).mockResolvedValue({
      data: { response: { value: mockFaqUrl } },
      status: 200,
      headers: {},
    });

    vi.mocked(axios.get).mockResolvedValue({
      data: mockFaqData,
    });

    render(<FAQSection />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`${mockFaqUrl}/faq-en.json`);
    });
  });

  it('should render HTML content with proper formatting', async () => {
    const htmlData = {
      general: [
        {
          title: 'HTML Test',
          description: '<ul><li>Item 1</li><li>Item 2</li></ul>',
        },
      ],
    };

    vi.mocked(SystemSettingService.prototype.read).mockResolvedValue({
      data: { response: { value: mockFaqUrl } },
      status: 200,
      headers: {},
    });

    vi.mocked(axios.get).mockResolvedValue({
      data: htmlData,
    });

    render(<FAQSection />);

    await waitFor(() => {
      expect(screen.getByText('HTML Test')).toBeInTheDocument();
      // Check that HTML list is rendered
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
    });
  });

  it('should handle both language fetch and fallback failures', async () => {
    vi.mocked(SystemSettingService.prototype.read).mockResolvedValue({
      data: { response: { value: mockFaqUrl } },
      status: 200,
      headers: {},
    });

    // Both language-specific and English fallback fail
    vi.mocked(axios.get)
      .mockRejectedValueOnce(new Error('404'))
      .mockRejectedValueOnce(new Error('404'));

    const { container } = render(<FAQSection />);

    await waitFor(() => {
      // Verify axios was called twice (once for language, once for fallback)
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    // Component should render nothing when both fail
    expect(container.firstChild).toBeNull();
  });
});
