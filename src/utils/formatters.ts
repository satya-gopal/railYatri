import { ClassType, Quota, BerthPreference } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatShortDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export function calculateDuration(depTime: string, arrTime: string, dayOffset: number = 0): string {
  const [depHours, depMins] = depTime.split(':').map(Number);
  const [arrHours, arrMins] = arrTime.split(':').map(Number);

  if (isNaN(depHours) || isNaN(depMins) || isNaN(arrHours) || isNaN(arrMins)) {
    return '--:--';
  }

  const depTotal = depHours * 60 + depMins;
  const arrTotal = arrHours * 60 + arrMins + (dayOffset > 1 ? (dayOffset - 1) * 1440 : (arrHours < depHours ? 1440 : 0));
  
  const diff = arrTotal - depTotal;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;

  return `${hours}h ${mins}m`;
}

export function getClassName(code: ClassType): string {
  const map: Record<ClassType, string> = {
    '1A': 'AC First Class (1A)',
    '2A': 'AC 2 Tier (2A)',
    '3A': 'AC 3 Tier (3A)',
    'CC': 'AC Chair Car (CC)',
    'SL': 'Sleeper (SL)',
    '2S': 'Second Sitting (2S)',
  };
  return map[code] || code;
}

export function getQuotaName(code: Quota): string {
  const map: Record<Quota, string> = {
    GN: 'General (GN)',
    TQ: 'Tatkal (TQ)',
    LD: 'Ladies (LD)',
    SS: 'Senior Citizen (SS)',
  };
  return map[code] || code;
}

export function getBerthName(code: BerthPreference): string {
  const map: Record<BerthPreference, string> = {
    NO_PREF: 'No Preference',
    LOWER: 'Lower Berth',
    MIDDLE: 'Middle Berth',
    UPPER: 'Upper Berth',
    SIDE_LOWER: 'Side Lower',
    SIDE_UPPER: 'Side Upper',
    WINDOW: 'Window Seat',
  };
  return map[code] || code;
}

export function getMaskedCard(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 4) return cardNumber;
  const last4 = digits.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

export function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
