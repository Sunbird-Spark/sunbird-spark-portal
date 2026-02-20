import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ExploreFilters from './ExploreFilters';
import { useFormRead } from '../../hooks/useForm';
import type { FilterState } from '../../pages/Explore';

// --------------------
// Mocks
// --------------------

vi.mock('../../hooks/useForm');

vi.mock('../../hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

// Mock Accordion so we can inspect defaultValue and render content unconditionally
vi.mock('../landing/Accordion', () => ({
  Accordion: ({ children, defaultValue }: { children: React.ReactNode; defaultValue: string[] }) => (
    <div data-testid="accordion" data-default-value={JSON.stringify(defaultValue)}>
      {children}
    </div>
  ),
  AccordionItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-accordion-item={value}>{children}</div>
  ),
  AccordionTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  AccordionContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../common/CheckBox', () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
  }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  ),
}));

// --------------------
// Mock data
// --------------------

// Intentionally places 'content' (index 2) before 'collection' (index 1) in the array
// to verify that sorting by index works correctly.
const mockFormData = {
  data: {
    form: {
      data: {
        filters: [
          {
            id: 'content',
            index: 2,
            label: 'ContentTypes',
            list: [
              { id: 'video', index: 1, label: 'Video', code: 'mimeType', value: ['video/mp4', 'video/webm'] },
              { id: 'pdf',   index: 2, label: 'PDF',   code: 'mimeType', value: ['application/pdf'] },
            ],
          },
          {
            id: 'collection',
            index: 1,
            label: 'Collections',
            options: [
              { id: 'course',           index: 1, label: 'Course',           code: 'primaryCategory', value: 'Course' },
              { id: 'digital_textbook', index: 2, label: 'Digital Textbook', code: 'primaryCategory', value: 'Digital Textbook' },
            ],
          },
        ],
      },
    },
  },
};

// --------------------
// Helpers
// --------------------

const renderComponent = (
  filters: FilterState = {},
  setFilters: React.Dispatch<React.SetStateAction<FilterState>> = vi.fn()
) => render(<ExploreFilters filters={filters} setFilters={setFilters} />);

// --------------------
// Tests
// --------------------

describe('ExploreFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows a skeleton while the form API is loading', () => {
      vi.mocked(useFormRead).mockReturnValue({ isLoading: true, isError: false, data: undefined } as any);
      renderComponent();
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('scenario 3 — hide when errored or empty', () => {
    it('renders nothing when the form API returns an error', () => {
      vi.mocked(useFormRead).mockReturnValue({ isLoading: false, isError: true, data: undefined } as any);
      const { container } = renderComponent();
      expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when the API returns an empty filters array', () => {
      vi.mocked(useFormRead).mockReturnValue({
        isLoading: false,
        isError: false,
        data: { data: { form: { data: { filters: [] } } } },
      } as any);
      const { container } = renderComponent();
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('scenario 1 — sort by index', () => {
    beforeEach(() => {
      vi.mocked(useFormRead).mockReturnValue({
        isLoading: false,
        isError: false,
        data: mockFormData,
      } as any);
    });

    it('renders filter group section headers sorted by index', () => {
      renderComponent();
      // 'collection' has index 1 → should come before 'content' (index 2)
      const triggers = screen.getAllByRole('button');
      expect(triggers[0]).toHaveTextContent('Collections');
      expect(triggers[1]).toHaveTextContent('ContentTypes');
    });

    it('renders options within a group sorted by index', () => {
      renderComponent();
      // Collections: Course (index 1), Digital Textbook (index 2)
      const courseLabel   = screen.getByText('Course');
      const textbookLabel = screen.getByText('Digital Textbook');
      expect(courseLabel.compareDocumentPosition(textbookLabel)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });
  });

  describe('scenario 4 — open only the first section by default', () => {
    it('sets defaultValue to only the first group id (sorted by index)', () => {
      vi.mocked(useFormRead).mockReturnValue({
        isLoading: false,
        isError: false,
        data: mockFormData,
      } as any);
      renderComponent();
      // First group sorted by index is 'collection' (index 1)
      const accordion = screen.getByTestId('accordion');
      expect(accordion).toHaveAttribute('data-default-value', '["collection"]');
    });
  });

  describe('scenario 2 — code as key, value as value in filters', () => {
    beforeEach(() => {
      vi.mocked(useFormRead).mockReturnValue({
        isLoading: false,
        isError: false,
        data: mockFormData,
      } as any);
    });

    // Checkbox order (groups sorted by index, options sorted by index):
    // [0] Course          — primaryCategory, scalar value 'Course'
    // [1] Digital Textbook — primaryCategory, scalar value 'Digital Textbook'
    // [2] Video            — mimeType, array value ['video/mp4', 'video/webm']
    // [3] PDF              — mimeType, array value ['application/pdf']

    it('adds a scalar value to filters[code] when checked', () => {
      const setFilters = vi.fn();
      renderComponent({}, setFilters);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]!); // Course

      const updater = setFilters.mock.calls[0]![0] as (prev: FilterState) => FilterState;
      expect(updater({})).toEqual({ primaryCategory: ['Course'] });
    });

    it('adds all values in an array option to filters[code] when checked', () => {
      const setFilters = vi.fn();
      renderComponent({}, setFilters);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[2]!); // Video

      const updater = setFilters.mock.calls[0]![0] as (prev: FilterState) => FilterState;
      expect(updater({})).toEqual({ mimeType: ['video/mp4', 'video/webm'] });
    });

    it('merges new values with existing values for the same code', () => {
      const setFilters = vi.fn();
      renderComponent({ primaryCategory: ['Digital Textbook'] }, setFilters);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]!); // Add Course

      const updater = setFilters.mock.calls[0]![0] as (prev: FilterState) => FilterState;
      expect(updater({ primaryCategory: ['Digital Textbook'] })).toEqual({
        primaryCategory: ['Digital Textbook', 'Course'],
      });
    });

    it('removes all option values from filters[code] when unchecked', () => {
      const setFilters = vi.fn();
      renderComponent({ mimeType: ['video/mp4', 'video/webm'] }, setFilters);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[2]!); // Uncheck Video

      const updater = setFilters.mock.calls[0]![0] as (prev: FilterState) => FilterState;
      expect(updater({ mimeType: ['video/mp4', 'video/webm'] })).toEqual({ mimeType: [] });
    });

    it('shows a checkbox as checked when all its values are present in filters', () => {
      renderComponent({ mimeType: ['video/mp4', 'video/webm'] });
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[2]).toBeChecked();   // Video — both values present
      expect(checkboxes[3]).not.toBeChecked(); // PDF — value not present
    });

    it('shows a checkbox as unchecked when only some of its values are present', () => {
      // Only one of Video's two mimeType values is present — should show unchecked
      renderComponent({ mimeType: ['video/mp4'] });
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[2]).not.toBeChecked(); // Video requires both mp4 AND webm
    });

    it('does not duplicate values when the same option is checked twice', () => {
      const setFilters = vi.fn();
      renderComponent({}, setFilters);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]!); // Course (first click)

      const updater = setFilters.mock.calls[0]![0] as (prev: FilterState) => FilterState;
      // Simulate already having Course in filters
      const result = updater({ primaryCategory: ['Course'] });
      expect(result.primaryCategory).toEqual(['Course']); // no duplicate
    });
  });
});
