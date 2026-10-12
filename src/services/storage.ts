export const STORAGE_KEYS = {
  USERS: 'railyatri_users',
  CURRENT_USER: 'railyatri_current_user',
  STATIONS: 'railyatri_stations',
  TRAINS: 'railyatri_trains',
  AVAILABILITIES: 'railyatri_availabilities',
  SAVED_PASSENGERS: 'railyatri_saved_passengers',
  PAYMENT_METHODS: 'railyatri_payment_methods',
  BOOKINGS: 'railyatri_bookings',
  TRANSACTIONS: 'railyatri_transactions',
  BOOKING_SESSION: 'railyatri_booking_session',
  INITIALIZED: 'railyatri_initialized_v1',
} as const;

export function simulateDelay(min = 400, max = 1000): Promise<void> {
  const duration = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, duration));
}

export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Error reading ${key} from storage:`, error);
    return defaultValue;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to storage:`, error);
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
  }
}

export function clearAllAppData(): void {
  Object.values(STORAGE_KEYS).forEach((k) => {
    localStorage.removeItem(k);
  });
}
