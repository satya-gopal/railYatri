import React from 'react';
import { Train, PhoneCall, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6 sm:gap-6 lg:gap-8">
          {/* Col 1: About */}
          <div className="space-y-3 col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-700 to-accent-500 flex items-center justify-center text-white shadow-sm shrink-0">
                <Train className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white">
                Rail<span className="text-accent-500">Yatri</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              A high-fidelity Indian Railways / IRCTC NextGen booking simulation frontend application.
              Built for seamless passenger ticket reservation experience.
            </p>
          </div>

          {/* Col 2: Passenger Services */}
          <div className="col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
              Railway Services
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <li className="hover:text-primary-600 dark:hover:text-primary-400 transition cursor-pointer">Live Seat Availability</li>
              <li className="hover:text-primary-600 dark:hover:text-primary-400 transition cursor-pointer">Tatkal Booking System</li>
              <li className="hover:text-primary-600 dark:hover:text-primary-400 transition cursor-pointer">PNR Status & Coach Layout</li>
              <li className="hover:text-primary-600 dark:hover:text-primary-400 transition cursor-pointer">Instant Cancellation & Refunds</li>
            </ul>
          </div>

          {/* Col 3: Helpline */}
          <div className="col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
              Railway Helplines
            </h4>
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <a
                href="tel:139"
                className="flex items-center gap-1.5 sm:gap-2 p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
              >
                <PhoneCall className="w-4 h-4 text-accent-500 shrink-0" />
                <span>
                  Helpline: <strong className="font-semibold text-accent-600 dark:text-accent-400">139</strong>
                  <span className="hidden sm:inline"> (24x7)</span>
                </span>
              </a>
              <a
                href="tel:182"
                className="flex items-center gap-1.5 sm:gap-2 p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
              >
                <ShieldCheck className="w-4 h-4 text-success-500 shrink-0" />
                <span>
                  Security<span className="hidden sm:inline"> & Safety</span>:{' '}
                  <strong className="font-semibold text-success-600 dark:text-success-400">182</strong>
                </span>
              </a>
              {/* Desktop-only note (mobile version is shown below the two columns) */}
              <p className="hidden lg:block text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                Simulated service. No real money or railway reservations are made.
              </p>
            </div>
          </div>

          {/* Mobile/tablet note: spans both columns */}
          <p className="col-span-2 lg:hidden text-[11px] text-slate-400 dark:text-slate-500 -mt-2">
            Simulated service. No real money or railway reservations are made.
          </p>

          {/* Col 4: Quick Demo Credentials */}
          <div className="hidden md:block bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 col-span-2 lg:col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-2.5">
              Demo Credentials
            </h4>
            <div className="text-xs space-y-3 text-slate-600 dark:text-slate-300">
              <div className="space-y-1">
                <p className="font-semibold text-primary-600 dark:text-primary-400">Passenger User</p>
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                  <code className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 break-all">user@demo.com</code>
                  <span className="text-slate-400">/</span>
                  <code className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">User@123</code>
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-accent-600 dark:text-accent-400">Admin Controller</p>
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                  <code className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 break-all">admin@demo.com</code>
                  <span className="text-slate-400">/</span>
                  <code className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">Admin@123</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3 text-center sm:text-left">
          <p>© {new Date().getFullYear()} RailYatri IRCTC Simulation.</p>
          <div className="flex items-center justify-center gap-1">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-danger-500 fill-danger-500" />
            <span>for speed and precision(openskale)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};