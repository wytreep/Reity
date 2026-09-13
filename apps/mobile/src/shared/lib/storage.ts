import AsyncStorage from '@react-native-async-storage/async-storage';

const memoryCache: Record<string, string> = {};

export const storage = {
    getString: (key: string): string | undefined => memoryCache[key],
    set: (key: string, value: string): void => {
        memoryCache[key] = value;
        AsyncStorage.setItem(key, value);
    },
    delete: (key: string): void => {
        delete memoryCache[key];
        AsyncStorage.removeItem(key);
    },
    clearAll: (): void => {
        Object.keys(memoryCache).forEach(k => delete memoryCache[k]);
        AsyncStorage.clear();
    },
};

export async function hydrateStorage(): Promise<void> {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const pairs = await AsyncStorage.multiGet(keys);
        pairs.forEach(([key, value]) => {
            if (value) memoryCache[key] = value;
        });
    } catch { }
}