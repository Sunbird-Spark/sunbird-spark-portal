import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImagePickerDialog } from './ImagePickerDialog';
import { emptyImage } from './utils';

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useCertificate', () => ({
  useMyImages: () => ({ data: [{ name: 'my-img.png', artifactUrl: 'https://example.com/my-img.png' }], isLoading: false }),
  useAllImages: () => ({ data: [{ name: 'all-img.png', artifactUrl: 'https://example.com/all-img.png' }], isLoading: false }),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const map: Record<string, string> = {
        'imagePicker.selectImage': 'Select Image',
        'imagePicker.changeImage': 'Change Image',
        'imagePicker.remove': 'Remove',
        'imagePicker.selectImageTitle': params?.label ? `Select ${params.label}` : 'Select Image',
        'imagePicker.myImages': 'My Images',
        'imagePicker.allImages': 'All Images',
        'imagePicker.uploadImage': 'Upload Image',
        'imagePicker.noImagesUploaded': 'No images uploaded',
        'imagePicker.noImagesFound': 'No images found',
        'imagePicker.cancel': 'Cancel',
        'imagePicker.uploadNew': 'Upload New',
      };
      return map[key] ?? key;
    },
  }),
}));

vi.mock('@/components/collection/ImageGallery', () => ({
  ImageGallery: ({ onSelect, emptyMessage }: { images: unknown[]; onSelect: (url: string) => void; loading: boolean; emptyMessage: string; selectedUrl: string | null }) => (
    <div data-testid="image-gallery">
      <span>{emptyMessage}</span>
      <button onClick={() => onSelect('https://example.com/selected.png')}>Select Gallery Image</button>
    </div>
  ),
}));

