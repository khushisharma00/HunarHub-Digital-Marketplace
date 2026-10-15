import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '../api';

export default function DisputeModal({ isOpen, onClose, target, onSuccess }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !target) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || !details.trim()) {
      setError('Please provide both a reason and detailed explanation.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        reason: reason.trim(),
        details: details.trim()
      };

      if (target.type === 'service_request') {
        payload.service_request_id = target.id;
      } else if (target.type === 'order') {
        payload.order_id = target.id;
      }

      const res = await api.raiseDispute(payload);
      if (res.success) {
        setSuccess('Dispute raised. Our platform admin team will review and issue a binding resolution.');
        setTimeout(() => {
          onSuccess && onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to raise dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-red-50/60 dark:bg-red-950/40">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Raise Dispute / Complaint</h3>
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
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40 p-3 rounded-lg border border-green-200 dark:border-green-900/50">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Dispute Category / Primary Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">Select a reason...</option>
              <option value="Service Quality Issue">Service Quality Not As Described</option>
              <option value="Delayed Completion / No Show">Delayed Completion / Missed Appointment</option>
              <option value="Damaged Item">Product Arrived Damaged or Defective</option>
              <option value="Pricing / Payment Discrepancy">Pricing or Payment Discrepancy</option>
              <option value="Unprofessional Conduct">Unprofessional Conduct</option>
              <option value="Other">Other Grievance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Detailed Description & Timeline
            </label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              required
              placeholder="Provide specific details about what occurred, dates, and what resolution you are requesting..."
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
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
              className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl shadow-md transition-colors"
            >
              {loading ? 'Submitting...' : 'File Dispute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
