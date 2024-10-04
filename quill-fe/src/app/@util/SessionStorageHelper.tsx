export const setSessionStorageItem = (key: any, value: any) => {
    if (sessionStorage) {
        sessionStorage.setItem(JSON.stringify(key), JSON.stringify(value));
    }
}

export const getSessionStorageItem = (key: any) => {
    if (sessionStorage) {
        const item = sessionStorage.getItem(JSON.stringify(key));
        return item ? JSON.parse(item) : undefined;
    }
}