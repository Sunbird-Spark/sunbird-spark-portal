import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSidebarState } from './useSidebarState';

const SIDEBAR_STATE_KEY = 'sunbird_sidebar_open';
const SIDEBAR_USER_TOGGLED_KEY = 'sunbird_sidebar_user_toggled';

describe('useSidebarState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with default state when no stored value exists', () => {
    const { result } = renderHook(() => useSidebarState(true));
    expect(result.current.isOpen).toBe(true);
  });

  it('should initialize with false when default is false', () => {
    const { result } = renderHook(() => useSidebarState(false));
    expect(result.current.isOpen).toBe(false);
  });

  it('should persist state to localStorage when toggled', () => {
    const { result } = renderHook(() => useSidebarState(true));
    
    act(() => {
      result.current.toggleSidebar();
    });

    expect(result.current.isOpen).toBe(false);
    expect(localStorage.getItem(SIDEBAR_STATE_KEY)).toBe('false');
    expect(localStorage.getItem(SIDEBAR_USER_TOGGLED_KEY)).toBe('true');
  });

  it('should restore persisted state on subsequent renders when user has toggled', () => {
    localStorage.setItem(SIDEBAR_STATE_KEY, 'false');
    localStorage.setItem(SIDEBAR_USER_TOGGLED_KEY, 'true');

    const { result } = renderHook(() => useSidebarState(true));
    expect(result.current.isOpen).toBe(false);
  });

  it('should use default state when user has not toggled before', () => {
    localStorage.setItem(SIDEBAR_STATE_KEY, 'false');
    // No SIDEBAR_USER_TOGGLED_KEY set

    const { result } = renderHook(() => useSidebarState(true));
    expect(result.current.isOpen).toBe(true); // Uses default, not stored value
  });

  it('should mark user toggle when setSidebarOpen is called with userInitiated=true', () => {
    const { result } = renderHook(() => useSidebarState(true));
    
    act(() => {
      result.current.setSidebarOpen(false, true);
    });

    expect(result.current.isOpen).toBe(false);
    expect(localStorage.getItem(SIDEBAR_STATE_KEY)).toBe('false');
    expect(localStorage.getItem(SIDEBAR_USER_TOGGLED_KEY)).toBe('true');
  });

  it('should not mark user toggle when setSidebarOpen is called with userInitiated=false', () => {
    const { result } = renderHook(() => useSidebarState(true));
    
    act(() => {
      result.current.setSidebarOpen(false, false);
    });

    expect(result.current.isOpen).toBe(false);
    expect(localStorage.getItem(SIDEBAR_STATE_KEY)).toBe('false');
    expect(localStorage.getItem(SIDEBAR_USER_TOGGLED_KEY)).toBeNull();
  });

  it('should handle localStorage errors gracefully', () => {
    const mockGetItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useSidebarState(true));
    expect(result.current.isOpen).toBe(true); // Falls back to default

    mockGetItem.mockRestore();
  });

  it('should handle localStorage write errors gracefully', () => {
    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useSidebarState(true));
    
    act(() => {
      result.current.toggleSidebar();
    });

    expect(result.current.isOpen).toBe(false); // State still updates

    mockSetItem.mockRestore();
  });

  it('should toggle between open and closed states', () => {
    const { result } = renderHook(() => useSidebarState(true));
    
    expect(result.current.isOpen).toBe(true);
    
    act(() => {
      result.current.toggleSidebar();
    });
    expect(result.current.isOpen).toBe(false);
    
    act(() => {
      result.current.toggleSidebar();
    });
    expect(result.current.isOpen).toBe(true);
  });
});
