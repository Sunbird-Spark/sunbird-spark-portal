import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateOptions from './CreateOptions';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

describe('CreateOptions', () => {
  it('renders welcome text and Collection Editor category', () => {
    const onOptionSelect = vi.fn();
    render(<CreateOptions onOptionSelect={onOptionSelect} />);
    expect(screen.getByText('createOptions.title')).toBeInTheDocument();
    expect(screen.getByText('workspace.categories.collectionEditor.title')).toBeInTheDocument();
  });

  it('calls onOptionSelect with option id when Course is clicked', () => {
    const onOptionSelect = vi.fn();
    render(<CreateOptions onOptionSelect={onOptionSelect} />);
    const courseButton = screen.getByRole('button', { name: /workspace\.editorOptions\.course/ });
    fireEvent.click(courseButton);
    expect(onOptionSelect).toHaveBeenCalledWith('course');
  });

  it('calls onOptionSelect when another option is clicked', () => {
    const onOptionSelect = vi.fn();
    render(<CreateOptions onOptionSelect={onOptionSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /workspace\.editorOptions\.collection/ }));
    expect(onOptionSelect).toHaveBeenCalledWith('collection');
  });
});
