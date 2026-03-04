import { useState } from 'react';

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

    const persistState = (state: boolean, userInitiated: boolean = false) => {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            const storage = window.localStorage;
            if (!storage) {
                return;
            }
            storage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(state));
            
            // Mark that user has manually toggled the sidebar
            if (userInitiated) {
                storage.setItem(SIDEBAR_USER_TOGGLED_KEY, 'true');
            }
        } catch {
            // Ignore storage errors and continue without persisting
        }
    };

    const toggleSidebar = () => {
        setIsOpen((prevIsOpen) => {
            const newState = !prevIsOpen;
            persistState(newState, true); // User-initiated toggle
            return newState;
        });
    };

    const setSidebarOpen = (state: boolean, userInitiated: boolean = false) => {
        setIsOpen(state);
        persistState(state, userInitiated);
    };

    return { isOpen, toggleSidebar, setSidebarOpen };
};
