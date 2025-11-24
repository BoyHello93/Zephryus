
import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Code, Zap, Layers, Trash2, Settings as SettingsIcon, X, Terminal, Award, BookOpen, User, GraduationCap, CheckCircle2, TrendingUp, Clock, Calendar, CheckSquare, ToggleLeft, ToggleRight, Palette } from 'lucide-react';
import { Difficulty, CourseLength, Course, AppSettings, Badge, Theme } from '../types';
import { getSavedCourses, deleteCourseFromStorage, getSavedBadges } from '../services/storage';

interface LandingProps {
  onGenerate: (prompt: string, difficulty: Difficulty, length: CourseLength) => void;
  onResume: (course: Course) => void;
  onEnterPlayground: () => void;
  isGenerating: boolean;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

const Landing: React.FC<LandingProps> = ({ onGenerate, onResume, onEnterPlayground, isGenerating, settings, onUpdateSettings }) => {
  const [activeTab, setActiveTab] = useState<'new' | 'saved' | 'badges'>('new');
  const [prompt, setPrompt] = useState('');
  
  // Continuous Slider states (0-100)
  const [difficultyValue, setDifficultyValue] = useState(20); 
  const [lengthValue, setLengthValue] = useState(50); 

  const [progress, setProgress] = useState(0);
  const [savedCourses, setSavedCourses] = useState<Course[]>([]);
  const [savedBadges, setSavedBadges] = useState<Badge[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // Load saved data
    setSavedCourses(getSavedCourses());
    setSavedBadges(getSavedBadges());
  }, [activeTab]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isGenerating) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev; 
          const increment = Math.max(0.5, (95 - prev) / 20);
          return prev + increment;
        });
      }, 200);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Convert 0-100 range to buckets
  const getDifficultyFromValue = (val: number): Difficulty => {
      if (val < 25) return 'novice';
      if (val < 50) return 'beginner';
      if (val < 75) return 'intermediate';
      return 'advanced';
  }

  const getLengthFromValue = (val: number): CourseLength => {
      if (val < 33) return 'short';
      if (val < 66) return 'medium';
      return 'long';
  }
  
  const getDifficultyLabel = (val: number) => {
     if (val < 25) return { label: 'Novice', desc: 'Hand-holding, copy & paste style' };
     if (val < 50) return { label: 'Beginner', desc: 'Guided tasks, simple concepts' };
     if (val < 75) return { label: 'Intermediate', desc: 'Independent problem solving' };
     return { label: 'Advanced', desc: 'Complex logic & patterns' };
  }

  const getLengthLabel = (val: number) => {
      if (val < 33) return { label: 'Crash Course', desc: 'Quick start (3-4 lessons)' };
      if (val < 66) return { label: 'Standard', desc: 'Balanced depth (6-8 lessons)' };
      return { label: 'Deep Dive', desc: 'Comprehensive (10-15 lessons)' };
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt, getDifficultyFromValue(difficultyValue), getLengthFromValue(lengthValue));
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const updated = deleteCourseFromStorage(id);
      setSavedCourses(updated);
  }

  const currentDiff = getDifficultyLabel(difficultyValue);
  const currentLen = getLengthLabel(lengthValue);

  return (
    <div className="h-full bg-slate-950 text-white flex flex-col relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-96 bg-primary-900/20 blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-full h-96 bg-secondary-900/20 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="p-4 md:px-12 flex justify-between items-center relative z-20 shrink-0 bg-slate-950/50 backdrop-blur-sm border-b border-slate-800/50">
        <div className="flex items-center gap-3 font-bold text-lg md:text-xl tracking-tight">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-tr from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Zap size={20} className="text-white fill-current" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Zephyrus AI</span>
        </div>
        
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <SettingsIcon size={20} />
        </button>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
        <div className="flex flex-col items-center px-4 text-center max-w-5xl mx-auto w-full pb-24 pt-8">
          
          {/* Tab Switcher */}
          <div className="bg-slate-900/80 p-1 rounded-xl border border-slate-800 mb-8 flex gap-1 animate-in slide-in-from-top-4 sticky top-0 z-30 shadow-2xl backdrop-blur-md overflow-x-auto max-w-full">
              <button 
                  onClick={() => setActiveTab('new')}
                  className={`px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'new' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                  New Course
              </button>
              <button 
                  onClick={() => setActiveTab('saved')}
                  className={`px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'saved' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                  My Courses
                  {savedCourses.length > 0 && <span className="bg-white/20 px-1.5 rounded-full text-[10px] md:text-xs">{savedCourses.length}</span>}
              </button>
              <button 
                  onClick={() => setActiveTab('badges')}
                  className={`px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'badges' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                  Badges
                  {savedBadges.length > 0 && <span className="bg-yellow-500/20 text-yellow-200 px-1.5 rounded-full text-[10px] md:text-xs">{savedBadges.length}</span>}
              </button>
          </div>

          {activeTab === 'new' && (
            <div className="w-full max-w-4xl flex flex-col items-center animate-in fade-in duration-300">
              <div className="hidden md:inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-primary-300 mb-8 shadow-sm">
                <Sparkles size={12} />
                <span>AI-Powered Curriculum Generator</span>
              </div>

              <h1 className="text-3xl md:text-6xl font-extrabold tracking-tight mb-4 md:mb-6 leading-tight max-w-4xl">
              Learn to code by building <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-purple-400 to-secondary-400">
                  exactly what you want.
              </span>
              </h1>

              <p className="text-sm md:text-xl text-slate-400 mb-8 md:mb-12 max-w-2xl px-4">
              Type your project idea, adjust the difficulty, and we'll generate a custom interactive course for you instantly.
              </p>

              {/* Input Area */}
              <div className="w-full max-w-xl px-2">
                <form onSubmit={handleSubmit} className="w-full relative group z-20">
                    <div className={`absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-purple-500 rounded-2xl blur opacity-30 transition duration-1000 ${isGenerating ? 'opacity-60 animate-pulse' : 'group-hover:opacity-60'}`}></div>
                    <div className="relative flex flex-col bg-slate-900/90 backdrop-blur-xl rounded-xl p-2 border border-slate-700 shadow-2xl">
                      <input
                          type="text"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="e.g., Build a Pomodoro Timer..."
                          className="w-full bg-transparent border-none text-white placeholder-slate-500 px-4 py-3 focus:outline-none focus:ring-0 text-base md:text-lg font-medium"
                          disabled={isGenerating}
                      />
                      <button
                          type="submit"
                          disabled={!prompt.trim() || isGenerating}
                          className="w-full bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary-900/20"
                      >
                          {isGenerating ? (
                          <div className="flex items-center gap-2">
                             <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                             <span>Creating Course...</span>
                          </div>
                          ) : (
                          <>
                              <span>Generate Course</span>
                              <ArrowRight size={18} />
                          </>
                          )}
                      </button>
                    </div>
                </form>

                {/* Sliders Section */}
                {!isGenerating && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-in fade-in slide-in-from-bottom-4">
                        {/* Continuous Difficulty Slider */}
                        <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 flex flex-col items-center hover:border-slate-700 transition-colors">
                            <div className="flex justify-between w-full mb-4 items-end">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Layers size={14} /> Difficulty
                                </label>
                                <div className="text-right">
                                    <span className="block text-primary-400 font-bold text-sm">{currentDiff.label}</span>
                                    <span className="block text-[10px] text-slate-500">{currentDiff.desc}</span>
                                </div>
                            </div>
                            <div className="w-full px-2 relative">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={difficultyValue}
                                    onChange={(e) => setDifficultyValue(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500 hover:accent-primary-400"
                                />
                                <div className="absolute top-0 left-0 h-2 bg-gradient-to-r from-primary-800 to-primary-500 rounded-lg pointer-events-none opacity-20" style={{width: `${difficultyValue}%`}}></div>
                            </div>
                        </div>

                        {/* Continuous Length Slider */}
                        <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 flex flex-col items-center hover:border-slate-700 transition-colors">
                            <div className="flex justify-between w-full mb-4 items-end">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Clock size={14} /> Course Length
                                </label>
                                <div className="text-right">
                                    <span className="block text-primary-400 font-bold text-sm">{currentLen.label}</span>
                                    <span className="block text-[10px] text-slate-500">{currentLen.desc}</span>
                                </div>
                            </div>
                            <div className="w-full px-2 relative">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={lengthValue}
                                    onChange={(e) => setLengthValue(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500 hover:accent-primary-400"
                                />
                                <div className="absolute top-0 left-0 h-2 bg-gradient-to-r from-primary-800 to-primary-500 rounded-lg pointer-events-none opacity-20" style={{width: `${lengthValue}%`}}></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress Bar with Estimated Time */}
                {isGenerating && (
                    <div className="mt-8 w-full bg-slate-900/50 p-6 rounded-2xl border border-slate-800 animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-end text-sm text-slate-300 mb-3 font-medium">
                        <span className="flex items-center gap-2">
                            <Sparkles size={14} className="text-primary-400" />
                            Generating Curriculum...
                        </span>
                        <span className="font-mono">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                        <div 
                        className="h-full bg-gradient-to-r from-primary-500 via-purple-500 to-secondary-500 transition-all duration-300 ease-out relative"
                        style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-4 italic text-center">
                        Writing lessons, generating starting code...
                    </p>
                    </div>
                )}

                {/* Playground Card */}
                {!isGenerating && (
                    <div className="mt-6 w-full animate-in slide-in-from-bottom-6">
                        <div 
                           onClick={onEnterPlayground}
                           className="bg-gradient-to-r from-slate-900 to-primary-950/30 p-4 rounded-2xl border border-slate-700/50 cursor-pointer hover:border-primary-500/50 transition-all group relative overflow-hidden text-left shadow-lg hover:shadow-primary-900/20"
                        >
                             <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Code size={80} />
                             </div>
                             <div className="relative z-10 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                        <Terminal size={18} className="text-primary-400" />
                                        Code Playground
                                    </h3>
                                    <p className="text-slate-400 text-xs mt-1">Practice freely and earn badges.</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-primary-600 transition-colors">
                                    <ArrowRight size={14} />
                                </div>
                             </div>
                        </div>
                    </div>
                )}

              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {savedCourses.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center text-slate-500 py-20">
                    <Layers size={48} className="mb-4 opacity-50" />
                    <p>No courses started yet.</p>
                </div>
              ) : (
                savedCourses.map(course => (
                  <div 
                    key={course.id}
                    onClick={() => onResume(course)}
                    className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-primary-500/50 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:bg-primary-600 transition-colors">
                            <Code size={20} />
                        </div>
                        <button 
                            onClick={(e) => handleDelete(e, course.id)}
                            className="p-2 hover:bg-red-500/10 hover:text-red-400 text-slate-600 rounded-lg transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2 line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">{course.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-auto pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-1">
                            <Layers size={12} />
                            <span>{course.modules.length} Modules</span>
                        </div>
                        <div className="flex items-center gap-1">
                             <CheckCircle2 size={12} />
                             <span>{Math.round((course.modules.reduce((acc, m) => acc + m.lessons.filter(l => l.completed).length, 0) / Math.max(1, course.modules.reduce((acc, m) => acc + m.lessons.length, 0))) * 100)}%</span>
                        </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'badges' && (
              <div className="w-full max-w-4xl animate-in fade-in duration-300">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {savedBadges.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center text-slate-500 py-20">
                            <Award size={48} className="mb-4 opacity-50" />
                            <p>No badges earned yet. Use the Playground!</p>
                        </div>
                      ) : (
                          savedBadges.map(badge => (
                              <div key={badge.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center text-center hover:border-yellow-500/50 transition-colors">
                                  <div className="text-4xl mb-2 filter drop-shadow-md">{badge.icon}</div>
                                  <div className="font-bold text-slate-200 text-sm">{badge.name}</div>
                                  <div className="text-[10px] text-slate-500 mt-1">{badge.description}</div>
                              </div>
                          ))
                      )}
                   </div>
              </div>
          )}
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <SettingsIcon size={20} className="text-primary-400" />
              App Settings
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <Palette size={20} className="text-pink-400" />
                  <div>
                    <h3 className="font-bold text-slate-200 text-sm">Theme</h3>
                    <p className="text-xs text-slate-400">Choose your vibe</p>
                  </div>
                </div>
                <div className="flex gap-2">
                    {(['zephyr', 'sunset', 'ocean', 'forest', 'crimson'] as Theme[]).map(t => (
                        <button
                            key={t}
                            onClick={() => onUpdateSettings({ ...settings, theme: t })}
                            className={`w-6 h-6 rounded-full border-2 ${settings.theme === t ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'} transition-all`}
                            style={{ 
                                backgroundColor: 
                                    t === 'zephyr' ? '#6366f1' : 
                                    t === 'sunset' ? '#f43f5e' : 
                                    t === 'ocean' ? '#06b6d4' : 
                                    t === 'forest' ? '#22c55e' :
                                    '#ef4444'
                            }}
                            title={t}
                        />
                    ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <BookOpen size={20} className="text-indigo-400" />
                  <div>
                    <h3 className="font-bold text-slate-200 text-sm">Learning Tips</h3>
                    <p className="text-xs text-slate-400">Show concept explanations in lessons</p>
                  </div>
                </div>
                <button 
                  onClick={() => onUpdateSettings({ ...settings, showTips: !settings.showTips })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.showTips ? 'bg-primary-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.showTips ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <Code size={20} className="text-emerald-400" />
                  <div>
                    <h3 className="font-bold text-slate-200 text-sm">Insertion Hints</h3>
                    <p className="text-xs text-slate-400">Show where to write code</p>
                  </div>
                </div>
                <button 
                  onClick={() => onUpdateSettings({ ...settings, showInsertionHints: !settings.showInsertionHints })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.showInsertionHints ? 'bg-primary-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.showInsertionHints ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-slate-500">
                Zephyrus AI v2.0 • Powered by Gemini
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;