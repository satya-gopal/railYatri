import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  ShieldCheck,
  RotateCcw,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { TrainSearchWidget } from '../components/search/TrainSearchWidget';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const popularRoutes = [
    {
      title: 'New Delhi ↔ Mumbai Central',
      from: 'NDLS',
      to: 'BCT',
      train: 'Mumbai Rajdhani Express (12951)',
      duration: '15h 32m',
      startingFare: '₹2,150',
      badge: 'High Speed',
      gradient: 'from-blue-600 to-indigo-700',
    },
    {
      title: 'New Delhi ↔ Varanasi Cantt',
      from: 'NDLS',
      to: 'BSB',
      train: 'Vande Bharat Express (22436)',
      duration: '8h 00m',
      startingFare: '₹1,750',
      badge: 'Vande Bharat',
      gradient: 'from-orange-500 to-amber-600',
    },
    {
      title: 'Howrah ↔ New Delhi',
      from: 'HWH',
      to: 'NDLS',
      train: 'Howrah Rajdhani Express (12301)',
      duration: '17h 15m',
      startingFare: '₹2,200',
      badge: 'Rajdhani',
      gradient: 'from-emerald-600 to-teal-700',
    },
    {
      title: 'Chennai Central ↔ Bengaluru',
      from: 'MAS',
      to: 'SBC',
      train: 'Chennai Vande Bharat (20607)',
      duration: '4h 30m',
      startingFare: '₹995',
      badge: 'Vande Bharat',
      gradient: 'from-purple-600 to-blue-700',
    },
  ];

  const handleQuickBook = (from: string, to: string) => {
    navigate(`/search?source=${from}&destination=${to}&date=${tomorrow()}&quota=GN`);
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary-500/10 dark:bg-primary-500/15 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-accent-500/10 dark:bg-accent-500/15 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-300 text-xs font-bold tracking-wide animate-in fade-in slide-in-from-top duration-300">
            <Sparkles className="w-3.5 h-3.5 text-accent-500" />
            <span>NextGen High-Speed Indian Railways Ticket Booking</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Book Train Tickets with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500">Live Seat Availability</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            Realistic IRCTC ticketing simulation featuring 20+ express trains, 28 stations, Tatkal quotas, PNR coach/berth allocation, payment gateway, and printable e-tickets.
          </p>

          {/* Search Box Widget */}
          <div className="pt-6 sm:pt-8 max-w-6xl mx-auto">
            <TrainSearchWidget />
          </div>
        </div>
      </section>

      {/* Popular Superfast Routes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent-600 dark:text-accent-400">
              Top Trending Corridors
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Popular Express Routes
            </h2>
          </div>
          <p className="text-xs text-slate-400">1-click instant availability search for tomorrow</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularRoutes.map((route, idx) => (
            <div
              key={idx}
              onClick={() => handleQuickBook(route.from, route.to)}
              className="group rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-hover hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {route.badge}
                  </span>
                  <span className="text-xs font-black text-primary-600 dark:text-primary-400">
                    From {route.startingFare}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                    {route.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {route.train}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {route.duration}
                </span>
                <span className="text-accent-600 dark:text-accent-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Book Now <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 text-white shadow-2xl relative overflow-hidden">
          <div className="max-w-xl space-y-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-400 bg-accent-950/60 px-3 py-1 rounded-full border border-accent-800">
              IRCTC Advanced Features
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Designed for Speed, Reliability and Precision
            </h2>
            <p className="text-xs sm:text-sm text-primary-200 leading-relaxed">
              Experience the next generation of Indian Railways reservation: lightning fast search, auto-upgrade options, instant clerkage cancellation refunds, and QR encoded digital e-tickets.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1.5">
              <Zap className="w-6 h-6 text-accent-400" />
              <h4 className="font-bold text-sm">Tatkal Quota Engine</h4>
              <p className="text-xs text-primary-200">
                Book premium Tatkal quota seats with automated surcharge algorithms.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1.5">
              <ShieldCheck className="w-6 h-6 text-success-400" />
              <h4 className="font-bold text-sm">Auto-Upgrade Policy</h4>
              <p className="text-xs text-primary-200">
                Automatic zero-cost berth elevation during railway chart preparation.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1.5">
              <RotateCcw className="w-6 h-6 text-warning-400" />
              <h4 className="font-bold text-sm">Instant Clerkage Refunds</h4>
              <p className="text-xs text-primary-200">
                Transparent cancellation clerkage rules based on hours before departure.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
