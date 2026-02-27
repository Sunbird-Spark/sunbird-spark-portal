import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import dayjs from 'dayjs';
import { BatchRow, getBatchStatus } from './BatchRow';
import { Batch } from '@/services/BatchService';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, data?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'batchTabs.ongoing': 'Ongoing',
        'batchTabs.upcoming': 'Upcoming',
        'batchTabs.expired': 'Expired',
        'batchRow.editBatch': 'Edit batch',
        'batchRow.batchCannotBeEdited': 'Batch cannot be edited after the start date has passed',
        'batchRow.certificateCannotBeModified': 'Certificate cannot be modified after the batch end date',
        'batchRow.enrolmentEnds': 'Enrolment ends {{date}}',
        'certificate.certificateLocked': 'Certificate Locked',
        'certificate.certificateUnavailable': 'Certificate Unavailable',
        'certificate.editCertificate': 'Edit Certificate',
        'certificate.addCertificate': 'Add Certificate',
      };
      let result = translations[key] || key;
      if (data) {
        Object.entries(data).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v));
        });
      }
      return result;
    },
  }),
}));

vi.mock('dayjs', async () => {
  const actual = await vi.importActual('dayjs');
  return actual;
});

describe('BatchRow', () => {
  let onEditClick: any;
  let onCertificateClick: any;
  const tomorrowDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const yesterdayDate = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const today = dayjs().format('YYYY-MM-DD');

  beforeEach(() => {
    onEditClick = vi.fn();
    onCertificateClick = vi.fn();
  });

  describe('getBatchStatus', () => {
    it('returns "Upcoming" for status "0"', () => {
      expect(getBatchStatus('0')).toBe('Upcoming');
    });

    it('returns "Ongoing" for status "1"', () => {
      expect(getBatchStatus('1')).toBe('Ongoing');
    });

    it('returns "Expired" for status "2"', () => {
      expect(getBatchStatus('2')).toBe('Expired');
    });

    it('returns "Expired" for unknown status', () => {
      expect(getBatchStatus('99')).toBe('Expired');
    });
  });

  describe('Rendering Batch Information', () => {
    it('displays the batch name', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: today,
        endDate: tomorrowDate,
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      expect(screen.getByText('Test Batch')).toBeInTheDocument();
    });

    it('displays batch status badge', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: today,
        endDate: tomorrowDate,
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      expect(screen.getByText('Ongoing')).toBeInTheDocument();
    });

    it('displays formatted start and end dates', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: '2026-03-01',
        endDate: '2026-06-30',
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      expect(screen.getByText(/01 Mar 2026.*–.*30 Jun 2026/)).toBeInTheDocument();
    });

    it('displays enrollment end date when provided', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: '2026-03-01',
        endDate: '2026-06-30',
        enrollmentEndDate: '2026-05-15',
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      expect(screen.getByText(/enrolment ends/i)).toBeInTheDocument();
      expect(screen.getByText(/15 May 2026/)).toBeInTheDocument();
    });

    it('handles missing start date gracefully', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: undefined,
        endDate: tomorrowDate,
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      expect(screen.getByText(/—/)).toBeInTheDocument();
    });

    it('handles invalid date strings gracefully', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: 'invalid-date',
        endDate: 'invalid-date',
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      expect(screen.getByText(/—.*–.*—/)).toBeInTheDocument();
    });
  });

  describe('Edit Button - Batch Editable', () => {
    it('shows edit button when start date has not passed', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: tomorrowDate,
        endDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      const editButton = screen.getByRole('button', { name: /edit batch/i });
      expect(editButton).toBeInTheDocument();
    });

    it('shows lock icon when start date has passed', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: yesterdayDate,
        endDate: tomorrowDate,
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      // Check for the lock icon (it's an FiLock component)
      const lockElements = screen.getAllByTitle(/cannot be edited after/i);
      expect(lockElements.length).toBeGreaterThan(0);
    });

    it('allows editing on the same day as start date', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: today,
        endDate: tomorrowDate,
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      const editButton = screen.getByRole('button', { name: /edit batch/i });
      expect(editButton).toBeInTheDocument();
    });

    it('allows editing when start date is not set', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: undefined,
        endDate: tomorrowDate,
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      const editButton = screen.getByRole('button', { name: /edit batch/i });
      expect(editButton).toBeInTheDocument();
    });

    it('calls onEditClick when edit button is clicked', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: tomorrowDate,
        endDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      const editButton = screen.getByRole('button', { name: /edit batch/i });
      fireEvent.click(editButton);
      expect(onEditClick).toHaveBeenCalledWith(batch);
    });
  });

  describe('Certificate Actions - Batch Locked', () => {
    it('shows "Add Certificate" button when no certificate exists and batch not locked', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: yesterdayDate,
        endDate: tomorrowDate,
        certTemplates: undefined,
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      expect(screen.getByRole('button', { name: /add certificate/i })).toBeInTheDocument();
    });

    it('shows "Edit Certificate" button when certificate exists and batch not locked', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: yesterdayDate,
        endDate: tomorrowDate,
        certTemplates: { 'template-1': { name: 'Template 1' } },
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      expect(screen.getByRole('button', { name: /edit certificate/i })).toBeInTheDocument();
    });

    it('shows locked state when end date has passed and no certificate', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
        endDate: yesterdayDate,
        certTemplates: undefined,
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      expect(screen.getByText(/certificate unavailable/i)).toBeInTheDocument();
    });

    it('shows locked state when end date has passed and certificate exists', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
        endDate: yesterdayDate,
        certTemplates: { 'template-1': { name: 'Template 1' } },
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      expect(screen.getByText(/certificate locked/i)).toBeInTheDocument();
    });

    it('allows certificate modification when end date is today but not passed', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        endDate: today,
        certTemplates: undefined,
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      expect(screen.getByRole('button', { name: /add certificate/i })).toBeInTheDocument();
    });

    it('calls onCertificateClick when certificate button is clicked', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: yesterdayDate,
        endDate: tomorrowDate,
        certTemplates: undefined,
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      const certButton = screen.getByRole('button', { name: /add certificate/i });
      fireEvent.click(certButton);
      expect(onCertificateClick).toHaveBeenCalledWith(batch);
    });

    it('does not call onCertificateClick when batch is locked', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
        endDate: yesterdayDate,
        certTemplates: undefined,
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      const lockedText = screen.getByText(/certificate unavailable/i);
      expect(lockedText).toBeInTheDocument();
      expect(onCertificateClick).not.toHaveBeenCalled();
    });

    it('handles empty cert templates object correctly', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Test Batch',
        status: '1',
        startDate: yesterdayDate,
        endDate: tomorrowDate,
        certTemplates: {},
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      expect(screen.getByRole('button', { name: /add certificate/i })).toBeInTheDocument();
    });
  });

  describe('Status Styling', () => {
    it('applies correct styling for Upcoming status', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Upcoming Batch',
        status: '0',
        startDate: tomorrowDate,
        endDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      const statusBadge = screen.getByText('Upcoming');
      expect(statusBadge).toHaveClass('bg-yellow-100');
    });

    it('applies correct styling for Ongoing status', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Ongoing Batch',
        status: '1',
        startDate: yesterdayDate,
        endDate: tomorrowDate,
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      const statusBadge = screen.getByText('Ongoing');
      expect(statusBadge).toHaveClass('bg-green-100');
    });

    it('applies correct styling for Expired status', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'Expired Batch',
        status: '2',
        startDate: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
        endDate: yesterdayDate,
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      const statusBadge = screen.getByText('Expired');
      expect(statusBadge).toHaveClass('bg-gray-100');
    });
  });

  describe('Edge Cases', () => {
    it('handles batch with no dates', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'No Date Batch',
        status: '1',
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      expect(screen.getByText('No Date Batch')).toBeInTheDocument();
    });

    it('handles batch with no enrollment end date', () => {
      const batch: Batch = {
        id: 'b1',
        name: 'No Enrollment Batch',
        status: '1',
        startDate: '2026-03-01',
        endDate: '2026-06-30',
      } as unknown as Batch;
      render(<BatchRow batch={batch} onEditClick={onEditClick} onCertificateClick={onCertificateClick} />);
      expect(screen.queryByText(/enrolment ends/i)).not.toBeInTheDocument();
    });
  });
});
