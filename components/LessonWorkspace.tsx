
import React, { useState, useEffect, useCallback } from 'react';
import { Lesson, AppSettings } from '../types';
import { ChevronLeft, Play, CheckCircle, RotateCcw, Code2, Monitor, BookOpen, AlertCircle, ArrowRight, Lightbulb } from 'lucide-react';
import { checkCode } from '../services/geminiService';
import ChatBot from './ChatBot';

interface LessonWorkspaceProps {
  lesson: Lesson;
  onBack: () => void;
  onComplete: (lessonId: string, code: string) => void;
  settings: AppSettings;
}

type MobileTab = 'guide' | 'code' | 'preview';

const LessonWorkspace: React.FC<LessonWorkspaceProps> = ({ lesson, onBack, onComplete, settings }) => {
  // Use userCode if available (editing), otherwise initialCode
  const [code, setCode] = useState(lesson.userCode || lesson.initialCode);
  const [mobileTab, setMobileTab] = useState<MobileTab>('guide'); 
  const [isRunning, setIsRunning] = useState(false);
  const [checkResult, setCheckResult] = useState<{ passed: boolean; feedback: string } | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    // Reset state when lesson changes
    let initialCode = lesson.userCode || lesson.initialCode;

    // Logic to ensure insertion hint marker exists if setting is on
    if (settings.showInsertionHints && !initialCode.includes('<!-- Write code here -->') && !lesson.userCode) {
         if (initialCode.includes('<body>')) {
             initialCode = initialCode.replace('<body>', '<body>\n  <!-- Write code here -->');
         } else if (initialCode.includes('<div id="app">')) {
             initialCode = initialCode.replace('<div id="app">', '<div id="app">\n  <!-- Write code here -->');
         } else {
             // Fallback to append if no structure found, or empty
             if (initialCode.trim() === '') {
                 initialCode = '<!-- Write code here -->';
             } else {
                 initialCode = initialCode + '\n\n<!-- Write code here -->';
             }
         }
    }

    setCode(initialCode);
    setCheckResult(null);
    setMobileTab('guide');
  }, [lesson, settings.showInsertionHints]);

  const handleRun = useCallback(() => {
    setIframeKey(prev => prev + 1);
    // On mobile, switch to preview after run so they see the result immediately
    if (window.innerWidth < 768) {
        setMobileTab('preview');
    }
  }, []);

  const handleMainAction = async () => {
    if (checkResult?.passed) {
        onComplete(lesson.id, code);
        return;
    }
    
    setIsRunning(true);
    setCheckResult(null);
    const result = await checkCode(code, lesson.instructions, `Task: ${lesson.title}`);
    setCheckResult(result);
    setIsRunning(false);
    
    // Switch to guide to show result on mobile if passed or failed
    if (window.innerWidth < 768) {
        setMobileTab('guide');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col min-w-0">
             <h2 className="font-bold text-sm md:text-base truncate text-slate-100">{lesson.title}</h2>
             <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${checkResult?.passed ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                <span className="text-[10px] text-slate-500 truncate uppercase tracking-wider">{checkResult?.passed ? 'Completed' : 'In Progress'}</span>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={() => setCode(lesson.initialCode)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors hidden sm:block"
            title="Reset Code"
          >
            <RotateCcw size={18} />
          </button>
          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block"></div>
          
          <button
            onClick={handleRun}
            className="flex items-center gap-2 px-3 py-2 md:px-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors font-semibold text-xs md:text-sm border border-slate-700"
          >
            <Play size={14} className="fill-current" />
            <span>Run</span>
          </button>
          
          <button
            onClick={handleMainAction}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-semibold text-xs md:text-sm shadow-lg ${
              checkResult?.passed 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-900/30' 
                : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-900/30'
            }`}
          >
            {isRunning ? (
              <span className="animate-pulse">Checking...</span>
            ) : checkResult?.passed ? (
               <>
                <span>Next Lesson</span>
                <ArrowRight size={16} />
               </>
            ) : (
               <>
                <CheckCircle size={16} />
                <span>Submit</span>
               </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace - Responsive Layout */}
      <div className="flex-1 flex overflow-hidden relative bg-slate-950">
        
        {/* 1. GUIDE PANEL (Unified Task + Concept) */}
        <div className={`
            flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300
            ${mobileTab === 'guide' ? 'absolute inset-0 z-10 w-full flex' : 'hidden'}
            md:flex md:relative md:w-1/4 md:min-w-[320px] md:inset-auto md:z-0
        `}>
          <div className="flex items-center gap-2 p-4 border-b border-slate-800 bg-slate-900">
             <BookOpen size={18} className="text-primary-400" />
             <span className="font-bold text-sm text-slate-200">Guide</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 pb-24 md:pb-6 custom-scrollbar space-y-6">
            
            {/* Concept Section - Only shown if tips are enabled */}
            {settings.showTips && (
              <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4 animate-in fade-in slide-in-from-left-4">
                  <h3 className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Lightbulb size={14} /> Core Concept
                  </h3>
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {lesson.concept}
                  </div>
              </div>
            )}

            {/* Task Section */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Your Mission</h3>
              
              {/* Result Feedback Banner */}
              {checkResult && (
                <div className={`p-4 rounded-xl border animate-in zoom-in-95 duration-200 shadow-md mb-4 ${
                  checkResult.passed 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' 
                    : 'bg-red-500/10 border-red-500/30 text-red-100'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0">
                      {checkResult.passed ? <CheckCircle size={20} className="text-emerald-400" /> : <AlertCircle size={20} className="text-red-400" />}
                    </div>
                    <div className="w-full">
                      <p className="font-bold text-sm">{checkResult.passed ? "Excellent work!" : "Not quite there"}</p>
                      <p className="text-sm opacity-90 mt-1 leading-relaxed">{checkResult.feedback}</p>
                      {checkResult.passed && (
                        <button 
                          onClick={() => onComplete(lesson.id, code)}
                          className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-semibold text-xs uppercase tracking-wide transition-colors shadow-lg"
                        >
                          Continue to Next Lesson
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/50">
                <div className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed prose prose-invert max-w-none">
                  {lesson.instructions}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 2. CODE EDITOR */}
        <div className={`
            flex-col border-r border-slate-800 bg-[#1e1e2e]
            ${mobileTab === 'code' ? 'absolute inset-0 z-10 w-full flex' : 'hidden'}
            md:flex md:relative md:flex-1 md:inset-auto md:z-0
        `}>
            <div className="h-9 bg-[#181825] flex items-center justify-between px-4 text-xs text-slate-500 select-none shrink-0 border-b border-[#2a2a3c]">
                <div className="flex items-center gap-2 text-slate-400">
                    <Code2 size={14} />
                    <span className="font-mono">index.html</span>
                </div>
                <span className="opacity-50">UTF-8</span>
            </div>

            {/* Insertion Hint Banner */}
            {settings.showInsertionHints && (
                <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-1.5 text-[10px] text-yellow-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <Lightbulb size={12} className="text-yellow-400" />
                    <span>💡 Tip: Insert your code between the <span className="font-mono bg-yellow-500/20 px-1 rounded mx-0.5 text-yellow-100">&lt;!-- Write code here --&gt;</span> tags</span>
                </div>
            )}

            <div className="flex-1 relative">
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="absolute inset-0 w-full h-full bg-[#1e1e2e] text-slate-300 p-4 md:p-6 font-mono text-sm resize-none focus:outline-none custom-scrollbar leading-relaxed"
                    spellCheck={false}
                    placeholder={settings.showTips ? "<!-- Write your code here -->" : ""}
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                    style={{ paddingBottom: '5rem' }} // Space for mobile nav
                />
            </div>
        </div>

        {/* 3. PREVIEW */}
        <div className={`
            flex-col bg-white
            ${mobileTab === 'preview' ? 'absolute inset-0 z-10 w-full flex' : 'hidden'}
            md:flex md:relative md:w-1/3 md:min-w-[320px] md:inset-auto md:z-0
        `}>
          <div className="h-9 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2 text-xs text-slate-500 select-none shrink-0">
            <Monitor size={14} />
            <span className="font-semibold text-slate-600">Browser Output</span>
            <div className="ml-auto flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
            </div>
          </div>
          <div className="flex-1 bg-white relative">
            <iframe
              key={iframeKey}
              title="Preview"
              srcDoc={code}
              className="w-full h-full border-none"
              sandbox="allow-scripts" 
              style={{ paddingBottom: mobileTab === 'preview' ? '4rem' : '0' }}
            />
          </div>
        </div>

        {/* Mobile Tab Navigation (Bottom Bar) */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex justify-around p-2 pb-safe z-50">
            <button 
                onClick={() => setMobileTab('guide')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-all w-full active:scale-95 ${mobileTab === 'guide' ? 'text-primary-400 bg-primary-500/10' : 'text-slate-500'}`}
            >
                <BookOpen size={20} />
                <span>Guide</span>
            </button>
            <button 
                onClick={() => setMobileTab('code')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-all w-full active:scale-95 ${mobileTab === 'code' ? 'text-primary-400 bg-primary-500/10' : 'text-slate-500'}`}
            >
                <Code2 size={20} />
                <span>Code</span>
            </button>
            <button 
                onClick={() => setMobileTab('preview')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-all w-full active:scale-95 ${mobileTab === 'preview' ? 'text-primary-400 bg-primary-500/10' : 'text-slate-500'}`}
            >
                <Monitor size={20} />
                <span>Preview</span>
            </button>
        </div>
      </div>

      <ChatBot currentLesson={lesson} />
    </div>
  );
};

export default LessonWorkspace;
