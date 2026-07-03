import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  GraduationCap, 
  Code, 
  Heart, 
  Award, 
  Plus, 
  Trash2, 
  Save, 
  Loader2,
  ListPlus
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile state matching backend expectations
  const [profile, setProfile] = useState({
    personal_info: { name: '', email: '', college: '', branch: '', year: '1' },
    academic_info: { cgpa: '', tenth_percentage: '', twelfth_percentage: '' },
    technical_skills: {
      programming_languages: [],
      skills: [],
      projects: [],
      internships: [],
      certifications: [],
      hackathons: []
    },
    soft_skills: {
      communication: 3,
      leadership: 3,
      teamwork: 3,
      problem_solving: 3,
      public_speaking: 3
    },
    extracurriculars: {
      ncc: false,
      nss: false,
      sports: [],
      volunteering: [],
      club_activities: [],
      event_management: false,
      achievements: []
    },
    interests: []
  });

  // State helpers for adding tags/pills
  const [newLang, setNewLang] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newSport, setNewSport] = useState('');
  const [newVolunteering, setNewVolunteering] = useState('');
  const [newClub, setNewClub] = useState('');
  const [newAchievement, setNewAchievement] = useState('');

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiFetch('/profile');
        if (data) {
          // Normalize default properties if empty
          setProfile(prev => ({
            ...prev,
            ...data,
            personal_info: { ...prev.personal_info, ...data.personal_info },
            academic_info: { ...prev.academic_info, ...data.academic_info },
            technical_skills: { ...prev.technical_skills, ...data.technical_skills },
            soft_skills: { ...prev.soft_skills, ...data.soft_skills },
            extracurriculars: { ...prev.extracurriculars, ...data.extracurriculars },
            interests: data.interests || []
          }));
        }
      } catch (err) {
        toast.error('Failed to load profile.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      personal_info: { ...prev.personal_info, [name]: value }
    }));
  };

  const handleAcademicChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      academic_info: { ...prev.academic_info, [name]: value }
    }));
  };

  const handleSoftSkillChange = (name, value) => {
    setProfile(prev => ({
      ...prev,
      soft_skills: { ...prev.soft_skills, [name]: parseInt(value) }
    }));
  };

  const handleExtracurricularCheckbox = (name) => {
    setProfile(prev => ({
      ...prev,
      extracurriculars: { ...prev.extracurriculars, [name]: !prev.extracurriculars[name] }
    }));
  };

  // Tag list helpers
  const addTag = (category, value, setter, isExtra = false) => {
    if (!value.trim()) return;
    
    if (isExtra) {
      if (profile.extracurriculars[category].includes(value.trim())) {
        toast.error('Tag already exists.');
        return;
      }
      setProfile(prev => ({
        ...prev,
        extracurriculars: {
          ...prev.extracurriculars,
          [category]: [...prev.extracurriculars[category], value.trim()]
        }
      }));
    } else {
      if (profile.technical_skills[category].includes(value.trim())) {
        toast.error('Tag already exists.');
        return;
      }
      setProfile(prev => ({
        ...prev,
        technical_skills: {
          ...prev.technical_skills,
          [category]: [...prev.technical_skills[category], value.trim()]
        }
      }));
    }
    setter('');
  };

  const removeTag = (category, index, isExtra = false) => {
    if (isExtra) {
      setProfile(prev => ({
        ...prev,
        extracurriculars: {
          ...prev.extracurriculars,
          [category]: prev.extracurriculars[category].filter((_, i) => i !== index)
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        technical_skills: {
          ...prev.technical_skills,
          [category]: prev.technical_skills[category].filter((_, i) => i !== index)
        }
      }));
    }
  };

  // Dynamic Item row helpers (Projects, Internships, etc.)
  const addRow = (category, template) => {
    setProfile(prev => ({
      ...prev,
      technical_skills: {
        ...prev.technical_skills,
        [category]: [...prev.technical_skills[category], template]
      }
    }));
  };

  const removeRow = (category, index) => {
    setProfile(prev => ({
      ...prev,
      technical_skills: {
        ...prev.technical_skills,
        [category]: prev.technical_skills[category].filter((_, i) => i !== index)
      }
    }));
  };

  const handleRowChange = (category, index, field, value) => {
    setProfile(prev => {
      const updatedRows = [...prev.technical_skills[category]];
      updatedRows[index] = { ...updatedRows[index], [field]: value };
      return {
        ...prev,
        technical_skills: {
          ...prev.technical_skills,
          [category]: updatedRows
        }
      };
    });
  };

  // Interests Checklist helper
  const handleInterestToggle = (interest) => {
    setProfile(prev => {
      const interests = [...prev.interests];
      if (interests.includes(interest)) {
        return { ...prev, interests: interests.filter(i => i !== interest) };
      } else {
        return { ...prev, interests: [...interests, interest] };
      }
    });
  };

  const handleSave = async () => {
    // Basic Form validation
    const { name, college, branch } = profile.personal_info;
    const { cgpa, tenth_percentage, twelfth_percentage } = profile.academic_info;

    if (!name || !college || !branch) {
      toast.error('Name, College, and Branch are required fields.');
      setActiveTab('personal');
      return;
    }

    if (cgpa && (parseFloat(cgpa) < 0 || parseFloat(cgpa) > 10)) {
      toast.error('CGPA must be between 0 and 10.');
      setActiveTab('personal');
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/profile', {
        method: 'POST',
        body: JSON.stringify(profile)
      });
      toast.success('Profile saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const interestOptions = [
    'Software Development',
    'Artificial Intelligence',
    'Cyber Security',
    'Government Jobs',
    'Defence',
    'Data Science',
    'Management',
    'Teaching',
    'Entrepreneurship'
  ];

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Student Profile Analyzer</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Complete your profile to unlock custom career matches.</p>
        </div>
        <button
          onClick={handleSave}
          className="btn-primary flex items-center justify-center gap-2"
          disabled={saving}
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Save Profile
        </button>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="mb-6 flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'personal'
              ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <User className="h-4.5 w-4.5" /> Personal & Academics
        </button>
        <button
          onClick={() => setActiveTab('technical')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'technical'
              ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <Code className="h-4.5 w-4.5" /> Technical Skills
        </button>
        <button
          onClick={() => setActiveTab('soft')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'soft'
              ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <Heart className="h-4.5 w-4.5" /> Soft Skills & Interests
        </button>
        <button
          onClick={() => setActiveTab('extra')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'extra'
              ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <Award className="h-4.5 w-4.5" /> Extracurriculars
        </button>
      </div>

      {/* Tabs panels */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-900 dark:bg-slate-950">
        
        {/* Tab 1: Personal & Academics */}
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" /> Personal Details
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={profile.personal_info.name}
                  onChange={handlePersonalChange}
                  className="form-input"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={profile.personal_info.email}
                  className="form-input opacity-60 cursor-not-allowed"
                  disabled
                />
              </div>
              <div>
                <label className="form-label">College / University *</label>
                <input
                  type="text"
                  name="college"
                  value={profile.personal_info.college}
                  onChange={handlePersonalChange}
                  className="form-input"
                  placeholder="National Institute of Technology"
                  required
                />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="form-label">Branch *</label>
                  <input
                    type="text"
                    name="branch"
                    value={profile.personal_info.branch}
                    onChange={handlePersonalChange}
                    className="form-input"
                    placeholder="CSE / IT / ECE"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Year of Study</label>
                  <select
                    name="year"
                    value={profile.personal_info.year}
                    onChange={handlePersonalChange}
                    className="form-select"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-900" />

            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" /> Academic Information
            </h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="form-label">Current CGPA (10-Point Scale)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  name="cgpa"
                  value={profile.academic_info.cgpa}
                  onChange={handleAcademicChange}
                  className="form-input"
                  placeholder="8.75"
                />
              </div>
              <div>
                <label className="form-label">Class 10th Percentage</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  name="tenth_percentage"
                  value={profile.academic_info.tenth_percentage}
                  onChange={handleAcademicChange}
                  className="form-input"
                  placeholder="92.4"
                />
              </div>
              <div>
                <label className="form-label">Class 12th Percentage</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  name="twelfth_percentage"
                  value={profile.academic_info.twelfth_percentage}
                  onChange={handleAcademicChange}
                  className="form-input"
                  placeholder="88.6"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Technical Skills */}
        {activeTab === 'technical' && (
          <div className="space-y-8">
            {/* Programming Languages */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Programming Languages</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.technical_skills.programming_languages.map((lang, index) => (
                  <span key={index} className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                    {lang}
                    <button type="button" onClick={() => removeTag('programming_languages', index)} className="text-purple-400 hover:text-purple-600">×</button>
                  </span>
                ))}
              </div>
              <div className="flex max-w-md gap-2">
                <input
                  type="text"
                  placeholder="e.g. Python, Java, JavaScript"
                  value={newLang}
                  onChange={(e) => setNewLang(e.target.value)}
                  className="form-input py-2"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('programming_languages', newLang, setNewLang))}
                />
                <button type="button" onClick={() => addTag('programming_languages', newLang, setNewLang)} className="btn-secondary px-3 py-2 flex items-center justify-center">
                  <Plus className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Technical Skills */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Technical Skills & Frameworks</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.technical_skills.skills.map((skill, index) => (
                  <span key={index} className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                    {skill}
                    <button type="button" onClick={() => removeTag('skills', index)} className="text-purple-400 hover:text-purple-600">×</button>
                  </span>
                ))}
              </div>
              <div className="flex max-w-md gap-2">
                <input
                  type="text"
                  placeholder="e.g. SQL, AWS, React, Django"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="form-input py-2"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('skills', newSkill, setNewSkill))}
                />
                <button type="button" onClick={() => addTag('skills', newSkill, setNewSkill)} className="btn-secondary px-3 py-2 flex items-center justify-center">
                  <Plus className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-900" />

            {/* Dynamic Items: Projects */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Projects</h3>
                <button
                  type="button"
                  onClick={() => addRow('projects', { title: '', description: '' })}
                  className="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Project
                </button>
              </div>
              <div className="space-y-4">
                {profile.technical_skills.projects.map((proj, idx) => (
                  <div key={idx} className="flex gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-900 dark:bg-slate-900/10">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        placeholder="Project Title"
                        value={proj.title}
                        onChange={(e) => handleRowChange('projects', idx, 'title', e.target.value)}
                        className="form-input"
                      />
                      <textarea
                        placeholder="Description (e.g. Built a real-time web portal for recommendation using Python Flask)"
                        value={proj.description}
                        onChange={(e) => handleRowChange('projects', idx, 'description', e.target.value)}
                        className="form-input h-20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow('projects', idx)}
                      className="text-red-500 hover:text-red-700 mt-2 self-start p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                {profile.technical_skills.projects.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No projects added yet.</p>
                )}
              </div>
            </div>

            {/* Dynamic Items: Internships */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Internships</h3>
                <button
                  type="button"
                  onClick={() => addRow('internships', { role: '', company: '', duration: '', description: '' })}
                  className="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Internship
                </button>
              </div>
              <div className="space-y-4">
                {profile.technical_skills.internships.map((intern, idx) => (
                  <div key={idx} className="flex gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-900 dark:bg-slate-900/10">
                    <div className="flex-1 grid gap-3 md:grid-cols-3">
                      <div className="md:col-span-2 grid gap-3 grid-cols-2">
                        <input
                          type="text"
                          placeholder="Role (e.g. Software Engineer Intern)"
                          value={intern.role}
                          onChange={(e) => handleRowChange('internships', idx, 'role', e.target.value)}
                          className="form-input"
                        />
                        <input
                          type="text"
                          placeholder="Company"
                          value={intern.company}
                          onChange={(e) => handleRowChange('internships', idx, 'company', e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Duration (e.g. 3 Months)"
                        value={intern.duration}
                        onChange={(e) => handleRowChange('internships', idx, 'duration', e.target.value)}
                        className="form-input"
                      />
                      <div className="md:col-span-3">
                        <textarea
                          placeholder="Description of responsibilities and achievements"
                          value={intern.description}
                          onChange={(e) => handleRowChange('internships', idx, 'description', e.target.value)}
                          className="form-input h-20"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow('internships', idx)}
                      className="text-red-500 hover:text-red-700 mt-2 self-start p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                {profile.technical_skills.internships.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No internships added yet.</p>
                )}
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-900" />

            {/* Certifications and Hackathons */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Certifications</h3>
                  <button
                    type="button"
                    onClick={() => addRow('certifications', { name: '', issuer: '' })}
                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Row
                  </button>
                </div>
                <div className="space-y-3">
                  {profile.technical_skills.certifications.map((cert, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Certification Name"
                        value={cert.name}
                        onChange={(e) => handleRowChange('certifications', idx, 'name', e.target.value)}
                        className="form-input py-2"
                      />
                      <input
                        type="text"
                        placeholder="Issuer (e.g. AWS)"
                        value={cert.issuer}
                        onChange={(e) => handleRowChange('certifications', idx, 'issuer', e.target.value)}
                        className="form-input py-2"
                      />
                      <button type="button" onClick={() => removeRow('certifications', idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Hackathons</h3>
                  <button
                    type="button"
                    onClick={() => addRow('hackathons', { name: '', description: '' })}
                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Row
                  </button>
                </div>
                <div className="space-y-3">
                  {profile.technical_skills.hackathons.map((hack, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Hackathon Name"
                        value={hack.name}
                        onChange={(e) => handleRowChange('hackathons', idx, 'name', e.target.value)}
                        className="form-input py-2"
                      />
                      <input
                        type="text"
                        placeholder="Details (e.g. Winner/Participant)"
                        value={hack.description}
                        onChange={(e) => handleRowChange('hackathons', idx, 'description', e.target.value)}
                        className="form-input py-2"
                      />
                      <button type="button" onClick={() => removeRow('hackathons', idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Soft Skills & Interests */}
        {activeTab === 'soft' && (
          <div className="space-y-8">
            {/* Soft Skills Sliders (1 to 5) */}
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Soft Skill Proficiencies</h3>
              <div className="grid gap-6 md:grid-cols-2">
                {Object.keys(profile.soft_skills).map((skill) => (
                  <div key={skill} className="rounded-xl border border-slate-100 p-4 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold capitalize text-slate-700 dark:text-slate-300">
                        {skill.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full dark:bg-purple-950/40 dark:text-purple-400">
                        Level {profile.soft_skills[skill]} / 5
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={profile.soft_skills[skill]}
                      onChange={(e) => handleSoftSkillChange(skill, e.target.value)}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:bg-slate-800"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                      <span>Beginner</span>
                      <span>Intermediate</span>
                      <span>Expert</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-900" />

            {/* Career Interests Checklist */}
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">Career Fields & Interests</h3>
              <p className="text-xs text-slate-400 mb-4">Select all fields of interest to orient the recommendations.</p>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {interestOptions.map((interest) => {
                  const isChecked = profile.interests.includes(interest);
                  return (
                    <label 
                      key={interest} 
                      className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
                        isChecked 
                          ? 'border-purple-600 bg-purple-50/20 text-purple-700 dark:border-purple-500 dark:text-purple-400' 
                          : 'border-slate-100 hover:bg-slate-50 dark:border-slate-900 dark:hover:bg-slate-900/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleInterestToggle(interest)}
                        className="form-checkbox text-purple-600 focus:ring-purple-500 rounded border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                      />
                      <span className="text-sm font-semibold">{interest}</span>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* Tab 4: Extracurriculars */}
        {activeTab === 'extra' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Volunteering & Organization Engagements</h3>
            
            {/* Checkbox triggers */}
            <div className="grid gap-4 sm:grid-cols-3">
              <label className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                profile.extracurriculars.ncc ? 'border-purple-600 bg-purple-50/20 text-purple-700 dark:border-purple-500 dark:text-purple-400' : 'border-slate-100 dark:border-slate-900'
              }`}>
                <input
                  type="checkbox"
                  checked={profile.extracurriculars.ncc}
                  onChange={() => handleExtracurricularCheckbox('ncc')}
                  className="form-checkbox"
                />
                <span className="text-sm font-semibold">NCC Participation</span>
              </label>

              <label className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                profile.extracurriculars.nss ? 'border-purple-600 bg-purple-50/20 text-purple-700 dark:border-purple-500 dark:text-purple-400' : 'border-slate-100 dark:border-slate-900'
              }`}>
                <input
                  type="checkbox"
                  checked={profile.extracurriculars.nss}
                  onChange={() => handleExtracurricularCheckbox('nss')}
                  className="form-checkbox"
                />
                <span className="text-sm font-semibold">NSS Participation</span>
              </label>

              <label className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                profile.extracurriculars.event_management ? 'border-purple-600 bg-purple-50/20 text-purple-700 dark:border-purple-500 dark:text-purple-400' : 'border-slate-100 dark:border-slate-900'
              }`}>
                <input
                  type="checkbox"
                  checked={profile.extracurriculars.event_management}
                  onChange={() => handleExtracurricularCheckbox('event_management')}
                  className="form-checkbox"
                />
                <span className="text-sm font-semibold">Event Management</span>
              </label>
            </div>

            <hr className="border-slate-100 dark:border-slate-900" />

            {/* List Inputs (Sports, Club Activities, Volunteer Work, Achievements) */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Sports */}
              <div>
                <label className="form-label">Sports Achievements & Activities</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.extracurriculars.sports.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                      {tag}
                      <button type="button" onClick={() => removeTag('sports', idx, true)} className="text-purple-400 hover:text-purple-600">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Cricket Team Captain, Athletics Winner"
                    value={newSport}
                    onChange={(e) => setNewSport(e.target.value)}
                    className="form-input py-2"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('sports', newSport, setNewSport, true))}
                  />
                  <button type="button" onClick={() => addTag('sports', newSport, setNewSport, true)} className="btn-secondary px-3 py-2">
                    <Plus className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Volunteer Work */}
              <div>
                <label className="form-label">Volunteer Work</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.extracurriculars.volunteering.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                      {tag}
                      <button type="button" onClick={() => removeTag('volunteering', idx, true)} className="text-purple-400 hover:text-purple-600">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Blood Donation Drive, Teaching Kids"
                    value={newVolunteering}
                    onChange={(e) => setNewVolunteering(e.target.value)}
                    className="form-input py-2"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('volunteering', newVolunteering, setNewVolunteering, true))}
                  />
                  <button type="button" onClick={() => addTag('volunteering', newVolunteering, setNewVolunteering, true)} className="btn-secondary px-3 py-2">
                    <Plus className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Club Activities */}
              <div>
                <label className="form-label">Club Activities & Leadership</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.extracurriculars.club_activities.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                      {tag}
                      <button type="button" onClick={() => removeTag('club_activities', idx, true)} className="text-purple-400 hover:text-purple-600">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Coding Club Head, Drama Society Member"
                    value={newClub}
                    onChange={(e) => setNewClub(e.target.value)}
                    className="form-input py-2"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('club_activities', newClub, setNewClub, true))}
                  />
                  <button type="button" onClick={() => addTag('club_activities', newClub, setNewClub, true)} className="btn-secondary px-3 py-2">
                    <Plus className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* General Achievements */}
              <div>
                <label className="form-label">Achievements & Awards</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.extracurriculars.achievements.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                      {tag}
                      <button type="button" onClick={() => removeTag('achievements', idx, true)} className="text-purple-400 hover:text-purple-600">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Dean's List, Hackathon 1st Runner Up"
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    className="form-input py-2"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('achievements', newAchievement, setNewAchievement, true))}
                  />
                  <button type="button" onClick={() => addTag('achievements', newAchievement, setNewAchievement, true)} className="btn-secondary px-3 py-2">
                    <Plus className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
