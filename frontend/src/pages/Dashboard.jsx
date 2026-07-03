import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle, 
  AlertTriangle, 
  Compass, 
  TrendingUp, 
  Award, 
  BookOpen,
  ArrowRight,
  Sparkles,
  Calendar,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { apiFetch, user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningEngine, setRunningEngine] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const profileData = await apiFetch('/profile');
        setProfile(profileData);
        
        // Only attempt to fetch recommendations if the profile is completed (has college details)
        if (profileData && profileData.personal_info?.college) {
          try {
            const recsData = await apiFetch('/recommendations');
            setRecommendations(recsData.recommendations || []);
          } catch (err) {
            console.log('No recommendations calculated yet.');
          }
        }
      } catch (err) {
        toast.error('Failed to load dashboard.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Compute profile completion percentage
  const getCompletionPercentage = () => {
    if (!profile) return 0;
    let score = 0;
    
    // Personal Details (25%)
    const { name, college, branch } = profile.personal_info || {};
    if (name && college && branch) score += 25;
    
    // Academic Details (25%)
    const { cgpa, tenth_percentage } = profile.academic_info || {};
    if (cgpa && tenth_percentage) score += 25;

    // Technical Skills (25%)
    const { skills, programming_languages } = profile.technical_skills || {};
    if ((skills && skills.length > 0) || (programming_languages && programming_languages.length > 0)) {
      score += 25;
    }

    // Extracurriculars & Interests (25%)
    const { interests } = profile || {};
    if (interests && interests.length > 0) score += 25;

    return score;
  };

  const handleRunEngine = async () => {
    setRunningEngine(true);
    try {
      const data = await apiFetch('/recommendations', { method: 'POST' });
      setRecommendations(data.recommendations || []);
      toast.success('Career recommendation calculations completed!');
    } catch (err) {
      toast.error(err.message || 'Engine run failed.');
    } finally {
      setRunningEngine(false);
    }
  };

  // Derive improvements dynamically
  const getSuggestions = () => {
    const list = [];
    if (!profile) return list;

    const cgpaVal = parseFloat(profile.academic_info?.cgpa || 0);
    if (cgpaVal < 7.5) {
      list.push({
        id: 'cgpa',
        text: 'Target a CGPA above 7.5 to open up top-tier Software and AI Engineer roles.',
        type: 'warning'
      });
    }

    const langs = profile.technical_skills?.programming_languages || [];
    if (langs.length < 2) {
      list.push({
        id: 'lang',
        text: 'Add at least 2 programming languages (e.g. Python, Java) to strengthen your technical profile.',
        type: 'info'
      });
    }

    const projects = profile.technical_skills?.projects || [];
    if (projects.length === 0) {
      list.push({
        id: 'projects',
        text: 'List at least 1 technical project showcasing your coding skills.',
        type: 'info'
      });
    }

    const interests = profile.interests || [];
    if (interests.length === 0) {
      list.push({
        id: 'interests',
        text: 'Specify your career interests in your profile to refine matchmaking.',
        type: 'warning'
      });
    }

    // Default encouragement if profile looks strong
    if (list.length === 0) {
      list.push({
        id: 'perfect',
        text: 'Your profile is highly optimized! Download your PDF report to view details.',
        type: 'success'
      });
    }

    return list;
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  const completion = getCompletionPercentage();
  const suggestions = getSuggestions();
  const hasProfile = profile?.personal_info?.college;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Top Banner Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            <Sparkles className="h-4 w-4" /> Personal Career Dashboard
          </span>
          <h1 className="mt-1 text-2xl font-bold text-slate-800 dark:text-white">
            Welcome back, {user?.name || 'Student'}!
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white border border-slate-100 rounded-xl px-4 py-2.5 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
          <Calendar className="h-4 w-4" /> Local Time: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Progress & Profile Snapshot */}
        <div className="space-y-6 md:col-span-2">
          {/* Profile Completion Box */}
          <div className="glass-card flex flex-col justify-between gap-6 border-purple-100/50 bg-gradient-to-tr from-purple-50/20 via-white to-white dark:from-purple-950/10 dark:via-slate-900 dark:to-slate-900">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-slate-800 dark:text-white">Profile Completion</h2>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{completion}%</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500" 
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
            
            {completion < 100 ? (
              <div className="flex items-center justify-between gap-4 rounded-xl bg-amber-50/50 p-4 border border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/30">
                <div className="flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <p>Complete your profile sections to get more accurate recommendations.</p>
                </div>
                <Link to="/profile" className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 font-semibold whitespace-nowrap">
                  Complete Profile <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50/50 p-4 border border-emerald-100 text-xs text-emerald-800 dark:bg-emerald-950/10 dark:border-emerald-900/30 dark:text-emerald-300">
                <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                Your profile is 100% complete. You are ready for analysis!
              </div>
            )}
          </div>

          {/* Recommendations Summary */}
          <div className="glass-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Compass className="h-5 w-5 text-purple-600" /> Recommended Careers
              </h2>
              {hasProfile && recommendations.length > 0 && (
                <button 
                  onClick={handleRunEngine} 
                  disabled={runningEngine}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400"
                >
                  {runningEngine ? 'Calculating...' : 'Re-calculate Matches'}
                </button>
              )}
            </div>

            {!hasProfile ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 rounded-2xl bg-purple-50 p-3 text-purple-600 dark:bg-purple-950/30">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Profile Blocked</h3>
                <p className="mt-1 max-w-xs text-xs text-slate-400">Please enter your basic college details in My Profile to generate suggestions.</p>
                <Link to="/profile" className="btn-primary mt-4 py-2 text-xs">Complete My Profile</Link>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 rounded-2xl bg-purple-50 p-3 text-purple-600 dark:bg-purple-950/30">
                  <Compass className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">No Recommendations Generated</h3>
                <p className="mt-1 max-w-xs text-xs text-slate-400">Trigger our rule engine to analyze your profile elements.</p>
                <button onClick={handleRunEngine} disabled={runningEngine} className="btn-primary mt-4 py-2 text-xs flex items-center gap-2">
                  {runningEngine ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Run Recommendations
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <div key={rec.career_id} className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-50 p-4 transition-all duration-200 hover:bg-slate-50/50 dark:border-slate-900 dark:hover:bg-slate-900/20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-bold text-sm dark:bg-purple-950/40 dark:text-purple-400">
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">{rec.title}</h4>
                        <p className="text-xs text-slate-400">Avg Salary: {rec.average_salary}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">{rec.score}%</span>
                        <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Match</p>
                      </div>
                      <Link to="/recommendations" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-850">
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                ))}
                
                <Link to="/recommendations" className="block text-center text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 mt-2">
                  View All 5 Recommendations →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Suggestions & Profile Snapshot info */}
        <div className="space-y-6">
          {/* Recently Updated Profile snapshot */}
          <div className="glass-card">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-purple-600" /> Profile Snapshot
            </h2>
            {profile?.personal_info?.college ? (
              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between border-b border-slate-50 pb-2 dark:border-slate-900">
                  <span className="font-semibold">College</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[150px]">{profile.personal_info.college}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2 dark:border-slate-900">
                  <span className="font-semibold">Branch / Year</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{profile.personal_info.branch} - Year {profile.personal_info.year}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2 dark:border-slate-900">
                  <span className="font-semibold">CGPA</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{profile.academic_info.cgpa || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Skills Logged</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">
                    {(profile.technical_skills.skills?.length || 0) + (profile.technical_skills.programming_languages?.length || 0)} skills
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No details logged yet.</p>
            )}
          </div>

          {/* Dynamic Suggestions */}
          <div className="glass-card">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-purple-600" /> Actions to Improve
            </h2>
            <div className="space-y-3">
              {suggestions.map((sug, idx) => (
                <div key={sug.id} className="flex gap-2 text-xs rounded-xl p-3 border border-slate-50 bg-slate-50/50 dark:border-slate-900 dark:bg-slate-900/10">
                  {sug.type === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  ) : sug.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <BookOpen className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  )}
                  <span className="text-slate-600 dark:text-slate-300">{sug.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
