export type Role = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  dob?: string;
  gender?: 'MALE' | 'FEMALE' | 'TRANSGENDER';
  address?: string;
  role: Role;
  createdAt: string;
}

export type ClassType = 'SL' | '3A' | '2A' | '1A' | 'CC' | '2S';

export type Quota = 'GN' | 'TQ' | 'LD' | 'SS';

export type TrainType =
  | 'Rajdhani'
  | 'Shatabdi'
  | 'Duronto'
  | 'Vande Bharat'
  | 'Superfast'
  | 'Express'
  | 'Garib Rath';

export type Gender = 'MALE' | 'FEMALE' | 'TRANSGENDER';

export type BerthPreference =
  | 'NO_PREF'
  | 'LOWER'
  | 'MIDDLE'
  | 'UPPER'
  | 'SIDE_LOWER'
  | 'SIDE_UPPER'
  | 'WINDOW';

export interface Station {
  code: string;
  name: string;
  city: string;
  state: string;
  zone?: string;
}

export interface TrainStop {
  stopNumber: number;
  stationCode: string;
  stationName: string;
  arrivalTime: string;
  departureTime: string;
  day: number;
  distanceKm: number;
  haltMinutes: number;
}

export interface TrainClassConfig {
  fare: number;
  totalSeats: number;
  available: boolean;
}

export interface Train {
  id: string;
  number: string;
  name: string;
  type: TrainType;
  sourceStation: string;
  destStation: string;
  stops: TrainStop[];
  runningDays: number[]; // 0=Sunday, 1=Monday... 6=Saturday
  classes: Partial<Record<ClassType, TrainClassConfig>>;
  hasPantry: boolean;
}

export type AvailabilityStatus = 'AVAILABLE' | 'RAC' | 'WL';

export interface Availability {
  trainNumber: string;
  date: string; // YYYY-MM-DD
  classType: ClassType;
  quota: Quota;
  status: AvailabilityStatus;
  count: number;
  fare: number;
  lastUpdated: string;
}

export interface Passenger {
  name: string;
  age: number;
  gender: Gender;
  berthPreference: BerthPreference;
  nationality: string;
  idType?: string;
  idNumber?: string;
}

export interface SavedPassenger extends Passenger {
  id: string;
  userId: string;
  createdAt: string;
}

export interface CardPaymentMethod {
  id: string;
  userId: string;
  type: 'CARD';
  cardNumberMasked: string; // e.g. **** **** **** 1234
  cardHolderName: string;
  expiryMonth: string;
  expiryYear: string;
  brand: 'VISA' | 'MASTERCARD' | 'RUPAY' | 'AMEX' | 'OTHER';
  isDefault: boolean;
  createdAt: string;
}

export interface UpiPaymentMethod {
  id: string;
  userId: string;
  type: 'UPI';
  upiId: string;
  handle: string;
  isDefault: boolean;
  createdAt: string;
}

export type PaymentMethod = CardPaymentMethod | UpiPaymentMethod;

export type BookingStatus =
  | 'CONFIRMED'
  | 'PARTIALLY_CONFIRMED'
  | 'RAC'
  | 'WAITLISTED'
  | 'CANCELLED'
  | 'PAYMENT_PENDING';

export interface PassengerBooking extends Passenger {
  bookingStatus: 'CNF' | 'RAC' | 'WL';
  coach?: string;
  berthNumber?: number;
  berthType?: BerthPreference;
  waitlistNumber?: number;
  racNumber?: number;
  isCancelled?: boolean;
  refundAmount?: number;
}

export interface FareBreakdown {
  baseFare: number;
  reservationCharge: number;
  superfastCharge: number;
  tatkalCharge: number;
  gst: number;
  totalFare: number;
}

export interface Booking {
  id: string;
  pnr: string;
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
  passengers: PassengerBooking[];
  fareBreakdown: FareBreakdown;
  bookingStatus: BookingStatus;
  transactionId: string;
  bookedAt: string;
  autoUpgrade: boolean;
  cancellationDetails?: {
    cancelledAt: string;
    cancelledPassengersCount: number;
    refundAmount: number;
    clerkageDeducted: number;
  };
}

export interface Transaction {
  id: string;
  bookingId: string;
  pnr: string;
  userId: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED';
  paymentMethod: 'CARD' | 'UPI' | 'NET_BANKING' | 'SAVED_METHOD';
  reference: string;
  createdAt: string;
}

export interface Refund {
  id: string;
  bookingId: string;
  pnr: string;
  amount: number;
  clerkageFee: number;
  status: 'COMPLETED' | 'PROCESSING';
  processedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SearchFilters {
  source: string;
  destination: string;
  date: string;
  classType?: ClassType;
  quota?: Quota;
  trainTypes?: TrainType[];
  departureSlots?: ('early_morning' | 'morning' | 'afternoon' | 'night')[];
  availableOnly?: boolean;
  sortBy?: 'departure' | 'duration' | 'fare';
}
