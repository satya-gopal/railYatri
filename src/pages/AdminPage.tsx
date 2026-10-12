import React, { useState, useEffect } from 'react';
import { Shield, Plus, Train, Ticket } from 'lucide-react';
import { Train as TrainModel, Booking } from '../types';
import { getAllTrains } from '../services/trainService';
import { getAllBookings } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import { AdminStats } from '../components/admin/AdminStats';
import { TrainListTable } from '../components/admin/TrainListTable';
import { AdminBookingsTable } from '../components/admin/AdminBookingsTable';
import { TrainFormModal } from '../components/admin/TrainFormModal';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'trains' | 'bookings'>('trains');
  const [trains, setTrains] = useState<TrainModel[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Train form modal
  const [isTrainModalOpen, setIsTrainModalOpen] = useState(false);
  const [editingTrain, setEditingTrain] = useState<TrainModel | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [trainsRes, bookingsRes] = await Promise.all([
        getAllTrains(),
        getAllBookings(),
      ]);

      if (trainsRes.success && trainsRes.data) {
        setTrains(trainsRes.data);
      }
      if (bookingsRes.success && bookingsRes.data) {
        setBookings(bookingsRes.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute metrics
  const totalRevenue = bookings
    .filter((b) => b.bookingStatus !== 'CANCELLED' && b.bookingStatus !== 'PAYMENT_PENDING')
    .reduce((sum, b) => sum + b.fareBreakdown.totalFare, 0);

  const totalCancellations = bookings.filter((b) => b.bookingStatus === 'CANCELLED').length;

  const handleOpenAddTrain = () => {
    setEditingTrain(null);
    setIsTrainModalOpen(true);
  };

  const handleOpenEditTrain = (train: TrainModel) => {
    setEditingTrain(train);
    setIsTrainModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2 text-accent-400 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>IRCTC Central Operations Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Railway Management Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Logged in as <strong>{user?.name}</strong> • Controller Privileges Active
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Button
            variant="accent"
            size="md"
            onClick={handleOpenAddTrain}
            leftIcon={<Plus className="w-5 h-5" />}
          >
            Add New Train Route
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <AdminStats
        totalTrains={trains.length}
        totalBookings={bookings.length}
        totalRevenue={totalRevenue}
        totalCancellations={totalCancellations}
      />

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Tabs
            tabs={[
              { id: 'trains', label: 'Trains & Route Schedules', icon: <Train className="w-4 h-4" />, count: trains.length },
              { id: 'bookings', label: 'Passenger Bookings CRS', icon: <Ticket className="w-4 h-4" />, count: bookings.length },
            ]}
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab as 'trains' | 'bookings')}
          />

          {activeTab === 'trains' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddTrain}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Train
            </Button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'trains' ? (
          <TrainListTable
            trains={trains}
            onEditTrain={handleOpenEditTrain}
            onRefresh={fetchData}
          />
        ) : (
          <AdminBookingsTable bookings={bookings} />
        )}
      </div>

      {/* Train Form Modal */}
      <TrainFormModal
        isOpen={isTrainModalOpen}
        onClose={() => setIsTrainModalOpen(false)}
        trainToEdit={editingTrain}
        onSaved={fetchData}
      />
    </div>
  );
};
