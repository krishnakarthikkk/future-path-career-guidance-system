import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Lock, Loader2, Database, Info, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { apiFetch } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  const [dbStatus, setDbStatus] = useState(null);
  const [loadingDb, setLoadingDb] = useState(true);

  // Fetch db configuration details
  useEffect(() => {
    const fetchDbStatus = async () => {
      try {
        const data = await apiFetch('/settings/status');
        setDbStatus(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDb(false);
      }
    };
    fetchDbStatus();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    setUpdatingPassword(true);
    try {
      await apiFetch('/settings/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-purple-600" /> Account Settings & Diagnostics
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your account credentials and inspect system database connection configurations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Password Management */}
        <div className="glass-card">
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-purple-600" /> Change Account Password
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2 pt-2.5"
              disabled={updatingPassword}
            >
              {updatingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>

        {/* Right Column: DB Status and System Details */}
        <div className="space-y-6">
          <div className="glass-card">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Database className="h-5 w-5 text-purple-600" /> Database Connection Status
            </h2>

            {loadingDb ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : dbStatus ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3 dark:border-slate-850">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Database Engine</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    dbStatus.mode === 'mongodb_atlas' 
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400'
                  }`}>
                    {dbStatus.mode === 'mongodb_atlas' ? 'MongoDB Atlas (Cloud)' : 'Local File JSON Fallback'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-50 pb-3 dark:border-slate-850 text-xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Database Name</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{dbStatus.database_name}</span>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-400 block">Database Storage Location</span>
                  <code className="block bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-[10px] text-slate-600 break-all font-mono dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
                    {dbStatus.path}
                  </code>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Could not fetch database information.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-900 dark:bg-slate-900/10 flex gap-3 text-xs">
            <Info className="h-5 w-5 text-purple-500 shrink-0" />
            <div className="space-y-1 text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-750 dark:text-slate-200 block">Submission Ready Architecture</span>
              <p>This project has been built in compliance with final-year CSE project requirements, featuring a dual-mode database module that enables seamless evaluation during presentation defense.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
