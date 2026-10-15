import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, Clock, ExternalLink, ArrowLeft } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { setUnreadCount: setGlobalUnreadCount } = useAuth();

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
        setGlobalUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.markNotificationAsRead(id);
      loadNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      loadNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <Bell className="w-6 h-6 text-orange-600" />
            <span>In-App Notifications</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time updates about your service bookings, orders, and administrative reviews.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-3 py-1.5 bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 rounded-xl text-xs font-bold flex items-center space-x-1 border border-orange-200 dark:border-orange-800/60 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs font-semibold">
          Loading alerts...
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-white text-sm">No Notifications</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">You're all caught up! New alerts will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                n.is_read
                  ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                  : 'bg-orange-50/60 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/60 shadow-sm'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{n.title}</h4>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{n.message}</p>
                <div className="flex items-center space-x-3 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </span>
                  {n.link && (
                    <Link
                      to={n.link}
                      onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                      className="font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center space-x-0.5"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  title="Mark as read"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
