import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  RotateCw,
  Utensils,
  ChevronRight,
  Info,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ClassType, Quota, Availability } from '../../types';
import { TrainSearchResult, checkAvailability } from '../../services/trainService';
import { useBooking } from '../../context/BookingContext';
import { formatCurrency, getClassName } from '../../utils/formatters';
import { calculateFare } from '../../utils/fare';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

export interface TrainResultCardProps {
  result: TrainSearchResult;
  journeyDate: string;
  selectedQuota: Quota;
}

export const TrainResultCard: React.FC<TrainResultCardProps> = ({
  result,
  journeyDate,
  selectedQuota,
}) => {
  const navigate = useNavigate();
  const { setTrainSelection } = useBooking();

  const [selectedClassType, setSelectedClassType] = useState<ClassType>(
    result.availableClasses[0]?.classType || '3A'
  );
  const [classAvailabilities, setClassAvailabilities] = useState<Record<string, Availability>>(() => {
    const map: Record<string, Availability> = {};
    result.availableClasses.forEach((c) => {
      map[c.classType] = c.availability;
    });
    return map;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFareModalOpen, setIsFareModalOpen] = useState(false);

  const currentClassObj = result.availableClasses.find((c) => c.classType === selectedClassType);
  const currentFare = currentClassObj?.fare || 1000;

  const handleRefreshAvailability = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    const toastId = toast.loading(`Refreshing availability for ${selectedClassType}...`);
    try {
      const res = await checkAvailability(
        result.train.number,
        journeyDate,
        selectedClassType,
        selectedQuota
      );
      if (res.success && res.data) {
        setClassAvailabilities((prev) => ({
          ...prev,
          [selectedClassType]: res.data!,
        }));
        toast.success(`Availability updated: ${res.data.status} ${res.data.count}`, { id: toastId });
      } else {
        toast.error('Failed to refresh availability', { id: toastId });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBook = () => {
    setTrainSelection({
      train: result.train,
      sourceStop: result.sourceStop,
      destStop: result.destStop,
      journeyDate,
      classType: selectedClassType,
      quota: selectedQuota,
      fare: currentFare,
    });
    navigate('/booking');
  };

  const fareBreakdown = calculateFare(
    currentFare,
    selectedClassType,
    result.train.type,
    selectedQuota,
    1
  );

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-card transition-all p-5 sm:p-6">
      {/* Header: Train Number, Name, Badges, Pantry */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary-50 dark:bg-primary-950/60 px-3 py-1.5 rounded-xl border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 font-mono font-bold text-sm">
            #{result.train.number}
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <span>{result.train.name}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Runs On:{' '}
              {dayNames.map((d, idx) => (
                <span
                  key={idx}
                  className={`inline-block mx-0.5 px-1 py-0.2 rounded text-[11px] font-bold ${
                    result.train.runningDays.includes(idx)
                      ? 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-950/40'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                >
                  {d}
                </span>
              ))}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="default" size="sm">
            {result.train.type}
          </Badge>
          {result.train.hasPantry && (
            <Badge variant="outline" size="sm" className="hidden sm:inline-flex items-center gap-1">
              <Utensils className="w-3 h-3 text-accent-500" />
              <span>Pantry</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Middle: Schedule, Stations, Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center py-5 border-b border-slate-100 dark:border-slate-800/80">
        {/* Source Stop */}
        <div className="sm:col-span-4">
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {result.sourceStop.departureTime}
          </span>
          <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
            {result.sourceStop.stationName} ({result.sourceStop.stationCode})
          </p>
          <p className="text-xs text-slate-400">Day {result.sourceStop.day}</p>
        </div>

        {/* Duration Arrow */}
        <div className="sm:col-span-4 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{result.duration}</span>
          </div>
          <div className="w-full flex items-center justify-center relative">
            <div className="w-full h-0.5 bg-slate-200 dark:bg-slate-700" />
            <div className="absolute bg-white dark:bg-slate-900 px-2 text-slate-400">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">{result.distanceKm} km</span>
        </div>

        {/* Dest Stop */}
        <div className="sm:col-span-4 text-left sm:text-right">
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {result.destStop.arrivalTime}
          </span>
          <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
            {result.destStop.stationName} ({result.destStop.stationCode})
          </p>
          <p className="text-xs text-slate-400">Day {result.destStop.day}</p>
        </div>
      </div>

      {/* Bottom: Class Selectors & Availability Chips */}
      <div className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Select Class & Availability
          </span>
          <button
            type="button"
            onClick={handleRefreshAvailability}
            disabled={isRefreshing}
            className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Availability</span>
          </button>
        </div>

        {/* Class Chips Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {result.availableClasses.map((c) => {
            const isSelected = selectedClassType === c.classType;
            const avail = classAvailabilities[c.classType] || c.availability;

            const isAvailable = avail.status === 'AVAILABLE';
            const isRac = avail.status === 'RAC';

            return (
              <button
                key={c.classType}
                type="button"
                onClick={() => setSelectedClassType(c.classType)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 ring-2 ring-primary-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {c.classType}
                  </span>
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    {formatCurrency(c.fare)}
                  </span>
                </div>
                <div className="text-[11px] font-bold">
                  {isAvailable && (
                    <span className="text-success-600 dark:text-success-400">
                      AVL {avail.count}
                    </span>
                  )}
                  {isRac && (
                    <span className="text-warning-600 dark:text-warning-400">
                      RAC {avail.count}
                    </span>
                  )}
                  {!isAvailable && !isRac && (
                    <span className="text-danger-600 dark:text-danger-400">
                      WL {avail.count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selection Summary and CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {getClassName(selectedClassType)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsFareModalOpen(true)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 inline-flex items-center"
                  title="View Fare Breakdown"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(fareBreakdown.totalFare)}
                </span>
                <span className="text-xs text-slate-400 font-medium">per passenger (incl. GST)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFareModalOpen(true)}
              className="hidden sm:inline-flex"
            >
              Fare Breakdown
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleBook}
              rightIcon={<ChevronRight className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Book Now
            </Button>
          </div>
        </div>
      </div>

      {/* Fare Breakdown Modal */}
      <Modal
        isOpen={isFareModalOpen}
        onClose={() => setIsFareModalOpen(false)}
        title="Fare Summary & Tax Breakdown"
        description={`${result.train.name} (${result.train.number}) • ${getClassName(selectedClassType)}`}
      >
        <div className="space-y-4">
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Base Railway Fare</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(fareBreakdown.baseFare)}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Reservation Charge</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(fareBreakdown.reservationCharge)}
              </span>
            </div>
            {fareBreakdown.superfastCharge > 0 && (
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Superfast Surcharge</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(fareBreakdown.superfastCharge)}
                </span>
              </div>
            )}
            {fareBreakdown.tatkalCharge > 0 && (
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Tatkal Premium Surcharge</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(fareBreakdown.tatkalCharge)}
                </span>
              </div>
            )}
            {fareBreakdown.gst > 0 && (
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Goods & Service Tax (5% GST)</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(fareBreakdown.gst)}
                </span>
              </div>
            )}
            <div className="pt-3 flex justify-between text-base font-extrabold text-primary-600 dark:text-primary-400">
              <span>Total Ticket Amount</span>
              <span>{formatCurrency(fareBreakdown.totalFare)}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="md" onClick={() => setIsFareModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
