import {
  Station,
  Train,
  TrainStop,
  ClassType,
  Quota,
  Availability,
  ApiResponse,
  SearchFilters,
  Booking,
} from '../types';
import {
  STORAGE_KEYS,
  getFromStorage,
  setToStorage,
  simulateDelay,
} from './storage';
import { calculateDuration } from '../utils/formatters';

export interface TrainSearchResult {
  train: Train;
  sourceStop: TrainStop;
  destStop: TrainStop;
  duration: string;
  distanceKm: number;
  availableClasses: {
    classType: ClassType;
    fare: number;
    availability: Availability;
  }[];
}

export async function getStations(): Promise<ApiResponse<Station[]>> {
  await simulateDelay(150, 300);
  const stations = getFromStorage<Station[]>(STORAGE_KEYS.STATIONS, []);
  return { success: true, data: stations };
}

export async function getStationByCode(code: string): Promise<ApiResponse<Station | null>> {
  const stations = getFromStorage<Station[]>(STORAGE_KEYS.STATIONS, []);
  const found = stations.find((s) => s.code.toUpperCase() === code.toUpperCase()) || null;
  return { success: true, data: found };
}

export async function getTrainByNumber(number: string): Promise<ApiResponse<Train | null>> {
  await simulateDelay(200, 400);
  const trains = getFromStorage<Train[]>(STORAGE_KEYS.TRAINS, []);
  const found = trains.find((t) => t.number === number) || null;
  return { success: true, data: found };
}

// Compute seat availability dynamically based on base seats and stored active bookings
export function getCalculatedAvailability(
  trainNumber: string,
  date: string,
  classType: ClassType,
  quota: Quota,
  train: Train
): Availability {
  const classConfig = train.classes[classType];
  const baseCapacity = classConfig?.totalSeats || 60;

  // Key for local store
  const allAvailabilities = getFromStorage<Record<string, Availability>>(
    STORAGE_KEYS.AVAILABILITIES,
    {}
  );
  const availKey = `${trainNumber}_${date}_${classType}_${quota}`;

  // Find confirmed/RAC/WL bookings for this train, date, and class
  const allBookings = getFromStorage<Booking[]>(STORAGE_KEYS.BOOKINGS, []);
  const activePassengers = allBookings
    .filter(
      (b) =>
        b.trainNumber === trainNumber &&
        b.journeyDate === date &&
        b.classType === classType &&
        b.bookingStatus !== 'CANCELLED'
    )
    .flatMap((b) => b.passengers.filter((p) => !p.isCancelled));

  const bookedCount = activePassengers.length;

  // Quota allocation
  let quotaCapacity = Math.floor(baseCapacity * 0.7); // General gets 70%
  if (quota === 'TQ') quotaCapacity = Math.floor(baseCapacity * 0.15); // Tatkal 15%
  else if (quota === 'LD') quotaCapacity = Math.floor(baseCapacity * 0.1); // Ladies 10%
  else if (quota === 'SS') quotaCapacity = Math.floor(baseCapacity * 0.05); // Senior 5%

  const remaining = quotaCapacity - bookedCount;

  let status: Availability['status'] = 'AVAILABLE';
  let count = remaining;

  if (remaining > 0) {
    status = 'AVAILABLE';
    count = remaining;
  } else if (remaining > -15) {
    status = 'RAC';
    count = Math.abs(remaining) + 1;
  } else {
    status = 'WL';
    count = Math.abs(remaining) - 14;
  }

  const baseFare = classConfig?.fare || 500;

  const result: Availability = {
    trainNumber,
    date,
    classType,
    quota,
    status,
    count,
    fare: baseFare,
    lastUpdated: new Date().toLocaleTimeString(),
  };

  // Cache in storage
  allAvailabilities[availKey] = result;
  setToStorage(STORAGE_KEYS.AVAILABILITIES, allAvailabilities);

  return result;
}

export async function checkAvailability(
  trainNumber: string,
  date: string,
  classType: ClassType,
  quota: Quota
): Promise<ApiResponse<Availability>> {
  await simulateDelay(400, 800);
  const trains = getFromStorage<Train[]>(STORAGE_KEYS.TRAINS, []);
  const train = trains.find((t) => t.number === trainNumber);

  if (!train) {
    return { success: false, error: 'Train not found' };
  }

  const avail = getCalculatedAvailability(trainNumber, date, classType, quota, train);
  return { success: true, data: avail, message: 'Availability refreshed' };
}

