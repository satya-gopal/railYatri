import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Ticket, Search, Calendar, Eye, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getBookingsByUser, getBookingByPnr } from '../services/bookingService';
import { Booking } from '../types';
import { formatDate, formatCurrency, getClassName } from '../utils/formatters';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { ETicketView } from '../components/booking/ETicketView';
import { CancellationModal } from '../components/booking/CancellationModal';

export const MyBookingsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search by PNR state
  const [pnrSearch, setPnrSearch] = useState(searchParams.get('pnr') || '');
  const [isSearchingPnr, setIsSearchingPnr] = useState(false);

  // Modals
  const [viewTicketBooking, setViewTicketBooking] = useState<Booking | null>(null);
  const [cancelTicketBooking, setCancelTicketBooking] = useState<Booking | null>(null);

  const fetchUserBookings = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await getBookingsByUser(user.id);
      if (res.success && res.data) {
        setBookings(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBookings();
  }, [user]);

  const handlePnrSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pnrSearch.trim() || pnrSearch.trim().length !== 10) {
      toast.error('Please enter a valid 10-digit PNR number');
      return;
    }

    setIsSearchingPnr(true);
    const toastId = toast.loading('Searching PNR record in Indian Railways CRS...');
    try {
      const res = await getBookingByPnr(pnrSearch.trim());
      if (res.success && res.data) {
        setViewTicketBooking(res.data);
        toast.success(`Found booking record for PNR ${res.data.pnr}`, { id: toastId });
      } else {
        toast.error(res.error || 'No booking found for this PNR', { id: toastId });
      }
    } finally {
      setIsSearchingPnr(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const upcomingBookings = bookings.filter(
    (b) => b.journeyDate >= today && b.bookingStatus !== 'CANCELLED'
  );
  const completedBookings = bookings.filter(
    (b) => b.journeyDate < today && b.bookingStatus !== 'CANCELLED'
  );
  const cancelledBookings = bookings.filter((b) => b.bookingStatus === 'CANCELLED');

  const currentList =
    activeTab === 'upcoming'
      ? upcomingBookings
      : activeTab === 'completed'
      ? completedBookings
      : cancelledBookings;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & PNR Direct Search Box */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket className="w-6 h-6 text-primary-600" />
            <span>My Bookings & PNR Inquiry</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            View reserved e-tickets, check coach/berth status, or cancel passengers
          </p>
        </div>

        {/* PNR search form */}
        <form onSubmit={handlePnrSearch} className="flex items-center gap-2 max-w-sm w-full">
          <input
            type="text"
            placeholder="Direct 10-digit PNR search..."
            maxLength={10}
            value={pnrSearch}
            onChange={(e) => setPnrSearch(e.target.value.replace(/\D/g, ''))}
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSearchingPnr}
            leftIcon={<Search className="w-3.5 h-3.5" />}
          >
            Check
          </Button>
        </form>
      </div>

      {/* Booking Tabs: Upcoming / Completed / Cancelled */}
      <Tabs
        tabs={[
          { id: 'upcoming', label: 'Upcoming Journeys', count: upcomingBookings.length },
          { id: 'completed', label: 'Completed Past Journeys', count: completedBookings.length },
          { id: 'cancelled', label: 'Cancelled Tickets', count: cancelledBookings.length },
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as 'upcoming' | 'completed' | 'cancelled')}
      />

      {/* Bookings Stream */}
      {currentList.length === 0 ? (
        <EmptyState
          icon={<Ticket className="w-8 h-8" />}
          title={`No ${activeTab} bookings`}
          description={
            activeTab === 'upcoming'
              ? 'You do not have any upcoming train reservations right now. Ready for your next journey?'
              : `No tickets found in ${activeTab} category.`
          }
          action={
            activeTab === 'upcoming' ? (
              <Button variant="primary" size="md" onClick={() => (window.location.href = '/')}>
                Book a Train Ticket
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          {currentList.map((booking) => {
            const isConfirmed = booking.bookingStatus === 'CONFIRMED';
            const isCancelled = booking.bookingStatus === 'CANCELLED';

            return (
              <div
                key={booking.id}
                className="p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-card transition-all space-y-4"
              >
                {/* Header: PNR + Train + Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase font-bold text-slate-400">PNR</span>
                    <span className="font-mono font-black text-primary-700 dark:text-primary-400 text-base sm:text-lg tracking-wider">
                      {booking.pnr}
                    </span>
                    <Badge
                      variant={isConfirmed ? 'success' : isCancelled ? 'danger' : 'warning'}
                      size="sm"
                    >
                      {booking.bookingStatus}
                    </Badge>
                  </div>

                  <span className="text-xs text-slate-400">
                    Booked on {new Date(booking.bookedAt).toLocaleDateString('en-IN')}
                  </span>
                </div>

                {/* Train Schedule & Route */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-5 space-y-0.5">
                    <span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded">
                      #{booking.trainNumber}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                      {booking.trainName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {getClassName(booking.classType)} • {booking.quota} Quota
                    </p>
                  </div>

                  <div className="sm:col-span-4 space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                      <Calendar className="w-4 h-4 text-accent-500 shrink-0" />
                      <span>{formatDate(booking.journeyDate)}</span>
                    </div>
                    <p className="text-slate-500">
                      {booking.sourceStationName} ({booking.sourceStation}) →{' '}
                      {booking.destStationName} ({booking.destStation})
                    </p>
                  </div>

                  <div className="sm:col-span-3 text-left sm:text-right space-y-1">
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {formatCurrency(booking.fareBreakdown.totalFare)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {booking.passengers.length} Passenger{booking.passengers.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Actions: View E-Ticket, Cancel */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {booking.passengers.map((p, idx) => (
                      <span
                        key={idx}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          p.isCancelled
                            ? 'bg-danger-50 text-danger-700 line-through'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {p.name.split(' ')[0]} ({p.coach || 'WL'}-{p.berthNumber || 'WL'})
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {!isCancelled && activeTab === 'upcoming' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancelTicketBooking(booking)}
                        leftIcon={<Ban className="w-3.5 h-3.5 text-danger-500" />}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setViewTicketBooking(booking)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      View Ticket
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Details Modal */}
      <Modal
        isOpen={!!viewTicketBooking}
        onClose={() => setViewTicketBooking(null)}
        title="Electronic Reservation Slip"
        size="2xl"
      >
        {viewTicketBooking && (
          <ETicketView
            booking={viewTicketBooking}
            onCancelTicket={() => {
              const current = viewTicketBooking;
              setViewTicketBooking(null);
              setCancelTicketBooking(current);
            }}
          />
        )}
      </Modal>

      {/* Cancellation Modal */}
      {cancelTicketBooking && (
        <CancellationModal
          isOpen={!!cancelTicketBooking}
          onClose={() => setCancelTicketBooking(null)}
          booking={cancelTicketBooking}
          onCancelled={(updated) => {
            fetchUserBookings();
            setViewTicketBooking(updated);
          }}
        />
      )}
    </div>
  );
};
