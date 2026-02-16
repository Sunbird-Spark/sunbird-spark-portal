import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FAQSection from './FAQSection';
import { SystemSettingService } from '@/services/SystemSettingService';
import { BlobStorageService } from '@/services/BlobStorageService';

// Mock dependencies
vi.mock('@/services/SystemSettingService');
vi.mock('@/services/BlobStorageService');

const mockUseAppI18n = vi.fn();
vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => mockUseAppI18n(),
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
    // Default mock for useAppI18n
    mockUseAppI18n.mockReturnValue({
      t: (key: string) => key,
      currentCode: 'en',
      changeLanguage: vi.fn(),
      languages: [],
    });
  });

  it('should render nothing when no FAQs are available', async () => {
    // Mock empty FAQ response
    vi.mocked(SystemSettingService.prototype.read).mockResolvedValue({
      data: { response: { value: mockFaqUrl } },
      status: 200,
      headers: {},
    });

    vi.mocked(BlobStorageService.prototype.buildLanguageUrl).mockReturnValue(
      `${mockFaqUrl}/faq-en.json`
    );

    vi.mocked(BlobStorageService.prototype.fetchJson).mockResolvedValue({
      general: [],
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

    vi.mocked(BlobStorageService.prototype.buildLanguageUrl).mockReturnValue(
      `${mockFaqUrl}/faq-en.json`
    );

    vi.mocked(BlobStorageService.prototype.fetchJson).mockResolvedValue(mockFaqData);

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

    vi.mocked(BlobStorageService.prototype.buildLanguageUrl).mockReturnValue(
      `${mockFaqUrl}/faq-en.json`
    );

    vi.mocked(BlobStorageService.prototype.fetchJson).mockResolvedValue(maliciousData);

    render(<FAQSection />);

    await waitFor(() => {
      expect(screen.getByText('Security Test')).toBeInTheDocument();
      // Script tag should be removed by DOMPurify
      expect(screen.queryByText(/alert/)).not.toBeInTheDocument();
    });
  });

  it('should fallback to English when language-specific FAQ is not available', async () => {
    // Override the default 'en' language to test fallback behavior
    mockUseAppI18n.mockReturnValue({
      t: (key: string) => key,
      currentCode: 'fr', // Use French to trigger fallback
      changeLanguage: vi.fn(),
      languages: [],
    });

    vi.mocked(SystemSettingService.prototype.read).mockResolvedValue({
      data: { response: { value: mockFaqUrl } },
      status: 200,
      headers: {},
    });

    vi.mocked(BlobStorageService.prototype.buildLanguageUrl)
      .mockReturnValueOnce(`${mockFaqUrl}/faq-fr.json`)
      .mockReturnValueOnce(`${mockFaqUrl}/faq-en.json`);

    // Mock fetchJsonWithFallback to return data (simulating successful fallback)
    vi.mocked(BlobStorageService.prototype.fetchJsonWithFallback).mockResolvedValue(mockFaqData);

    render(<FAQSection />);

    await waitFor(() => {
      expect(screen.getByText('Test Question 1')).toBeInTheDocument();
    });

    // Verify fetchJsonWithFallback was called
    expect(BlobStorageService.prototype.fetchJsonWithFallback).toHaveBeenCalledTimes(1);
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

    vi.mocked(BlobStorageService.prototype.buildLanguageUrl).mockReturnValue(
      `${mockFaqUrl}/faq-en.json`
    );

    vi.mocked(BlobStorageService.prototype.fetchJson).mockResolvedValue(mockFaqData);

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

    vi.mocked(BlobStorageService.prototype.buildLanguageUrl).mockReturnValue(
      `${mockFaqUrl}/faq-en.json`
    );

    vi.mocked(BlobStorageService.prototype.fetchJson).mockResolvedValue({
      categories: [], // No general array
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

    // BlobStorageService should not be called if FAQ URL is not set
    expect(BlobStorageService.prototype.fetchJson).not.toHaveBeenCalled();
  });

  it('should handle different API response structures for FAQ URL', async () => {
    // Test with value directly in data (not nested in response)
    vi.mocked(SystemSettingService.prototype.read).mockResolvedValue({
      data: { value: mockFaqUrl },
      status: 200,
      headers: {},
    });

    vi.mocked(BlobStorageService.prototype.buildLanguageUrl).mockReturnValue(
      `${mockFaqUrl}/faq-en.json`
    );

    vi.mocked(BlobStorageService.prototype.fetchJson).mockResolvedValue(mockFaqData);

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

    vi.mocked(BlobStorageService.prototype.buildLanguageUrl).mockReturnValue(
      `${mockFaqUrl}/faq-en.json`
    );

    vi.mocked(BlobStorageService.prototype.fetchJson).mockResolvedValue(mockFaqData);

    render(<FAQSection />);

    await waitFor(() => {
      expect(BlobStorageService.prototype.buildLanguageUrl).toHaveBeenCalledWith(
        mockFaqUrl,
        'faq',
        'en'
      );
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

    vi.mocked(BlobStorageService.prototype.buildLanguageUrl).mockReturnValue(
      `${mockFaqUrl}/faq-en.json`
    );

    vi.mocked(BlobStorageService.prototype.fetchJson).mockResolvedValue(htmlData);

    render(<FAQSection />);

    await waitFor(() => {
      expect(screen.getByText('HTML Test')).toBeInTheDocument();
      // Check that HTML list is rendered
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
    });
  });

  it('should handle both language fetch and fallback failures', async () => {
    // Override the default 'en' language to test fallback behavior
    mockUseAppI18n.mockReturnValue({
      t: (key: string) => key,
      currentCode: 'fr', // Use French to trigger fallback
      changeLanguage: vi.fn(),
      languages: [],
    });

    vi.mocked(SystemSettingService.prototype.read).mockResolvedValue({
      data: { response: { value: mockFaqUrl } },
      status: 200,
      headers: {},
    });

    vi.mocked(BlobStorageService.prototype.buildLanguageUrl)
      .mockReturnValueOnce(`${mockFaqUrl}/faq-fr.json`)
      .mockReturnValueOnce(`${mockFaqUrl}/faq-en.json`);

    // Mock fetchJsonWithFallback to return null (both primary and fallback failed)
    vi.mocked(BlobStorageService.prototype.fetchJsonWithFallback).mockResolvedValue(null);

    const { container } = render(<FAQSection />);

    await waitFor(() => {
      // Verify fetchJsonWithFallback was called
      expect(BlobStorageService.prototype.fetchJsonWithFallback).toHaveBeenCalledTimes(1);
    });

    // Component should render nothing when both fail
    expect(container.firstChild).toBeNull();
  });

  it('should filter out FAQs with empty descriptions', async () => {
    const dataWithEmptyDescription = {
      general: [
        {
          title: 'Valid Question',
          description: 'Valid answer',
        },
        {
          title: 'Empty Description Question',
          description: '',
        },
        {
          title: 'Another Valid Question',
          description: 'Another valid answer',
        },
      ],
    };

    vi.mocked(SystemSettingService.prototype.read).mockResolvedValue({
      data: { response: { value: mockFaqUrl } },
      status: 200,
      headers: {},
    });

    vi.mocked(BlobStorageService.prototype.buildLanguageUrl).mockReturnValue(
      `${mockFaqUrl}/faq-en.json`
    );

    // Since currentCode is 'en', it will use fetchJson (not fetchJsonWithFallback)
    vi.mocked(BlobStorageService.prototype.fetchJson).mockResolvedValue(dataWithEmptyDescription);

    render(<FAQSection />);

    await waitFor(() => {
      expect(screen.getByText('Valid Question')).toBeInTheDocument();
      expect(screen.getByText('Another Valid Question')).toBeInTheDocument();
      expect(screen.queryByText('Empty Description Question')).not.toBeInTheDocument();
    });
  });

  it('should filter out FAQs with empty titles', async () => {
    const dataWithEmptyTitle = {
      general: [
        {
          title: 'Valid Question',
          description: 'Valid answer',
        },
        {
          title: '',
          description: 'This has no title',
        },
      ],
    };

    vi.mocked(SystemSettingService.prototype.read).mockResolvedValue({
      data: { response: { value: mockFaqUrl } },
      status: 200,
      headers: {},
    });

    vi.mocked(BlobStorageService.prototype.buildLanguageUrl).mockReturnValue(
      `${mockFaqUrl}/faq-en.json`
    );

    // Since currentCode is 'en', it will use fetchJson (not fetchJsonWithFallback)
    vi.mocked(BlobStorageService.prototype.fetchJson).mockResolvedValue(dataWithEmptyTitle);

    render(<FAQSection />);

    await waitFor(() => {
      expect(screen.getByText('Valid Question')).toBeInTheDocument();
      // Should only render 1 FAQ item
      const accordionItems = screen.getAllByRole('button');
      expect(accordionItems).toHaveLength(1);
    });
  });
});
