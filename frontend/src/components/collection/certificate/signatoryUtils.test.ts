import { describe, it, expect } from 'vitest';
import { resolveSignatoryList, buildSignatoryListFromForm } from './signatoryUtils';
import type { Signatory } from './signatoryUtils';

const makeSig = (overrides: Partial<Signatory> = {}): Signatory => ({
  name: 'Test',
  designation: 'Manager',
  id: 'Manager/Manager',
  image: '',
  ...overrides,
});

describe('resolveSignatoryList', () => {
  it('returns fullSignatoryList when it has entries', () => {
    const full = [makeSig({ name: 'Full' })];
    const last = [makeSig({ name: 'Last' })];
    expect(resolveSignatoryList(full, last)).toBe(full);
  });

  it('returns lastBuiltSignatoryList when fullSignatoryList is empty (line 15)', () => {
    const last = [makeSig({ name: 'Last' })];
    expect(resolveSignatoryList([], last)).toBe(last);
  });

  it('returns lastBuiltSignatoryList when fullSignatoryList is undefined (line 15)', () => {
    const last = [makeSig({ name: 'Last' })];
    expect(resolveSignatoryList(undefined, last)).toBe(last);
  });

  it('returns default Director signatory when both lists are empty (line 17)', () => {
    const result = resolveSignatoryList([], []);
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe('Director');
    expect(result[0]!.id).toBe('Director/Director');
  });

  it('returns default Director signatory when fullSignatoryList is undefined and last is empty', () => {
    const result = resolveSignatoryList(undefined, []);
    expect(result[0]!.name).toBe('Director');
  });
});

describe('buildSignatoryListFromForm', () => {
  const emptyForm = {
    name: '',
    sig1: { preview: '' },
    sig1Designation: '',
    sig2: { preview: '' },
    sig2Designation: '',
  };

  it('returns empty list when no sig fields are provided', () => {
    expect(buildSignatoryListFromForm(emptyForm as any)).toHaveLength(0);
  });

  it('adds sig1 when sig1Designation is provided (line 24 true branch)', () => {
    const form = { ...emptyForm, sig1Designation: 'Principal' };
    const result = buildSignatoryListFromForm(form as any);
    expect(result).toHaveLength(1);
    expect(result[0]!.designation).toBe('Principal');
    expect(result[0]!.id).toBe('Principal/Principal');
  });

  it('uses form name when name is provided (line 25 || fallback skipped)', () => {
    const form = { ...emptyForm, name: 'Alice', sig1Designation: 'Director' };
    const result = buildSignatoryListFromForm(form as any);
    expect(result[0]!.name).toBe('Alice');
  });

  it('falls back to "Signatory 1" when name is empty (line 25 || branch)', () => {
    const form = { ...emptyForm, name: '', sig1Designation: 'Director' };
    const result = buildSignatoryListFromForm(form as any);
    expect(result[0]!.name).toBe('Signatory 1');
  });

  it('adds sig1 when sig1.preview is set but sig1Designation is empty (line 24 || branch)', () => {
    const form = { ...emptyForm, sig1: { preview: 'data:image/png;base64,abc' } };
    const result = buildSignatoryListFromForm(form as any);
    expect(result).toHaveLength(1);
    expect(result[0]!.image).toBe('data:image/png;base64,abc');
    // id falls back to 'sig1/sig1' when designation is empty
    expect(result[0]!.id).toBe('sig1/sig1');
  });

  it('adds sig2 when sig2Designation is provided (line 29 true branch)', () => {
    const form = { ...emptyForm, sig2Designation: 'Vice Principal' };
    const result = buildSignatoryListFromForm(form as any);
    expect(result).toHaveLength(1);
    expect(result[0]!.designation).toBe('Vice Principal');
  });

  it('falls back to "Signatory 2" when name is empty for sig2 (line 30 || branch)', () => {
    const form = { ...emptyForm, name: '', sig2Designation: 'HOD' };
    const result = buildSignatoryListFromForm(form as any);
    expect(result[0]!.name).toBe('Signatory 2');
  });

  it('adds both signatories when both have data', () => {
    const form = {
      name: 'School',
      sig1: { preview: '' },
      sig1Designation: 'Principal',
      sig2: { preview: '' },
      sig2Designation: 'Vice Principal',
    };
    const result = buildSignatoryListFromForm(form as any);
    expect(result).toHaveLength(2);
  });
});
