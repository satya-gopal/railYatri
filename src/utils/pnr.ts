import { ClassType, BerthPreference } from '../types';

export function generatePNR(): string {
  // 10-digit Indian Railways PNR format: 3 digits zone prefix + 7 digits
  const prefixes = ['241', '452', '623', '814', '285', '436', '679', '891'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomSeven = Math.floor(1000000 + Math.random() * 9000000).toString();
  return `${prefix}${randomSeven}`.slice(0, 10);
}

export function generateTransactionId(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'TXN';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getCoachPrefix(classType: ClassType): string {
  switch (classType) {
    case '1A':
      return 'H1';
    case '2A':
      return 'A' + (Math.floor(Math.random() * 2) + 1);
    case '3A':
      return 'B' + (Math.floor(Math.random() * 4) + 1);
    case 'CC':
      return 'C' + (Math.floor(Math.random() * 2) + 1);
    case 'SL':
      return 'S' + (Math.floor(Math.random() * 6) + 1);
    case '2S':
      return 'D' + (Math.floor(Math.random() * 3) + 1);
    default:
      return 'S1';
  }
}

export function getBerthTypeFromNumber(classType: ClassType, berthNumber: number): BerthPreference {
  if (classType === 'SL' || classType === '3A') {
    const mod = berthNumber % 8;
    switch (mod) {
      case 1:
      case 4:
        return 'LOWER';
      case 2:
      case 5:
        return 'MIDDLE';
      case 3:
      case 6:
        return 'UPPER';
      case 7:
        return 'SIDE_LOWER';
      case 0:
        return 'SIDE_UPPER';
      default:
        return 'LOWER';
    }
  }

  if (classType === '2A') {
    const mod = berthNumber % 6;
    switch (mod) {
      case 1:
      case 3:
        return 'LOWER';
      case 2:
      case 4:
        return 'UPPER';
      case 5:
        return 'SIDE_LOWER';
      case 0:
        return 'SIDE_UPPER';
      default:
        return 'LOWER';
    }
  }

  if (classType === 'CC' || classType === '2S') {
    return berthNumber % 2 === 0 ? 'WINDOW' : 'NO_PREF';
  }

  return 'LOWER';
}
