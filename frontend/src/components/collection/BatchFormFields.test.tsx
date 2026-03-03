import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BatchFormFields, BatchFormState } from './BatchFormFields';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'batch.nameOfBatch': 'Name of Batch',
        'batch.enterBatchName': 'Enter batch name',
        'batch.aboutBatch': 'About Batch',
        'batch.briefDescBatch': 'Brief description about this batch',
        'batch.startDate': 'Start Date',
        'batch.endDate': 'End Date',
        'batch.enrolmentEndDate': 'Enrolment End Date',
        'batch.mustBeAfterEnrolmentEnd': 'Must be on or after enrolment end date',
        'batch.betweenStartDate': 'Between start date',
        'batch.betweenStartAndEndDate': 'Between start & end date',
      };
      return translations[key] || key;
    },
  }),
}));

describe('BatchFormFields', () => {
  let form: BatchFormState;
  let handleField: any;
  let setForm: any;

  beforeEach(() => {
    form = {
      batchName: '',
      aboutBatch: '',
      startDate: '',
      endDate: '',
      enrolmentEndDate: '',
      issueCertificate: false,
      enableDiscussion: false,
      batchType: '',
      selectedMentorIds: [],
      acceptTerms: false,
    };
    handleField = vi.fn();
    setForm = vi.fn();
  });

  describe('Rendering', () => {
    it('renders batch name field', () => {
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      expect(screen.getByLabelText(/name of batch/i)).toBeInTheDocument();
    });

    it('renders about batch field', () => {
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      expect(screen.getByLabelText(/about batch/i)).toBeInTheDocument();
    });

    it('renders start date field', () => {
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    });

    it('renders end date field', () => {
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      expect(screen.getByLabelText(/^end date$/i)).toBeInTheDocument();
    });

    it('renders enrolment end date field', () => {
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      expect(screen.getByLabelText(/enrolment end date/i)).toBeInTheDocument();
    });

    it('renders required asterisks for batch name and start date', () => {
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      const labels = screen.getAllByText('*');
      expect(labels.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Batch Name Field', () => {
    it('displays the current batch name value', () => {
      form.batchName = 'Test Batch';
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      const input = screen.getByDisplayValue('Test Batch');
      expect(input).toBeInTheDocument();
    });

    it('calls handleField when batch name changes', () => {
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      const input = screen.getByLabelText(/name of batch/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'New Batch' } });
      expect(handleField).toHaveBeenCalledWith('batchName', 'New Batch');
    });

    it('batch name field has required attribute', () => {
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      const input = screen.getByLabelText(/name of batch/i) as HTMLInputElement;
      expect(input.required).toBe(true);
    });
  });

  describe('About Batch Field', () => {
    it('displays the current about batch value', () => {
      form.aboutBatch = 'Test Description';
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    });

    it('calls handleField when about batch changes', () => {
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      const textarea = screen.getByLabelText(/about batch/i);
      fireEvent.change(textarea, { target: { value: 'Updated Description' } });
      expect(handleField).toHaveBeenCalledWith('aboutBatch', 'Updated Description');
    });
  });

  describe('Start Date Field', () => {
    it('displays the current start date value', () => {
      form.startDate = '2026-03-01';
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      expect(screen.getByDisplayValue('2026-03-01')).toBeInTheDocument();
    });

    it('start date field has required attribute', () => {
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      const input = screen.getByLabelText(/start date/i) as HTMLInputElement;
      expect(input.required).toBe(true);
    });

    it('clears enrolmentEndDate when start date is changed to a later date', () => {
      form.startDate = '2026-01-01';
      form.enrolmentEndDate = '2025-12-31';
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      const input = screen.getByLabelText(/start date/i);
      fireEvent.change(input, { target: { value: '2026-03-01' } });

      expect(setForm).toHaveBeenCalledWith(expect.any(Function));
      const updateFn = setForm.mock.calls[0][0] as Function;
      const updated = updateFn({ ...form });
      expect(updated.enrolmentEndDate).toBe('');
    });

    it('clears endDate when start date is changed to a later date', () => {
      form.startDate = '2026-01-01';
      form.endDate = '2025-12-31';
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      const input = screen.getByLabelText(/start date/i);
      fireEvent.change(input, { target: { value: '2026-03-01' } });

      expect(setForm).toHaveBeenCalledWith(expect.any(Function));
      const updateFn = setForm.mock.calls[0][0] as Function;
      const updated = updateFn({ ...form });
      expect(updated.endDate).toBe('');
    });

    it('does not clear enrolmentEndDate if new start date is valid', () => {
      form.startDate = '2026-01-01';
      form.enrolmentEndDate = '2026-02-01';
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      const input = screen.getByLabelText(/start date/i);
      fireEvent.change(input, { target: { value: '2025-12-01' } });

      expect(setForm).toHaveBeenCalledWith(expect.any(Function));
      const updateFn = setForm.mock.calls[0][0] as Function;
      const updated = updateFn({ ...form, startDate: '2025-12-01' });
      expect(updated.enrolmentEndDate).toBe('2026-02-01');
    });
  });

  describe('End Date Field', () => {
    it('displays the current end date value', () => {
      form.endDate = '2026-06-30';
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      expect(screen.getByDisplayValue('2026-06-30')).toBeInTheDocument();
    });

    it('calls handleField when end date changes', () => {
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      const input = screen.getByLabelText(/^end date$/i);
      fireEvent.change(input, { target: { value: '2026-06-30' } });
      expect(handleField).toHaveBeenCalledWith('endDate', '2026-06-30');
    });

    it('sets min attribute to start date when no enrolment end date', () => {
      form.startDate = '2026-03-01';
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      const input = screen.getByLabelText(/^end date$/i) as HTMLInputElement;
      expect(input.min).toBe('2026-03-01');
    });

    it('sets min attribute to enrolment end date when it is after start date', () => {
      form.startDate = '2026-01-01';
      form.enrolmentEndDate = '2026-05-01';
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      const input = screen.getByLabelText(/^end date$/i) as HTMLInputElement;
      expect(input.min).toBe('2026-05-01');
    });

    it('shows warning when enrolment end date exists but end date is empty', () => {
      form.enrolmentEndDate = '2026-05-01';
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      expect(screen.getByText(/must be on or after enrolment end date/i)).toBeInTheDocument();
    });

    it('does not show warning when end date is provided', () => {
      form.enrolmentEndDate = '2026-05-01';
      form.endDate = '2026-06-01';
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      expect(screen.queryByText(/must be on or after enrolment end date/i)).not.toBeInTheDocument();
    });
  });

  describe('Enrolment End Date Field', () => {
    it('displays the current enrolment end date value', () => {
      form.enrolmentEndDate = '2026-05-15';
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      expect(screen.getByDisplayValue('2026-05-15')).toBeInTheDocument();
    });

    it('calls handleField when enrolment end date changes', () => {
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      const input = screen.getByLabelText(/enrolment end date/i);
      fireEvent.change(input, { target: { value: '2026-05-15' } });
      expect(handleField).toHaveBeenCalledWith('enrolmentEndDate', '2026-05-15');
    });

    it('sets min attribute to start date', () => {
      form.startDate = '2026-03-01';
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      const input = screen.getByLabelText(/enrolment end date/i) as HTMLInputElement;
      expect(input.min).toBe('2026-03-01');
    });

    it('sets max attribute to end date when provided', () => {
      form.startDate = '2026-03-01';
      form.endDate = '2026-07-01';
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      const input = screen.getByLabelText(/enrolment end date/i) as HTMLInputElement;
      expect(input.max).toBe('2026-07-01');
    });

    it('shows helper text when start date is provided without end date', () => {
      form.startDate = '2026-03-01';
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      expect(screen.getByText(/between start date/i)).toBeInTheDocument();
    });

    it('shows helper text mentioning both dates when both are provided', () => {
      form.startDate = '2026-03-01';
      form.endDate = '2026-07-01';
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      expect(screen.getByText(/between start & end date/i)).toBeInTheDocument();
    });

    it('does not show helper text when start date is not provided', () => {
      render(<BatchFormFields form={form} handleField={handleField} setForm={setForm} />);
      expect(screen.queryByText(/between start/i)).not.toBeInTheDocument();
    });
  });

  describe('Custom styling props', () => {
    it('applies custom label class when provided', () => {
      const customLabelClass = 'custom-label-class';
      render(
        <BatchFormFields
          form={form}
          handleField={handleField}
          setForm={setForm}
          labelClass={customLabelClass}
        />
      );
      const label = screen.getByLabelText(/name of batch/i).parentElement?.querySelector('label');
      expect(label).toHaveClass(customLabelClass);
    });

    it('applies custom input class when provided', () => {
      const customInputClass = 'custom-input-class';
      render(
        <BatchFormFields
          form={form}
          handleField={handleField}
          setForm={setForm}
          inputClass={customInputClass}
        />
      );
      const input = screen.getByLabelText(/name of batch/i);
      expect(input).toHaveClass(customInputClass);
    });
  });
});
