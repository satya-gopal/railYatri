import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Filter,
  ArrowUpDown,
  Train as TrainIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { ClassType, Quota, TrainType } from '../types';
import { searchTrains, TrainSearchResult } from '../services/trainService';
import { TrainSearchWidget } from '../components/search/TrainSearchWidget';
import { TrainResultCard } from '../components/search/TrainResultCard';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

export const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const source = searchParams.get('source') || 'NDLS';
  const destination = searchParams.get('destination') || 'BCT';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const initialClass = (searchParams.get('classType') as ClassType) || undefined;
  const quota = (searchParams.get('quota') as Quota) || 'GN';

  // Filters State
  const [selectedTrainTypes, setSelectedTrainTypes] = useState<TrainType[]>([]);
  const [selectedDepartureSlots, setSelectedDepartureSlots] = useState<
    ('early_morning' | 'morning' | 'afternoon' | 'night')[]
  >([]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'departure' | 'duration' | 'fare'>('departure');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Search Results State
  const [results, setResults] = useState<TrainSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await searchTrains({
          source,
          destination,
          date,
          classType: initialClass,
          quota,
          trainTypes: selectedTrainTypes.length > 0 ? selectedTrainTypes : undefined,
          departureSlots: selectedDepartureSlots.length > 0 ? selectedDepartureSlots : undefined,
          availableOnly,
          sortBy,
        });

        if (res.success && res.data) {
          setResults(res.data);
        } else {
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [
    source,
    destination,
    date,
    initialClass,
    quota,
    selectedTrainTypes,
    selectedDepartureSlots,
    availableOnly,
    sortBy,
  ]);

  const toggleTrainType = (type: TrainType) => {
    if (selectedTrainTypes.includes(type)) {
      setSelectedTrainTypes(selectedTrainTypes.filter((t) => t !== type));
    } else {
      setSelectedTrainTypes([...selectedTrainTypes, type]);
    }
  };

  const toggleDepartureSlot = (slot: 'early_morning' | 'morning' | 'afternoon' | 'night') => {
    if (selectedDepartureSlots.includes(slot)) {
      setSelectedDepartureSlots(selectedDepartureSlots.filter((s) => s !== slot));
    } else {
      setSelectedDepartureSlots([...selectedDepartureSlots, slot]);
    }
  };

  const resetFilters = () => {
    setSelectedTrainTypes([]);
    setSelectedDepartureSlots([]);
    setAvailableOnly(false);
    setSortBy('departure');
  };

  const trainTypesList: TrainType[] = [
    'Rajdhani',
    'Vande Bharat',
    'Shatabdi',
    'Duronto',
    'Superfast',
    'Express',
  ];

  const departureSlotsList = [
    { id: 'early_morning', label: 'Early Morning (00:00 - 06:00)' },
    { id: 'morning', label: 'Morning (06:00 - 12:00)' },
    { id: 'afternoon', label: 'Midday / Afternoon (12:00 - 18:00)' },
    { id: 'night', label: 'Night (18:00 - 24:00)' },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Search Modify Widget */}
      <div className="no-print">
        <TrainSearchWidget
          initialSource={source}
          initialDestination={destination}
          initialDate={date}
          initialClassType={initialClass || ''}
          initialQuota={quota}
          compact
        />
      </div>

      {/* Main Grid: Filters + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
          >
            Filters ({selectedTrainTypes.length + selectedDepartureSlots.length + (availableOnly ? 1 : 0)})
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'departure' | 'duration' | 'fare')}
              className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5"
            >
              <option value="departure">Departure Time</option>
              <option value="duration">Fastest Duration</option>
              <option value="fare">Lowest Fare</option>
            </select>
          </div>
        </div>

        {/* Sidebar Filters Desktop & Mobile Drawer */}
        <aside
          className={`lg:col-span-3 space-y-6 ${
            isMobileFiltersOpen ? 'block' : 'hidden lg:block'
          } p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Filters</h3>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
            >
              Reset
            </button>
          </div>

          {/* Available Seats Only Toggle */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Available Seats Only (AVL)</span>
            </label>
          </div>

          {/* Departure Time Slots */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Departure Time Slot
            </h4>
            <div className="space-y-2">
              {departureSlotsList.map((slot) => {
                const isChecked = selectedDepartureSlots.includes(slot.id);
                return (
                  <label
                    key={slot.id}
                    className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium hover:text-primary-600"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDepartureSlot(slot.id)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>{slot.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Train Types */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Train Category
            </h4>
            <div className="space-y-2">
              {trainTypesList.map((tType) => {
                const isChecked = selectedTrainTypes.includes(tType);
                return (
                  <label
                    key={tType}
                    className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium hover:text-primary-600"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleTrainType(tType)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>{tType}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Results Stream */}
        <main className="lg:col-span-9 space-y-4">
          {/* Header Strip with Result Count & Desktop Sort */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                Trains from {source} to {destination}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isLoading ? 'Searching railway schedules...' : `${results.length} trains running on selected date`}
              </p>
            </div>

            {/* Desktop Sort Options */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold">
              <span className="text-slate-400 mr-1 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort by:
              </span>
              <button
                type="button"
                onClick={() => setSortBy('departure')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  sortBy === 'departure'
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 font-bold'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                Departure
              </button>
              <button
                type="button"
                onClick={() => setSortBy('duration')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  sortBy === 'duration'
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 font-bold'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                Duration
              </button>
              <button
                type="button"
                onClick={() => setSortBy('fare')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  sortBy === 'fare'
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 font-bold'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                Lowest Fare
              </button>
            </div>
          </div>

          {/* Skeletons when Loading */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search Result Cards */}
          {!isLoading && results.length > 0 && (
            <div className="space-y-4">
              {results.map((res) => (
                <TrainResultCard
                  key={res.train.id}
                  result={res}
                  journeyDate={date}
                  selectedQuota={quota}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && results.length === 0 && (
            <EmptyState
              icon={<TrainIcon className="w-8 h-8" />}
              title="No Trains Running on Selected Corridor & Date"
              description={`We couldn't find any direct train service running between ${source} and ${destination} on ${date} matching your filter criteria.`}
              action={
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="md" onClick={resetFilters}>
                    Clear Applied Filters
                  </Button>
                  <Button variant="primary" size="md" onClick={() => navigate('/')}>
                    Modify Search Stations
                  </Button>
                </div>
              }
            />
          )}
        </main>
      </div>
    </div>
  );
};