vi.mock('@/components/collection/ImageUploadTab', () => ({
  ImageUploadTab: ({ handleBack, handleCancel, handleUploadAndUse, uploadFile, handleDrop, setDragging, fileInputRef, handleFileInput }: {
    handleBack: () => void;
    handleCancel: () => void;
    handleUploadAndUse: () => void;
    uploadFile: File | null;
    handleDrop: (e: React.DragEvent) => void;
    setDragging: (v: boolean) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div
      data-testid="upload-tab"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDrop={handleDrop}
    >
      <input
        data-testid="file-input"
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/*"
      />
      <button onClick={handleBack}>Back</button>
      <button onClick={handleCancel}>Cancel Upload</button>
      <button onClick={handleUploadAndUse} disabled={!uploadFile}>Upload &amp; Use</button>
    </div>
  ),
}));

const mockResolveUserAndOrg = vi.fn();
vi.mock('./utils', () => ({
  emptyImage: () => ({ preview: null, artifactUrl: null, file: null }),
  resolveUserAndOrg: () => mockResolveUserAndOrg(),
}));

// ── Tests ────────────────────────────────────────────────────────────────────

const defaultProps = {
  label: 'Certificate Image',
  value: { preview: null, artifactUrl: null, file: null },
  onChange: vi.fn(),
};

describe('ImagePickerDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUserAndOrg.mockResolvedValue({ userName: 'Test User', userId: 'u1', rootOrgId: 'org1' });
  });

  it('renders label and select-image trigger button', () => {
    render(<ImagePickerDialog {...defaultProps} />);
    expect(screen.getByText('Certificate Image')).toBeInTheDocument();
    expect(screen.getByText('Select Image')).toBeInTheDocument();
  });

  it('renders required asterisk when required prop is true', () => {
    render(<ImagePickerDialog {...defaultProps} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows preview image and change-image text when value has preview', () => {
    render(
      <ImagePickerDialog
        {...defaultProps}
        value={{ preview: 'https://example.com/thumb.png', artifactUrl: 'https://example.com/thumb.png', file: null }}
      />
    );
    const img = screen.getByRole('img', { name: 'selected' });
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.png');
    expect(screen.getByText('Change Image')).toBeInTheDocument();
  });

  it('shows Remove button when value has preview, calls onChange(emptyImage()) on click', () => {
    const onChange = vi.fn();
    render(
      <ImagePickerDialog
        {...defaultProps}
        onChange={onChange}
        value={{ preview: 'https://example.com/thumb.png', artifactUrl: null, file: null }}
      />
    );
    fireEvent.click(screen.getByText('Remove'));
    expect(onChange).toHaveBeenCalledWith(emptyImage());
  });

  it('opens the dialog when trigger button is clicked', () => {
    render(<ImagePickerDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Select Image'));
    expect(screen.getByText('My Images')).toBeInTheDocument();
    expect(screen.getByText('All Images')).toBeInTheDocument();
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });

  it('shows My Images tab by default with ImageGallery', () => {
    render(<ImagePickerDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Select Image'));
    expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
    expect(screen.getByText('No images uploaded')).toBeInTheDocument();
  });

  it('switches to All Images tab and shows correct gallery', () => {
    render(<ImagePickerDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Select Image'));
    fireEvent.click(screen.getByText('All Images'));
    expect(screen.getByText('No images found')).toBeInTheDocument();
  });

  it('selecting an image calls onChange and closes the dialog', () => {
    const onChange = vi.fn();
    render(<ImagePickerDialog {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText('Select Image'));
    fireEvent.click(screen.getByText('Select Gallery Image'));
    expect(onChange).toHaveBeenCalledWith({
      preview: 'https://example.com/selected.png',
      artifactUrl: 'https://example.com/selected.png',
      file: null,
    });
    expect(screen.queryByText('My Images')).not.toBeInTheDocument();
  });

  it('switches to Upload tab when Upload New is clicked', async () => {
    render(<ImagePickerDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Select Image'));
    fireEvent.click(screen.getByText('Upload New'));
    expect(screen.getByTestId('upload-tab')).toBeInTheDocument();
  });

  it('resolves creator name when switching to upload tab', async () => {
    render(<ImagePickerDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Select Image'));
    fireEvent.click(screen.getByText('Upload New'));
    await waitFor(() => expect(mockResolveUserAndOrg).toHaveBeenCalled());
  });

  it('does not call resolveUserAndOrg again if uploadCreator is already set', async () => {
    render(<ImagePickerDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Select Image'));
    fireEvent.click(screen.getByText('Upload New'));
    await waitFor(() => expect(mockResolveUserAndOrg).toHaveBeenCalledTimes(1));

    // Go back and switch to upload again — creator already resolved
    fireEvent.click(screen.getByText('Back'));
    fireEvent.click(screen.getByText('Upload New'));
    await waitFor(() => expect(mockResolveUserAndOrg).toHaveBeenCalledTimes(1));
  });

  it('Back button in upload tab returns to My Images tab', async () => {
    render(<ImagePickerDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Select Image'));
    fireEvent.click(screen.getByText('Upload New'));
    fireEvent.click(screen.getByText('Back'));
    expect(screen.queryByTestId('upload-tab')).not.toBeInTheDocument();
    expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
  });

  it('Cancel Upload button in upload tab closes the dialog', async () => {
    render(<ImagePickerDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Select Image'));
    fireEvent.click(screen.getByText('Upload New'));
    fireEvent.click(screen.getByText('Cancel Upload'));
    expect(screen.queryByTestId('upload-tab')).not.toBeInTheDocument();
  });

  it('Cancel button in footer closes the dialog', () => {
    render(<ImagePickerDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Select Image'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('My Images')).not.toBeInTheDocument();
  });

  describe('handleFileInput and applyFile (line 52, 62)', () => {
    beforeEach(() => {
      vi.stubGlobal('FileReader', class {
        onload: ((ev: { target: { result: string } }) => void) | undefined;
        readAsDataURL() {
          this.onload?.({ target: { result: 'data:image/png;base64,abc' } });
        }
      });
    });

    it('handleFileInput — selecting a file enables Upload & Use button', async () => {
      render(<ImagePickerDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('Select Image'));
      fireEvent.click(screen.getByText('Upload New'));

      const fileInput = screen.getByTestId('file-input');
      const mockFile = new File(['img'], 'test.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(screen.getByText('Upload & Use')).not.toBeDisabled();
      });
    });

    it('handleUploadAndUse — calls onChange with preview, null artifactUrl, and file; closes dialog', async () => {
      const onChange = vi.fn();
      render(<ImagePickerDialog {...defaultProps} onChange={onChange} />);
      fireEvent.click(screen.getByText('Select Image'));
      fireEvent.click(screen.getByText('Upload New'));

      const fileInput = screen.getByTestId('file-input');
      const mockFile = new File(['img'], 'upload.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(screen.getByText('Upload & Use')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText('Upload & Use'));

      expect(onChange).toHaveBeenCalledWith({
        preview: 'data:image/png;base64,abc',
        artifactUrl: null,
        file: mockFile,
      });
      expect(screen.queryByTestId('upload-tab')).not.toBeInTheDocument();
    });
  });

  describe('handleDrop (lines 66-69)', () => {
    beforeEach(() => {
      vi.stubGlobal('FileReader', class {
        onload: ((ev: { target: { result: string } }) => void) | undefined;
        readAsDataURL() {
          this.onload?.({ target: { result: 'data:image/png;base64,drop' } });
        }
      });
    });

    it('handleDrop with image file — enables Upload & Use button', async () => {
      render(<ImagePickerDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('Select Image'));
      fireEvent.click(screen.getByText('Upload New'));

      const uploadTab = screen.getByTestId('upload-tab');
      const mockFile = new File(['img'], 'dropped.png', { type: 'image/png' });

      fireEvent.dragOver(uploadTab);
      fireEvent.drop(uploadTab, {
        dataTransfer: { files: [mockFile] },
      });

      await waitFor(() => {
        expect(screen.getByText('Upload & Use')).not.toBeDisabled();
      });
    });

    it('handleDrop with non-image file — Upload & Use button stays disabled', async () => {
      render(<ImagePickerDialog {...defaultProps} />);
      fireEvent.click(screen.getByText('Select Image'));
      fireEvent.click(screen.getByText('Upload New'));

      const uploadTab = screen.getByTestId('upload-tab');
      const textFile = new File(['hello'], 'notes.txt', { type: 'text/plain' });

      fireEvent.dragOver(uploadTab);
      fireEvent.drop(uploadTab, {
        dataTransfer: { files: [textFile] },
      });

      // uploadFile should remain null because type is not image/*
      expect(screen.getByText('Upload & Use')).toBeDisabled();
    });
  });
});
