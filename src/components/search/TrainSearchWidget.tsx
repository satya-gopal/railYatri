import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Calendar, Layers, ShieldCheck, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Station, ClassType, Quota } from '../../types';
import { getStations } from '../../services/trainService';
import { Autocomplete, AutocompleteItem } from '../ui/Autocomplete';
import { Button } from '../ui/Button';

export interface TrainSearchWidgetProps {
  initialSource?: string;
  initialDestination?: string;
  initialDate?: string;
  initialClassType?: ClassType | '';
  initialQuota?: Quota;
  compact?: boolean;
}

function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function getMaxDateStr() {
  const d = new Date();
  d.setDate(d.getDate() + 120);
  return d.toISOString().split('T')[0];
}

function getMinDateStr() {
  return new Date().toISOString().split('T')[0];
}

export const TrainSearchWidget: React.FC<TrainSearchWidgetProps> = ({
  initialSource = 'NDLS',
  initialDestination = 'BCT',
  initialDate,
  initialClassType = '',
  initialQuota = 'GN',
  compact = false,
}) => {
  const navigate = useNavigate();
  const [stations, setStations] = useState<Station[]>([]);

  const [sourceCode, setSourceCode] = useState(initialSource);
  const [destCode, setDestCode] = useState(initialDestination);
  const [journeyDate, setJourneyDate] = useState(() => initialDate || getTomorrowStr());
  const [classType, setClassType] = useState<string>(initialClassType);
  const [quota, setQuota] = useState<Quota>(initialQuota);
  const [errors, setErrors] = useState<{ source?: string; dest?: string; date?: string }>({});

  useEffect(() => {
    const fetchStations = async () => {
      const res = await getStations();
      if (res.success && res.data) {
        setStations(res.data);
      }
    };
    fetchStations();
  }, []);

  const autocompleteItems: AutocompleteItem[] = stations.map((s) => ({
    id: s.code,
    title: s.name,
    subtitle: `${s.city}, ${s.state}`,
    tag: s.code,
  }));

  const handleSwap = () => {
    const temp = sourceCode;
    setSourceCode(destCode);
    setDestCode(temp);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { source?: string; dest?: string; date?: string } = {};

    if (!sourceCode) newErrors.source = 'Please select origin station';
    if (!destCode) newErrors.dest = 'Please select destination station';
    if (sourceCode && destCode && sourceCode === destCode) {
      newErrors.dest = 'Source and destination cannot be identical';
    }
    if (!journeyDate) newErrors.date = 'Please select travel date';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please resolve form errors before searching');
      return;
    }

    setErrors({});
    const params = new URLSearchParams({
      source: sourceCode,
      destination: destCode,
      date: journeyDate,
      quota,
    });
    if (classType) params.append('classType', classType);

    navigate(`/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className={`w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl transition-all ${compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'
        }`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Source Station */}
        <div className="lg:col-span-3">
          <Autocomplete
            label="Origin Station"
            placeholder="Search Station / Code"
            items={autocompleteItems}
            value={sourceCode}
            onChange={(item) => {
              setSourceCode(item.id);
              setErrors((e) => ({ ...e, source: undefined }));
            }}
            error={errors.source}
          />
        </div>

        {/* Swap Button */}
        <div className="lg:col-span-1 flex justify-center py-1 lg:py-0">
          <button
            type="button"
            onClick={handleSwap}
            title="Swap Origin and Destination"
            className="p-3 rounded-full bg-slate-100 hover:bg-primary-50 hover:text-primary-600 dark:bg-slate-800 dark:hover:bg-primary-950/60 dark:hover:text-primary-400 text-slate-600 dark:text-slate-300 transition-all shadow-subtle hover:rotate-180 duration-300"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* Destination Station */}
        <div className="lg:col-span-3">
          <Autocomplete
            label="Destination Station"
            placeholder="Search Station / Code"
            items={autocompleteItems}
            value={destCode}
            onChange={(item) => {
              setDestCode(item.id);
              setErrors((e) => ({ ...e, dest: undefined }));
            }}
            error={errors.dest}
          />
        </div>

        {/* Journey Date */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
            Date of Journey
          </label>
          <div className="relative">
            <input
              type="date"
              value={journeyDate}
              min={getMinDateStr()}
              max={getMaxDateStr()}
              onChange={(e) => {
                setJourneyDate(e.target.value);
                setErrors((er) => ({ ...er, date: undefined }));
              }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {/* <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Calendar className="w-4 h-4" />
            </div> */}
          </div>
          {errors.date && <p className="mt-1 text-xs text-danger-500">{errors.date}</p>}
        </div>

        {/* Class Filter */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Class</span>
            </label>
            <select
              value={classType}
              onChange={(e) => setClassType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            >
              <option value="">All Classes</option>
              <option value="1A">AC First (1A)</option>
              <option value="2A">AC 2 Tier (2A)</option>
              <option value="3A">AC 3 Tier (3A)</option>
              <option value="CC">AC Chair Car (CC)</option>
              <option value="SL">Sleeper (SL)</option>
              <option value="2S">Second Sitting (2S)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Quota</span>
            </label>
            <select
              value={quota}
              onChange={(e) => setQuota(e.target.value as Quota)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            >
              <option value="GN">General (GN)</option>
              <option value="TQ">Tatkal (TQ)</option>
              <option value="LD">Ladies (LD)</option>
              <option value="SS">Sr. Citizen (SS)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submit Search */}
      <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success-500 inline-block" />
            Live Seat Allocation
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-500 inline-block" />
            120-Day Advance Booking
          </span>
        </div>

        <Button
          type="submit"
          variant="accent"
          size="lg"
          leftIcon={<Search className="w-5 h-5" />}
          className="ml-auto w-full sm:w-auto shadow-md shadow-accent-500/20"
        >
          Search Trains
        </Button>
      </div>
    </form>
  );
};
