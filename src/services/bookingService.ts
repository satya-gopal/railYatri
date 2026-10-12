import {
  Booking,
  BookingStatus,
  Passenger,
  PassengerBooking,
  ClassType,
  Quota,
  ApiResponse,
  Refund,
  TrainType,
  Train,
} from '../types';
import {
  STORAGE_KEYS,
  getFromStorage,
  setToStorage,
  simulateDelay,
} from './storage';
import { generatePNR, generateTransactionId, getCoachPrefix, getBerthTypeFromNumber } from '../utils/pnr';
import { calculateFare, calculateCancellationRefund } from '../utils/fare';
import { getCalculatedAvailability } from './trainService';

export interface CreateBookingParams {
  userId: string;
  trainNumber: string;
  trainName: string;
  trainType: TrainType;
  sourceStation: string;
  sourceStationName: string;
  destStation: string;
  destStationName: string;
  departureTime: string;
  arrivalTime: string;
  journeyDate: string; // YYYY-MM-DD
  classType: ClassType;
  quota: Quota;
  passengers: Passenger[];
  baseFarePerPassenger: number;
  autoUpgrade: boolean;
}

export async function createBooking(
  params: CreateBookingParams
): Promise<ApiResponse<Booking>> {
  await simulateDelay(600, 1100);

  const trains = getFromStorage<Train[]>(STORAGE_KEYS.TRAINS, []);
  const train = trains.find((t) => t.number === params.trainNumber);
  if (!train) return { success: false, error: 'Train details not found' };

  // Check live availability
  const avail = getCalculatedAvailability(
    params.trainNumber,
    params.journeyDate,
    params.classType,
    params.quota,
    train
  );

  const fareBreakdown = calculateFare(
    params.baseFarePerPassenger,
    params.classType,
    params.trainType,
    params.quota,
    params.passengers.length
  );

  const coach = getCoachPrefix(params.classType);
  let overallStatus: BookingStatus = 'CONFIRMED';
  if (avail.status === 'RAC') overallStatus = 'RAC';
  else if (avail.status === 'WL') overallStatus = 'WAITLISTED';

  // Allocate berths or RAC/WL numbers for each passenger
  const passengerBookings: PassengerBooking[] = params.passengers.map((p, idx) => {
    if (avail.status === 'AVAILABLE') {
      const berthNum = Math.floor(Math.random() * 64) + 1;
      const allocatedBerthType = getBerthTypeFromNumber(params.classType, berthNum);
      return {
        ...p,
        bookingStatus: 'CNF',
        coach,
        berthNumber: berthNum,
        berthType: allocatedBerthType,
      };
    } else if (avail.status === 'RAC') {
      const racNumber = avail.count + idx;
      return {
        ...p,
        bookingStatus: 'RAC',
        racNumber,
        coach: 'RAC-' + coach,
      };
    } else {
      const wlNumber = avail.count + idx;
      return {
        ...p,
        bookingStatus: 'WL',
        waitlistNumber: wlNumber,
      };
    }
  });

  const pnr = generatePNR();
  const transactionId = generateTransactionId();

  const newBooking: Booking = {
    id: `b-${Date.now()}`,
    pnr,
    userId: params.userId,
    trainNumber: params.trainNumber,
    trainName: params.trainName,
    trainType: params.trainType,
    sourceStation: params.sourceStation,
    sourceStationName: params.sourceStationName,
    destStation: params.destStation,
    destStationName: params.destStationName,
    departureTime: params.departureTime,
    arrivalTime: params.arrivalTime,
    journeyDate: params.journeyDate,
    classType: params.classType,
    quota: params.quota,
    passengers: passengerBookings,
    fareBreakdown,
    bookingStatus: 'PAYMENT_PENDING',
    transactionId,
    bookedAt: new Date().toISOString(),
    autoUpgrade: params.autoUpgrade,
  };

  const bookings = getFromStorage<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
  bookings.unshift(newBooking);
  setToStorage(STORAGE_KEYS.BOOKINGS, bookings);

  return { success: true, data: newBooking };
}

