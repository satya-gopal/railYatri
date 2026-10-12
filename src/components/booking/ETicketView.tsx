import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { Booking } from '../../types';
import { formatCurrency, formatDate, getQuotaName, getBerthName } from '../../utils/formatters';
import { Button } from '../ui/Button';

export interface ETicketViewProps {
  booking: Booking;
  onCancelTicket?: () => void;
}

export const ETicketView: React.FC<ETicketViewProps> = ({
  booking,
  onCancelTicket,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const isConfirmed = booking.bookingStatus === 'CONFIRMED';
  const isCancelled = booking.bookingStatus === 'CANCELLED';

  // Construct QR verification data payload
  const qrData = JSON.stringify({
    pnr: booking.pnr,
    train: booking.trainNumber,
    date: booking.journeyDate,
    pax: booking.passengers.length,
    status: booking.bookingStatus,
    txn: booking.transactionId,
  });

  return (
    <div className="space-y-6">
      {/* Action Header (Hidden in print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-950 text-success-600 dark:text-success-400 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Electronic Reservation Slip (ERS)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Valid for travel with original Government ID card
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCancelTicket && !isCancelled && (
            <Button variant="danger" size="sm" onClick={onCancelTicket}>
              Cancel Ticket
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print E-Ticket
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* Official Railway E-Ticket Sheet */}
      <div className="print-ticket-container bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Ticket Header */}
        <div className="border-b-2 border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-800 text-white flex items-center justify-center font-black text-xl">
              IR
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 uppercase">
                Indian Railways / IRCTC NextGen ERS
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Electronic Reservation Slip • Passenger Central Reservation System
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase font-bold">Booking Status</p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isConfirmed
                  ? 'bg-success-100 text-success-800'
                  : isCancelled
                  ? 'bg-danger-100 text-danger-800'
                  : 'bg-warning-100 text-warning-800'
              }`}
            >
              {booking.bookingStatus}
            </span>
          </div>
        </div>

        {/* PNR & Transaction Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          <div>
            <p className="text-slate-500 font-semibold uppercase text-[10px]">PNR Number</p>
            <p className="text-lg sm:text-xl font-black font-mono text-primary-700 tracking-wider">
              {booking.pnr}
            </p>
          </div>
          <div>
            <p className="text-slate-500 font-semibold uppercase text-[10px]">Transaction ID</p>
            <p className="font-mono font-bold text-slate-800">{booking.transactionId}</p>
          </div>
          <div>
            <p className="text-slate-500 font-semibold uppercase text-[10px]">Quota & Class</p>
            <p className="font-bold text-slate-800">
              {booking.quota} ({getQuotaName(booking.quota)}) • {booking.classType}
            </p>
          </div>
          <div>
            <p className="text-slate-500 font-semibold uppercase text-[10px]">Booked On</p>
            <p className="font-semibold text-slate-800">
              {new Date(booking.bookedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>

        {/* Journey & Train Block */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-5 rounded-2xl border border-slate-200">
          <div className="md:col-span-8 space-y-4">
            <div>
              <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-md">
                Train #{booking.trainNumber}
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-1">{booking.trainName}</h2>
              <p className="text-xs text-slate-500">
                Service Type: {booking.trainType} • Date of Journey: <strong>{formatDate(booking.journeyDate)}</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center pt-2">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Boarding From</p>
                <p className="text-base font-black text-slate-900">{booking.sourceStationName}</p>
                <p className="text-xs font-mono font-bold text-primary-700">
                  [{booking.sourceStation}] • Dep: {booking.departureTime} hrs
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Destination</p>
                <p className="text-base font-black text-slate-900">{booking.destStationName}</p>
                <p className="text-xs font-mono font-bold text-primary-700">
                  [{booking.destStation}] • Arr: {booking.arrivalTime} hrs
                </p>
              </div>
            </div>
          </div>

          {/* Verification QR Code */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <QRCodeSVG value={qrData} size={110} level="M" />
            <p className="text-[10px] text-slate-500 font-mono mt-2">IRCTC DIGITAL VERIFY</p>
            <p className="text-[9px] text-slate-400">Scan via TTE verification scanner</p>
          </div>
        </div>

        {/* Passenger Seat Allocation Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Passenger Details & Berth Allocation
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Passenger Name</th>
                  <th className="p-3">Age / Sex</th>
                  <th className="p-3">Booking Status</th>
                  <th className="p-3">Coach</th>
                  <th className="p-3">Berth / Seat</th>
                  <th className="p-3">Berth Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {booking.passengers.map((p, idx) => (
                  <tr
                    key={idx}
                    className={p.isCancelled ? 'bg-danger-50/50 text-slate-400 line-through' : ''}
                  >
                    <td className="p-3 font-bold">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{p.name}</td>
                    <td className="p-3">
                      {p.age} / {p.gender[0]}
                    </td>
                    <td className="p-3">
                      {p.isCancelled ? (
                        <span className="font-bold text-danger-600">CANCELLED</span>
                      ) : p.bookingStatus === 'CNF' ? (
                        <span className="font-bold text-success-700 bg-success-50 px-2 py-0.5 rounded">
                          CONFIRMED (CNF)
                        </span>
                      ) : p.bookingStatus === 'RAC' ? (
                        <span className="font-bold text-warning-700 bg-warning-50 px-2 py-0.5 rounded">
                          RAC {p.racNumber}
                        </span>
                      ) : (
                        <span className="font-bold text-danger-700 bg-danger-50 px-2 py-0.5 rounded">
                          WL {p.waitlistNumber}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-primary-700">
                      {p.coach || 'WL'}
                    </td>
                    <td className="p-3 font-mono font-black text-slate-900 text-sm">
                      {p.berthNumber ?? (p.waitlistNumber ? `WL-${p.waitlistNumber}` : `RAC-${p.racNumber}`)}
                    </td>
                    <td className="p-3 font-semibold text-slate-700">
                      {p.berthType ? getBerthName(p.berthType) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fare Summary & Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Instructions */}
          <div className="text-[11px] text-slate-600 space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary-600" />
              Important Railway Rules:
            </p>
            <p>1. One passenger must carry original Government photo identity card during the journey.</p>
            <p>2. Fully waitlisted passengers whose names do not appear on charts are not allowed to board.</p>
            <p>3. Auto-upgradation option opted: {booking.autoUpgrade ? 'YES' : 'NO'}.</p>
            <p>4. All India Railway Helpline 24x7: Dial 139.</p>
          </div>

          {/* Payment Breakdown */}
          <div className="text-xs p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Base Railway Fare:</span>
              <span className="font-semibold">{formatCurrency(booking.fareBreakdown.baseFare)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reservation & SF Charges:</span>
              <span className="font-semibold">
                {formatCurrency(booking.fareBreakdown.reservationCharge + booking.fareBreakdown.superfastCharge)}
              </span>
            </div>
            {booking.fareBreakdown.gst > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">GST (5%):</span>
                <span className="font-semibold">{formatCurrency(booking.fareBreakdown.gst)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-primary-800">
              <span>Total Fare Paid:</span>
              <span>{formatCurrency(booking.fareBreakdown.totalFare)}</span>
            </div>
          </div>
        </div>

        {/* Cancellation Details if any */}
        {booking.cancellationDetails && (
          <div className="p-4 bg-danger-50 rounded-2xl border border-danger-200 text-xs text-danger-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-danger-600" />
              Ticket Cancellation Record:
            </p>
            <p>
              Cancelled {booking.cancellationDetails.cancelledPassengersCount} passenger(s) on{' '}
              {new Date(booking.cancellationDetails.cancelledAt).toLocaleString('en-IN')}.
            </p>
            <p>
              Refund Amount: <strong>{formatCurrency(booking.cancellationDetails.refundAmount)}</strong> (Clerkage fee
              deducted: {formatCurrency(booking.cancellationDetails.clerkageDeducted)}).
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
