import {
  User,
  SavedPassenger,
  Passenger,
  PaymentMethod,
  CardPaymentMethod,
  UpiPaymentMethod,
  ApiResponse,
} from '../types';
import {
  STORAGE_KEYS,
  getFromStorage,
  setToStorage,
  removeFromStorage,
  simulateDelay,
} from './storage';
import {
  LoginFormData,
  SignupFormData,
  ProfileFormData,
  ChangePasswordFormData,
} from '../schemas';
import { detectCardBrand } from '../utils/validators';
import { getMaskedCard } from '../utils/formatters';

interface StoredUser extends User {
  passwordHash: string;
}

export async function getCurrentUser(): Promise<ApiResponse<User | null>> {
  await simulateDelay(200, 400);
  const user = getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  return { success: true, data: user };
}

export async function login(data: LoginFormData): Promise<ApiResponse<User>> {
  await simulateDelay(500, 900);
  const users = getFromStorage<StoredUser[]>(STORAGE_KEYS.USERS, []);
  const found = users.find(
    (u) => u.email.toLowerCase() === data.email.toLowerCase() && u.passwordHash === data.password
  );

  if (!found) {
    return {
      success: false,
      error: 'Invalid email or password. For demo, use user@demo.com / User@123',
    };
  }

  // Strip passwordHash before saving to current session
  const { passwordHash: _, ...userWithoutPass } = found;
  setToStorage(STORAGE_KEYS.CURRENT_USER, userWithoutPass);
  return { success: true, data: userWithoutPass, message: 'Logged in successfully' };
}

export async function signup(data: SignupFormData): Promise<ApiResponse<User>> {
  await simulateDelay(600, 1000);
  const users = getFromStorage<StoredUser[]>(STORAGE_KEYS.USERS, []);
  const exists = users.some((u) => u.email.toLowerCase() === data.email.toLowerCase());

  if (exists) {
    return { success: false, error: 'An account with this email address already exists' };
  }

  const newUser: StoredUser = {
    id: `u-${Date.now()}`,
    name: data.name,
    email: data.email,
    mobile: data.mobile,
    role: 'user',
    passwordHash: data.password,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  setToStorage(STORAGE_KEYS.USERS, users);

  const { passwordHash: _, ...userWithoutPass } = newUser;
  setToStorage(STORAGE_KEYS.CURRENT_USER, userWithoutPass);
  return { success: true, data: userWithoutPass, message: 'Registration completed successfully' };
}

export async function logout(): Promise<ApiResponse<boolean>> {
  await simulateDelay(200, 400);
  removeFromStorage(STORAGE_KEYS.CURRENT_USER);
  return { success: true, data: true };
}

export async function updateProfile(data: ProfileFormData): Promise<ApiResponse<User>> {
  await simulateDelay(400, 800);
  const current = getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  if (!current) return { success: false, error: 'Not authenticated' };

  const users = getFromStorage<StoredUser[]>(STORAGE_KEYS.USERS, []);
  const idx = users.findIndex((u) => u.id === current.id);
  if (idx === -1) return { success: false, error: 'User not found in storage' };

  const updated: StoredUser = {
    ...users[idx],
    name: data.name,
    mobile: data.mobile,
    dob: data.dob,
    gender: data.gender,
    address: data.address,
  };

  users[idx] = updated;
  setToStorage(STORAGE_KEYS.USERS, users);

  const { passwordHash: _, ...userWithoutPass } = updated;
  setToStorage(STORAGE_KEYS.CURRENT_USER, userWithoutPass);
  return { success: true, data: userWithoutPass, message: 'Profile updated successfully' };
}

export async function changePassword(data: ChangePasswordFormData): Promise<ApiResponse<boolean>> {
  await simulateDelay(500, 900);
  const current = getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  if (!current) return { success: false, error: 'Not authenticated' };

  const users = getFromStorage<StoredUser[]>(STORAGE_KEYS.USERS, []);
  const idx = users.findIndex((u) => u.id === current.id);
  if (idx === -1) return { success: false, error: 'User not found' };

  if (users[idx].passwordHash !== data.currentPassword) {
    return { success: false, error: 'Current password does not match' };
  }

  users[idx].passwordHash = data.newPassword;
  setToStorage(STORAGE_KEYS.USERS, users);
  return { success: true, data: true, message: 'Password changed successfully' };
}

// Passenger Master List CRUD
export async function getSavedPassengers(): Promise<ApiResponse<SavedPassenger[]>> {
  await simulateDelay(300, 600);
  const current = getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  if (!current) return { success: true, data: [] };

  const all = getFromStorage<SavedPassenger[]>(STORAGE_KEYS.SAVED_PASSENGERS, []);
  const filtered = all.filter((p) => p.userId === current.id);
  return { success: true, data: filtered };
}

export async function createSavedPassenger(
  passenger: Passenger
): Promise<ApiResponse<SavedPassenger>> {
  await simulateDelay(400, 700);
  const current = getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  if (!current) return { success: false, error: 'Please log in to save passengers' };

  const all = getFromStorage<SavedPassenger[]>(STORAGE_KEYS.SAVED_PASSENGERS, []);
  const newPassenger: SavedPassenger = {
    ...passenger,
    id: `sp-${Date.now()}`,
    userId: current.id,
    createdAt: new Date().toISOString(),
  };

  all.push(newPassenger);
  setToStorage(STORAGE_KEYS.SAVED_PASSENGERS, all);
  return {
    success: true,
    data: newPassenger,
    message: `${passenger.name} added to master list`,
  };
}

export async function updateSavedPassenger(
  id: string,
  passenger: Passenger
): Promise<ApiResponse<SavedPassenger>> {
  await simulateDelay(400, 700);
  const all = getFromStorage<SavedPassenger[]>(STORAGE_KEYS.SAVED_PASSENGERS, []);
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return { success: false, error: 'Passenger not found' };

  const updated: SavedPassenger = {
    ...all[idx],
    ...passenger,
  };

  all[idx] = updated;
  setToStorage(STORAGE_KEYS.SAVED_PASSENGERS, all);
  return { success: true, data: updated, message: 'Passenger updated' };
}

export async function deleteSavedPassenger(id: string): Promise<ApiResponse<boolean>> {
  await simulateDelay(300, 600);
  const all = getFromStorage<SavedPassenger[]>(STORAGE_KEYS.SAVED_PASSENGERS, []);
  const filtered = all.filter((p) => p.id !== id);
  setToStorage(STORAGE_KEYS.SAVED_PASSENGERS, filtered);
  return { success: true, data: true, message: 'Passenger removed from master list' };
}

// Payment Methods CRUD
export async function getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
  await simulateDelay(300, 600);
  const current = getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  if (!current) return { success: true, data: [] };

  const all = getFromStorage<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, []);
  const filtered = all.filter((p) => p.userId === current.id);
  return { success: true, data: filtered };
}

