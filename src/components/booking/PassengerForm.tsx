import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Bookmark, Sparkles, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { Passenger, SavedPassenger, Gender, BerthPreference } from '../../types';
import { getSavedPassengers, createSavedPassenger } from '../../services/authService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';

export interface PassengerFormProps {
  passengers: Passenger[];
  onChange: (passengers: Passenger[]) => void;
  autoUpgrade: boolean;
  onAutoUpgradeChange: (enabled: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export const PassengerForm: React.FC<PassengerFormProps> = ({
  passengers,
  onChange,
  autoUpgrade,
  onAutoUpgradeChange,
  onNext,
  onBack,
}) => {
  const [savedList, setSavedList] = useState<SavedPassenger[]>([]);
  const [saveToMaster, setSaveToMaster] = useState<boolean[]>([]);

  useEffect(() => {
    const fetchMasterList = async () => {
      const res = await getSavedPassengers();
      if (res.success && res.data) {
        setSavedList(res.data);
      }
    };
    fetchMasterList();
  }, []);

  // Initialize at least 1 passenger if empty
  useEffect(() => {
    if (passengers.length === 0) {
      onChange([
        {
          name: '',
          age: 30,
          gender: 'MALE',
          berthPreference: 'NO_PREF',
          nationality: 'Indian',
        },
      ]);
      setSaveToMaster([false]);
    } else if (saveToMaster.length !== passengers.length) {
      setSaveToMaster(passengers.map(() => false));
    }
  }, [passengers, onChange, saveToMaster.length]);

  const addPassenger = () => {
    if (passengers.length >= 6) {
      toast.error('Maximum 6 passengers allowed per booking by Indian Railways');
      return;
    }
    onChange([
      ...passengers,
      {
        name: '',
        age: 30,
        gender: 'MALE',
        berthPreference: 'NO_PREF',
        nationality: 'Indian',
      },
    ]);
    setSaveToMaster([...saveToMaster, false]);
  };

  const removePassenger = (index: number) => {
    if (passengers.length <= 1) {
      toast.error('At least 1 passenger is required');
      return;
    }
    const updated = passengers.filter((_, i) => i !== index);
    const updatedSave = saveToMaster.filter((_, i) => i !== index);
    onChange(updated);
    setSaveToMaster(updatedSave);
  };

  const updatePassenger = <K extends keyof Passenger>(
    index: number,
    field: K,
    value: Passenger[K]
  ) => {
    const updated = [...passengers];
    updated[index] = {
      ...updated[index],
      [field]: field === 'age' ? ((parseInt(String(value), 10) || 0) as Passenger[K]) : value,
    };
    onChange(updated);
  };

  const selectFromMasterList = (index: number, saved: SavedPassenger) => {
    const updated = [...passengers];
    updated[index] = {
      name: saved.name,
      age: saved.age,
      gender: saved.gender,
      berthPreference: saved.berthPreference,
      nationality: saved.nationality,
    };
    onChange(updated);
    toast.success(`Loaded details for ${saved.name}`);
  };

  const handleProceed = async () => {
    // Validation
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name.trim() || p.name.trim().length < 2) {
        toast.error(`Please enter a valid name for Passenger ${i + 1}`);
        return;
      }
      if (p.age < 1 || p.age > 120) {
        toast.error(`Please enter a valid age (1-120) for Passenger ${i + 1}`);
        return;
      }
    }

    // Save checked passengers to Master List asynchronously
    passengers.forEach(async (p, idx) => {
      if (saveToMaster[idx] && p.name.trim()) {
        await createSavedPassenger(p);
      }
    });

    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Informational Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 text-xs sm:text-sm text-primary-900 dark:text-primary-200">
        <Info className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Railway Passenger Guidelines:</p>
          <p className="text-primary-800 dark:text-primary-300">
            • Maximum 6 passengers per ticket. Senior citizens (Age 60+) are given priority for Lower Berth.
          </p>
          <p className="text-primary-800 dark:text-primary-300">
            • Children below 5 years travel free without a berth. Valid government photo ID is mandatory during travel.
          </p>
        </div>
      </div>

      {/* Passenger Cards */}
      <div className="space-y-4">
        {passengers.map((passenger, index) => (
          <div
            key={index}
            className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center">
                  {index + 1}
                </span>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Passenger {index + 1}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                {/* Pick from Master List Dropdown */}
                {savedList.length > 0 && (
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        const selected = savedList.find((s) => s.id === e.target.value);
                        if (selected) selectFromMasterList(index, selected);
                      }}
                      defaultValue=""
                      className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg border-none focus:ring-1 focus:ring-primary-500 font-medium"
                    >
                      <option value="" disabled>
                        📋 Pick from Master List
                      </option>
                      {savedList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.age}y, {s.gender})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {passengers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePassenger(index)}
                    className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950/40 rounded-lg transition"
                    title="Remove Passenger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Inputs: Name, Age, Gender, Berth */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-5">
                <Input
                  label="Full Name (as per Govt ID)"
                  placeholder="e.g. Satya Gopal"
                  value={passenger.name}
                  onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Age"
                  type="number"
                  min={1}
                  max={120}
                  value={passenger.age}
                  onChange={(e) => updatePassenger(index, 'age', parseInt(e.target.value, 10) || 0)}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <Select
                  label="Gender"
                  value={passenger.gender}
                  onChange={(e) => updatePassenger(index, 'gender', e.target.value as Gender)}
                  options={[
                    { label: 'Male', value: 'MALE' },
                    { label: 'Female', value: 'FEMALE' },
                    { label: 'Transgender', value: 'TRANSGENDER' },
                  ]}
                />
              </div>

              <div className="sm:col-span-3">
                <Select
                  label="Berth Preference"
                  value={passenger.berthPreference}
                  onChange={(e) =>
                    updatePassenger(index, 'berthPreference', e.target.value as BerthPreference)
                  }
                  options={[
                    { label: 'No Preference', value: 'NO_PREF' },
                    { label: 'Lower Berth', value: 'LOWER' },
                    { label: 'Middle Berth', value: 'MIDDLE' },
                    { label: 'Upper Berth', value: 'UPPER' },
                    { label: 'Side Lower', value: 'SIDE_LOWER' },
                    { label: 'Side Upper', value: 'SIDE_UPPER' },
                    { label: 'Window Seat', value: 'WINDOW' },
                  ]}
                />
              </div>
            </div>

            {/* Checkbox: Save to Master List */}
            <div className="pt-1 flex items-center justify-between">
              <Checkbox
                label={
                  <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <Bookmark className="w-3.5 h-3.5 text-accent-500" />
                    Save this passenger to my Master List for future one-click bookings
                  </span>
                }
                checked={saveToMaster[index] || false}
                onChange={(e) => {
                  const copy = [...saveToMaster];
                  copy[index] = e.target.checked;
                  setSaveToMaster(copy);
                }}
              />

              {passenger.age >= 60 && (
                <span className="text-[11px] font-bold text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Senior Citizen Berth Priority
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Passenger CTA */}
      {passengers.length < 6 && (
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={addPassenger}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full border-dashed border-2 py-3.5 font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-950/30"
        >
          Add Another Passenger ({passengers.length} of 6 added)
        </Button>
      )}

      {/* Auto-Upgrade Policy */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
        <Checkbox
          label={
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Consider for Auto-Upgrade (Free of Cost)
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                If eligible, Indian Railways may automatically upgrade your berths to higher AC classes (e.g. SL to 3A, or 3A to 2A) during chart preparation at zero extra charge.
              </p>
            </div>
          }
          checked={autoUpgrade}
          onChange={(e) => onAutoUpgradeChange(e.target.checked)}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button type="button" variant="outline" size="md" onClick={onBack}>
          Back to Trains
        </Button>
        <Button type="button" variant="primary" size="md" onClick={handleProceed}>
          Proceed to Review
        </Button>
      </div>
    </div>
  );
};
