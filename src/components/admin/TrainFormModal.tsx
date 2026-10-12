import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Train, TrainType, ClassType, TrainStop } from '../../types';
import { createTrain, updateTrain } from '../../services/trainService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';

export interface TrainFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainToEdit?: Train | null;
  onSaved: () => void;
}

export const TrainFormModal: React.FC<TrainFormModalProps> = ({
  isOpen,
  onClose,
  trainToEdit,
  onSaved,
}) => {
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<TrainType>('Superfast');
  const [sourceStation, setSourceStation] = useState('NDLS');
  const [destStation, setDestStation] = useState('BCT');
  const [hasPantry, setHasPantry] = useState(true);
  const [runningDays, setRunningDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  // Stops state
  const [stops, setStops] = useState<TrainStop[]>([
    {
      stopNumber: 1,
      stationCode: 'NDLS',
      stationName: 'New Delhi',
      arrivalTime: '06:00',
      departureTime: '06:00',
      day: 1,
      distanceKm: 0,
      haltMinutes: 0,
    },
    {
      stopNumber: 2,
      stationCode: 'BCT',
      stationName: 'Mumbai Central',
      arrivalTime: '21:30',
      departureTime: '21:30',
      day: 1,
      distanceKm: 1386,
      haltMinutes: 0,
    },
  ]);

  // Classes state
  const [classesConfig, setClassesConfig] = useState<
    Record<ClassType, { enabled: boolean; fare: number; totalSeats: number }>
  >({
    SL: { enabled: true, fare: 650, totalSeats: 360 },
    '3A': { enabled: true, fare: 1750, totalSeats: 180 },
    '2A': { enabled: true, fare: 2550, totalSeats: 64 },
    '1A': { enabled: false, fare: 4200, totalSeats: 24 },
    CC: { enabled: false, fare: 1100, totalSeats: 200 },
    '2S': { enabled: true, fare: 350, totalSeats: 120 },
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (trainToEdit) {
      setNumber(trainToEdit.number);
      setName(trainToEdit.name);
      setType(trainToEdit.type);
      setSourceStation(trainToEdit.sourceStation);
      setDestStation(trainToEdit.destStation);
      setHasPantry(trainToEdit.hasPantry);
      setRunningDays(trainToEdit.runningDays);
      setStops(trainToEdit.stops);

      const newClasses = { ...classesConfig };
      (Object.keys(classesConfig) as ClassType[]).forEach((ct) => {
        if (trainToEdit.classes[ct]) {
          newClasses[ct] = {
            enabled: true,
            fare: trainToEdit.classes[ct]?.fare || 1000,
            totalSeats: trainToEdit.classes[ct]?.totalSeats || 60,
          };
        } else {
          newClasses[ct] = { ...newClasses[ct], enabled: false };
        }
      });
      setClassesConfig(newClasses);
    } else {
      // Reset defaults
      setNumber('');
      setName('');
      setType('Superfast');
      setSourceStation('NDLS');
      setDestStation('BCT');
      setStops([
        {
          stopNumber: 1,
          stationCode: 'NDLS',
          stationName: 'New Delhi',
          arrivalTime: '06:00',
          departureTime: '06:00',
          day: 1,
          distanceKm: 0,
          haltMinutes: 0,
        },
        {
          stopNumber: 2,
          stationCode: 'BCT',
          stationName: 'Mumbai Central',
          arrivalTime: '21:30',
          departureTime: '21:30',
          day: 1,
          distanceKm: 1386,
          haltMinutes: 0,
        },
      ]);
    }
  }, [trainToEdit, isOpen]);

  const addStop = () => {
    const nextNum = stops.length + 1;
    setStops([
      ...stops,
      {
        stopNumber: nextNum,
        stationCode: '',
        stationName: '',
        arrivalTime: '12:00',
        departureTime: '12:05',
        day: 1,
        distanceKm: 500,
        haltMinutes: 5,
      },
    ]);
  };

  const removeStop = (idx: number) => {
    if (stops.length <= 2) {
      toast.error('Train route must have at least source and destination stops');
      return;
    }
    const filtered = stops.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stopNumber: i + 1 }));
    setStops(filtered);
  };

  const toggleDay = (day: number) => {
    if (runningDays.includes(day)) {
      if (runningDays.length <= 1) {
        toast.error('Train must run on at least one day');
        return;
      }
      setRunningDays(runningDays.filter((d) => d !== day));
    } else {
      setRunningDays([...runningDays, day].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!/^\d{5}$/.test(number.trim())) {
      toast.error('Train number must be exactly 5 digits');
      return;
    }
    if (!name.trim()) {
      toast.error('Please enter a train name');
      return;
    }

    // Build classes map
    const finalClasses: Train['classes'] = {};
    let hasAnyClass = false;
    (Object.keys(classesConfig) as ClassType[]).forEach((ct) => {
      if (classesConfig[ct].enabled) {
        hasAnyClass = true;
        finalClasses[ct] = {
          fare: classesConfig[ct].fare,
          totalSeats: classesConfig[ct].totalSeats,
          available: true,
        };
      }
    });

    if (!hasAnyClass) {
      toast.error('Please enable at least one travel class');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading(trainToEdit ? 'Updating train route...' : 'Adding train route...');

    try {
      const trainPayload = {
        number: number.trim(),
        name: name.trim(),
        type,
        sourceStation: stops[0].stationCode || sourceStation,
        destStation: stops[stops.length - 1].stationCode || destStation,
        runningDays,
        hasPantry,
        stops,
        classes: finalClasses,
      };

      let res;
      if (trainToEdit) {
        res = await updateTrain(trainToEdit.id, trainPayload);
      } else {
        res = await createTrain(trainPayload);
      }

      if (res.success) {
        toast.success(res.message || 'Saved train route successfully', { id: toastId });
        onSaved();
        onClose();
      } else {
        toast.error(res.error || 'Failed to save train', { id: toastId });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={trainToEdit ? `Edit Train #${trainToEdit.number}` : 'Add New Train & Route'}
      description="Define train schedule, intermediate halts, running days, and class fares. Newly added trains appear instantly in user search."
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
        {/* Basic Train Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Train Number (5 digits)"
            placeholder="12953"
            value={number}
            maxLength={5}
            onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))}
            required
          />

          <div className="sm:col-span-2">
            <Input
              label="Train Name"
              placeholder="August Kranti Rajdhani"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Train Service Category"
            value={type}
            onChange={(e) => setType(e.target.value as TrainType)}
            options={[
              { label: 'Rajdhani Express', value: 'Rajdhani' },
              { label: 'Shatabdi Express', value: 'Shatabdi' },
              { label: 'Vande Bharat Express', value: 'Vande Bharat' },
              { label: 'Duronto Express', value: 'Duronto' },
              { label: 'Superfast Express', value: 'Superfast' },
              { label: 'Express', value: 'Express' },
              { label: 'Garib Rath', value: 'Garib Rath' },
            ]}
          />

          <div className="flex items-center h-full pt-6">
            <Checkbox
              label="Has On-Board Pantry Car"
              checked={hasPantry}
              onChange={(e) => setHasPantry(e.target.checked)}
            />
          </div>
        </div>

        {/* Running Days */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
            Operational Days of Week
          </label>
          <div className="flex flex-wrap gap-2">
            {dayLabels.map((d, idx) => {
              const isSelected = runningDays.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stops & Schedule */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Route Stops & Halts ({stops.length} stations)
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStop}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Halt
            </Button>
          </div>

          <div className="space-y-2">
            {stops.map((stop, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex flex-wrap items-center gap-2 text-xs"
              >
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>

                <input
                  type="text"
                  placeholder="Code (e.g. NDLS)"
                  value={stop.stationCode}
                  onChange={(e) => {
                    const copy = [...stops];
                    copy[idx].stationCode = e.target.value.toUpperCase();
                    setStops(copy);
                  }}
                  className="w-24 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 uppercase font-mono font-bold"
                  required
                />

                <input
                  type="text"
                  placeholder="Station Name"
                  value={stop.stationName}
                  onChange={(e) => {
                    const copy = [...stops];
                    copy[idx].stationName = e.target.value;
                    setStops(copy);
                  }}
                  className="flex-1 min-w-[140px] px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700"
                  required
                />

                <div className="flex items-center gap-1">
                  <span>Arr:</span>
                  <input
                    type="time"
                    value={stop.arrivalTime}
                    onChange={(e) => {
                      const copy = [...stops];
                      copy[idx].arrivalTime = e.target.value;
                      setStops(copy);
                    }}
                    className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span>Dep:</span>
                  <input
                    type="time"
                    value={stop.departureTime}
                    onChange={(e) => {
                      const copy = [...stops];
                      copy[idx].departureTime = e.target.value;
                      setStops(copy);
                    }}
                    className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span>Km:</span>
                  <input
                    type="number"
                    value={stop.distanceKm}
                    onChange={(e) => {
                      const copy = [...stops];
                      copy[idx].distanceKm = parseInt(e.target.value, 10) || 0;
                      setStops(copy);
                    }}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700"
                  />
                </div>

                {stops.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeStop(idx)}
                    className="p-1 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950/40 rounded ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Classes & Seat Configuration */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Classes Offered & Fares
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(classesConfig) as ClassType[]).map((ct) => {
              const cfg = classesConfig[ct];
              return (
                <div
                  key={ct}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    cfg.enabled
                      ? 'border-primary-400 bg-primary-50/30 dark:bg-primary-950/20'
                      : 'border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={cfg.enabled}
                      onChange={(e) => {
                        setClassesConfig({
                          ...classesConfig,
                          [ct]: { ...cfg, enabled: e.target.checked },
                        });
                      }}
                      className="rounded border-slate-300 text-primary-600"
                    />
                    <span>{ct}</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span>₹</span>
                      <input
                        type="number"
                        disabled={!cfg.enabled}
                        value={cfg.fare}
                        onChange={(e) => {
                          setClassesConfig({
                            ...classesConfig,
                            [ct]: { ...cfg, fare: parseInt(e.target.value, 10) || 0 },
                          });
                        }}
                        className="w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span>Seats:</span>
                      <input
                        type="number"
                        disabled={!cfg.enabled}
                        value={cfg.totalSeats}
                        onChange={(e) => {
                          setClassesConfig({
                            ...classesConfig,
                            [ct]: { ...cfg, totalSeats: parseInt(e.target.value, 10) || 0 },
                          });
                        }}
                        className="w-16 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
            {trainToEdit ? 'Save Changes' : 'Create Train Route'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
