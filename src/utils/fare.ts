import { ClassType, Quota, TrainType, FareBreakdown } from '../types';

export function calculateFare(
  baseFarePerPax: number,
  classType: ClassType,
  trainType: TrainType,
  quota: Quota,
  passengerCount: number
): FareBreakdown {
  const isAC = ['1A', '2A', '3A', 'CC'].includes(classType);
  const isSuperfast = ['Rajdhani', 'Shatabdi', 'Duronto', 'Vande Bharat', 'Superfast'].includes(trainType);

  // Reservation charge per passenger
  let resChargePerPax = 20;
  if (['3A', 'CC'].includes(classType)) resChargePerPax = 40;
  else if (['1A', '2A'].includes(classType)) resChargePerPax = 50;

  // Superfast surcharge per passenger
  let sfChargePerPax = 0;
  if (isSuperfast) {
    sfChargePerPax = isAC ? 45 : 30;
  }

  // Tatkal surcharge per passenger
  let tatkalChargePerPax = 0;
  if (quota === 'TQ') {
    if (isAC) {
      tatkalChargePerPax = Math.max(400, Math.round(baseFarePerPax * 0.3));
    } else {
      tatkalChargePerPax = Math.max(100, Math.round(baseFarePerPax * 0.1));
    }
  }

  const subtotalBeforeGst = (baseFarePerPax + resChargePerPax + sfChargePerPax + tatkalChargePerPax) * passengerCount;

  // GST: 5% on AC classes only
  const gst = isAC ? Math.round(subtotalBeforeGst * 0.05) : 0;
  const totalFare = subtotalBeforeGst + gst;

  return {
    baseFare: baseFarePerPax * passengerCount,
    reservationCharge: resChargePerPax * passengerCount,
    superfastCharge: sfChargePerPax * passengerCount,
    tatkalCharge: tatkalChargePerPax * passengerCount,
    gst,
    totalFare,
  };
}

export interface RefundCalculation {
  perPassengerRefund: number;
  perPassengerClerkage: number;
  totalRefund: number;
  totalClerkage: number;
  cancellationRuleDescription: string;
}

export function calculateCancellationRefund(
  classType: ClassType,
  isWaitlistedOrRac: boolean,
  paidFarePerPassenger: number,
  journeyDateTime: Date,
  cancelledPassengersCount: number
): RefundCalculation {
  if (cancelledPassengersCount <= 0) {
    return {
      perPassengerRefund: 0,
      perPassengerClerkage: 0,
      totalRefund: 0,
      totalClerkage: 0,
      cancellationRuleDescription: 'No passengers selected',
    };
  }

  // If WL or RAC
  if (isWaitlistedOrRac) {
    const clerkage = 60;
    const refund = Math.max(0, paidFarePerPassenger - clerkage);
    return {
      perPassengerRefund: refund,
      perPassengerClerkage: clerkage,
      totalRefund: refund * cancelledPassengersCount,
      totalClerkage: clerkage * cancelledPassengersCount,
      cancellationRuleDescription: 'Flat ₹60 clerkage per passenger for RAC/Waitlisted tickets',
    };
  }

  // Calculate hours remaining till departure
  const now = new Date();
  const diffHours = (journeyDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Flat clerkage charges by class for > 48h
  let minClerkage = 120;
  if (classType === '1A') minClerkage = 240;
  else if (classType === '2A') minClerkage = 200;
  else if (['3A', 'CC'].includes(classType)) minClerkage = 180;
  else if (classType === '2S') minClerkage = 60;

  let clerkage = minClerkage;
  let ruleDesc = '> 48 hours before departure: Flat clerkage fee charged';

  if (diffHours < 4) {
    clerkage = paidFarePerPassenger;
    ruleDesc = '< 4 hours before departure: No refund admissible';
  } else if (diffHours < 12) {
    clerkage = Math.max(minClerkage, Math.round(paidFarePerPassenger * 0.5));
    ruleDesc = 'Between 4 to 12 hours before departure: 50% fare deducted';
  } else if (diffHours < 48) {
    clerkage = Math.max(minClerkage, Math.round(paidFarePerPassenger * 0.25));
    ruleDesc = 'Between 12 to 48 hours before departure: 25% fare deducted';
  }

  const perPaxRefund = Math.max(0, paidFarePerPassenger - clerkage);

  return {
    perPassengerRefund: perPaxRefund,
    perPassengerClerkage: clerkage,
    totalRefund: perPaxRefund * cancelledPassengersCount,
    totalClerkage: clerkage * cancelledPassengersCount,
    cancellationRuleDescription: ruleDesc,
  };
}
