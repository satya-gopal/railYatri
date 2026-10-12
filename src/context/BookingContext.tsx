import React, { createContext, useContext, useState } from 'react';
import {
  Train,
  TrainStop,
  ClassType,
  Quota,
  Passenger,
  Booking,
} from '../types';

interface BookingSessionData {
  train: Train | null;
  sourceStop: TrainStop | null;
  destStop: TrainStop | null;
  journeyDate: string;
  classType: ClassType;
  quota: Quota;
  farePerPassenger: number;
  passengers: Passenger[];
  autoUpgrade: boolean;
  currentBooking: Booking | null;
}

interface BookingContextType {
  session: BookingSessionData;
  setTrainSelection: (params: {
    train: Train;
    sourceStop: TrainStop;
    destStop: TrainStop;
    journeyDate: string;
    classType: ClassType;
    quota: Quota;
    fare: number;
  }) => void;
  setPassengers: (passengers: Passenger[]) => void;
  setAutoUpgrade: (enabled: boolean) => void;
  setCurrentBooking: (booking: Booking | null) => void;
  clearBookingSession: () => void;
}

const initialSession: BookingSessionData = {
  train: null,
  sourceStop: null,
  destStop: null,
  journeyDate: '',
  classType: '3A',
  quota: 'GN',
  farePerPassenger: 0,
  passengers: [],
  autoUpgrade: false,
  currentBooking: null,
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<BookingSessionData>(initialSession);

  const setTrainSelection = (params: {
    train: Train;
    sourceStop: TrainStop;
    destStop: TrainStop;
    journeyDate: string;
    classType: ClassType;
    quota: Quota;
    fare: number;
  }) => {
    setSession((prev) => ({
      ...prev,
      train: params.train,
      sourceStop: params.sourceStop,
      destStop: params.destStop,
      journeyDate: params.journeyDate,
      classType: params.classType,
      quota: params.quota,
      farePerPassenger: params.fare,
      passengers: prev.passengers.length > 0 ? prev.passengers : [],
    }));
  };

  const setPassengers = (passengers: Passenger[]) => {
    setSession((prev) => ({ ...prev, passengers }));
  };

  const setAutoUpgrade = (autoUpgrade: boolean) => {
    setSession((prev) => ({ ...prev, autoUpgrade }));
  };

  const setCurrentBooking = (currentBooking: Booking | null) => {
    setSession((prev) => ({ ...prev, currentBooking }));
  };

  const clearBookingSession = () => {
    setSession(initialSession);
  };

  return (
    <BookingContext.Provider
      value={{
        session,
        setTrainSelection,
        setPassengers,
        setAutoUpgrade,
        setCurrentBooking,
        clearBookingSession,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export function useBooking(): BookingContextType {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