export async function confirmBookingPayment(
  bookingId: string,
  isConfirmed: boolean = true
): Promise<ApiResponse<Booking>> {
  await simulateDelay(400, 800);
  const bookings = getFromStorage<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
  const idx = bookings.findIndex((b) => b.id === bookingId);

  if (idx === -1) {
    return { success: false, error: 'Booking record not found' };
  }

  if (isConfirmed) {
    const isWl = bookings[idx].passengers.some((p) => p.bookingStatus === 'WL');
    const isRac = bookings[idx].passengers.some((p) => p.bookingStatus === 'RAC');
    bookings[idx].bookingStatus = isWl ? 'WAITLISTED' : isRac ? 'RAC' : 'CONFIRMED';
  } else {
    bookings[idx].bookingStatus = 'PAYMENT_PENDING';
  }

  setToStorage(STORAGE_KEYS.BOOKINGS, bookings);
  return { success: true, data: bookings[idx], message: 'Booking confirmed successfully' };
}

export async function getBookingsByUser(userId: string): Promise<ApiResponse<Booking[]>> {
  await simulateDelay(300, 600);
  const all = getFromStorage<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
  const userBookings = all.filter((b) => b.userId === userId);
  return { success: true, data: userBookings };
}

export async function getBookingByPnr(pnr: string): Promise<ApiResponse<Booking | null>> {
  await simulateDelay(300, 500);
  const all = getFromStorage<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
  const found = all.find((b) => b.pnr === pnr.trim()) || null;
  if (!found) {
    return { success: false, error: `No booking found for PNR: ${pnr}` };
  }
  return { success: true, data: found };
}

export async function getAllBookings(): Promise<ApiResponse<Booking[]>> {
  await simulateDelay(400, 700);
  const all = getFromStorage<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
  return { success: true, data: all };
}

export interface CancelBookingParams {
  bookingId: string;
  passengerIndices: number[]; // which passengers to cancel
}

export async function cancelBooking(
  params: CancelBookingParams
): Promise<ApiResponse<{ booking: Booking; refund: Refund }>> {
  await simulateDelay(600, 1100);
  const bookings = getFromStorage<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
  const idx = bookings.findIndex((b) => b.id === params.bookingId);

  if (idx === -1) {
    return { success: false, error: 'Booking not found' };
  }

  const booking = bookings[idx];
  const journeyDateTime = new Date(`${booking.journeyDate}T${booking.departureTime}:00`);
  const isWaitlistedOrRac = booking.bookingStatus === 'WAITLISTED' || booking.bookingStatus === 'RAC';

  const paidFarePerPax = booking.fareBreakdown.totalFare / booking.passengers.length;
  const refundCalc = calculateCancellationRefund(
    booking.classType,
    isWaitlistedOrRac,
    paidFarePerPax,
    journeyDateTime,
    params.passengerIndices.length
  );

  // Mark selected passengers as cancelled
  booking.passengers.forEach((p, i) => {
    if (params.passengerIndices.includes(i)) {
      p.isCancelled = true;
      p.refundAmount = refundCalc.perPassengerRefund;
    }
  });

  const activePaxRemaining = booking.passengers.filter((p) => !p.isCancelled).length;
  if (activePaxRemaining === 0) {
    booking.bookingStatus = 'CANCELLED';
  } else {
    booking.bookingStatus = 'PARTIALLY_CONFIRMED';
  }

  booking.cancellationDetails = {
    cancelledAt: new Date().toISOString(),
    cancelledPassengersCount: params.passengerIndices.length,
    refundAmount: refundCalc.totalRefund,
    clerkageDeducted: refundCalc.totalClerkage,
  };

  bookings[idx] = booking;
  setToStorage(STORAGE_KEYS.BOOKINGS, bookings);

  // Record refund transaction
  const refundRecord: Refund = {
    id: `ref-${Date.now()}`,
    bookingId: booking.id,
    pnr: booking.pnr,
    amount: refundCalc.totalRefund,
    clerkageFee: refundCalc.totalClerkage,
    status: 'COMPLETED',
    processedAt: new Date().toISOString(),
  };

  return {
    success: true,
    data: { booking, refund: refundRecord },
    message: `Cancellation processed. ₹${refundCalc.totalRefund} will be refunded within 3-5 days.`,
  };
}
