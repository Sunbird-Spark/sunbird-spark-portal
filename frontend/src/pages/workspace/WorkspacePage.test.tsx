import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import WorkspacePage from './WorkspacePage';
import type { UseWorkspaceReturn, WorkspaceItem } from '@/types/workspaceTypes';
import type { ContentFormData } from './ContentDynamicFormDialog';

const { mockNavigate, mockContentCreate, mockQuestionSetMutateAsync, mockQuestionSetRetireMutateAsync } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockContentCreate: vi.fn(),
  mockQuestionSetMutateAsync: vi.fn(),
  mockQuestionSetRetireMutateAsync: vi.fn(),
}));

const mockUseWorkspace = vi.fn<() => UseWorkspaceReturn>();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/services/ContentService', () => ({
  ContentService: class MockContentService {
    contentCreate = mockContentCreate;
    contentRetire = vi.fn().mockResolvedValue({ data: { result: 'success' } });
  },
}));

vi.mock('@/hooks/useWorkspace', () => ({ useWorkspace: () => mockUseWorkspace() }));

vi.mock('@/hooks/useUserRead', () => ({
  useUserRead: () => ({
    data: {
      data: {
        response: {
          firstName: 'Test',
          lastName: 'User',
          channel: 'test-channel-slug',
          roles: [{ role: 'CONTENT_CREATOR' }],
        },
      },
    },
  }),
}));
vi.mock('@/hooks/useOrganization', () => ({ 
  useOrganizationSearch: () => ({ 
    mutateAsync: vi.fn().mockResolvedValue({ 
      data: { 
        response: { 
          content: [{ 
            hashTagId: 'test-org-id', 
            identifier: 'test-org-id' 
          }] 
        } 
      } 
    }) 
  }) 
}));
vi.mock('@/hooks/useQuestionSetCreate', () => ({ useQuestionSetCreate: () => ({ mutateAsync: mockQuestionSetMutateAsync }) }));
vi.mock('@/hooks/useQuestionSetRetire', () => ({ useQuestionSetRetire: () => ({ mutateAsync: mockQuestionSetRetireMutateAsync }) }));
vi.mock('@/hooks/useChannel', () => ({ useChannel: () => ({ data: undefined }) }));

vi.mock('@/hooks/usePermission', () => ({
  usePermissions: () => ({
    roles: ['PUBLIC'],
    isLoading: false,
    isAuthenticated: false,
    error: null,
    hasAnyRole: vi.fn(() => false),
    canAccessFeature: vi.fn(() => false),
    refetch: vi.fn(),
  }),
}));

vi.mock('@/services/UserProfileService', () => ({
  default: {
    initialize: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { name: 'Test User', role: 'content_creator' },
    login: vi.fn(),
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getUserId: () => 'test-user-id',
    isUserAuthenticated: () => true,
  },
}));

const mockToast = vi.fn();
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ toast: mockToast }) }));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'create': 'Create',
        'workspace.createContent': 'Create',
        'workspace.closeDialog': 'Close dialog',
        'loading': 'loading',
        'workspace.deleteContent': 'Delete Content',
        'workspace.deleteConfirmation': 'Are you sure you want to delete this content?',
        'delete': 'Delete',
        'cancel': 'Cancel',
        'header.openMenu': 'Open menu',
        'navigationMenu': 'Navigation Menu',
        'Success': 'Success',
        'workspace.editorOptions.story': 'Story & Game',
        'workspace.editorOptions.quiz': 'Quiz & Assessment',
        'workspace.editorOptions.course': 'Course',
        'workspace.editorOptions.collection': 'Collection',
        'workspace.editorOptions.questionSet': 'Question Set',
        'workspace.errors.creationFailed': 'Creation Failed',
        'workspace.errors.unableToCreate': 'Unable to create content. Please try again.',
      };
      return map[key] || key;
    },
    languages: [{ code: 'en', label: 'English' }],
    currentCode: 'en',
    changeLanguage: vi.fn(),
  }),
}));


vi.mock('@/components/common/PageLoader', () => ({ default: ({ message }: { message: string }) => <div>{message}</div> }));

