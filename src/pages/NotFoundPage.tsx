import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Train, Home, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative mx-auto w-24 h-24">
          <div className="w-24 h-24 rounded-3xl bg-primary-100 dark:bg-primary-950/80 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto shadow-lg">
            <Train className="w-12 h-12 stroke-[1.8]" />
          </div>
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-accent-500 text-white font-black text-xs">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Off the Railway Track
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            The page or station schedule you are looking for has been moved or does not exist on this corridor.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/')}
            leftIcon={<Home className="w-4 h-4" />}
          >
            Return Home
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/')}
            leftIcon={<Search className="w-4 h-4" />}
          >
            Search Trains
          </Button>
        </div>
      </div>
    </div>
  );
};
