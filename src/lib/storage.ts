import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getStoredValue<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setStoredValue<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Fail silently; persistence is best-effort.
  }
}

export async function removeStoredValue(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Fail silently; persistence is best-effort.
  }
}
