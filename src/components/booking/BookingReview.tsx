import React from 'react';
import { Train, User, ShieldCheck, ArrowRight, Calendar, CreditCard, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { formatCurrency, formatDate, getClassName, getQuotaName, getBerthName } from '../../utils/formatters';
import { calculateFare } from '../../utils/fare';
import { Button } from '../ui/Button';

export interface BookingReviewProps {
  onBack: () => void;
  onProceedToPayment: () => void;
  isLoading?: boolean;
}

export const BookingReview: React.FC<BookingReviewProps> = ({
  onBack,
  onProceedToPayment,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const { session } = useBooking();
  const { train, sourceStop, destStop, journeyDate, classType, quota, passengers, autoUpgrade, farePerPassenger } =
    session;

  if (!train || !sourceStop || !destStop) {
    return <div>Missing train details. Please go back to search.</div>;
  }

  const fareBreakdown = calculateFare(
    farePerPassenger,
    classType,
    train.type,
    quota,
    passengers.length
  );

  return (
    <div className="space-y-6">
      {/* Journey Summary Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 flex items-center justify-center">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {train.name} (#{train.number})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {train.type} • {getClassName(classType)} • {getQuotaName(quota)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-accent-500" />
            <span>{formatDate(journeyDate)}</span>
          </div>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-5">
            <p className="text-xl font-black text-slate-900 dark:text-white">
              {sourceStop.departureTime}
            </p>
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
              {sourceStop.stationName} ({sourceStop.stationCode})
            </p>
          </div>

          <div className="sm:col-span-2 flex justify-center text-slate-400">
            <ArrowRight className="w-5 h-5" />
          </div>

          <div className="sm:col-span-5 text-left sm:text-right">
            <p className="text-xl font-black text-slate-900 dark:text-white">
              {destStop.arrivalTime}
            </p>
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
              {destStop.stationName} ({destStop.stationCode})
            </p>
          </div>
        </div>
      </div>

      {/* Passengers Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-primary-600" />
          <span>Passenger Details ({passengers.length})</span>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold text-[11px]">
                <th className="pb-2">#</th>
                <th className="pb-2">Name</th>
                <th className="pb-2">Age / Gender</th>
                <th className="pb-2">Berth Choice</th>
                <th className="pb-2">Nationality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {passengers.map((p, idx) => (
                <tr key={idx} className="py-2.5">
                  <td className="py-2.5 font-bold text-primary-600">{idx + 1}</td>
                  <td className="py-2.5 font-semibold text-slate-900 dark:text-white">{p.name}</td>
                  <td className="py-2.5">
                    {p.age} yrs • {p.gender}
                  </td>
                  <td className="py-2.5">{getBerthName(p.berthPreference)}</td>
                  <td className="py-2.5">{p.nationality}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {autoUpgrade && (
          <div className="pt-2 flex items-center gap-2 text-xs text-success-600 dark:text-success-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Auto-Upgrade option opted: Yes</span>
          </div>
        )}
      </div>

      {/* Itemized Fare Summary */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Fare Summary</h4>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
          <div className="py-2 flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">
              Ticket Base Fare ({passengers.length} passenger{passengers.length > 1 ? 's' : ''})
            </span>
            <span className="font-semibold">{formatCurrency(fareBreakdown.baseFare)}</span>
          </div>
          <div className="py-2 flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Reservation Fees</span>
            <span className="font-semibold">{formatCurrency(fareBreakdown.reservationCharge)}</span>
          </div>
          {fareBreakdown.superfastCharge > 0 && (
            <div className="py-2 flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Superfast Surcharge</span>
              <span className="font-semibold">{formatCurrency(fareBreakdown.superfastCharge)}</span>
            </div>
          )}
          {fareBreakdown.tatkalCharge > 0 && (
            <div className="py-2 flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Tatkal Surcharge</span>
              <span className="font-semibold">{formatCurrency(fareBreakdown.tatkalCharge)}</span>
            </div>
          )}
          {fareBreakdown.gst > 0 && (
            <div className="py-2 flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Goods and Services Tax (5% GST)</span>
              <span className="font-semibold">{formatCurrency(fareBreakdown.gst)}</span>
            </div>
          )}
          <div className="pt-3 flex justify-between text-base font-extrabold text-primary-600 dark:text-primary-400">
            <span>Total Payable Amount</span>
            <span>{formatCurrency(fareBreakdown.totalFare)}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button type="button" variant="outline" size="md" onClick={onBack} disabled={isLoading}>
          Edit Passengers
        </Button>
        <div className="flex flex-col sm:items-end gap-1">
          <Button
            type="button"
            variant="accent"
            size="lg"
            onClick={onProceedToPayment}
            isLoading={isLoading}
            leftIcon={user ? <CreditCard className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            className="shadow-md shadow-accent-500/20"
          >
            {user
              ? `Pay ${formatCurrency(fareBreakdown.totalFare)}`
              : `Sign In & Pay ${formatCurrency(fareBreakdown.totalFare)}`}
          </Button>
          {!user && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center sm:text-right">
              Sign in is required to generate PNR. Your passenger data is saved.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
