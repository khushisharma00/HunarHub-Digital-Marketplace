import React from 'react';
import { Star } from 'lucide-react';

export default function RatingStars({ rating = 0, max = 5, size = 'w-4 h-4', interactive = false, onSelect }) {
  const rounded = Math.round(rating);

  return (
    <div className="flex items-center space-x-1">
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= (interactive ? rating : rounded);

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onSelect && onSelect(starValue)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <Star
              className={`${size} ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300 dark:text-slate-600 fill-slate-100 dark:fill-slate-800'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
