import { useState, useEffect } from 'react';

const SIDEBAR_STATE_KEY = 'sunbird_sidebar_open';

export const useSidebarState = (defaultState: boolean = true) => {
    // Initialize from sessionStorage if available, otherwise use defaultState
    const [isOpen, setIsOpen] = useState(() => {
        const savedState = sessionStorage.getItem(SIDEBAR_STATE_KEY);
        return savedState !== null ? JSON.parse(savedState) : defaultState;
    });

    const toggleSidebar = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        sessionStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(newState));
    };

    const setSidebarOpen = (state: boolean) => {
        setIsOpen(state);
        sessionStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(state));
    };

    return { isOpen, toggleSidebar, setSidebarOpen };
};
