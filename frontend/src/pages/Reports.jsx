import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, Loader2, Sparkles, AlertTriangle, Eye, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Reports = () => {
  const { apiFetch, user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        const data = await apiFetch('/profile');
        setProfile(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkProfileStatus();
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await apiFetch('/reports/download');
      
      // Create local URL for blob
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      
      const safeName = profile?.personal_info?.name?.replace(/ /g, '_') || 'Student';
      link.setAttribute('download', `Career_Report_${safeName}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF report generated and downloaded!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to generate PDF report.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const isProfileComplete = profile && profile.personal_info?.college;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <FileText className="h-6 w-6 text-purple-600" /> Download Reports
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Generate and download a comprehensive PDF containing your academic profile, recommended careers, and roadmap recommendations.
        </p>
      </div>

      {!isProfileComplete ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm dark:border-slate-900 dark:bg-slate-950">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/40">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Profile Blocked</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            You must fill out your academic and technical profile before a PDF report can be synthesized.
          </p>
          <Link to="/profile" className="btn-primary mt-6 inline-block">Complete Profile</Link>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-5">
          {/* Left Panel: Download Actions */}
          <div className="md:col-span-2 space-y-6">
            <div className="glass-card flex flex-col justify-between h-full border-purple-100/50 bg-gradient-to-tr from-purple-50/10 to-white dark:from-purple-950/5 dark:to-slate-950">
              <div className="space-y-4">
                <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-400">
                  <Sparkles className="h-3.5 w-3.5" /> PDF Synthesis Engine
                </span>
                <h2 className="text-lg font-extrabold text-slate-800 dark:text-white leading-tight">
                  Academic & Career Synthesis Report
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  This report packages your structural profile metrics, rule-based compatibility outputs, identified skill deficits, and certification courses into a ready-to-present document suitable for CSE academic project submissions.
                </p>
                
                <div className="space-y-2.5 pt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Fully custom ReportLab design
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Career compatibility table
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Detailed skill gap roadmap
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-8 py-3 shadow-lg hover:scale-[1.01]"
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Download PDF Report
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel: Interactive PDF Mock Preview */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block px-1">
              Document Preview
            </span>
            {/* Simulated Sheet of Paper */}
            <div className="relative overflow-hidden aspect-[1/1.4] w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900 group transition-all duration-300 hover:shadow-lg">
              {/* Header simulation */}
              <div className="border-b border-slate-100 pb-3 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[8px] font-bold tracking-widest text-purple-600 dark:text-purple-400 uppercase">
                  AI Career Recommendation Report
                </span>
                <span className="text-[7px] text-slate-400">Page 1 of 2</span>
              </div>

              {/* Title simulation */}
              <div className="mt-5 space-y-1.5">
                <div className="h-6 w-3/4 rounded bg-purple-100 dark:bg-purple-950/40" />
                <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
              </div>

              {/* Grid block simulation */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="space-y-2 rounded-xl bg-slate-50/50 p-3 dark:bg-slate-850">
                  <div className="h-2.5 w-1/3 rounded bg-purple-200 dark:bg-purple-900/60" />
                  <div className="h-2 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-2 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="space-y-2 rounded-xl bg-slate-50/50 p-3 dark:bg-slate-850">
                  <div className="h-2.5 w-1/3 rounded bg-purple-200 dark:bg-purple-900/60" />
                  <div className="h-2 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-2 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>

              {/* Table simulation */}
              <div className="mt-8 space-y-2.5">
                <div className="h-3 w-1/4 rounded bg-purple-200 dark:bg-purple-900/60" />
                <div className="rounded-xl border border-slate-100 overflow-hidden dark:border-slate-850">
                  <div className="h-6 w-full bg-purple-600/10 dark:bg-purple-950/20" />
                  <div className="h-10 w-full border-t border-slate-100 dark:border-slate-850" />
                  <div className="h-10 w-full border-t border-slate-100 dark:border-slate-850" />
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 opacity-0 group-hover:bg-slate-900/40 group-hover:opacity-100 transition-all duration-300">
                <button 
                  onClick={handleDownload}
                  className="btn-primary py-2.5 flex items-center gap-1.5 shadow-lg scale-90 group-hover:scale-100 transition-all"
                >
                  <Eye className="h-4.5 w-4.5" /> Preview & Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
