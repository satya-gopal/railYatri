import { z } from 'zod';
import { validateLuhn, validateUpiId } from '../utils/validators';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  dob: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'TRANSGENDER']).optional(),
  address: z.string().max(250, 'Address cannot exceed 250 characters').optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const passengerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters'),
  age: z
    .number({ invalid_type_error: 'Age must be a number' })
    .int('Age must be an integer')
    .min(1, 'Age must be at least 1')
    .max(120, 'Age cannot exceed 120'),
  gender: z.enum(['MALE', 'FEMALE', 'TRANSGENDER']),
  berthPreference: z.enum([
    'NO_PREF',
    'LOWER',
    'MIDDLE',
    'UPPER',
    'SIDE_LOWER',
    'SIDE_UPPER',
    'WINDOW',
  ]),
  nationality: z.string().default('Indian'),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
});

export type PassengerFormData = z.infer<typeof passengerSchema>;

export const cardPaymentSchema = z.object({
  cardNumber: z
    .string()
    .min(13, 'Card number too short')
    .max(19, 'Card number too long')
    .refine((val) => validateLuhn(val), 'Invalid card number (Luhn check failed)'),
  cardHolderName: z.string().min(2, 'Cardholder name is required'),
  expiryMonth: z
    .string()
    .regex(/^(0[1-9]|1[0-2])$/, 'Month must be 01 to 12'),
  expiryYear: z
    .string()
    .regex(/^(20)?[2-3][0-9]$/, 'Invalid expiry year'),
  cvv: z
    .string()
    .regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
  saveCard: z.boolean().default(false),
});

export type CardPaymentFormData = z.infer<typeof cardPaymentSchema>;

export const upiPaymentSchema = z.object({
  upiId: z
    .string()
    .refine((val) => validateUpiId(val), 'Invalid UPI ID format (e.g. name@okhdfcbank)'),
  saveUpi: z.boolean().default(false),
});

export type UpiPaymentFormData = z.infer<typeof upiPaymentSchema>;

export const trainSearchSchema = z
  .object({
    source: z.string().min(1, 'Please select source station'),
    destination: z.string().min(1, 'Please select destination station'),
    date: z.string().min(1, 'Please select journey date'),
    classType: z.enum(['SL', '3A', '2A', '1A', 'CC', '2S']).optional(),
    quota: z.enum(['GN', 'TQ', 'LD', 'SS']).default('GN'),
  })
  .refine((data) => data.source !== data.destination, {
    message: 'Source and destination cannot be the same',
    path: ['destination'],
  });

export type TrainSearchFormData = z.infer<typeof trainSearchSchema>;

export const adminTrainStopSchema = z.object({
  stopNumber: z.number().int().min(1),
  stationCode: z.string().min(2, 'Station code required'),
  stationName: z.string().min(2, 'Station name required'),
  arrivalTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format HH:MM'),
  departureTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format HH:MM'),
  day: z.number().int().min(1),
  distanceKm: z.number().min(0),
  haltMinutes: z.number().min(0),
});

export const adminTrainSchema = z.object({
  number: z.string().regex(/^\d{5}$/, 'Train number must be exactly 5 digits'),
  name: z.string().min(3, 'Train name must be at least 3 characters'),
  type: z.enum([
    'Rajdhani',
    'Shatabdi',
    'Duronto',
    'Vande Bharat',
    'Superfast',
    'Express',
    'Garib Rath',
  ]),
  sourceStation: z.string().min(2, 'Source station required'),
  destStation: z.string().min(2, 'Destination station required'),
  runningDays: z.array(z.number().min(0).max(6)).min(1, 'Select at least one running day'),
  hasPantry: z.boolean().default(true),
  stops: z.array(adminTrainStopSchema).min(2, 'Must include at least source and destination stops'),
  classes: z.record(
    z.object({
      fare: z.number().min(1),
      totalSeats: z.number().min(1),
      available: z.boolean(),
    })
  ),
});

export type AdminTrainFormData = z.infer<typeof adminTrainSchema>;
