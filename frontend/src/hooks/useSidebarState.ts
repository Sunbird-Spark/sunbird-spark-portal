import { useState, useCallback, useEffect, useRef } from 'react';

const SIDEBAR_STATE_KEY = 'sunbird_sidebar_open';
const SIDEBAR_USER_TOGGLED_KEY = 'sunbird_sidebar_user_toggled';

export const useSidebarState = (defaultState: boolean = true) => {
    // Initialize from localStorage if available, otherwise use defaultState
    const [isOpen, setIsOpen] = useState(() => {
        if (typeof window === 'undefined') {
            return defaultState;
        }
        try {
            const storage = window.localStorage;
            if (!storage) {
                return defaultState;
            }
            
            // Check if user has ever manually toggled the sidebar
            const userToggled = storage.getItem(SIDEBAR_USER_TOGGLED_KEY);
            
            // If user has toggled before, use the saved state
            if (userToggled === 'true') {
                const savedState = storage.getItem(SIDEBAR_STATE_KEY);
                if (savedState !== null) {
                    const parsed = JSON.parse(savedState);
                    return typeof parsed === 'boolean' ? parsed : defaultState;
                }
            }
            
            // Otherwise, use the default state for this page
            return defaultState;
        } catch {
            return defaultState;
        }
    });

    // Track if user has ever toggled to avoid syncing defaultState after user preference is set
    const hasUserToggledRef = useRef<boolean>(false);
    
    // Check user toggle status on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const storage = window.localStorage;
                hasUserToggledRef.current = storage?.getItem(SIDEBAR_USER_TOGGLED_KEY) === 'true';
            } catch {
                // Ignore errors
            }
        }
    }, []);

    // Sync with defaultState changes only if user has never toggled
    useEffect(() => {
        if (!hasUserToggledRef.current) {
            setIsOpen(defaultState);
        }
    }, [defaultState]);

    const persistState = useCallback((state: boolean, userInitiated: boolean = false) => {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            const storage = window.localStorage;
            if (!storage) {
                return;
            }
            
            // Only persist state if user-initiated
            if (userInitiated) {
                storage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(state));
                storage.setItem(SIDEBAR_USER_TOGGLED_KEY, 'true');
                hasUserToggledRef.current = true;
            }
        } catch {
            // Ignore storage errors and continue without persisting
        }
    }, []);

    const toggleSidebar = useCallback(() => {
        setIsOpen((prevIsOpen) => {
            const newState = !prevIsOpen;
            persistState(newState, true); // User-initiated toggle
            return newState;
        });
    }, [persistState]);

    const setSidebarOpen = useCallback((state: boolean, userInitiated: boolean = false) => {
        setIsOpen(state);
        persistState(state, userInitiated);
    }, [persistState]);

    return { isOpen, toggleSidebar, setSidebarOpen };
};
