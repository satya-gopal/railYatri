import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  QrCode,
  Building,
  Bookmark,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Bug,
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { Booking, PaymentMethod } from '../../types';
import { getPaymentMethods, saveCardPaymentMethod, saveUpiPaymentMethod } from '../../services/authService';
import { processPayment } from '../../services/paymentService';
import { confirmBookingPayment } from '../../services/bookingService';
import { formatCurrency } from '../../utils/formatters';
import { detectCardBrand, validateLuhn, validateUpiId } from '../../utils/validators';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Tabs } from '../ui/Tabs';
import { Spinner } from '../ui/Spinner';
import { QRCodeSVG } from 'qrcode.react';

export interface PaymentGatewayProps {
  booking: Booking;
  onSuccess: (confirmedBooking: Booking) => void;
  onCancel: () => void;
}

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  booking,
  onSuccess,
  onCancel,
}) => {
  // 10-Second Session Timer
  const [timeLeft, setTimeLeft] = useState(10);
  const [isTimerExpired, setIsTimerExpired] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState('card');
  const [savedMethods, setSavedMethods] = useState<PaymentMethod[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string>('');

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('12');
  const [expiryYear, setExpiryYear] = useState('28');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  // UPI Form State
  const [upiId, setUpiId] = useState('');
  const [saveUpi, setSaveUpi] = useState(false);

  // Net Banking State
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // Dev mode toggle & processing state
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Countdown timer effect
  useEffect(() => {
    if (isProcessing || isTimerExpired) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isProcessing, isTimerExpired]);

  // Load user saved payment methods
  useEffect(() => {
    const fetchMethods = async () => {
      const res = await getPaymentMethods();
      if (res.success && res.data && res.data.length > 0) {
        setSavedMethods(res.data);
        const def = res.data.find((m) => m.isDefault) || res.data[0];
        setSelectedSavedId(def.id);
        setActiveTab('saved');
      }
    };
    fetchMethods();
  }, []);

  const resetTimer = () => {
    setTimeLeft(10);
    setIsTimerExpired(false);
  };

  const handlePay = async (methodType: 'CARD' | 'UPI' | 'NET_BANKING' | 'SAVED_METHOD') => {
    if (isTimerExpired) {
      toast.error('Session expired. Please restart the payment timer.');
      return;
    }

    // Tab-specific validations
    if (methodType === 'CARD') {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      if (!validateLuhn(cleanNum)) {
        toast.error('Invalid card number. Please check the digits (Luhn algorithm check failed).');
        return;
      }
      if (!cardHolder.trim()) {
        toast.error('Cardholder name is required');
        return;
      }
      if (!cvv || cvv.length < 3) {
        toast.error('Valid 3 or 4-digit CVV required');
        return;
      }
    } else if (methodType === 'UPI') {
      if (!validateUpiId(upiId)) {
        toast.error('Please enter a valid UPI ID (e.g. user@oksbi)');
        return;
      }
    }

    setPaymentError(null);
    setIsProcessing(true);
    setProcessingStep(1);

    // Simulated progress steps
    const stepTimer1 = setTimeout(() => setProcessingStep(2), 500);
    const stepTimer2 = setTimeout(() => setProcessingStep(3), 1000);

    try {
      const res = await processPayment({
        bookingId: booking.id,
        pnr: booking.pnr,
        userId: booking.userId,
        amount: booking.fareBreakdown.totalFare,
        paymentMethod: methodType,
        simulateFailure,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (res.success) {
        // Optionally save card or UPI if requested
        if (methodType === 'CARD' && saveCard) {
          await saveCardPaymentMethod({
            cardNumber,
            cardHolderName: cardHolder,
            expiryMonth,
            expiryYear,
          });
        } else if (methodType === 'UPI' && saveUpi) {
          await saveUpiPaymentMethod(upiId);
        }

        // Confirm booking in storage
        const confirmRes = await confirmBookingPayment(booking.id, true);
        if (confirmRes.success && confirmRes.data) {
          // Trigger victory confetti
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
          toast.success('Payment verified! Your ticket has been booked.');
          onSuccess(confirmRes.data);
        }
      } else {
        // Payment failed - keep booking in PAYMENT_PENDING
        await confirmBookingPayment(booking.id, false);
        setPaymentError(res.error || 'Payment declined by issuer bank');
        toast.error('Transaction Failed. Ticket status: Payment Pending');
      }
    } catch {
      setPaymentError('Network communication error during payment processing');
      toast.error('Transaction failed due to network error');
    } finally {
      setIsProcessing(false);
      setProcessingStep(0);
    }
  };

  const cardBrand = detectCardBrand(cardNumber);

  const tabsList = [
    ...(savedMethods.length > 0
      ? [
        {
          id: 'saved',
          label: 'Saved Methods',
          icon: <Bookmark className="w-4 h-4" />,
          count: savedMethods.length,
        },
      ]
      : []),
    { id: 'card', label: 'Credit / Debit Card', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'upi', label: 'UPI / QR Code', icon: <QrCode className="w-4 h-4" /> },
    { id: 'netbanking', label: 'Net Banking', icon: <Building className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Dev Mode Banner */}
      <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
          <Bug className="w-4 h-4 text-accent-500" />
          <span>Dev Simulation Tools:</span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={simulateFailure}
            onChange={(e) => setSimulateFailure(e.target.checked)}
            className="rounded border-slate-300 text-danger-600 focus:ring-danger-500"
          />
          <span className="font-bold text-danger-600 dark:text-danger-400">
            Force Failure Test
          </span>
        </label>
      </div>

      {/* Main Payment Gateway Box */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
        {/* Gateway Header: Amount & 10s Timer */}
        <div className="p-6 bg-gradient-to-r from-primary-800 via-primary-700 to-primary-900 text-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-primary-200">
                IRCTC Instant Payment Gateway
              </span>
              <ShieldCheck className="w-4 h-4 text-success-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black mt-1">
              {formatCurrency(booking.fareBreakdown.totalFare)}
            </p>
            <p className="text-xs text-primary-200">PNR: {booking.pnr} • {booking.trainName}</p>
          </div>

          {/* Session Timer Widget */}
          <div className="flex items-center gap-3 bg-black/25 px-4 py-2 rounded-2xl border border-white/10">
            <Clock className={`w-5 h-5 ${timeLeft <= 3 ? 'text-danger-400 animate-pulse' : 'text-accent-400'}`} />
            <div>
              <p className="text-[10px] uppercase font-bold text-primary-200">Session Window</p>
              <p className={`text-base font-mono font-bold ${timeLeft <= 3 ? 'text-danger-300' : 'text-white'}`}>
                00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
              </p>
            </div>
          </div>
        </div>

        {/* Expired Timer Notice */}
        {isTimerExpired && (
          <div className="p-4 bg-warning-50 dark:bg-warning-950/60 border-b border-warning-200 dark:border-warning-800 text-warning-900 dark:text-warning-200 flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning-600 shrink-0" />
              <span>Payment session timeout (10s elapsed). Click refresh to extend.</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetTimer}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Extend Session
            </Button>
          </div>
        )}

        {/* Failure Message with Retry */}
        {paymentError && (
          <div className="p-5 bg-danger-50 dark:bg-danger-950/60 border-b border-danger-200 dark:border-danger-800 text-danger-900 dark:text-danger-200 space-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-bold text-danger-700 dark:text-danger-300">
              <AlertTriangle className="w-5 h-5 text-danger-500" />
              <span>Transaction Failed</span>
            </div>
            <p>{paymentError}</p>
            <p className="text-xs text-danger-700 dark:text-danger-300 font-medium">
              Your ticket has been placed in <strong>Payment Pending</strong> status. You can retry with another payment method below.
            </p>
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing ? (
          <div className="p-12 text-center space-y-6">
            <Spinner size="xl" color="primary" className="mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Processing Secure Payment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Please do not refresh or close this browser window
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-2 text-xs text-left">
              <div className={`flex items-center gap-2 ${processingStep >= 1 ? 'text-success-600 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Connecting to payment gateway</span>
              </div>
              <div className={`flex items-center gap-2 ${processingStep >= 2 ? 'text-success-600 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Contacting issuing bank network</span>
              </div>
              <div className={`flex items-center gap-2 ${processingStep >= 3 ? 'text-success-600 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Authorizing transaction token</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Tabs */}
            <Tabs
              tabs={tabsList}
              activeTab={activeTab}
              onChange={setActiveTab}
              variant="pills"
            />

            {/* TAB 1: Saved Payment Methods */}
            {activeTab === 'saved' && savedMethods.length > 0 && (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Saved Method
                </p>

                <div className="space-y-2.5">
                  {savedMethods.map((m) => {
                    const isSelected = selectedSavedId === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedSavedId(m.id)}
                        className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${isSelected
                            ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/40 ring-2 ring-primary-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="savedMethod"
                            checked={isSelected}
                            onChange={() => setSelectedSavedId(m.id)}
                            className="text-primary-600"
                          />
                          <div>
                            {m.type === 'CARD' ? (
                              <>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">
                                  {m.brand} • {m.cardNumberMasked}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {m.cardHolderName} • Exp {m.expiryMonth}/{m.expiryYear}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">
                                  UPI ID: {m.upiId}
                                </p>
                                <p className="text-xs text-slate-400">Bank handle: @{m.handle}</p>
                              </>
                            )}
                          </div>
                        </div>

                        {m.isDefault && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Default
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => handlePay('SAVED_METHOD')}
                  disabled={!selectedSavedId || isTimerExpired}
                >
                  Pay {formatCurrency(booking.fareBreakdown.totalFare)} via Saved Method
                </Button>
              </div>
            )}

            {/* TAB 2: Card Payment */}
            {activeTab === 'card' && (
              <div className="space-y-4">
                <div>
                  <Input
                    label="Card Number (Luhn Validated)"
                    placeholder="4111 2222 3333 4444"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                      setCardNumber(val);
                    }}
                    rightIcon={
                      cardBrand !== 'OTHER' ? (
                        <span className="text-xs font-bold text-primary-600 px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-950">
                          {cardBrand}
                        </span>
                      ) : null
                    }
                    required
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Supports Visa, MasterCard, RuPay, Amex. (Demo test: any valid 16-digit card or 4242...)
                  </p>
                </div>

                <Input
                  label="Cardholder Name"
                  placeholder="Satya Gopal"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  required
                />

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                      Month
                    </label>
                    <select
                      value={expiryMonth}
                      onChange={(e) => setExpiryMonth(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm"
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const m = (i + 1).toString().padStart(2, '0');
                        return (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                      Year
                    </label>
                    <select
                      value={expiryYear}
                      onChange={(e) => setExpiryYear(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm"
                    >
                      {['25', '26', '27', '28', '29', '30', '31', '32'].map((y) => (
                        <option key={y} value={y}>
                          20{y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Input
                      label="CVV"
                      type="password"
                      maxLength={4}
                      placeholder="•••"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>Save card securely for future fast booking (CVV is never stored)</span>
                  </label>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => handlePay('CARD')}
                  disabled={isTimerExpired}
                >
                  Pay {formatCurrency(booking.fareBreakdown.totalFare)} via Card
                </Button>
              </div>
            )}

            {/* TAB 3: UPI / QR Code */}
            {activeTab === 'upi' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="bg-white p-3 rounded-2xl shadow-sm shrink-0">
                    <QRCodeSVG
                      value={`upi://pay?pa=irctc.booking@upi&pn=IRCTC%20Simulation&am=${booking.fareBreakdown.totalFare}&tr=${booking.pnr}&tn=Ticket%20${booking.pnr}`}
                      size={130}
                      level="M"
                    />
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">
                      Scan QR code with any UPI App
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Google Pay, PhonePe, Paytm, BHIM or any banking app.
                    </p>
                    <p className="text-xs font-mono font-bold text-primary-600">
                      Amount: {formatCurrency(booking.fareBreakdown.totalFare)}
                    </p>
                  </div>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                  <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 uppercase">
                    Or Enter VPA / UPI ID
                  </span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                </div>

                <div className="space-y-3">
                  <Input
                    label="Virtual Payment Address (VPA / UPI ID)"
                    placeholder="e.g. mobile@upi or name@oksbi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={saveUpi}
                      onChange={(e) => setSaveUpi(e.target.checked)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>Save UPI ID to my account</span>
                  </label>

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => handlePay('UPI')}
                    disabled={isTimerExpired}
                  >
                    Verify & Pay {formatCurrency(booking.fareBreakdown.totalFare)}
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 4: Net Banking */}
            {activeTab === 'netbanking' && (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Bank
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { code: 'HDFC', name: 'HDFC Bank' },
                    { code: 'SBI', name: 'State Bank of India' },
                    { code: 'ICICI', name: 'ICICI Bank' },
                    { code: 'AXIS', name: 'Axis Bank' },
                    { code: 'KOTAK', name: 'Kotak Mahindra' },
                    { code: 'PNB', name: 'Punjab National Bank' },
                  ].map((bank) => (
                    <button
                      key={bank.code}
                      type="button"
                      onClick={() => setSelectedBank(bank.code)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${selectedBank === bank.code
                          ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500/30'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                    >
                      {bank.name}
                    </button>
                  ))}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => handlePay('NET_BANKING')}
                  disabled={isTimerExpired}
                >
                  Pay via {selectedBank} Net Banking
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Cancel Button */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="text-slate-500 hover:text-danger-600 font-semibold"
          >
            Cancel & Return to Booking
          </button>
          <span className="text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-success-500" />
            256-bit SSL Encrypted Sandbox
          </span>
        </div>
      </div>
    </div>
  );
};
