import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { createBooking } from '../services/bookingService';
import { Booking } from '../types';
import { Stepper } from '../components/ui/Stepper';
import { PassengerForm } from '../components/booking/PassengerForm';
import { BookingReview } from '../components/booking/BookingReview';
import { PaymentGateway } from '../components/booking/PaymentGateway';
import { ETicketView } from '../components/booking/ETicketView';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Train, UserCheck } from 'lucide-react';

export const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { session, setPassengers, setAutoUpgrade, setCurrentBooking, clearBookingSession } = useBooking();

  const urlStep = parseInt(searchParams.get('step') || '1', 10);
  const [currentStep, setCurrentStep] = useState<number>(() => {
    return urlStep >= 1 && urlStep <= 4 ? urlStep : 1;
  });

  const [createdBooking, setCreatedBooking] = useState<Booking | null>(session.currentBooking);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  // Sync state if URL param changes
  useEffect(() => {
    if (urlStep >= 1 && urlStep <= 4 && urlStep !== currentStep) {
      setCurrentStep(urlStep);
    }
  }, [urlStep]);

  const changeStep = (newStep: number) => {
    setCurrentStep(newStep);
    setSearchParams({ step: String(newStep) }, { replace: true });
  };

  // If no train is selected
  if (!session.train || !session.sourceStop || !session.destStop) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          icon={<Train className="w-8 h-8" />}
          title="No Train Selected for Booking"
          description="Please search and select a train first to begin your reservation workflow."
          action={
            <Button variant="primary" size="md" onClick={() => navigate('/')}>
              Search Trains Now
            </Button>
          }
        />
      </div>
    );
  }

  const steps = [
    { id: 1, label: 'Passenger Details', description: 'Names & Berths' },
    { id: 2, label: 'Review Journey', description: 'Schedule & Fares' },
    { id: 3, label: 'Payment Gateway', description: 'Instant Checkout' },
    { id: 4, label: 'Confirmation', description: 'Print E-Ticket' },
  ];

  const handleProceedToPayment = async () => {
    if (!user) {
      toast('Please log in to complete your booking. Your passenger details are saved!', {
        icon: '🔐',
      });
      navigate('/login', {
        state: {
          from: {
            pathname: '/booking',
            search: '?step=2',
          },
        },
      });
      return;
    }

    setIsCreatingBooking(true);
    const toastId = toast.loading('Initializing ticket reservation session...');
    try {
      const res = await createBooking({
        userId: user.id,
        trainNumber: session.train!.number,
        trainName: session.train!.name,
        trainType: session.train!.type,
        sourceStation: session.sourceStop!.stationCode,
        sourceStationName: session.sourceStop!.stationName,
        destStation: session.destStop!.stationCode,
        destStationName: session.destStop!.stationName,
        departureTime: session.sourceStop!.departureTime,
        arrivalTime: session.destStop!.arrivalTime,
        journeyDate: session.journeyDate,
        classType: session.classType,
        quota: session.quota,
        passengers: session.passengers,
        baseFarePerPassenger: session.farePerPassenger,
        autoUpgrade: session.autoUpgrade,
      });

      if (res.success && res.data) {
        setCreatedBooking(res.data);
        setCurrentBooking(res.data);
        changeStep(3);
        toast.success(`Reserved in queue: PNR ${res.data.pnr}`, { id: toastId });
      } else {
        toast.error(res.error || 'Failed to initialize booking', { id: toastId });
      }
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const handlePaymentSuccess = (confirmed: Booking) => {
    setCreatedBooking(confirmed);
    setCurrentBooking(confirmed);
    changeStep(4);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Guest Booking Helper Banner */}
      {!user && currentStep <= 2 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs sm:text-sm text-amber-900 dark:text-amber-200 shadow-sm">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="font-bold">Booking in Guest Mode</p>
              <p className="text-amber-800 dark:text-amber-300 text-xs">
                Your passenger information is saved automatically. You can sign in now or at checkout to generate your IRCTC PNR.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate('/login', {
                state: {
                  from: {
                    pathname: '/booking',
                    search: `?step=${currentStep}`,
                  },
                },
              })
            }
            className="shrink-0 text-xs font-semibold bg-white dark:bg-slate-900"
          >
            Sign In Now
          </Button>
        </div>
      )}

      {/* Stepper (Hidden on Print) */}
      <div className="no-print">
        <Stepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={(step) => {
            // Only allow clicking back to completed steps before payment
            if (currentStep < 3 && step < currentStep) {
              changeStep(step);
            }
          }}
        />
      </div>

      {/* Step 1: Passenger Form */}
      {currentStep === 1 && (
        <PassengerForm
          passengers={session.passengers}
          onChange={setPassengers}
          autoUpgrade={session.autoUpgrade}
          onAutoUpgradeChange={setAutoUpgrade}
          onNext={() => changeStep(2)}
          onBack={() => navigate(-1)}
        />
      )}

      {/* Step 2: Review Journey & Fare */}
      {currentStep === 2 && (
        <BookingReview
          onBack={() => changeStep(1)}
          onProceedToPayment={handleProceedToPayment}
          isLoading={isCreatingBooking}
        />
      )}

      {/* Step 3: Payment Gateway */}
      {currentStep === 3 && createdBooking && (
        <PaymentGateway
          booking={createdBooking}
          onSuccess={handlePaymentSuccess}
          onCancel={() => changeStep(2)}
        />
      )}

      {/* Step 4: Confirmation E-Ticket */}
      {currentStep === 4 && createdBooking && (
        <div className="space-y-6">
          <ETicketView booking={createdBooking} />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 no-print">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                clearBookingSession();
                navigate('/');
              }}
            >
              Book Another Ticket
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                clearBookingSession();
                navigate('/bookings');
              }}
            >
              View in My Bookings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
