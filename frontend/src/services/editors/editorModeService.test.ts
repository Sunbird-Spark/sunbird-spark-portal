import { describe, it, expect } from 'vitest';
import { getUserRole, getEditorMode } from './editorModeService';

describe('getUserRole', () => {
  it('returns "reviewer" when CONTENT_REVIEWER role is present', () => {
    const userData: any = {
      data: { response: { roles: [{ role: 'CONTENT_REVIEWER' }] } },
    };
    expect(getUserRole(userData)).toBe('reviewer');
  });

  it('returns "creator" when CONTENT_CREATOR role is present', () => {
    const userData: any = {
      data: { response: { roles: [{ role: 'CONTENT_CREATOR' }] } },
    };
    expect(getUserRole(userData)).toBe('creator');
  });

  it('prefers reviewer over creator when both roles are present', () => {
    const userData: any = {
      data: {
        response: {
          roles: [{ role: 'CONTENT_CREATOR' }, { role: 'CONTENT_REVIEWER' }],
        },
      },
    };
    expect(getUserRole(userData)).toBe('reviewer');
  });

  it('returns null when roles array is empty', () => {
    const userData: any = { data: { response: { roles: [] } } };
    expect(getUserRole(userData)).toBeNull();
  });

  it('returns null when roles is not an array', () => {
    const userData: any = { data: { response: { roles: undefined } } };
    expect(getUserRole(userData)).toBeNull();
  });

  it('returns null when userData is undefined', () => {
    expect(getUserRole(undefined)).toBeNull();
  });
});

describe('getEditorMode', () => {
  it('returns "edit" when status is undefined', () => {
    expect(getEditorMode(undefined, 'creator')).toBe('edit');
  });

  it('returns "read" for FlagDraft status', () => {
    expect(getEditorMode('FlagDraft', 'creator')).toBe('read');
    expect(getEditorMode('FlagDraft', 'reviewer')).toBe('read');
  });

  it('returns "read" for FlagReview status', () => {
    expect(getEditorMode('FlagReview', 'creator')).toBe('read');
    expect(getEditorMode('FlagReview', 'reviewer')).toBe('read');
  });

  it('returns "read" for Processing status', () => {
    expect(getEditorMode('Processing', 'creator')).toBe('read');
    expect(getEditorMode('Processing', 'reviewer')).toBe('read');
  });

  it('returns "review" for Review status when user is reviewer', () => {
    expect(getEditorMode('Review', 'reviewer')).toBe('review');
  });

  it('returns "read" for Review status when user is creator', () => {
    expect(getEditorMode('Review', 'creator')).toBe('read');
  });

  it('returns "read" for Review status when user role is null', () => {
    expect(getEditorMode('Review', null)).toBe('read');
  });

  it('returns "read" for Live status when user is reviewer', () => {
    expect(getEditorMode('Live', 'reviewer')).toBe('read');
  });

  it('returns "edit" for Live status when user is creator', () => {
    expect(getEditorMode('Live', 'creator')).toBe('edit');
  });

  it('returns "edit" for Draft status', () => {
    expect(getEditorMode('Draft', 'creator')).toBe('edit');
    expect(getEditorMode('Draft', 'reviewer')).toBe('edit');
  });

  it('returns "edit" for Unlisted status', () => {
    expect(getEditorMode('Unlisted', 'creator')).toBe('edit');
  });
});
