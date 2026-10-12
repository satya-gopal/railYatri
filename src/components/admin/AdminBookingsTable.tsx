import React, { useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { Booking } from '../../types';
import { Table, Column } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ETicketView } from '../booking/ETicketView';
import { formatCurrency, formatDate } from '../../utils/formatters';

export interface AdminBookingsTableProps {
  bookings: Booking[];
}

export const AdminBookingsTable: React.FC<AdminBookingsTableProps> = ({ bookings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

  const filtered = bookings.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      b.pnr.includes(q) ||
      b.trainName.toLowerCase().includes(q) ||
      b.trainNumber.includes(q) ||
      b.sourceStation.toLowerCase().includes(q) ||
      b.destStation.toLowerCase().includes(q)
    );
  });

  const columns: Column<Booking>[] = [
    {
      header: 'PNR & Transaction',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-primary-600 dark:text-primary-400 text-sm">
            {row.pnr}
          </span>
          <p className="text-[11px] font-mono text-slate-400">{row.transactionId}</p>
        </div>
      ),
    },
    {
      header: 'Train & Date',
      render: (row) => (
        <div className="text-xs">
          <p className="font-bold text-slate-900 dark:text-white">
            {row.trainName} (#{row.trainNumber})
          </p>
          <p className="text-slate-400">
            {formatDate(row.journeyDate)} • {row.sourceStation} → {row.destStation}
          </p>
        </div>
      ),
    },
    {
      header: 'Class / Pax',
      render: (row) => (
        <div className="text-xs font-semibold">
          <span>{row.classType}</span> • <span>{row.passengers.length} Pax</span>
        </div>
      ),
    },
    {
      header: 'Fare Paid',
      render: (row) => (
        <span className="font-bold text-slate-900 dark:text-white text-xs">
          {formatCurrency(row.fareBreakdown.totalFare)}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => {
        let variant: 'success' | 'warning' | 'danger' | 'info' = 'success';
        if (row.bookingStatus === 'CANCELLED') variant = 'danger';
        else if (row.bookingStatus === 'WAITLISTED' || row.bookingStatus === 'RAC') variant = 'warning';
        else if (row.bookingStatus === 'PAYMENT_PENDING') variant = 'info';

        return <Badge variant={variant}>{row.bookingStatus}</Badge>;
      },
    },
    {
      header: 'Ticket Slip',
      className: 'text-right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewingBooking(row)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          View ERS
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by PNR, Train, or Station..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-semibold shrink-0">
          Bookings: {filtered.length}
        </span>
      </div>

      <Table<Booking>
        columns={columns}
        data={filtered}
        keyExtractor={(row) => row.id}
        emptyMessage="No passenger reservations made yet."
      />

      {/* Ticket Modal */}
      <Modal
        isOpen={!!viewingBooking}
        onClose={() => setViewingBooking(null)}
        title="Passenger E-Ticket Details"
        size="2xl"
      >
        {viewingBooking && <ETicketView booking={viewingBooking} />}
      </Modal>
    </div>
  );
};