export async function saveCardPaymentMethod(params: {
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: string;
  expiryYear: string;
}): Promise<ApiResponse<CardPaymentMethod>> {
  await simulateDelay(400, 800);
  const current = getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  if (!current) return { success: false, error: 'Authentication required' };

  const all = getFromStorage<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, []);
  const brand = detectCardBrand(params.cardNumber);
  const masked = getMaskedCard(params.cardNumber);

  const newCard: CardPaymentMethod = {
    id: `pm-card-${Date.now()}`,
    userId: current.id,
    type: 'CARD',
    cardNumberMasked: masked,
    cardHolderName: params.cardHolderName,
    expiryMonth: params.expiryMonth,
    expiryYear: params.expiryYear,
    brand,
    isDefault: all.filter((p) => p.userId === current.id).length === 0,
    createdAt: new Date().toISOString(),
  };

  all.push(newCard);
  setToStorage(STORAGE_KEYS.PAYMENT_METHODS, all);
  return { success: true, data: newCard, message: 'Card saved securely' };
}

export async function saveUpiPaymentMethod(upiId: string): Promise<ApiResponse<UpiPaymentMethod>> {
  await simulateDelay(400, 800);
  const current = getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  if (!current) return { success: false, error: 'Authentication required' };

  const all = getFromStorage<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, []);
  const handle = upiId.split('@')[1] || 'upi';

  const newUpi: UpiPaymentMethod = {
    id: `pm-upi-${Date.now()}`,
    userId: current.id,
    type: 'UPI',
    upiId,
    handle,
    isDefault: all.filter((p) => p.userId === current.id).length === 0,
    createdAt: new Date().toISOString(),
  };

  all.push(newUpi);
  setToStorage(STORAGE_KEYS.PAYMENT_METHODS, all);
  return { success: true, data: newUpi, message: 'UPI ID saved' };
}

export async function deletePaymentMethod(id: string): Promise<ApiResponse<boolean>> {
  await simulateDelay(300, 600);
  const all = getFromStorage<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, []);
  const filtered = all.filter((p) => p.id !== id);
  setToStorage(STORAGE_KEYS.PAYMENT_METHODS, filtered);
  return { success: true, data: true, message: 'Payment method removed' };
}

export async function setDefaultPaymentMethod(id: string): Promise<ApiResponse<boolean>> {
  await simulateDelay(300, 500);
  const current = getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  if (!current) return { success: false, error: 'Not authenticated' };

  const all = getFromStorage<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, []);
  all.forEach((p) => {
    if (p.userId === current.id) {
      p.isDefault = p.id === id;
    }
  });

  setToStorage(STORAGE_KEYS.PAYMENT_METHODS, all);
  return { success: true, data: true, message: 'Default payment method updated' };
}
