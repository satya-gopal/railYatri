import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Booking } from '../../types';
import { cancelBooking } from '../../services/bookingService';
import { calculateCancellationRefund } from '../../utils/fare';
import { formatCurrency } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onCancelled: (updatedBooking: Booking) => void;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({
  isOpen,
  onClose,
  booking,
  onCancelled,
}) => {
  // Passenger selection for cancellation (default all active passengers)
  const [selectedIndices, setSelectedIndices] = useState<number[]>(() => {
    return booking.passengers
      .map((p, idx) => (!p.isCancelled ? idx : -1))
      .filter((i) => i !== -1);
  });

  const [isLoading, setIsLoading] = useState(false);

  const activePassengers = booking.passengers.filter((p) => !p.isCancelled);
  const paidFarePerPassenger = booking.fareBreakdown.totalFare / booking.passengers.length;
  const journeyDateTime = new Date(`${booking.journeyDate}T${booking.departureTime}:00`);
  const isWaitlistedOrRac = booking.bookingStatus === 'WAITLISTED' || booking.bookingStatus === 'RAC';

  const refundCalculation = calculateCancellationRefund(
    booking.classType,
    isWaitlistedOrRac,
    paidFarePerPassenger,
    journeyDateTime,
    selectedIndices.length
  );

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIndices(
        booking.passengers.map((p, idx) => (!p.isCancelled ? idx : -1)).filter((i) => i !== -1)
      );
    } else {
      setSelectedIndices([]);
    }
  };

  const togglePassenger = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleConfirmCancellation = async () => {
    if (selectedIndices.length === 0) {
      toast.error('Please select at least one passenger to cancel');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Processing ticket cancellation and refund...');

    try {
      const res = await cancelBooking({
        bookingId: booking.id,
        passengerIndices: selectedIndices,
      });

      if (res.success && res.data) {
        toast.success(res.message || 'Ticket cancelled successfully', { id: toastId });
        onCancelled(res.data.booking);
        onClose();
      } else {
        toast.error(res.error || 'Failed to cancel ticket', { id: toastId });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Ticket & Calculate Refund"
      description={`PNR: ${booking.pnr} • ${booking.trainName} (${booking.trainNumber})`}
      size="lg"
    >
      <div className="space-y-5">
        {/* Passenger Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Passengers to Cancel ({selectedIndices.length} of {activePassengers.length})
            </span>
            <button
              type="button"
              onClick={() => toggleSelectAll(selectedIndices.length !== activePassengers.length)}
              className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
            >
              {selectedIndices.length === activePassengers.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-2">
            {booking.passengers.map((p, idx) => {
              if (p.isCancelled) return null;
              const isChecked = selectedIndices.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => togglePassenger(idx)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked
                      ? 'border-danger-400 bg-danger-50/40 dark:bg-danger-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePassenger(idx)}
                      className="rounded border-slate-300 text-danger-600 focus:ring-danger-500"
                    />
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-slate-500">
                        {p.age} yrs, {p.gender} • Coach {p.coach || 'WL'} / Berth {p.berthNumber || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                    Paid {formatCurrency(paidFarePerPassenger)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Refund & Clerkage Calculation Box */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Cancellation Policy & Refund Breakdown
          </h4>

          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Rule Applied: <strong>{refundCalculation.cancellationRuleDescription}</strong>
          </p>

          <div className="divide-y divide-slate-200 dark:divide-slate-700 text-xs sm:text-sm">
            <div className="py-2 flex justify-between">
              <span className="text-slate-500">Paid Fare for Selected:</span>
              <span className="font-semibold">
                {formatCurrency(paidFarePerPassenger * selectedIndices.length)}
              </span>
            </div>
            <div className="py-2 flex justify-between text-danger-600 dark:text-danger-400">
              <span>Clerkage / Cancellation Charge:</span>
              <span className="font-semibold">- {formatCurrency(refundCalculation.totalClerkage)}</span>
            </div>
            <div className="pt-2 flex justify-between text-base font-extrabold text-success-600 dark:text-success-400">
              <span>Net Refundable Amount:</span>
              <span>{formatCurrency(refundCalculation.totalRefund)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="md" onClick={onClose} disabled={isLoading}>
            Keep Ticket
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={handleConfirmCancellation}
            isLoading={isLoading}
            disabled={selectedIndices.length === 0}
          >
            Confirm Cancellation
          </Button>
        </div>
      </div>
    </Modal>
  );
};
