import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Train,
  User as UserIcon,
  Ticket,
  Shield,
  LogOut,
  RotateCcw,
  Sun,
  Moon,
  Menu,
  X,
  CreditCard,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Dropdown } from '../ui/Dropdown';
import { getInitials } from '../../utils/formatters';

export const Navbar: React.FC = () => {
  const { user, logout, resetDemoData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  const handleResetConfirm = async () => {
    setIsResetModalOpen(false);
    await resetDemoData();
    navigate(user?.role === 'admin' ? '/admin' : '/');
  };

  // Auto-close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navLinks = user?.role === 'admin'
    ? [{ label: 'Admin Portal', href: '/admin', icon: <Shield className="w-4 h-4 text-accent-500" /> }]
    : [
        { label: 'Book Tickets', href: '/', icon: <Train className="w-4 h-4" /> },
        { label: 'My Bookings', href: '/bookings', icon: <Ticket className="w-4 h-4" />, authRequired: true },
      ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-colors no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link to={user?.role === 'admin' ? '/admin' : '/'} className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-primary-700 via-primary-600 to-accent-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
                <Train className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-base sm:text-xl font-extrabold tracking-tight text-primary-900 dark:text-white">
                    Rail<span className="text-accent-500">Yatri</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-accent-100 text-accent-700 dark:bg-accent-950 dark:text-accent-400">
                    NextGen
                  </span>
                </div>
                <span className="hidden xs:inline sm:inline text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px] sm:max-w-none">
                  IRCTC Booking Simulator
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links (>= md) */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navLinks.map((link) => {
                if (link.authRequired && !user) return null;
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center gap-2 px-3 py-2 lg:px-3.5 rounded-xl text-sm font-semibold transition-all ${isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
                      }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Right Controls (>= md) */}
            <div className="hidden md:flex items-center gap-2 lg:gap-2.5">
              {/* Reset Data Button */}
              {user?.role === "admin" && (
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  title="Reset simulation data to default demo state"
                  className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-accent-500" />
                  <span>Reset Demo</span>
                </button>
              )}

              {/* Dark mode toggle */}
              <button
                type="button"
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-warning-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User Menu / Auth Buttons */}
              {user ? (
                <Dropdown
                  trigger={
                    <button
                      type="button"
                      className="flex items-center gap-2 pl-2 pr-2.5 lg:pr-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-accent-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                        {getInitials(user.name)}
                      </div>
                      <div className="text-left hidden lg:block">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          {user.name.split(' ')[0]}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">
                          {user.role}
                        </p>
                      </div>
                    </button>
                  }
                  items={[
                    {
                      id: 'user-info',
                      label: `${user.email} (${user.role})`,
                      onClick: () => navigate('/profile'),
                    },
                    {
                      id: 'profile',
                      label: 'Profile & Account',
                      icon: <UserIcon className="w-4 h-4" />,
                      onClick: () => navigate('/profile?tab=profile'),
                    },
                    ...(user.role === 'admin'
                      ? [
                        {
                          id: 'admin-dash',
                          label: 'Admin Portal',
                          icon: <Shield className="w-4 h-4 text-accent-500" />,
                          onClick: () => navigate('/admin'),
                        },
                      ]
                      : [
                        {
                          id: 'passengers',
                          label: 'Saved Passengers',
                          icon: <Users className="w-4 h-4" />,
                          onClick: () => navigate('/profile?tab=passengers'),
                        },
                        {
                          id: 'payment-methods',
                          label: 'Payment Methods',
                          icon: <CreditCard className="w-4 h-4" />,
                          onClick: () => navigate('/profile?tab=payment'),
                        },
                        {
                          id: 'bookings',
                          label: 'My Bookings',
                          icon: <Ticket className="w-4 h-4" />,
                          onClick: () => navigate('/bookings'),
                        },
                      ]),
                    {
                      id: 'logout',
                      label: 'Sign Out',
                      icon: <LogOut className="w-4 h-4" />,
                      danger: true,
                      onClick: logout,
                    },
                  ]}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/login')}
                  >
                    Log In
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/signup')}
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Controls (< md) */}
            <div className="flex items-center gap-1.5 md:hidden">
              {/* Quick Dark Mode toggle for mobile */}
              <button
                type="button"
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
                className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-warning-400" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Mobile Profile Thumbnail if logged in */}
              {user && (
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-accent-500 text-white font-bold text-xs flex items-center justify-center shadow-sm"
                  aria-label="Open mobile profile menu"
                >
                  {getInitials(user.name)}
                </button>
              )}

              {/* Hamburger Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (slides from right) */}
      <div
        className={`md:hidden fixed inset-0 z-50 ${isMobileMenuOpen ? 'visible' : 'invisible pointer-events-none'
          }`}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Backdrop (the ~30% left area is this) */}
        <div
          className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Drawer Panel */}
        <aside
          className={`absolute right-0 top-0 h-full w-[70%] max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Menu</span>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
            {user && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-accent-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {getInitials(user.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{user.name}</p>
                    <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                      {user.role}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Navigation
              </p>
              {navLinks.map((link) => {
                if (link.authRequired && !user) return null;
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* My Account */}
            {user && (
              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  My Account
                </p>
                <Link
                  to="/profile?tab=profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span>Profile & Account</span>
                </Link>
                {user.role === 'admin' ? (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-accent-600 dark:text-accent-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Shield className="w-4 h-4 text-accent-500" />
                    <span>Admin Portal</span>
                  </Link>
                ) : (
                  [
                    { to: '/profile?tab=passengers', label: 'Saved Passengers', icon: <Users className="w-4 h-4 text-slate-500" /> },
                    { to: '/profile?tab=payment', label: 'Payment Methods', icon: <CreditCard className="w-4 h-4 text-slate-500" /> },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sticky footer actions */}
          <div className="shrink-0 px-3 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
            {user?.role === "admin" && <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsResetModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              <RotateCcw className="w-4 h-4 text-accent-500" />
              <span>Reset Demo Simulation</span>
            </button>
            }

            {user ? (
              <Button
                variant="danger"
                size="md"
                fullWidth
                leftIcon={<LogOut className="w-4 h-4" />}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
              >
                Sign Out
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="md" fullWidth onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}>
                  Log In
                </Button>
                <Button variant="primary" size="md" fullWidth onClick={() => { setIsMobileMenuOpen(false); navigate('/signup'); }}>
                  Register
                </Button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Confirmation Modal for Resetting Demo Data */}
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
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsResetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleResetConfirm}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Yes, Reset Data
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
