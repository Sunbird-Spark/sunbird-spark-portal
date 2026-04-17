import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { buildColumns } from './userConsentColumns';
import type { UserConsentRecord } from '@/types/reports';

const t = (key: string) => key.split('.').pop() ?? key;

const baseRecord: UserConsentRecord = {
  id: 'r1',
  userId: 'u1',
  userName: 'testuser',
  email: 'test@example.com',
  consentStatus: 'Granted',
  course: 'My Course',
  consentGivenOn: '2024-01-01',
  expiry: '2025-01-01',
};

describe('userConsentColumns — buildColumns', () => {
  const columns = buildColumns(t);

  const renderCell = (row: UserConsentRecord, key: string) => {
    const col = columns.find((c) => c.key === key)!;
    const content = col.render ? col.render(row) : (row as any)[key];
    return render(<>{content}</>);
  };

  it('renders course name when row.course is present (line 38 true branch)', () => {
    renderCell(baseRecord, 'course');
    expect(screen.getByText('My Course')).toBeInTheDocument();
  });

  it('renders dash when row.course is absent (line 38 false branch)', () => {
    renderCell({ ...baseRecord, course: '' }, 'course');
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders consentGivenOn when present (line 49 non-nullish branch)', () => {
    renderCell(baseRecord, 'consentGivenOn');
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
  });

  it('renders dash span when consentGivenOn is null (line 49 ?? fallback branch)', () => {
    renderCell({ ...baseRecord, consentGivenOn: null }, 'consentGivenOn');
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders expiry when row.expiry is present (line 58 true branch)', () => {
    renderCell(baseRecord, 'expiry');
    expect(screen.getByText('2025-01-01')).toBeInTheDocument();
  });

  it('renders dash when row.expiry is absent (line 58 false branch)', () => {
    renderCell({ ...baseRecord, expiry: null }, 'expiry');
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders Granted badge variant for Granted status', () => {
    renderCell(baseRecord, 'consentStatus');
    expect(screen.getByText('Granted')).toBeInTheDocument();
  });

  it('renders destructive badge variant for Revoked status', () => {
    renderCell({ ...baseRecord, consentStatus: 'Revoked' }, 'consentStatus');
    expect(screen.getByText('Revoked')).toBeInTheDocument();
  });
});
