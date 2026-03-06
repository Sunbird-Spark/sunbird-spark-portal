import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import ContentNameDialog from './ContentNameDialog';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'create': 'Create',
        'content.label': 'Content',
        'workspace.enterName': 'Enter {{type}} name',
        'workspace.name': 'Name',
        'workspace.description': 'Description',
        'workspace.enterDescription': 'Enter a description',
        'workspace.fillDetails': 'Fill in the details to create your content',
        'collection.label': 'Collection',
        'workspace.selectCollectionType': 'Select a collection type',
        'cancel': 'Cancel',
        'workspace.creating': 'Creating...',
        'workspace.collectionType': 'Collection Type',
        'collection.contentPlaylist': 'Content Playlist',
        'collection.digitalTextbook': 'Digital Textbook',
        'collection.questionPaper': 'Question Paper',
      };
      let result = translations[key] ?? key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v));
        });
      }
      return result;
    },
  }),
}));

describe('ContentNameDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing when open is false', () => {
    const { container } = render(
      <ContentNameDialog {...defaultProps} open={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('should render dialog when open is true', () => {
    render(<ContentNameDialog {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create Content')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter content name')).toBeInTheDocument();
  });

  it('should display custom optionTitle when provided', () => {
    render(<ContentNameDialog {...defaultProps} optionTitle="Quiz" />);
    expect(screen.getByText('Create Quiz')).toBeInTheDocument();
  });

  it('should call onSubmit with trimmed name on form submit', () => {
    render(<ContentNameDialog {...defaultProps} />);

    const input = screen.getByPlaceholderText('Enter content name');
    fireEvent.change(input, { target: { value: '  My Content  ' } });
    fireEvent.submit(input.closest('form')!);

    expect(defaultProps.onSubmit).toHaveBeenCalledWith('My Content');
  });

  it('should not call onSubmit when name is empty or whitespace', () => {
    render(<ContentNameDialog {...defaultProps} />);

    const input = screen.getByPlaceholderText('Enter content name');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form')!);

    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should disable Create button when name is empty', () => {
    render(<ContentNameDialog {...defaultProps} />);

    const createButton = screen.getByRole('button', { name: 'Create' });
    expect(createButton).toBeDisabled();
  });

  it('should enable Create button when name has content', () => {
    render(<ContentNameDialog {...defaultProps} />);

    const input = screen.getByPlaceholderText('Enter content name');
    fireEvent.change(input, { target: { value: 'My Content' } });

    const createButton = screen.getByRole('button', { name: 'Create' });
    expect(createButton).not.toBeDisabled();
  });

  it('should call onClose when Cancel button is clicked', () => {
    render(<ContentNameDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onClose when clicking backdrop', () => {
    render(<ContentNameDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole('dialog'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should not close when clicking dialog content area', () => {
    render(<ContentNameDialog {...defaultProps} />);

    const input = screen.getByPlaceholderText('Enter content name');
    fireEvent.click(input.closest('.bg-white')!);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('should show loading state when isLoading is true', () => {
    render(<ContentNameDialog {...defaultProps} isLoading={true} />);

    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter content name')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('should auto-focus the input field', () => {
    render(<ContentNameDialog {...defaultProps} />);

    const input = screen.getByPlaceholderText('Enter content name');
    expect(input).toHaveFocus();
  });

  it('should close when Escape key is pressed', () => {
    render(<ContentNameDialog {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should not close on Escape when isLoading is true', () => {
    render(<ContentNameDialog {...defaultProps} isLoading={true} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('should reset name when dialog is closed via open prop', () => {
    const { rerender } = render(<ContentNameDialog {...defaultProps} />);

    const input = screen.getByPlaceholderText('Enter content name');
    fireEvent.change(input, { target: { value: 'My Content' } });

    // Close the dialog by changing open to false
    rerender(<ContentNameDialog {...defaultProps} open={false} />);

    // Reopen the dialog
    rerender(<ContentNameDialog {...defaultProps} open={true} />);

    const reopenedInput = screen.getByPlaceholderText('Enter content name');
    expect(reopenedInput).toHaveValue('');
  });

  describe('collection mode (optionId="collection")', () => {
    const collectionProps = { ...defaultProps, optionId: 'collection', optionTitle: 'Collection' };

    it('should render description and collection type fields', () => {
      render(<ContentNameDialog {...collectionProps} />);

      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText(/Collection Type/)).toBeInTheDocument();
      expect(screen.getByText('Select a collection type')).toBeInTheDocument();
    });

    it('should disable Create button when collection type is not selected', () => {
      render(<ContentNameDialog {...collectionProps} />);

      const input = screen.getByPlaceholderText('Enter collection name');
      fireEvent.change(input, { target: { value: 'My Collection' } });

      const createButton = screen.getByRole('button', { name: 'Create' });
      expect(createButton).toBeDisabled();
    });

    it('should enable Create button when name and collection type are filled', () => {
      render(<ContentNameDialog {...collectionProps} />);

      fireEvent.change(screen.getByPlaceholderText('Enter collection name'), { target: { value: 'My Collection' } });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'content-playlist' } });

      const createButton = screen.getByRole('button', { name: 'Create' });
      expect(createButton).not.toBeDisabled();
    });

    it('should call onSubmit with name and extra data', () => {
      render(<ContentNameDialog {...collectionProps} />);

      fireEvent.change(screen.getByPlaceholderText('Enter collection name'), { target: { value: 'My Collection' } });
      fireEvent.change(screen.getByPlaceholderText('Enter a description'), { target: { value: 'A description' } });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'digital-textbook' } });

      fireEvent.submit(screen.getByPlaceholderText('Enter collection name').closest('form')!);

      expect(defaultProps.onSubmit).toHaveBeenCalledWith('My Collection', {
        description: 'A description',
        collectionType: 'digital-textbook',
      });
    });

    it('should not include description when it is empty', () => {
      render(<ContentNameDialog {...collectionProps} />);

      fireEvent.change(screen.getByPlaceholderText('Enter collection name'), { target: { value: 'My Collection' } });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'question-paper' } });

      fireEvent.submit(screen.getByPlaceholderText('Enter collection name').closest('form')!);

      expect(defaultProps.onSubmit).toHaveBeenCalledWith('My Collection', {
        description: undefined,
        collectionType: 'question-paper',
      });
    });
  });

  it('should handle invalid data-cdata gracefully without crashing', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <ContentNameDialog 
        {...defaultProps} 
        submitButtonProps={{ 'data-cdata': 'invalid-json' }} 
      />
    );

    const input = screen.getByPlaceholderText('Enter content name');
    fireEvent.change(input, { target: { value: 'My Content' } });

    const createButton = screen.getByRole('button', { name: 'Create' });
    expect(createButton).toHaveAttribute(
      'data-cdata',
      JSON.stringify([{ id: 'My Content', type: 'ContentName' }])
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to parse data-cdata in ContentNameDialog',
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });
});
