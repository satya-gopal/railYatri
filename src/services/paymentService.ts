import { Transaction, ApiResponse } from '../types';
import {
  STORAGE_KEYS,
  getFromStorage,
  setToStorage,
  simulateDelay,
} from './storage';

export interface ProcessPaymentParams {
  bookingId: string;
  pnr: string;
  userId: string;
  amount: number;
  paymentMethod: 'CARD' | 'UPI' | 'NET_BANKING' | 'SAVED_METHOD';
  simulateFailure?: boolean;
}

export async function processPayment(
  params: ProcessPaymentParams
): Promise<ApiResponse<Transaction>> {
  // Simulate processing time
  await simulateDelay(1200, 2000);

  // Check forced failure or rare 5% random failure
  const isRandomFail = Math.random() < 0.05;
  const shouldFail = params.simulateFailure || isRandomFail;

  const transaction: Transaction = {
    id: `txn-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    bookingId: params.bookingId,
    pnr: params.pnr,
    userId: params.userId,
    amount: params.amount,
    status: shouldFail ? 'FAILED' : 'SUCCESS',
    paymentMethod: params.paymentMethod,
    reference: `IRCTC-PG-${Math.floor(10000000 + Math.random() * 90000000)}`,
    createdAt: new Date().toISOString(),
  };

  const transactions = getFromStorage<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  transactions.unshift(transaction);
  setToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);

  if (shouldFail) {
    return {
      success: false,
      error: 'Bank gateway declined the transaction. Please try again or choose another payment method.',
      data: transaction,
    };
  }

  return {
    success: true,
    data: transaction,
    message: 'Payment received successfully by IRCTC gateway',
  };
}
