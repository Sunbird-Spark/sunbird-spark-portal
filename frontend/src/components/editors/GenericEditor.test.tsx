import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import GenericEditor from './GenericEditor';
import type { Mock } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../configs/i18n';

// Test wrapper that provides i18n context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <I18nextProvider i18n={i18n}>
    {children}
  </I18nextProvider>
);

const mockOpenEditor = vi.fn();
const mockCloseEditor = vi.fn();
const mockIframeRef = { current: null };

vi.mock('@/hooks/useGenericEditor', () => ({
  useGenericEditor: vi.fn(),
}));

import { useGenericEditor } from '@/hooks/useGenericEditor';

const mockUseGenericEditor = useGenericEditor as Mock;

function setHookReturn(overrides: Record<string, unknown> = {}) {
  mockUseGenericEditor.mockReturnValue({
    isLoading: false,
    error: null,
    editorUrl: null,
    isEditorReady: false,
    openEditor: mockOpenEditor,
    closeEditor: mockCloseEditor,
    iframeRef: mockIframeRef,
    ...overrides,
  });
}

describe('GenericEditor', () => {
  beforeEach(() => {
    setHookReturn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    setHookReturn({ isLoading: true, isEditorReady: false });

    const { getByTestId } = render(
      <TestWrapper>
        <GenericEditor contentId="do_123" />
      </TestWrapper>
    );

    expect(getByTestId('page-loader')).toBeInTheDocument();
  });

  it('should render loading state when isEditorReady is false even if not isLoading', () => {
    setHookReturn({ isLoading: false, isEditorReady: false });

    const { getByTestId } = render(
      <TestWrapper>
        <GenericEditor contentId="do_123" />
      </TestWrapper>
    );

    expect(getByTestId('page-loader')).toBeInTheDocument();
  });

  it('should show error message when error occurs', () => {
    setHookReturn({ error: 'Something went wrong' });

    const { getByText } = render(
      <TestWrapper>
        <GenericEditor contentId="do_123" />
      </TestWrapper>
    );

    expect(getByText('Editor Error')).toBeInTheDocument();
    expect(getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should show "Go Back" button that calls closeEditor on click', () => {
    setHookReturn({ error: 'Failed to load editor' });

    const { getByText } = render(
      <TestWrapper>
        <GenericEditor contentId="do_123" />
      </TestWrapper>
    );

    const goBackButton = getByText('Go Back');
    expect(goBackButton).toBeInTheDocument();

    fireEvent.click(goBackButton);
    expect(mockCloseEditor).toHaveBeenCalled();
  });

  it('should render iframe with correct src when editor is ready', () => {
    setHookReturn({
      isLoading: false,
      isEditorReady: true,
      editorUrl: '/generic-editor/index.html?contentId=do_123',
    });

    const { container } = render(
      <TestWrapper>
        <GenericEditor contentId="do_123" />
      </TestWrapper>
    );

    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe?.id).toBe('genericEditor');
    expect(iframe?.title).toBe('Generic Editor');
    expect(iframe?.src).toContain('/generic-editor/index.html?contentId=do_123');
  });

  it('should call openEditor on mount', () => {
    setHookReturn();

    render(
      <TestWrapper>
        <GenericEditor contentId="do_123" />
      </TestWrapper>
    );

    expect(mockOpenEditor).toHaveBeenCalled();
  });

  it('should handle popstate event by calling closeEditor', () => {
    setHookReturn({ isLoading: false, isEditorReady: true, editorUrl: '/editor' });

    render(
      <TestWrapper>
        <GenericEditor contentId="do_123" />
      </TestWrapper>
    );

    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(mockCloseEditor).toHaveBeenCalled();
  });

  it('should remove popstate listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    setHookReturn({ isLoading: false, isEditorReady: true, editorUrl: '/editor' });

    const { unmount } = render(
      <TestWrapper>
        <GenericEditor contentId="do_123" />
      </TestWrapper>
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('should pass correct params to useGenericEditor hook', () => {
    const onClose = vi.fn();
    const onError = vi.fn();
    const queryParams = { type: 'edit' } as any;

    render(
      <TestWrapper>
        <GenericEditor
          contentId="do_456"
          state="draft"
          framework="NCF"
          contentStatus="Draft"
          isLargeFileUpload={true}
          queryParams={queryParams}
          onClose={onClose}
          onError={onError}
        />
      </TestWrapper>
    );

    expect(mockUseGenericEditor).toHaveBeenCalledWith({
      params: {
        contentId: 'do_456',
        state: 'draft',
        framework: 'NCF',
        contentStatus: 'Draft',
      },
      queryParams,
      isLargeFileUpload: true,
      onClose,
      onError,
    });
  });

  it('should not render iframe when editorUrl is falsy', () => {
    setHookReturn({ isLoading: false, isEditorReady: true, editorUrl: null });

    const { container } = render(
      <TestWrapper>
        <GenericEditor contentId="do_123" />
      </TestWrapper>
    );

    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeInTheDocument();
  });
});
