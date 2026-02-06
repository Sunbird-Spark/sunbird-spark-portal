
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast } from './useToast';

// The useToast hook uses a module-level global state `memoryState`.
// To ensure test isolation, we must clear this state between tests.
// The only way to clear `toasts` array is via the `REMOVE_TOAST` action.
// This action is triggered by `addToRemoveQueue` after a delay (TOAST_REMOVE_DELAY = 1000000).
// Or we can rely on `toasts.slice(0, TOAST_LIMIT)` if we just flood it? No.
// Best approach: Use fake timers to force the removal queue to process.

describe('useToast', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        const { result } = renderHook(() => useToast());

        // Dismiss all current toasts
        act(() => {
            result.current.dismiss();
        });

        // Fast-forward time to trigger the removal of dismissed toasts
        act(() => {
            vi.advanceTimersByTime(1000000 + 1000);
        });

        vi.useRealTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should add a new toast', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            toast({
                title: 'Test Toast',
                description: 'Description',
            });
        });

        expect(result.current.toasts).toHaveLength(1);
        expect(result.current.toasts[0]!.title).toBe('Test Toast');
        expect(result.current.toasts[0]!.open).toBe(true);
    });

    it('should dismiss a toast', () => {
        const { result } = renderHook(() => useToast());

        let toastId = '';
        act(() => {
            const t = toast({ title: 'Dismiss Me' });
            toastId = t.id;
        });

        expect(result.current.toasts[0]!.open).toBe(true);

        act(() => {
            result.current.dismiss(toastId);
        });

        expect(result.current.toasts[0]!.open).toBe(false);
    });

    it('should update a toast', () => {
        const { result } = renderHook(() => useToast());

        let updateFn: any;
        act(() => {
            const t = toast({ title: 'Original' });
            updateFn = t.update;
        });

        expect(result.current.toasts[0]!.title).toBe('Original');

        act(() => {
            updateFn({ title: 'Updated' });
        });

        expect(result.current.toasts[0]!.title).toBe('Updated');
    });

    it('should enforce toast limit', () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            toast({ title: 'First' });
        });

        act(() => {
            toast({ title: 'Second' });
        });

        // Limit is 1
        expect(result.current.toasts).toHaveLength(1);
        expect(result.current.toasts[0]!.title).toBe('Second');
    });
});
