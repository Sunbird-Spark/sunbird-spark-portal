
export const getStorageItem = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.warn('LocalStorage access failed:', e);
        return null;
    }
};

export const setStorageItem = (key: string, value: string): void => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn('LocalStorage write failed:', e);
    }
};

export const removeStorageItem = (key: string): void => {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.warn('LocalStorage remove failed:', e);
    }
};
