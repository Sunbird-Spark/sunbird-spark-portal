import React, { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageUploadTab } from './ImageUploadTab';

const LICENSE_STATEMENT = 'All resources uploaded shall be available for free and public use.';

const defaultProps = {
  dragging: false,
  setDragging: vi.fn(),
  uploadPreview: null,
  fileInputRef: createRef<HTMLInputElement | null>(),
  handleDrop: vi.fn(),
  handleFileInput: vi.fn(),
  uploadFileName: '',
  setUploadFileName: vi.fn(),
  uploadCreator: 'John Doe',
  handleBack: vi.fn(),
  handleCancel: vi.fn(),
  handleUploadAndUse: vi.fn(),
  uploadFile: null,
  LICENSE_STATEMENT,
};

describe('ImageUploadTab', () => {
  it('renders drag-and-drop zone', () => {
    render(<ImageUploadTab {...defaultProps} />);
    expect(screen.getByText('Choose or drag and drop your image here')).toBeInTheDocument();
  });

  it('renders license statement', () => {
    render(<ImageUploadTab {...defaultProps} />);
    expect(screen.getByText(LICENSE_STATEMENT)).toBeInTheDocument();
  });

  it('renders file name input', () => {
    render(<ImageUploadTab {...defaultProps} />);
    expect(screen.getByPlaceholderText('File name')).toBeInTheDocument();
  });

  it('renders creator field as readonly with correct value', () => {
    render(<ImageUploadTab {...defaultProps} uploadCreator="Jane Smith" />);
    const inputs = screen.getAllByRole('textbox');
    const creatorInput = inputs.find((i) => (i as HTMLInputElement).readOnly);
    expect(creatorInput).toHaveValue('Jane Smith');
  });

  it('renders upload preview image when uploadPreview is set', () => {
    render(<ImageUploadTab {...defaultProps} uploadPreview="data:image/png;base64,abc" />);
    const img = screen.getByAltText('preview');
    expect(img).toHaveAttribute('src', 'data:image/png;base64,abc');
  });

  it('does not render preview image when uploadPreview is null', () => {
    render(<ImageUploadTab {...defaultProps} uploadPreview={null} />);
    expect(screen.queryByAltText('preview')).not.toBeInTheDocument();
    expect(screen.getByText('PNG, JPG, SVG supported')).toBeInTheDocument();
  });

  it('"Upload & Use" button is disabled when uploadFile is null', () => {
    render(<ImageUploadTab {...defaultProps} uploadFile={null} uploadFileName="" />);
    const uploadBtn = screen.getByText('Upload & Use');
    expect(uploadBtn).toBeDisabled();
  });

  it('"Upload & Use" button is disabled when uploadFileName is blank even with file', () => {
    const file = new File(['content'], 'test.png', { type: 'image/png' });
    render(<ImageUploadTab {...defaultProps} uploadFile={file} uploadFileName="" />);
    const uploadBtn = screen.getByText('Upload & Use');
    expect(uploadBtn).toBeDisabled();
  });

  it('"Upload & Use" button is enabled when uploadFile and uploadFileName are set', () => {
    const file = new File(['content'], 'test.png', { type: 'image/png' });
    render(<ImageUploadTab {...defaultProps} uploadFile={file} uploadFileName="test.png" />);
    const uploadBtn = screen.getByText('Upload & Use');
    expect(uploadBtn).not.toBeDisabled();
  });

  it('calls handleUploadAndUse when Upload & Use is clicked', () => {
    const handleUploadAndUse = vi.fn();
    const file = new File(['content'], 'test.png', { type: 'image/png' });
    render(
      <ImageUploadTab
        {...defaultProps}
        uploadFile={file}
        uploadFileName="test.png"
        handleUploadAndUse={handleUploadAndUse}
      />
    );
    fireEvent.click(screen.getByText('Upload & Use'));
    expect(handleUploadAndUse).toHaveBeenCalledTimes(1);
  });

  it('calls handleBack when Back button is clicked', () => {
    const handleBack = vi.fn();
    render(<ImageUploadTab {...defaultProps} handleBack={handleBack} />);
    fireEvent.click(screen.getByText('← Back'));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('calls handleCancel when Cancel button is clicked', () => {
    const handleCancel = vi.fn();
    render(<ImageUploadTab {...defaultProps} handleCancel={handleCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('calls setUploadFileName when file name input changes', () => {
    const setUploadFileName = vi.fn();
    render(<ImageUploadTab {...defaultProps} setUploadFileName={setUploadFileName} />);
    fireEvent.change(screen.getByPlaceholderText('File name'), { target: { value: 'new-name.png' } });
    expect(setUploadFileName).toHaveBeenCalledWith('new-name.png');
  });

  it('calls setDragging(true) on dragOver', () => {
    const setDragging = vi.fn();
    render(<ImageUploadTab {...defaultProps} setDragging={setDragging} />);
    const dropZone = screen.getByText('Choose or drag and drop your image here').closest('div');
    fireEvent.dragOver(dropZone!);
    expect(setDragging).toHaveBeenCalledWith(true);
  });

  it('calls setDragging(false) on dragLeave', () => {
    const setDragging = vi.fn();
    render(<ImageUploadTab {...defaultProps} setDragging={setDragging} />);
    const dropZone = screen.getByText('Choose or drag and drop your image here').closest('div');
    fireEvent.dragLeave(dropZone!);
    expect(setDragging).toHaveBeenCalledWith(false);
  });

  it('calls handleDrop on drop event', () => {
    const handleDrop = vi.fn();
    render(<ImageUploadTab {...defaultProps} handleDrop={handleDrop} />);
    const dropZone = screen.getByText('Choose or drag and drop your image here').closest('div');
    fireEvent.drop(dropZone!);
    expect(handleDrop).toHaveBeenCalledTimes(1);
  });

  it('applies dragging styling when dragging is true', () => {
    render(<ImageUploadTab {...defaultProps} dragging={true} />);
    const dropZone = screen.getByText('Choose or drag and drop your image here').closest('div');
    expect(dropZone?.className).toContain('border-sunbird-brick');
  });

  it('calls handleFileInput when file input changes', () => {
    const handleFileInput = vi.fn();
    render(<ImageUploadTab {...defaultProps} handleFileInput={handleFileInput} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'test.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);
    expect(handleFileInput).toHaveBeenCalledTimes(1);
  });
});
