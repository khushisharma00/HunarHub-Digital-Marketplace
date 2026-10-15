import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
      <div className="w-20 h-20 bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-orange-200 dark:border-orange-800/60">
        <Sparkles className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">404 - Page Not Found</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-sm mx-auto">
          The page or artisan profile you're looking for doesn't exist or has moved.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Link
          to="/"
          className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <Link
          to="/browse"
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all"
        >
          <Search className="w-4 h-4" />
          <span>Browse Talent</span>
        </Link>
      </div>
    </div>
  );
}
