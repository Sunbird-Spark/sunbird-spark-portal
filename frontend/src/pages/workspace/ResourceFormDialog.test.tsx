import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ResourceFormDialog from './ResourceFormDialog';

// Hoist the mock functions to avoid initialization order issues
const { mockFormRead, mockFrameworkRead } = vi.hoisted(() => ({
  mockFormRead: vi.fn(),
  mockFrameworkRead: vi.fn(),
}));

// Mock the Button component
vi.mock('@/components/common/Button', () => ({
  Button: ({ children, onClick, disabled, type, ...props }: any) => (
    <button 
      type={type || 'button'} 
      onClick={onClick} 
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock services with proper implementation
vi.mock('@/services/FormService', () => ({
  FormService: class MockFormService {
    formRead = mockFormRead;
  },
}));

vi.mock('@/services/FrameworkService', () => ({
  FrameworkService: class MockFrameworkService {
    read = mockFrameworkRead;
  },
}));

const mockFormResponse = {
  data: {
    form: {
      data: {
        fields: [
          {
            code: 'name',
            name: 'Name',
            label: 'Content Name',
            description: 'Name of the content',
            inputType: 'text',
            required: true,
            editable: true,
            visible: true,
            placeholder: 'Enter content name',
            index: 1,
          },
          {
            code: 'description',
            name: 'Description',
            label: 'Description',
            description: 'Description of the content',
            inputType: 'text',
            required: false,
            editable: true,
            visible: true,
            placeholder: 'Enter description',
            index: 2,
          },
          {
            code: 'subject',
            name: 'Subject',
            label: 'Subject',
            description: 'Subject area',
            inputType: 'select',
            required: true,
            editable: true,
            visible: true,
            placeholder: 'Select subject',
            index: 3,
            range: [
              { key: 'mathematics', name: 'Mathematics' },
              { key: 'science', name: 'Science' },
            ],
          },
          {
            code: 'audience',
            name: 'Audience',
            label: 'Target Audience',
            description: 'Target audience',
            inputType: 'multiSelect',
            required: false,
            editable: true,
            visible: true,
            placeholder: 'Select audience',
            index: 4,
            range: [
              { key: 'student', name: 'Student' },
              { key: 'teacher', name: 'Teacher' },
            ],
          },
          {
            code: 'duration',
            name: 'Duration',
            label: 'Duration (minutes)',
            description: 'Content duration',
            inputType: 'number',
            required: false,
            editable: true,
            visible: true,
            placeholder: 'Enter duration',
            index: 5,
          },
        ],
      },
    },
  },
};

const mockFrameworkResponse = {
  data: {
    framework: {
      categories: [
        {
          code: 'gradeLevel',
          terms: [
            { name: 'Grade 1', code: 'grade1' },
            { name: 'Grade 2', code: 'grade2' },
          ],
        },
      ],
    },
  },
};

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  isLoading: false,
  orgChannelId: 'test-channel',
  orgFramework: 'test-framework',
  formSubType: 'resource' as const,
  title: 'Create Content',
};

describe('ResourceFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFormRead.mockResolvedValue(mockFormResponse);
    mockFrameworkRead.mockResolvedValue(mockFrameworkResponse);
  });

  it('should not render when open is false', () => {
    render(<ResourceFormDialog {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render dialog with title when open', () => {
    render(<ResourceFormDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create Content')).toBeInTheDocument();
    expect(screen.getByText('Fill in the details to create your content')).toBeInTheDocument();
  });

  it('should show loading state while fetching form', async () => {
    // Mock a never-resolving promise to keep loading state
    mockFormRead.mockImplementation(() => new Promise(() => {}));

    render(<ResourceFormDialog {...defaultProps} />);
    
    expect(screen.getByText('Loading form...')).toBeInTheDocument();
    // Check for the spinner element
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should fetch form and framework data on open', async () => {
    render(<ResourceFormDialog {...defaultProps} />);

    await waitFor(() => {
      expect(mockFormRead).toHaveBeenCalledWith({
        type: 'content',
        action: 'create',
        subType: 'resource',
        rootOrgId: 'test-channel',
        framework: 'test-framework',
      });
    });

    expect(mockFrameworkRead).toHaveBeenCalledWith('test-framework');
  });

  it('should render form fields after successful fetch', async () => {
    render(<ResourceFormDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Content Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Subject/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Target Audience/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Duration/)).toBeInTheDocument();
    });
  });

  it('should show required field indicators', async () => {
    render(<ResourceFormDialog {...defaultProps} />);

    await waitFor(() => {
      // Check for asterisks in required field labels
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  it('should handle text input changes', async () => {
    render(<ResourceFormDialog {...defaultProps} />);

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/Content Name/);
      fireEvent.change(nameInput, { target: { value: 'Test Content' } });
      expect(nameInput).toHaveValue('Test Content');
    });
  });

  it('should handle form fetch error', async () => {
    mockFormRead.mockRejectedValue(new Error('API Error'));

    render(<ResourceFormDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load form configuration. Please try again.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument();
    });
  });

  it('should call onClose when clicking outside dialog', async () => {
    const onClose = vi.fn();
    render(<ResourceFormDialog {...defaultProps} onClose={onClose} />);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('should not call onClose when clicking inside dialog content', async () => {
    const onClose = vi.fn();
    render(<ResourceFormDialog {...defaultProps} onClose={onClose} />);

    await waitFor(() => {
      const dialogContent = screen.getByText('Fill in the details to create your content');
      fireEvent.click(dialogContent);
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should handle escape key to close dialog', async () => {
    const onClose = vi.fn();
    render(<ResourceFormDialog {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('should not close on escape when loading', async () => {
    const onClose = vi.fn();
    render(<ResourceFormDialog {...defaultProps} onClose={onClose} isLoading={true} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should call onSubmit with form data when form is submitted', async () => {
    const onSubmit = vi.fn();
    render(<ResourceFormDialog {...defaultProps} onSubmit={onSubmit} />);

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/Content Name/);
      const subjectSelect = screen.getByLabelText(/Subject/);
      
      fireEvent.change(nameInput, { target: { value: 'Test Content' } });
      fireEvent.change(subjectSelect, { target: { value: 'mathematics' } });
      
      const form = nameInput.closest('form');
      if (form) {
        fireEvent.submit(form);
      }
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Content',
        dynamicFields: expect.objectContaining({
          subject: 'mathematics',
        }),
      })
    );
  });

  it('should use default description when empty', async () => {
    const onSubmit = vi.fn();
    render(<ResourceFormDialog {...defaultProps} onSubmit={onSubmit} />);

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/Content Name/);
      const subjectSelect = screen.getByLabelText(/Subject/);
      
      fireEvent.change(nameInput, { target: { value: 'Test Content' } });
      fireEvent.change(subjectSelect, { target: { value: 'mathematics' } });
      
      const form = nameInput.closest('form');
      if (form) {
        fireEvent.submit(form);
      }
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Content',
        description: 'Enter description for Resource',
      })
    );
  });

  it('should handle retry on form fetch error', async () => {
    mockFormRead
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce(mockFormResponse);

    render(<ResourceFormDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load form configuration. Please try again.')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /Retry/ });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/Content Name/)).toBeInTheDocument();
    });

    expect(mockFormRead).toHaveBeenCalledTimes(2);
  });

  it('should show loading state on submit button when isLoading is true', async () => {
    render(<ResourceFormDialog {...defaultProps} isLoading={true} />);

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Creating.../ });
      expect(submitButton).toBeDisabled();
    });
  });

  it('should call onClose when cancel button is clicked', async () => {
    const onClose = vi.fn();
    render(<ResourceFormDialog {...defaultProps} onClose={onClose} />);

    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      fireEvent.click(cancelButton);
    });

    expect(onClose).toHaveBeenCalled();
  });
});