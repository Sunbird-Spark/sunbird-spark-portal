import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCollectionPageData } from './useCollectionPageData';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useCollection', () => ({
  useCollection: vi.fn(() => ({
    data: null,
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

vi.mock('@/hooks/useUserRead', () => ({
  useUserRead: vi.fn(() => ({ data: null })),
}));

vi.mock('@/hooks/useCollectionEnrollment', () => ({
  useCollectionEnrollment: vi.fn(() => ({
    isEnrolledInCurrentBatch: false,
    contentStatusMap: {},
    setCertificatePreviewUrl: vi.fn(),
    setCertificatePreviewOpen: vi.fn(),
  })),
}));

vi.mock('@/hooks/usePermission', () => ({
  usePermissions: vi.fn(() => ({ isAuthenticated: false })),
}));

vi.mock('@/hooks/useUser', () => ({
  useIsContentCreator: vi.fn(() => false),
}));

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getUserId: vi.fn(() => null),
  },
}));

vi.mock('@/assets/resource-robot-hand.svg', () => ({ default: 'default-image.svg' }));

// ── Helpers ───────────────────────────────────────────────────────────────────

import { useCollection } from '@/hooks/useCollection';
import { usePermissions } from '@/hooks/usePermission';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';

const baseCollection = {
  id: 'col-1',
  title: 'Test Course',
  image: 'https://example.com/image.png',
  lessons: 5,
  units: 2,
  description: 'Desc',
  audience: [],
  children: [],
  hierarchyRoot: null,
  createdBy: 'creator-user',
  trackable: { enabled: 'Yes' },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useCollectionPageData', () => {
  it('returns null displayCollectionData when collectionData is null', () => {
    vi.mocked(useCollection).mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useCollectionPageData('col-1', undefined));
    expect(result.current.displayCollectionData).toBeNull();
  });

  it('uses collection image when present (line 37 truthy branch)', () => {
    vi.mocked(useCollection).mockReturnValue({
      data: baseCollection,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useCollectionPageData('col-1', undefined));
    expect(result.current.displayCollectionData?.image).toBe('https://example.com/image.png');
  });

  it('falls back to defaultCollectionImage when image is empty (line 37 || branch)', () => {
    vi.mocked(useCollection).mockReturnValue({
      data: { ...baseCollection, image: '' },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useCollectionPageData('col-1', undefined));
    expect(result.current.displayCollectionData?.image).toBe('default-image.svg');
  });

  it('sets isCreatorViewingOwnCollection true when userId matches createdBy (line 23-27)', () => {
    vi.mocked(useCollection).mockReturnValue({
      data: baseCollection,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(usePermissions).mockReturnValue({ isAuthenticated: true } as any);
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue('creator-user');

    const { result } = renderHook(() => useCollectionPageData('col-1', undefined));
    expect(result.current.isCreatorViewingOwnCollection).toBe(true);
  });

  it('sets isTrackable true when trackable.enabled is "Yes" (line 30)', () => {
    vi.mocked(useCollection).mockReturnValue({
      data: baseCollection,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { result } = renderHook(() => useCollectionPageData('col-1', undefined));
    expect(result.current.isTrackable).toBe(true);
  });
});