export async function searchTrains(
  filters: SearchFilters
): Promise<ApiResponse<TrainSearchResult[]>> {
  await simulateDelay(500, 1000);
  const trains = getFromStorage<Train[]>(STORAGE_KEYS.TRAINS, []);

  const searchDate = new Date(filters.date);
  const dayOfWeek = isNaN(searchDate.getTime()) ? 0 : searchDate.getDay();

  const matchingTrains: TrainSearchResult[] = [];

  for (const train of trains) {
    // Check if train runs on this day of week
    if (!train.runningDays.includes(dayOfWeek)) {
      continue;
    }

    // Check train type filter
    if (filters.trainTypes && filters.trainTypes.length > 0) {
      if (!filters.trainTypes.includes(train.type)) {
        continue;
      }
    }

    // Check if train traverses source and destination in correct sequence
    const srcIndex = train.stops.findIndex(
      (s) => s.stationCode.toUpperCase() === filters.source.toUpperCase()
    );
    const destIndex = train.stops.findIndex(
      (s) => s.stationCode.toUpperCase() === filters.destination.toUpperCase()
    );

    if (srcIndex === -1 || destIndex === -1 || srcIndex >= destIndex) {
      continue;
    }

    const sourceStop = train.stops[srcIndex];
    const destStop = train.stops[destIndex];

    // Check departure time slot filter
    if (filters.departureSlots && filters.departureSlots.length > 0) {
      const depHour = parseInt(sourceStop.departureTime.split(':')[0], 10);
      let slot: 'early_morning' | 'morning' | 'afternoon' | 'night' = 'early_morning';
      if (depHour >= 0 && depHour < 6) slot = 'early_morning';
      else if (depHour >= 6 && depHour < 12) slot = 'morning';
      else if (depHour >= 12 && depHour < 18) slot = 'afternoon';
      else slot = 'night';

      if (!filters.departureSlots.includes(slot)) {
        continue;
      }
    }

    const duration = calculateDuration(
      sourceStop.departureTime,
      destStop.arrivalTime,
      destStop.day - sourceStop.day + 1
    );

    const distanceKm = Math.max(50, destStop.distanceKm - sourceStop.distanceKm);

    // Collect class availabilities
    const availableClasses: TrainSearchResult['availableClasses'] = [];
    const classKeys = Object.keys(train.classes) as ClassType[];

    for (const cType of classKeys) {
      const config = train.classes[cType];
      if (!config || !config.available) continue;

      // Filter by requested classType if specified
      if (filters.classType && filters.classType !== cType) {
        continue;
      }

      const quota = filters.quota || 'GN';
      const avail = getCalculatedAvailability(
        train.number,
        filters.date,
        cType,
        quota,
        train
      );

      // Distance-adjusted fare if partial journey
      const totalTrainDist = train.stops[train.stops.length - 1].distanceKm || distanceKm;
      const distRatio = Math.min(1, Math.max(0.3, distanceKm / (totalTrainDist || 1)));
      const adjustedFare = Math.round(config.fare * distRatio);

      availableClasses.push({
        classType: cType,
        fare: adjustedFare,
        availability: { ...avail, fare: adjustedFare },
      });
    }

    if (availableClasses.length === 0) {
      continue;
    }

    // Filter "available only"
    if (filters.availableOnly) {
      const hasAvailable = availableClasses.some((c) => c.availability.status === 'AVAILABLE');
      if (!hasAvailable) continue;
    }

    matchingTrains.push({
      train,
      sourceStop,
      destStop,
      duration,
      distanceKm,
      availableClasses,
    });
  }

  // Sort
  if (filters.sortBy === 'duration') {
    matchingTrains.sort((a, b) => {
      const durA = parseInt(a.duration) || 0;
      const durB = parseInt(b.duration) || 0;
      return durA - durB;
    });
  } else if (filters.sortBy === 'fare') {
    matchingTrains.sort((a, b) => {
      const minFareA = Math.min(...a.availableClasses.map((c) => c.fare));
      const minFareB = Math.min(...b.availableClasses.map((c) => c.fare));
      return minFareA - minFareB;
    });
  } else {
    // Default departure time sort
    matchingTrains.sort((a, b) =>
      a.sourceStop.departureTime.localeCompare(b.sourceStop.departureTime)
    );
  }

  return { success: true, data: matchingTrains };
}

// Admin Operations
export async function getAllTrains(): Promise<ApiResponse<Train[]>> {
  await simulateDelay(300, 600);
  const trains = getFromStorage<Train[]>(STORAGE_KEYS.TRAINS, []);
  return { success: true, data: trains };
}

export async function createTrain(trainData: Omit<Train, 'id'>): Promise<ApiResponse<Train>> {
  await simulateDelay(600, 1000);
  const trains = getFromStorage<Train[]>(STORAGE_KEYS.TRAINS, []);

  if (trains.some((t) => t.number === trainData.number)) {
    return { success: false, error: `Train number ${trainData.number} already exists` };
  }

  const newTrain: Train = {
    ...trainData,
    id: `t-${trainData.number}-${Date.now()}`,
  };

  trains.unshift(newTrain);
  setToStorage(STORAGE_KEYS.TRAINS, trains);
  return { success: true, data: newTrain, message: `Train ${newTrain.number} added successfully` };
}

export async function updateTrain(
  id: string,
  trainData: Partial<Train>
): Promise<ApiResponse<Train>> {
  await simulateDelay(500, 900);
  const trains = getFromStorage<Train[]>(STORAGE_KEYS.TRAINS, []);
  const index = trains.findIndex((t) => t.id === id);

  if (index === -1) {
    return { success: false, error: 'Train not found' };
  }

  const updated: Train = {
    ...trains[index],
    ...trainData,
  };

  trains[index] = updated;
  setToStorage(STORAGE_KEYS.TRAINS, trains);
  return { success: true, data: updated, message: `Train ${updated.number} updated successfully` };
}

export async function deleteTrain(id: string): Promise<ApiResponse<boolean>> {
  await simulateDelay(400, 800);
  const trains = getFromStorage<Train[]>(STORAGE_KEYS.TRAINS, []);
  const filtered = trains.filter((t) => t.id !== id);
  setToStorage(STORAGE_KEYS.TRAINS, filtered);
  return { success: true, data: true, message: 'Train deleted successfully' };
}
