export const setSessionStorageItem = (key: any, value: any) => {
    sessionStorage.setItem(JSON.stringify(key), JSON.stringify(value));
}

export const getSessionStorageItem = (key: any) => {
    const item = sessionStorage.getItem(JSON.stringify(key));
    return item ? JSON.parse(item) : undefined;
}