import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ResourceFormDialog, { type ResourceFormData } from './ResourceFormDialog';
import { FormService } from '@/services/FormService';
import { FrameworkService } from '@/services/FrameworkService';

// Mock services
vi.mock('@/services/FormService');
vi.mock('@/services/FrameworkService');

const mockFormService = vi.mocked(FormService);
const mockFrameworkService = vi.mocked(FrameworkService);

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
  formSubType: 'resource',
  title: 'Create Content',
};

describe('ResourceFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    const mockFormServiceInstance = {
      formRead: vi.fn().mockResolvedValue(mockFormResponse),
    };
    const mockFrameworkServiceInstance = {
      read: vi.fn().mockResolvedValue(mockFrameworkResponse),
    };
    
    mockFormService.mockImplementation(() => mockFormServiceInstance as any);
    mockFrameworkService.mockImplementation(() => mockFrameworkServiceInstance as any);
  });

  it('should not render when open is false', () => {
    render(<ResourceFormDialog {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render dialog with title when open', () => {
    render(<ResourceFormDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create Content')).toBeInTheDocument();
  });

  it('should show loading state while fetching form', async () => {
    const mockFormServiceInstance = {
      formRead: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
    };
    mockFormService.mockImplementation(() => mockFormServiceInstance as any);

    render(<ResourceFormDialog {...defaultProps} />);
    
    expect(screen.getByText('Loading form...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });

  it('should fetch form and framework data on open', async () => {
    const mockFormServiceInstance = {
      formRead: vi.fn().mockResolvedValue(mockFormResponse),
    };
    const mockFrameworkServiceInstance = {
      read: vi.fn().mockResolvedValue(mockFrameworkResponse),
    };
    
    mockFormService.mockImplementation(() => mockFormServiceInstance as any);
    mockFrameworkService.mockImplementation(() => mockFrameworkServiceInstance as any);

    render(<ResourceFormDialog {...defaultProps} />);

    await waitFor(() => {
      expect(mockFormServiceInstance.formRead).toHaveBeenCalledWith({
        type: 'content',
        action: 'create',
        subType: 'resource',
        rootOrgId: 'test-channel',
        framework: 'test-framework',
      });
    });

    expect(mockFrameworkServiceInstance.read).toHaveBeenCalledWith('test-framework');
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
      const nameLabel = screen.getByText('Content Name');
      const subjectLabel = screen.getByText('Subject');
      
      expect(nameLabel.parentElement).toHaveTextContent('*');
      expect(subjectLabel.parentElement).toHaveTextContent('*');
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

  it('should handle select input changes', async () => {
    render(<ResourceFormDialog {...defaultProps} />);

    await waitFor(() => {
      const subjectSelect = screen.getByLabelText(/Subject/);
      fireEvent.change(subjectSelect, { target: { value: 'mathematics' } });
      expect(subjectSelect).toHaveValue('mathematics');
    });
  });

  it('should handle multiselect dropdown', async () => {
    render(<ResourceFormDialog {...defaultProps} />);

    await waitFor(() => {
      const audienceButton = screen.getByRole('button', { name: /Select target audience/i });
      fireEvent.click(audienceButton);
      
      const studentOption = screen.getByText('Student');
      fireEvent.click(studentOption);
      
      expect(screen.getByText('Student')).toBeInTheDocument();
    });
  });

  it('should handle number input changes', async () => {
    render(<ResourceFormDialog {...defaultProps} />);

    await waitFor(() => {
      const durationInput = screen.getByLabelText(/Duration/);
      fireEvent.change(durationInput, { target: { value: '30' } });
      expect(durationInput).toHaveValue(30);
    });
  });

  it('should disable submit button when required fields are empty', async () => {
    render(<ResourceFormDialog {...defaultProps} />);

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Create/ });
      expect(submitButton).toBeDisabled();
    });
  });

  it('should enable submit button when required fields are filled', async () => {
    render(<ResourceFormDialog {...defaultProps} />);

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/Content Name/);
      const subjectSelect = screen.getByLabelText(/Subject/);
      
      fireEvent.change(nameInput, { target: { value: 'Test Content' } });
      fireEvent.change(subjectSelect, { target: { value: 'mathematics' } });
      
      const submitButton = screen.getByRole('button', { name: /Create/ });
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should call onSubmit with correct data when form is submitted', async () => {
    const onSubmit = vi.fn();
    render(<ResourceFormDialog {...defaultProps} onSubmit={onSubmit} />);

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/Content Name/);
      const descriptionInput = screen.getByLabelText(/Description/);
      const subjectSelect = screen.getByLabelText(/Subject/);
      const durationInput = screen.getByLabelText(/Duration/);
      
      fireEvent.change(nameInput, { target: { value: 'Test Content' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
      fireEvent.change(subjectSelect, { target: { value: 'mathematics' } });
      fireEvent.change(durationInput, { target: { value: '30' } });
      
      const submitButton = screen.getByRole('button', { name: /Create/ });
      fireEvent.click(submitButton);
    });

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Test Content',
      description: 'Test Description',
      dynamicFields: {
        subject: 'mathematics',
        duration: 30,
      },
    });
  });

  it('should use default values for empty fields', async () => {
    const onSubmit = vi.fn();
    render(<ResourceFormDialog {...defaultProps} onSubmit={onSubmit} />);

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/Content Name/);
      const subjectSelect = screen.getByLabelText(/Subject/);
      
      fireEvent.change(nameInput, { target: { value: 'Test Content' } });
      fireEvent.change(subjectSelect, { target: { value: 'mathematics' } });
      
      const submitButton = screen.getByRole('button', { name: /Create/ });
      fireEvent.click(submitButton);
    });

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Test Content',
      description: 'Enter description for Resource',
      dynamicFields: {
        subject: 'mathematics',
      },
    });
  });

  it('should handle form fetch error', async () => {
    const mockFormServiceInstance = {
      formRead: vi.fn().mockRejectedValue(new Error('API Error')),
    };
    mockFormService.mockImplementation(() => mockFormServiceInstance as any);

    render(<ResourceFormDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load form configuration. Please try again.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument();
    });
  });

  it('should retry form fetch on retry button click', async () => {
    const mockFormServiceInstance = {
      formRead: vi.fn()
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(mockFormResponse),
    };
    const mockFrameworkServiceInstance = {
      read: vi.fn().mockResolvedValue(mockFrameworkResponse),
    };
    
    mockFormService.mockImplementation(() => mockFormServiceInstance as any);
    mockFrameworkService.mockImplementation(() => mockFrameworkServiceInstance as any);

    render(<ResourceFormDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load form configuration. Please try again.')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /Retry/ });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/Content Name/)).toBeInTheDocument();
    });

    expect(mockFormServiceInstance.formRead).toHaveBeenCalledTimes(2);
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

  it('should show loading state on submit button when isLoading is true', async () => {
    render(<ResourceFormDialog {...defaultProps} isLoading={true} />);

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Creating.../ });
      expect(submitButton).toBeDisabled();
    });
  });

  it('should handle framework categories for field options', async () => {
    const mockFormWithFrameworkField = {
      data: {
        form: {
          data: {
            fields: [
              {
                code: 'gradeLevel',
                name: 'Grade Level',
                label: 'Grade Level',
                description: 'Grade level',
                inputType: 'select',
                required: true,
                editable: true,
                visible: true,
                placeholder: 'Select grade',
                index: 1,
              },
            ],
          },
        },
      },
    };

    const mockFormServiceInstance = {
      formRead: vi.fn().mockResolvedValue(mockFormWithFrameworkField),
    };
    const mockFrameworkServiceInstance = {
      read: vi.fn().mockResolvedValue(mockFrameworkResponse),
    };
    
    mockFormService.mockImplementation(() => mockFormServiceInstance as any);
    mockFrameworkService.mockImplementation(() => mockFrameworkServiceInstance as any);

    render(<ResourceFormDialog {...defaultProps} />);

    await waitFor(() => {
      const gradeLevelSelect = screen.getByLabelText(/Grade Level/);
      expect(gradeLevelSelect).toBeInTheDocument();
      
      // Check if framework options are available
      expect(screen.getByText('Grade 1')).toBeInTheDocument();
      expect(screen.getByText('Grade 2')).toBeInTheDocument();
    });
  });

  it('should handle multiselect tag removal', async () => {
    render(<ResourceFormDialog {...defaultProps} />);

    await waitFor(() => {
      const audienceButton = screen.getByRole('button', { name: /Select target audience/i });
      fireEvent.click(audienceButton);
      
      const studentOption = screen.getByText('Student');
      fireEvent.click(studentOption);
      
      // Find and click the remove button (×)
      const removeButton = screen.getByText('×');
      fireEvent.click(removeButton);
      
      expect(screen.queryByText('Student')).not.toBeInTheDocument();
    });
  });

  it('should close dropdown when clicking outside', async () => {
    render(<ResourceFormDialog {...defaultProps} />);

    await waitFor(() => {
      const audienceButton = screen.getByRole('button', { name: /Select target audience/i });
      fireEvent.click(audienceButton);
      
      expect(screen.getByText('Student')).toBeInTheDocument();
      
      // Click outside
      fireEvent.mouseDown(document.body);
      
      expect(screen.queryByText('Student')).not.toBeInTheDocument();
    });
  });

  it('should handle escape key to close dialog', async () => {
    const onClose = vi.fn();
    render(<ResourceFormDialog {...defaultProps} onClose={onClose} />);

    await waitFor(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('should not close on escape when loading', async () => {
    const onClose = vi.fn();
    render(<ResourceFormDialog {...defaultProps} onClose={onClose} isLoading={true} />);

    await waitFor(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});