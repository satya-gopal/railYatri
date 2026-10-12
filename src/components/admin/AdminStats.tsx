import React from 'react';
import { Train, Ticket, IndianRupee, Ban, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export interface AdminStatsProps {
  totalTrains: number;
  totalBookings: number;
  totalRevenue: number;
  totalCancellations: number;
}

export const AdminStats: React.FC<AdminStatsProps> = ({
  totalTrains,
  totalBookings,
  totalRevenue,
  totalCancellations,
}) => {
  const statCards = [
    {
      title: 'Active Trains & Routes',
      value: totalTrains,
      icon: <Train className="w-6 h-6 text-primary-600" />,
      bg: 'bg-primary-50 dark:bg-primary-950/60',
      change: 'Dynamic live routing',
    },
    {
      title: 'Total Passenger Bookings',
      value: totalBookings,
      icon: <Ticket className="w-6 h-6 text-accent-600" />,
      bg: 'bg-accent-50 dark:bg-accent-950/60',
      change: 'Realtime PNR generation',
    },
    {
      title: 'Gross Revenue Collected',
      value: formatCurrency(totalRevenue),
      icon: <IndianRupee className="w-6 h-6 text-success-600" />,
      bg: 'bg-success-50 dark:bg-success-950/60',
      change: 'Simulated ticketing pool',
    },
    {
      title: 'Cancellations Processed',
      value: totalCancellations,
      icon: <Ban className="w-6 h-6 text-danger-600" />,
      bg: 'bg-danger-50 dark:bg-danger-950/60',
      change: 'Auto clerkage deducted',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, idx) => (
        <div
          key={idx}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {stat.title}
            </span>
            <div className={`p-2.5 rounded-xl ${stat.bg}`}>{stat.icon}</div>
          </div>

          <div className="mt-4">
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stat.value}
            </p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-success-500" />
              <span>{stat.change}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
