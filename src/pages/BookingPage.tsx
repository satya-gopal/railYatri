import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Train } from 'lucide-react';

export const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { session, setPassengers, setAutoUpgrade, setCurrentBooking } = useBooking();

  const [currentStep, setCurrentStep] = useState(1);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(session.currentBooking);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

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
      toast.error('Please log in to continue with your booking');
      navigate('/login');
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
        setCurrentStep(3);
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
    setCurrentStep(4);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Stepper (Hidden on Print) */}
      <div className="no-print">
        <Stepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={(step) => {
            // Only allow clicking back to completed steps before payment
            if (currentStep < 3 && step < currentStep) {
              setCurrentStep(step);
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
          onNext={() => setCurrentStep(2)}
          onBack={() => navigate(-1)}
        />
      )}

      {/* Step 2: Review Journey & Fare */}
      {currentStep === 2 && (
        <BookingReview
          onBack={() => setCurrentStep(1)}
          onProceedToPayment={handleProceedToPayment}
          isLoading={isCreatingBooking}
        />
      )}

      {/* Step 3: Payment Gateway */}
      {currentStep === 3 && createdBooking && (
        <PaymentGateway
          booking={createdBooking}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setCurrentStep(2)}
        />
      )}

      {/* Step 4: Confirmation E-Ticket */}
      {currentStep === 4 && createdBooking && (
        <div className="space-y-6">
          <ETicketView booking={createdBooking} />
        </div>
      )}
    </div>
  );
};
