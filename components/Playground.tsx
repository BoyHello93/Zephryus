import React, { useState } from 'react';
import { ChevronLeft, Play, Award, Loader2, Code2, Monitor, RotateCcw } from 'lucide-react';
import { evaluateBadge } from '../services/geminiService';
import { Badge } from '../types';
import ChatBot from './ChatBot';

interface PlaygroundProps {
  onBack: () => void;
  onAwardBadge: (badge: Badge) => void;
}

const DEFAULT_PLAYGROUND_CODE = `<!-- Welcome to the Playground! -->
<!-- Experiment freely here. -->
<!-- Build something cool and click "Claim Badge" -->

<div class="container">
  <h1>My Creation</h1>
  <div class="box"></div>
</div>

<style>
  body { 
    background: #0f172a; 
    color: white; 
    font-family: sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
  }
  .container { text-align: center; }
  h1 { 
    background: linear-gradient(to right, #818cf8, #6366f1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .box {
    width: 100px;
    height: 100px;
    background: #6366f1;
    margin: 20px auto;
    border-radius: 12px;
    animation: spin 3s infinite linear;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
`;

const Playground: React.FC<PlaygroundProps> = ({ onBack, onAwardBadge }) => {
  const [code, setCode] = useState(DEFAULT_PLAYGROUND_CODE);
  const [iframeKey, setIframeKey] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [badgeResult, setBadgeResult] = useState<{ badge: Badge | null, message: string } | null>(null);

  const handleRun = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleClaimBadge = async () => {
    setIsEvaluating(true);
    setBadgeResult(null);
    try {
        const badge = await evaluateBadge(code);
        if (badge) {
            onAwardBadge(badge);
            setBadgeResult({ badge, message: "Badge Awarded!" });
        } else {
            setBadgeResult({ badge: null, message: "Keep building! Make something a bit more complex to earn a badge." });
        }
    } catch (e) {
        setBadgeResult({ badge: null, message: "AI couldn't evaluate right now." });
    } finally {
        setIsEvaluating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
             <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Code2 size={18} className="text-primary-400" />
                Playground
             </h2>
             <span className="text-[10px] text-slate-500 uppercase tracking-wider">Free Mode</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRun}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors font-semibold text-sm border border-slate-700"
          >
            <Play size={14} className="fill-current" />
            <span>Run</span>
          </button>
          
          <button
            onClick={handleClaimBadge}
            disabled={isEvaluating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white rounded-lg transition-all font-semibold text-sm shadow-lg shadow-amber-900/20"
          >
            {isEvaluating ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
            <span>Claim Badge</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Editor */}
        <div className="flex-1 flex flex-col border-r border-slate-800 bg-[#1e1e2e] relative group">
            <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-[#1e1e2e] text-slate-300 p-6 font-mono text-sm resize-none focus:outline-none custom-scrollbar leading-relaxed"
                spellCheck={false}
                placeholder="Write your code..."
            />
            {/* Overlay for Badge Result */}
            {badgeResult && (
                <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 p-4 rounded-xl shadow-2xl animate-in slide-in-from-top-2 max-w-xs z-30">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-bold ${badgeResult.badge ? 'text-yellow-400' : 'text-slate-400'}`}>
                            {badgeResult.badge ? "Badge Unlocked!" : "Feedback"}
                        </h3>
                        <button onClick={() => setBadgeResult(null)} className="text-slate-500 hover:text-white">&times;</button>
                    </div>
                    {badgeResult.badge ? (
                        <div className="text-center">
                            <div className="text-4xl mb-2">{badgeResult.badge.icon || "🏆"}</div>
                            <div className="font-bold text-white mb-1">{badgeResult.badge.name}</div>
                            <div className="text-xs text-slate-400">{badgeResult.badge.description}</div>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-300">{badgeResult.message}</p>
                    )}
                </div>
            )}
        </div>

        {/* Preview */}
        <div className="flex-1 flex flex-col bg-white">
           <div className="h-9 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2 text-xs text-slate-500 select-none shrink-0">
                <Monitor size={14} />
                <span className="font-semibold text-slate-600">Browser Output</span>
           </div>
           <iframe
              key={iframeKey}
              title="Preview"
              srcDoc={code}
              className="w-full h-full border-none"
              sandbox="allow-scripts" 
            />
        </div>
      </div>

      <ChatBot />
    </div>
  );
};

export default Playground;