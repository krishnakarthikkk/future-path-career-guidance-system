import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Search, Building2, TrendingUp, IndianRupee, Award, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const CareerDetails = () => {
  const { apiFetch } = useAuth();
  const [careers, setCareers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCareerId, setActiveCareerId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        const data = await apiFetch('/careers');
        setCareers(data || []);
        if (data && data.length > 0) {
          setActiveCareerId(data[0].id);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load career catalog.');
      } finally {
        setLoading(false);
      }
    };
    fetchCareers();
  }, []);

  const filteredCareers = careers.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.required_skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeCareer = careers.find(c => c.id === activeCareerId);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-purple-600" /> Career Details Library
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Browse through the industry pathways directory to explore salary metrics, job tasks, and hiring ecosystems.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Search & List */}
        <div className="md:col-span-1 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute top-3 left-4 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search roles or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-11 py-2 text-xs"
            />
          </div>

          {/* List of Careers */}
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 md:max-h-[500px] md:overflow-y-auto">
            {filteredCareers.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCareerId(c.id)}
                className={`w-full text-left rounded-xl px-4 py-3 text-xs font-semibold whitespace-nowrap md:whitespace-normal transition-all ${
                  activeCareerId === c.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/15 dark:bg-purple-700'
                    : 'bg-white border border-slate-100 text-slate-700 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-900 dark:text-slate-400 dark:hover:bg-slate-900'
                }`}
              >
                {c.title}
              </button>
            ))}
            {filteredCareers.length === 0 && (
              <p className="text-xs text-slate-400 italic p-2">No matching pathways found.</p>
            )}
          </div>
        </div>

        {/* Right Column: Full details profile */}
        <div className="md:col-span-2">
          {activeCareer ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-900 dark:bg-slate-950 space-y-6">
              {/* Header Info */}
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{activeCareer.title}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeCareer.description}
                </p>
              </div>

              <hr className="border-slate-100 dark:border-slate-900" />

              {/* Metrics cards grid */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-purple-50/50 p-4 border border-purple-100/10 dark:bg-slate-900/40">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 mb-1">
                    <IndianRupee className="h-4 w-4" /> Average Salary
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white leading-none">
                    {activeCareer.average_salary}
                  </span>
                </div>

                <div className="rounded-2xl bg-purple-50/50 p-4 border border-purple-100/10 dark:bg-slate-900/40 sm:col-span-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 mb-1">
                    <TrendingUp className="h-4 w-4" /> Career Growth
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight block">
                    {activeCareer.career_growth}
                  </span>
                </div>
              </div>

              {/* Core Required Skills */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Core Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeCareer.required_skills.map((skill, sIdx) => (
                    <span 
                      key={sIdx}
                      className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3.5 py-1 text-xs font-semibold text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Companies and Certifications */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-purple-600" /> Top Hiring Companies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {activeCareer.hiring_companies.map((company, cIdx) => (
                      <span 
                        key={cIdx}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-50 border border-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-purple-600" /> Key Professional Certifications
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                    {activeCareer.required_certifications.map((cert, cIdx) => (
                      <li key={cIdx} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-purple-600 shrink-0" />
                        {cert}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">Select a career pathway to view details.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerDetails;
