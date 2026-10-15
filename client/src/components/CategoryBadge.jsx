import React from 'react';
import { Wrench, Sparkles, Scissors, Palette, ShoppingBag } from 'lucide-react';

export default function CategoryBadge({ name, slug }) {
  const norm = (slug || name || '').toLowerCase();

  let bg = 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800/60';
  let Icon = Sparkles;

  if (norm.includes('cobbler')) {
    bg = 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
    Icon = Wrench;
  } else if (norm.includes('potter') || norm.includes('kumhar')) {
    bg = 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/60';
    Icon = Sparkles;
  } else if (norm.includes('tailor')) {
    bg = 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
    Icon = Scissors;
  } else if (norm.includes('artisan')) {
    bg = 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
    Icon = Palette;
  } else if (norm.includes('vendor')) {
    bg = 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
    Icon = ShoppingBag;
  }

  return (
    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${bg}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{name || slug}</span>
    </span>
  );
}
