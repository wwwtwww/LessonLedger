import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  MEMBERS: '@lessonledger/members',
  CLASSES: '@lessonledger/classes',
  LOGS: '@lessonledger/logs',
  SYNC_QUEUE: '@lessonledger/syncQueue',
} as const;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const storage = {
  KEYS,

  async getMembers<T>() {
    const raw = await AsyncStorage.getItem(KEYS.MEMBERS);
    return safeParse<T>(raw, null as T);
  },

  async setMembers(data: unknown) {
    await AsyncStorage.setItem(KEYS.MEMBERS, JSON.stringify(data));
  },

  async getClasses<T>() {
    const raw = await AsyncStorage.getItem(KEYS.CLASSES);
    return safeParse<T>(raw, null as T);
  },

  async setClasses(data: unknown) {
    await AsyncStorage.setItem(KEYS.CLASSES, JSON.stringify(data));
  },

  async getLogs<T>() {
    const raw = await AsyncStorage.getItem(KEYS.LOGS);
    return safeParse<T>(raw, null as T);
  },

  async setLogs(data: unknown) {
    await AsyncStorage.setItem(KEYS.LOGS, JSON.stringify(data));
  },

  async getSyncQueue<T>() {
    const raw = await AsyncStorage.getItem(KEYS.SYNC_QUEUE);
    return safeParse<T>(raw, [] as unknown as T);
  },

  async setSyncQueue(data: unknown) {
    await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(data));
  },
};
