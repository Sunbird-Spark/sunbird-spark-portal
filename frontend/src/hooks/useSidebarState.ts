import { useState, useEffect } from 'react';

const SIDEBAR_STATE_KEY = 'sunbird_sidebar_open';

export const useSidebarState = (defaultState: boolean = true) => {
    // Initialize from sessionStorage if available, otherwise use defaultState
    const [isOpen, setIsOpen] = useState(() => {
        if (typeof window === 'undefined') {
            return defaultState;
        }
        try {
            const storage = window.sessionStorage;
            if (!storage) {
                return defaultState;
            }
            const savedState = storage.getItem(SIDEBAR_STATE_KEY);
            if (savedState === null) {
                return defaultState;
            }
            const parsed = JSON.parse(savedState);
            return typeof parsed === 'boolean' ? parsed : defaultState;
        } catch {
            return defaultState;
        }
    });

    const persistState = (state: boolean) => {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            const storage = window.sessionStorage;
            if (!storage) {
                return;
            }
            storage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(state));
        } catch {
            // Ignore storage errors and continue without persisting
        }
    };

    const toggleSidebar = () => {
        setIsOpen((prevIsOpen) => {
            const newState = !prevIsOpen;
            persistState(newState);
            return newState;
        });
    };

    const setSidebarOpen = (state: boolean) => {
        setIsOpen(state);
        persistState(state);
    };

    return { isOpen, toggleSidebar, setSidebarOpen };
};
