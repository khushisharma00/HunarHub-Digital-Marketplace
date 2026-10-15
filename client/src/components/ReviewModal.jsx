import React, { useState } from 'react';
import { X, Star, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../api';
import RatingStars from './RatingStars';

export default function ReviewModal({ isOpen, onClose, target, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !target) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        rating,
        comment: comment.trim()
      };

      if (target.type === 'service_request') {
        payload.service_request_id = target.id;
      } else if (target.type === 'order') {
        payload.order_id = target.id;
      }

      const res = await api.createReview(payload);
      if (res.success) {
        setSuccess('Review submitted successfully! Thank you for supporting local micro-entrepreneurs.');
        setTimeout(() => {
          onSuccess && onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-orange-50/50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rate & Review</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {target.title ? `Review for "${target.title}"` : `Review for Order #${target.id}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40 p-3 rounded-lg border border-green-200 dark:border-green-900/50">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="text-center py-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Select Your Rating</label>
            <div className="flex justify-center">
              <RatingStars rating={rating} size="w-8 h-8" interactive={true} onSelect={setRating} />
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
              {rating === 5 ? '⭐⭐⭐⭐⭐ Excellent Craftsmanship' : `${rating} out of 5 Stars`}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Your Feedback & Experience (optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about the quality of work, punctuality, and craftsmanship..."
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-xl shadow-md shadow-orange-600/20 transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
