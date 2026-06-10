import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SemanticSuggestions from './SemanticSuggestions';

const MOCK_SUGGESTIONS = [
  "How to teach fractions to beginners?",
  "Creative writing activities for students",
  "Science experiments for kids at home",
  "Learn programming basics step by step",
  "History of ancient civilizations",
  "Mathematics problem solving strategies",
];

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, opts?: { returnObjects?: boolean }) => {
      if (key === 'search.suggestions' && opts?.returnObjects) return MOCK_SUGGESTIONS;
      const map: Record<string, string> = {
        'search.semanticSuggestTitle': 'Try AI Search',
        'search.semanticSuggestSubtitle': 'Ask in natural language — or pick a suggestion below',
      };
      return map[key] ?? key;
    },
  }),
}));

describe('SemanticSuggestions', () => {
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title and subtitle', () => {
    render(<SemanticSuggestions onSelect={onSelect} />);
    expect(screen.getByText('Try AI Search')).toBeInTheDocument();
    expect(screen.getByText('Ask in natural language — or pick a suggestion below')).toBeInTheDocument();
  });

  it('renders suggestion pill buttons', () => {
    render(<SemanticSuggestions onSelect={onSelect} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders all expected suggestion texts', () => {
    render(<SemanticSuggestions onSelect={onSelect} />);
    expect(screen.getByText('How to teach fractions to beginners?')).toBeInTheDocument();
    expect(screen.getByText('Creative writing activities for students')).toBeInTheDocument();
    expect(screen.getByText('Science experiments for kids at home')).toBeInTheDocument();
    expect(screen.getByText('Learn programming basics step by step')).toBeInTheDocument();
    expect(screen.getByText('History of ancient civilizations')).toBeInTheDocument();
    expect(screen.getByText('Mathematics problem solving strategies')).toBeInTheDocument();
  });

  it('calls onSelect with the suggestion text when a pill is clicked', () => {
    render(<SemanticSuggestions onSelect={onSelect} />);
    fireEvent.click(screen.getByText('How to teach fractions to beginners?'));
    expect(onSelect).toHaveBeenCalledWith('How to teach fractions to beginners?');
  });

  it('calls onSelect with the correct text for each suggestion', () => {
    render(<SemanticSuggestions onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Learn programming basics step by step'));
    expect(onSelect).toHaveBeenCalledWith('Learn programming basics step by step');
  });

  it('calls onSelect only once per click', () => {
    render(<SemanticSuggestions onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Creative writing activities for students'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('renders 6 suggestion pills', () => {
    render(<SemanticSuggestions onSelect={onSelect} />);
    expect(screen.getAllByRole('button')).toHaveLength(6);
  });
});
