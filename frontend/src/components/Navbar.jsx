import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Database, Menu, ShieldCheck, User } from 'lucide-react';

const Navbar = ({ toggleSidebar }) => {
  const { apiFetch } = useAuth();
  const [dbStatus, setDbStatus] = useState({ mode: 'checking', database_name: '' });
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  // Sync dark mode style on mount & change
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fetch db status on load
  useEffect(() => {
    const fetchDbStatus = async () => {
      try {
        const data = await apiFetch('/settings/status');
        setDbStatus(data);
      } catch (err) {
        console.error('Failed to fetch DB status:', err);
        setDbStatus({ mode: 'error', database_name: 'Unknown' });
      }
    };
    fetchDbStatus();
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      {/* Mobile trigger & Title */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <span className="hidden text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 md:inline-block">
          Student Portal
        </span>
      </div>

      {/* Database Status, Dark Mode & profile */}
      <div className="flex items-center gap-4">
        {/* DB Connection Badge */}
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
          <Database className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">DB:</span>
          {dbStatus.mode === 'checking' ? (
            <span className="animate-pulse text-yellow-500">Connecting...</span>
          ) : dbStatus.mode === 'mongodb_atlas' ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              Cloud Atlas <ShieldCheck className="h-3 w-3 inline" />
            </span>
          ) : (
            <span className="text-purple-600 dark:text-purple-400">Local JSON DB</span>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5" />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
