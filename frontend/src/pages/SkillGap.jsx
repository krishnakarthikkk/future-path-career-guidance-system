import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Target, AlertTriangle, BookOpen, Award, ExternalLink, RefreshCcw, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const SkillGap = () => {
  const { apiFetch } = useAuth();
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCareerIndex, setActiveCareerIndex] = useState(0);

  const fetchGaps = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/skill-gap');
      setGaps(data.gap_analysis || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch skill gap analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  const activeGap = gaps[activeCareerIndex];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Target className="h-6 w-6 text-purple-600" /> Skill Gap Analysis
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Identify skills required for your target roles and explore roadmap resources.
          </p>
        </div>
        {gaps.length > 0 && (
          <button 
            onClick={fetchGaps}
            className="btn-secondary py-2 flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Reload Analysis
          </button>
        )}
      </div>

      {gaps.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm dark:border-slate-900 dark:bg-slate-950">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/40">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Profile Blocked</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Please fill in your details in My Profile first to calculate skill gap indicators.
          </p>
          <Link to="/profile" className="btn-primary mt-6 inline-block">Complete Profile</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-4">
          {/* Left Navigation: Target Roles list */}
          <div className="md:col-span-1 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block px-1.5">
              Target Career Pathways
            </span>
            <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
              {gaps.map((gap, index) => (
                <button
                  key={gap.career_id}
                  onClick={() => setActiveCareerIndex(index)}
                  className={`w-full text-left rounded-xl px-4 py-3 text-xs font-semibold whitespace-nowrap md:whitespace-normal transition-all ${
                    activeCareerIndex === index
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/15 dark:bg-purple-700'
                      : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-900 dark:text-slate-400 dark:hover:bg-slate-900'
                  }`}
                >
                  <p className="font-bold">{gap.career_title}</p>
                  <span className={`text-[10px] ${activeCareerIndex === index ? 'text-purple-200' : 'text-purple-600 dark:text-purple-400'}`}>
                    {gap.score}% match
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Details Panel: Gaps & Suggestions */}
          <div className="md:col-span-3 space-y-6">
            {activeGap && (
              <>
                {activeGap.dataset_support ? (
                  <div className="glass-card border-purple-100/40 bg-purple-50/40 dark:border-purple-900/20 dark:bg-purple-950/10">
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                      This pathway was reinforced by <span className="font-bold">{activeGap.dataset_support}</span> similar dataset profiles.
                    </p>
                  </div>
                ) : null}

                {/* Missing Skills Snapshot */}
                <div className="glass-card">
                  <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
                    <Target className="h-5 w-5 text-purple-600" /> Missing / Target Skills
                  </h2>
                  <p className="text-xs text-slate-400 mb-4">
                    Based on your profile, you need to acquire the following skills to qualify for this pathway:
                  </p>

                  <div className="flex flex-wrap gap-2.5">
                    {activeGap.missing_skills.length > 0 ? (
                      activeGap.missing_skills.map((skill, sIdx) => (
                        <span 
                          key={sIdx} 
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50/20 px-3.5 py-1.5 text-xs font-bold text-red-600 dark:border-red-950/20 dark:bg-red-950/10 dark:text-red-400"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50/20 px-3.5 py-1.5 text-xs font-bold text-emerald-600 dark:border-emerald-950/20 dark:bg-emerald-950/10 dark:text-emerald-400">
                        No missing skills! You satisfy all core technical skills.
                      </span>
                    )}
                  </div>
                </div>

                {/* Suggested Courses */}
                <div className="glass-card">
                  <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
                    <BookOpen className="h-5 w-5 text-purple-600" /> Suggested Online Courses
                  </h2>
                  <p className="text-xs text-slate-400 mb-4">
                    Enrolling in these online courses will help bridge your core technical gaps:
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {activeGap.suggested_courses.length > 0 ? (
                      activeGap.suggested_courses.map((course) => (
                        <div 
                          key={course.id} 
                          className="flex flex-col justify-between rounded-2xl border border-slate-50 p-4 transition-all duration-200 hover:border-purple-200/50 hover:bg-slate-50/20 dark:border-slate-900 dark:hover:border-purple-900/30 dark:hover:bg-slate-900/10"
                        >
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full dark:bg-purple-950/40 dark:text-purple-400">
                              {course.type}
                            </span>
                            <h4 className="text-xs font-bold text-slate-850 dark:text-white mt-2 leading-snug">{course.title}</h4>
                            <p className="text-[10px] text-slate-400 mt-1">Platform: {course.platform}</p>
                          </div>
                          
                          <a 
                            href={course.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-2 text-xs font-semibold text-slate-600 hover:bg-purple-600 hover:text-white dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-purple-700 transition-colors"
                          >
                            Go to Course <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No courses recommended currently.</p>
                    )}
                  </div>
                </div>

                {/* Professional Certifications & Improvement Suggestions */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="glass-card">
                    <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
                      <Award className="h-5 w-5 text-purple-600" /> Recommended Certifications
                    </h2>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      {activeGap.required_certifications?.map((cert, cIdx) => (
                        <li key={cIdx} className="flex items-center gap-2 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                          {cert}
                        </li>
                      )) || <li className="italic text-slate-400">None registered.</li>}
                    </ul>
                  </div>

                  <div className="glass-card bg-gradient-to-tr from-purple-50/10 to-white border-purple-100/30 dark:from-purple-950/5 dark:to-slate-950">
                    <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-purple-600" /> Strategic Roadmap Tips
                    </h2>
                    <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
                      <p>1. <b>Build portfolio:</b> Showcase the skills learned in courses by developing 1 small project for this career path.</p>
                      <p>2. <b>Practice coding:</b> Dedicate 30 mins daily to DSA if this is a Software/AI Engineer target.</p>
                      <p>3. <b>Improve soft skills:</b> Focus on teamwork and project management in your college clubs.</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillGap;
