import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Recommendation from './pages/Recommendation';
import SkillGap from './pages/SkillGap';
import CareerDetails from './pages/CareerDetails';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 lg:pl-64">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-col min-h-screen">
        {/* Top Navbar */}
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Scrollable View Content */}
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-600"></div>
          <div className="absolute h-6 w-6 animate-ping rounded-full border border-purple-500/20"></div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!token ? <Register /> : <Navigate to="/" replace />} />

      {/* Protected Main Views */}
      <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
      <Route path="/recommendations" element={<ProtectedRoute><AppLayout><Recommendation /></AppLayout></ProtectedRoute>} />
      <Route path="/skill-gap" element={<ProtectedRoute><AppLayout><SkillGap /></AppLayout></ProtectedRoute>} />
      <Route path="/careers" element={<ProtectedRoute><AppLayout><CareerDetails /></AppLayout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />

      {/* Redirects */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            className: 'dark:bg-slate-900 dark:text-slate-100 border dark:border-slate-800 text-sm font-semibold rounded-xl px-4 py-3 shadow-glass',
            style: {
              fontFamily: '"Plus Jakarta Sans", Inter, sans-serif',
            }
          }} 
        />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
