/**
 * Get an item from session storage given a key. Only call this on the client-side, i.e., within useEffect
 * @param key 
 * @returns The value or undefined if not found
 */
export const setSessionStorageItem = (key: any, value: any) => {
    if (sessionStorage) {
        sessionStorage.setItem(JSON.stringify(key), JSON.stringify(value));
    }
}

/**
 * Get an item from session storage given a key. Only call this on the client-side, i.e., within useEffect
 * @param key 
 * @returns The value or undefined if not found
 */
export const getSessionStorageItem = (key: any) => {
    if (sessionStorage) {
        const item = sessionStorage.getItem(JSON.stringify(key));
        return item ? JSON.parse(item) : undefined;
    }
}