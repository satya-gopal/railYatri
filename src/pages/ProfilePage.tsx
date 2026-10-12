import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User as UserIcon,
  Users,
  CreditCard,
  Lock,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  SavedPassenger,
  Passenger,
  PaymentMethod,
  Gender,
  BerthPreference,
} from '../types';
import {
  getSavedPassengers,
  createSavedPassenger,
  updateSavedPassenger,
  deleteSavedPassenger,
  getPaymentMethods,
  saveCardPaymentMethod,
  saveUpiPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
} from '../services/authService';
import { getInitials, getBerthName } from '../utils/formatters';
import { validateLuhn, validateUpiId, detectCardBrand } from '../utils/validators';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, changePassword, resetDemoData } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'profile');

  // Sync active tab whenever the URL ?tab= param changes
  // (e.g. when navigating from navbar dropdown while already on /profile)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'profile';
    if (user?.role === 'admin') {
      setActiveTab('profile');
    } else {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, user?.role]);


  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [gender, setGender] = useState<Gender>(user?.gender || 'MALE');
  const [address, setAddress] = useState(user?.address || '');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Passengers State
  const [passengers, setPassengers] = useState<SavedPassenger[]>([]);
  const [passengerModalOpen, setPassengerModalOpen] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<SavedPassenger | null>(null);
  const [paxName, setPaxName] = useState('');
  const [paxAge, setPaxAge] = useState(30);
  const [paxGender, setPaxGender] = useState<Gender>('MALE');
  const [paxBerth, setPaxBerth] = useState<BerthPreference>('NO_PREF');

  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardHolder, setNewCardHolder] = useState('');
  const [newCardMonth, setNewCardMonth] = useState('12');
  const [newCardYear, setNewCardYear] = useState('28');
  const [newUpiId, setNewUpiId] = useState('');

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setMobile(user.mobile);
      setDob(user.dob || '');
      setGender(user.gender || 'MALE');
      setAddress(user.address || '');
    }
  }, [user]);

  const fetchPassengers = async () => {
    const res = await getSavedPassengers();
    if (res.success && res.data) setPassengers(res.data);
  };

  const fetchPayments = async () => {
    const res = await getPaymentMethods();
    if (res.success && res.data) setPaymentMethods(res.data);
  };

  useEffect(() => {
    fetchPassengers();
    fetchPayments();
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Submit Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ name, mobile, dob, gender, address });
  };

  // Submit Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    const success = await changePassword({
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
    if (success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  // Open Add/Edit Passenger Modal
  const openPassengerModal = (p?: SavedPassenger) => {
    if (p) {
      setEditingPassenger(p);
      setPaxName(p.name);
      setPaxAge(p.age);
      setPaxGender(p.gender);
      setPaxBerth(p.berthPreference);
    } else {
      setEditingPassenger(null);
      setPaxName('');
      setPaxAge(30);
      setPaxGender('MALE');
      setPaxBerth('NO_PREF');
    }
    setPassengerModalOpen(true);
  };

  const handleSavePassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paxName.trim()) {
      toast.error('Passenger name required');
      return;
    }

    const payload: Passenger = {
      name: paxName.trim(),
      age: paxAge,
      gender: paxGender,
      berthPreference: paxBerth,
      nationality: 'Indian',
    };

    if (editingPassenger) {
      const res = await updateSavedPassenger(editingPassenger.id, payload);
      if (res.success) toast.success('Passenger details updated');
    } else {
      const res = await createSavedPassenger(payload);
      if (res.success) toast.success('Passenger saved to master list');
    }

    setPassengerModalOpen(false);
    fetchPassengers();
  };

  const handleDeletePassenger = async (id: string) => {
    await deleteSavedPassenger(id);
    toast.success('Passenger removed');
    fetchPassengers();
  };

  // Payment Methods Handlers
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLuhn(newCardNumber.replace(/\s+/g, ''))) {
      toast.error('Invalid card number (Luhn check failed)');
      return;
    }
    if (!newCardHolder.trim()) {
      toast.error('Cardholder name required');
      return;
    }

    const res = await saveCardPaymentMethod({
      cardNumber: newCardNumber,
      cardHolderName: newCardHolder,
      expiryMonth: newCardMonth,
      expiryYear: newCardYear,
    });

    if (res.success) {
      toast.success('Card saved securely');
      setCardModalOpen(false);
      setNewCardNumber('');
      setNewCardHolder('');
      fetchPayments();
    }
  };

  const handleAddUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUpiId(newUpiId.trim())) {
      toast.error('Invalid UPI format (e.g. name@oksbi)');
      return;
    }

    const res = await saveUpiPaymentMethod(newUpiId.trim());
    if (res.success) {
      toast.success('UPI ID saved');
      setUpiModalOpen(false);
      setNewUpiId('');
      fetchPayments();
    }
  };

  const handleDeletePayment = async (id: string) => {
    await deletePaymentMethod(id);
    toast.success('Payment method removed');
    fetchPayments();
  };

  const handleSetDefaultPayment = async (id: string) => {
    await setDefaultPaymentMethod(id);
    toast.success('Default payment method updated');
    fetchPayments();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Profile Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-700 to-accent-500 text-white font-black text-2xl flex items-center justify-center shadow-lg">
          {getInitials(user?.name || '')}
        </div>

        <div className="text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {user?.name}
            </h1>
            <Badge variant="default" size="sm" className="uppercase font-bold">
              {user?.role}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {user?.email} • +91 {user?.mobile}
          </p>
        </div>

        <div className="sm:ml-auto">
          {user?.role === "admin" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetModalOpen(true)}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-accent-500" />}
            >
              Reset Demo Data
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {user?.role !== 'admin' && (
        <Tabs
          tabs={[
            { id: 'profile', label: 'Profile & Security', icon: <UserIcon className="w-4 h-4" /> },
            { id: 'passengers', label: 'Saved Passengers', icon: <Users className="w-4 h-4" />, count: passengers.length },
            { id: 'payment', label: 'Payment Methods', icon: <CreditCard className="w-4 h-4" />, count: paymentMethods.length },
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
        />
      )}

      {/* TAB 1: Profile & Security */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Edit Profile Details */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-primary-600" />
              <span>Personal Information</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-3.5">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Mobile Number (10 digits)"
                value={mobile}
                maxLength={10}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Date of Birth"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />

                <Select
                  label="Gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  options={[
                    { label: 'Male', value: 'MALE' },
                    { label: 'Female', value: 'FEMALE' },
                    { label: 'Transgender', value: 'TRANSGENDER' },
                  ]}
                />
              </div>

              <Input
                label="Residential Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="City, State"
              />

              <div className="pt-2">
                <Button type="submit" variant="primary" size="md" fullWidth>
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent-600" />
              <span>Change Account Password</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />

              <div className="pt-2">
                <Button type="submit" variant="outline" size="md" fullWidth>
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Saved Passengers */}
      {activeTab === 'passengers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Passenger Master List
              </h3>
              <p className="text-xs text-slate-400">
                Pre-saved passenger profiles for 1-click booking during high-demand Tatkal rush
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openPassengerModal()}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Passenger
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {passengers.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle flex items-start justify-between"
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">{p.name}</h4>
                  <p className="text-xs text-slate-500">
                    {p.age} years • {p.gender} • {p.nationality}
                  </p>
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                    Preference: {getBerthName(p.berthPreference)}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openPassengerModal(p)}
                    className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePassenger(p.id)}
                    className="p-1.5 text-slate-400 hover:text-danger-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Payment Methods */}
      {activeTab === 'payment' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Saved Payment Methods
              </h3>
              <p className="text-xs text-slate-400">
                Cards & UPI IDs for accelerated payment checkout. CVV is never stored.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUpiModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add UPI ID
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCardModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Card
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle flex items-start justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {pm.type}
                    </span>
                    {pm.isDefault && (
                      <span className="text-[11px] font-bold text-success-600 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-success-600" /> Default
                      </span>
                    )}
                  </div>

                  {pm.type === 'CARD' ? (
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">
                        {pm.brand} • {pm.cardNumberMasked}
                      </p>
                      <p className="text-xs text-slate-400">
                        {pm.cardHolderName} • Exp {pm.expiryMonth}/{pm.expiryYear}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{pm.upiId}</p>
                      <p className="text-xs text-slate-400">UPI Handle: @{pm.handle}</p>
                    </div>
                  )}

                  {!pm.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultPayment(pm.id)}
                      className="text-xs font-semibold text-primary-600 hover:underline pt-1 block"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeletePayment(pm.id)}
                  className="p-1.5 text-slate-400 hover:text-danger-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Passenger Modal */}
      <Modal
        isOpen={passengerModalOpen}
        onClose={() => setPassengerModalOpen(false)}
        title={editingPassenger ? 'Edit Passenger' : 'Add Passenger to Master List'}
      >
        <form onSubmit={handleSavePassenger} className="space-y-4">
          <Input
            label="Passenger Name"
            placeholder="Satya Gopal"
            value={paxName}
            onChange={(e) => setPaxName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Age"
              type="number"
              min={1}
              max={120}
              value={paxAge}
              onChange={(e) => setPaxAge(parseInt(e.target.value, 10) || 0)}
              required
            />

            <Select
              label="Gender"
              value={paxGender}
              onChange={(e) => setPaxGender(e.target.value as Gender)}
              options={[
                { label: 'Male', value: 'MALE' },
                { label: 'Female', value: 'FEMALE' },
                { label: 'Transgender', value: 'TRANSGENDER' },
              ]}
            />
          </div>

          <Select
            label="Berth Preference"
            value={paxBerth}
            onChange={(e) => setPaxBerth(e.target.value as BerthPreference)}
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

          <div className="pt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setPassengerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save Passenger
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Card Modal */}
      <Modal
        isOpen={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
        title="Add Credit / Debit Card"
        description="Encrypted and stored with Luhn verification. CVV is never stored."
      >
        <form onSubmit={handleAddCard} className="space-y-4">
          <Input
            label="Card Number"
            placeholder="4111 2222 3333 4444"
            maxLength={19}
            value={newCardNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
              setNewCardNumber(val);
            }}
            rightIcon={
              detectCardBrand(newCardNumber) !== 'OTHER' ? (
                <span className="text-xs font-bold text-primary-600 px-2 py-0.5 rounded bg-primary-50">
                  {detectCardBrand(newCardNumber)}
                </span>
              ) : null
            }
            required
          />

          <Input
            label="Cardholder Name"
            placeholder="Satya Gopal"
            value={newCardHolder}
            onChange={(e) => setNewCardHolder(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Expiry Month"
              value={newCardMonth}
              onChange={(e) => setNewCardMonth(e.target.value)}
              options={Array.from({ length: 12 }, (_, i) => {
                const m = (i + 1).toString().padStart(2, '0');
                return { label: m, value: m };
              })}
            />

            <Select
              label="Expiry Year"
              value={newCardYear}
              onChange={(e) => setNewCardYear(e.target.value)}
              options={['25', '26', '27', '28', '29', '30', '31', '32'].map((y) => ({
                label: `20${y}`,
                value: y,
              }))}
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="outline" size="md" onClick={() => setCardModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save Card
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add UPI Modal */}
      <Modal
        isOpen={upiModalOpen}
        onClose={() => setUpiModalOpen(false)}
        title="Add UPI ID"
        description="Link your Virtual Payment Address (e.g. mobile@upi)"
      >
        <form onSubmit={handleAddUpi} className="space-y-4">
          <Input
            label="UPI ID / VPA"
            placeholder="username@oksbi"
            value={newUpiId}
            onChange={(e) => setNewUpiId(e.target.value)}
            required
          />

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="outline" size="md" onClick={() => setUpiModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save UPI ID
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Simulation Data Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Demo Simulation?"
        description="This will clear your local bookings, added passengers, custom cards, and restore original demo trains and stations."
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to restore factory demo data? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="md" onClick={() => setIsResetModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={async () => {
                setIsResetModalOpen(false);
                await resetDemoData();
              }}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Yes, Reset Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