vi.mock('@/components/workspace/WorkspaceToolbar', () => ({
  default: ({ onCreateClick, onViewChange }: { onCreateClick: () => void; onViewChange: (v: string) => void }) => (
    <div data-testid="segmented-control">
      <button type="button" onClick={onCreateClick}>createNew</button>
      <button type="button" onClick={() => onViewChange('all')}>All 0</button>
      <button type="button" onClick={() => onViewChange('drafts')}>Drafts 0</button>
      <button type="button" onClick={() => onViewChange('uploads')}>Uploads</button>
      <button type="button" onClick={() => onViewChange('collaborations')}>Collaborations</button>
      <button type="button" onClick={() => onViewChange('create')}>Create view</button>
    </div>
  ),
}));

vi.mock('./WorkspacePageContent', () => ({
  default: ({ filteredItems, onDelete }: { filteredItems: WorkspaceItem[]; onDelete: (id: string) => void }) => (
    <div data-testid="workspace-content">
      {filteredItems.map((item) => (
        <div key={item.id} data-testid={`content-item-${item.id}`}>
          <span>{item.title}</span>
          <button type="button" onClick={() => onDelete(item.id)}>Delete {item.title}</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('./CreateContentModal', () => ({
  default: ({ open, onClose, onOptionSelect }: { open: boolean; onClose: () => void; onOptionSelect: (option: string) => void }) =>
    open ? (
      <div role="dialog" aria-label="Create content">
        <button type="button" onClick={onClose} aria-label="Close dialog">Close</button>
        <button type="button" onClick={() => onOptionSelect('course')}>Course</button>
        <button type="button" onClick={() => onOptionSelect('question-set')}>Question Set</button>
        <button type="button" onClick={() => onOptionSelect('story')}>Resource</button>
        <button type="button" onClick={() => onOptionSelect('quiz')}>Quiz</button>
      </div>
    ) : null,
}));

vi.mock('./ContentNameDialog', () => {
  let nameValue = '';
  return {
    default: ({ open, onClose, onSubmit, optionId }: { open: boolean; onClose: () => void; onSubmit: (name: string) => void; optionId: string }) => {
      if (!open) { nameValue = ''; return null; }
      return (
        <div role="dialog" aria-label="Enter content name">
          <input
            placeholder={`Enter ${optionId === 'question-set' ? 'question set' : 'content'} name`}
            onChange={(e) => { nameValue = e.target.value; }}
          />
          <button type="button" onClick={() => onSubmit(nameValue || 'Test Content')}>Create</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      );
    },
  };
});

vi.mock('./ContentDynamicFormDialog', () => ({
  default: ({ open, onClose, onSubmit, title, formSubType }: { open: boolean; onClose: () => void; onSubmit: (data: ContentFormData) => void; title?: string; formSubType: string }) =>
    open ? (
      <div role="dialog" aria-label={title || 'Create Content'}>
        <h2>{title || 'Create Content'}</h2>
        <p>Form type: {formSubType}</p>
        <button
          type="button"
          onClick={() => onSubmit({
            name: 'Test Resource',
            description: 'Test Description',
            dynamicFields: { subject: 'mathematics' }
          })}
        >
          Create Story & Game
        </button>
        <button type="button" onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

vi.mock('@/components/common/ConfirmDialog', () => ({
  default: ({ open, onClose, onConfirm, title }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        <p>{title}</p>
        <button type="button" onClick={onConfirm}>Delete</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('WorkspacePage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockContentCreate.mockReset();
    mockContentCreate.mockResolvedValue({ data: { identifier: 'do_qs_123' } });
    mockUseWorkspace.mockReturnValue({
      contents: [],
      counts: { all: 0, drafts: 0, review: 0, published: 0, pendingReview: 0 },
      totalCount: 0,
      isLoading: false,
      isLoadingMore: false,
      isCountsLoading: false,
      isRefreshing: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      refetchCounts: vi.fn().mockResolvedValue(undefined),
      refetchAll: vi.fn().mockResolvedValue(undefined),
    });
  });
  afterEach(() => { vi.clearAllMocks(); });

  it('shows loading state when isLoading and isCountsLoading are true', () => {
    mockUseWorkspace.mockReturnValue({
      contents: [],
      counts: { all: 0, drafts: 0, review: 0, published: 0, pendingReview: 0 },
      totalCount: 0,
      isLoading: true,
      isLoadingMore: false,
      isCountsLoading: true,
      isRefreshing: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      refetchCounts: vi.fn().mockResolvedValue(undefined),
      refetchAll: vi.fn().mockResolvedValue(undefined),
    });
    renderWithProviders(<WorkspacePage />);
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('opens create modal when create button is clicked', async () => {
    renderWithProviders(<WorkspacePage />);
    const createBtn = screen.getByRole('button', { name: 'createNew' });
    fireEvent.click(createBtn);
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create content' })).toBeInTheDocument();
    });
  });

  it('shows empty state when there are no items', () => {
    renderWithProviders(<WorkspacePage />);
    expect(screen.getByTestId('segmented-control')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All 0' })).toBeInTheDocument();
  });

  it('closes create modal when close button is clicked', async () => {
    renderWithProviders(<WorkspacePage />);
    fireEvent.click(screen.getByRole('button', { name: 'createNew' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create content' })).toBeInTheDocument();
    });
    const closeBtn = screen.getByRole('button', { name: 'Close dialog' });
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Create content' })).not.toBeInTheDocument();
    });
  });

  it('opens name dialog when a create option is selected', async () => {
    renderWithProviders(<WorkspacePage />);
    fireEvent.click(screen.getByRole('button', { name: 'createNew' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create content' })).toBeInTheDocument();
    });
    const dialog = screen.getByRole('dialog', { name: 'Create content' });
    const courseOption = within(dialog).getByRole('button', { name: /Course/ });
    fireEvent.click(courseOption);
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Enter content name' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('dialog', { name: 'Create content' })).not.toBeInTheDocument();
  });

  it('creates question set from create options and navigates to quml editor', async () => {
    mockQuestionSetMutateAsync.mockResolvedValue({ identifier: 'do_qs_123' });
    renderWithProviders(<WorkspacePage />);
    fireEvent.click(screen.getByRole('button', { name: 'createNew' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create content' })).toBeInTheDocument();
    });
    const dialog = screen.getByRole('dialog', { name: 'Create content' });
    fireEvent.click(within(dialog).getByRole('button', { name: /Question Set/ }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Enter content name' })).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText('Enter question set name'), {
      target: { value: 'My Question Set' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(mockQuestionSetMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Question Set',
          createdBy: 'test-user-id',
        }),
      );
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/edit/quml-editor/do_qs_123');
    });
  });

  it('uses questionset retire API for questionset content deletion', async () => {
    const mockQuestionSetContent: WorkspaceItem = {
      id: 'do_qs_123', title: 'Test Question Set', description: 'A test question set', type: 'quiz',
      primaryCategory: 'Practice Question Set', mimeType: 'application/vnd.sunbird.questionset',
      status: 'draft', contentType: 'QuestionSet', createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z', author: 'Test Author',
      framework: '', contentStatus: 'Draft',
    };
    mockUseWorkspace.mockReturnValue({
      contents: [mockQuestionSetContent], counts: { all: 1, drafts: 1, review: 0, published: 0, pendingReview: 0 },
      totalCount: 1, isLoading: false, isLoadingMore: false, isCountsLoading: false, isRefreshing: false,
      error: null, hasMore: false, loadMore: vi.fn(), refetchCounts: vi.fn().mockResolvedValue(undefined),
      refetchAll: vi.fn().mockResolvedValue(undefined),
    });
    mockQuestionSetRetireMutateAsync.mockResolvedValue({ result: { identifier: 'do_qs_123', status: 'Retired' } });
    renderWithProviders(<WorkspacePage />);
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Delete Content' })).toBeInTheDocument();
    });
    const confirmButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmButton);
    await waitFor(() => {
      expect(mockQuestionSetRetireMutateAsync).toHaveBeenCalledWith('do_qs_123');
    });
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Content has been deleted successfully.',
      variant: 'success',
    });
  });

  it('opens ContentDynamicFormDialog for story and quiz options', async () => {
    renderWithProviders(<WorkspacePage />);
    fireEvent.click(screen.getByRole('button', { name: 'createNew' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create content' })).toBeInTheDocument();
    });
    const dialog = screen.getByRole('dialog', { name: 'Create content' });

    // Test story option
    const resourceOption = within(dialog).getByRole('button', { name: /Resource/ });
    fireEvent.click(resourceOption);
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create Story & Game' })).toBeInTheDocument();
      expect(screen.getByText('Form type: resource')).toBeInTheDocument();
    });
    expect(screen.queryByRole('dialog', { name: 'Create content' })).not.toBeInTheDocument();

    // Close and test quiz option
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'createNew' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create content' })).toBeInTheDocument();
    });
    const newDialog = screen.getByRole('dialog', { name: 'Create content' });
    const quizOption = within(newDialog).getByRole('button', { name: /Quiz/ });
    fireEvent.click(quizOption);
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create Quiz & Assessment' })).toBeInTheDocument();
      expect(screen.getByText('Form type: assessment')).toBeInTheDocument();
    });
  });

  it('creates resource and quiz content via ContentDynamicFormDialog', async () => {
    // Test resource creation
    mockContentCreate.mockResolvedValue({ data: { identifier: 'do_resource_123' } });
    renderWithProviders(<WorkspacePage />);
    fireEvent.click(screen.getByRole('button', { name: 'createNew' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create content' })).toBeInTheDocument();
    });
    const dialog = screen.getByRole('dialog', { name: 'Create content' });
    const resourceOption = within(dialog).getByRole('button', { name: /Resource/ });
    fireEvent.click(resourceOption);
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create Story & Game' })).toBeInTheDocument();
    });
    const resourceDialog = screen.getByRole('dialog', { name: 'Create Story & Game' });
    const createButton = within(resourceDialog).getByRole('button', { name: 'Create Story & Game' });
    fireEvent.click(createButton);
    await waitFor(() => {
      expect(mockContentCreate).toHaveBeenCalledWith('Test Resource', expect.objectContaining({
        createdBy: 'test-user-id', creator: 'Test User', mimeType: 'application/vnd.ekstep.ecml-archive',
        contentType: 'Resource', description: 'Test Description', extraFields: { subject: 'mathematics' },
      }));
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/edit/content-editor/do_resource_123');
    });

    // Test quiz creation with different contentType
    mockContentCreate.mockResolvedValue({ data: { identifier: 'do_quiz_123' } });
    fireEvent.click(screen.getByRole('button', { name: 'createNew' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create content' })).toBeInTheDocument();
    });
    const newDialog = screen.getByRole('dialog', { name: 'Create content' });
    const quizOption = within(newDialog).getByRole('button', { name: /Quiz/ });
    fireEvent.click(quizOption);
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create Quiz & Assessment' })).toBeInTheDocument();
    });
    const quizDialog = screen.getByRole('dialog', { name: 'Create Quiz & Assessment' });
    const quizCreateButton = within(quizDialog).getByRole('button', { name: 'Create Story & Game' });
    fireEvent.click(quizCreateButton);
    await waitFor(() => {
      expect(mockContentCreate).toHaveBeenCalledWith('Test Resource', expect.objectContaining({
        contentType: 'SelfAssess', primaryCategory: 'Course Assessment',
      }));
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/edit/content-editor/do_quiz_123');
    });
  });

  it('closes ContentDynamicFormDialog and handles creation errors', async () => {
    renderWithProviders(<WorkspacePage />);
    fireEvent.click(screen.getByRole('button', { name: 'createNew' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create content' })).toBeInTheDocument();
    });
    const dialog = screen.getByRole('dialog', { name: 'Create content' });
    const resourceOption = within(dialog).getByRole('button', { name: /Resource/ });
    fireEvent.click(resourceOption);
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create Story & Game' })).toBeInTheDocument();
    });
    const resourceDialog = screen.getByRole('dialog', { name: 'Create Story & Game' });

    // Test cancel functionality
    const cancelButton = within(resourceDialog).getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Create Story & Game' })).not.toBeInTheDocument();
    });

    // Test error handling
    mockContentCreate.mockRejectedValue(new Error('Creation failed'));
    fireEvent.click(screen.getByRole('button', { name: 'createNew' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create content' })).toBeInTheDocument();
    });
    const newDialog = screen.getByRole('dialog', { name: 'Create content' });
    const newResourceOption = within(newDialog).getByRole('button', { name: /Resource/ });
    fireEvent.click(newResourceOption);
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Create Story & Game' })).toBeInTheDocument();
    });
    const newResourceDialog = screen.getByRole('dialog', { name: 'Create Story & Game' });
    const createButton = within(newResourceDialog).getByRole('button', { name: 'Create Story & Game' });
    fireEvent.click(createButton);
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Creation Failed',
        description: 'Unable to create content. Please try again.',
        variant: 'destructive',
      });
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});