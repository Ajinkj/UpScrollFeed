import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Brain, Play, Square, RotateCcw, Activity, CheckCircle2, XCircle } from 'lucide-react';

export default function NBackGame({ onComplete }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [nLevel, setNLevel] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [activeSquare, setActiveSquare] = useState(null);
  const [score, setScore] = useState(0);
  const [turn, setTurn] = useState(0);
  const [feedback, setFeedback] = useState(null); // 'success', 'error', 'missed'
  const [gameOver, setGameOver] = useState(false);
  const [stats, setStats] = useState({ hits: 0, misses: 0, falseAlarms: 0 });

  const MAX_TURNS = 20;
  const TURN_DURATION = 2500; // 2.5 seconds per turn
  const VISIBLE_DURATION = 1500; // Square stays lit for 1.5s

  // Use refs for state that needs to be checked inside intervals without causing re-renders
  const respondedThisTurn = useRef(false);
  const currentSequence = useRef([]);
  const timerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const scoreRef = useRef(0);
  const statsRef = useRef({ hits: 0, misses: 0, falseAlarms: 0 });

  // Update refs when state changes to ensure intervals have latest values
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { statsRef.current = stats; }, [stats]);

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setSequence([]);
    currentSequence.current = [];
    setScore(0);
    setTurn(1);
    setStats({ hits: 0, misses: 0, falseAlarms: 0 });
    setFeedback(null);
    respondedThisTurn.current = false;
    processTurn(1);
  };

  const stopGame = useCallback(() => {
    setIsPlaying(false);
    setGameOver(true);
    setActiveSquare(null);
    clearInterval(timerRef.current);
    clearTimeout(hideTimerRef.current);
    if (onComplete) {
      onComplete(scoreRef.current, statsRef.current);
    }
  }, [onComplete]);

  const processTurn = useCallback((currentTurn) => {
    if (currentTurn > MAX_TURNS) {
      stopGame();
      return;
    }

    // Check for missed matches on the PREVIOUS turn
    const seq = currentSequence.current;
    if (seq.length > nLevel && !respondedThisTurn.current) {
      const prevSquare = seq[seq.length - 1];
      const targetSquare = seq[seq.length - 1 - nLevel];
      if (prevSquare === targetSquare) {
        setStats(s => ({ ...s, misses: s.misses + 1 }));
        setScore(s => Math.max(0, s - 50));
        setFeedback('missed');
        setTimeout(() => setFeedback(null), 800);
      }
    }

    // Reset response tracker for the new turn
    respondedThisTurn.current = false;

    // Generate next square (35% chance to force a match if possible)
    let nextSquare;
    const shouldForceMatch = Math.random() < 0.35;

    if (shouldForceMatch && seq.length >= nLevel) {
      nextSquare = seq[seq.length - nLevel];
    } else {
      nextSquare = Math.floor(Math.random() * 9);
      // Try not to accidentally create a match if we didn't want one
      if (seq.length >= nLevel && nextSquare === seq[seq.length - nLevel]) {
        nextSquare = (nextSquare + 1) % 9; 
      }
    }

    const newSeq = [...seq, nextSquare];
    currentSequence.current = newSeq;
    setSequence(newSeq);
    setActiveSquare(nextSquare);
    setTurn(currentTurn);

    // Hide the square after VISIBLE_DURATION
    hideTimerRef.current = setTimeout(() => {
      setActiveSquare(null);
    }, VISIBLE_DURATION);

    // Schedule next turn
    timerRef.current = setTimeout(() => {
      processTurn(currentTurn + 1);
    }, TURN_DURATION);

  }, [nLevel, stopGame]);

  // Handle user trying to match
  const handleMatchClick = () => {
    if (!isPlaying || respondedThisTurn.current || currentSequence.current.length <= nLevel) return;
    
    respondedThisTurn.current = true;
    const seq = currentSequence.current;
    const currentSq = seq[seq.length - 1];
    const targetSq = seq[seq.length - 1 - nLevel];

    if (currentSq === targetSq) {
      // Correct Match!
      setScore(s => s + 100);
      setStats(s => ({ ...s, hits: s.hits + 1 }));
      setFeedback('success');
    } else {
      // False Alarm!
      setScore(s => Math.max(0, s - 50));
      setStats(s => ({ ...s, falseAlarms: s.falseAlarms + 1 }));
      setFeedback('error');
    }

    setTimeout(() => setFeedback(null), 800);
  };

  // Keyboard shortcut (Spacebar for match)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleMatchClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <div className="h-full w-full bg-slate-900 text-slate-100 flex flex-col items-center py-12 px-4 font-sans selection:bg-indigo-500/30 overflow-y-auto no-scrollbar">
      
      {/* Header */}
      <div className="max-w-2xl w-full text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/20 rounded-2xl mb-4 text-indigo-400">
          <Brain size={32} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Cognitive N-Back</h1>
        <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base">
          Boost your working memory and fluid intelligence. Does the current lit square match the one from <strong className="text-indigo-400">{nLevel} step{nLevel > 1 ? 's' : ''} ago</strong>?
        </p>
      </div>

      {/* Main Game Interface */}
      <div className="w-full max-w-md bg-slate-800 rounded-3xl p-6 shadow-2xl shadow-indigo-900/20 border border-slate-700">
        
        {/* Top Bar (Score & Status) */}
        <div className="flex justify-between items-center mb-8 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Score</span>
            <span className="text-2xl font-black text-indigo-400">{score}</span>
          </div>
          
          <div className="flex flex-col items-end">
             <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">
               {isPlaying ? `Turn ${turn}/${MAX_TURNS}` : 'Ready'}
             </span>
             {isPlaying && (
               <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden mt-2">
                 <div 
                   className="h-full bg-indigo-500 transition-all duration-300" 
                   style={{ width: `${(turn / MAX_TURNS) * 100}%` }}
                 />
               </div>
             )}
          </div>
        </div>

        {/* The Grid */}
        <div className="relative mb-8">
          {/* Feedback Overlay */}
          {feedback && (
            <div className={`absolute -inset-4 rounded-3xl z-0 transition-opacity duration-300 ${
              feedback === 'success' ? 'bg-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : 
              feedback === 'error' ? 'bg-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.3)]' : 
              'bg-orange-500/20' // missed
            }`} />
          )}

          <div className="relative z-10 grid grid-cols-3 gap-3 aspect-square max-w-[300px] mx-auto p-4 bg-slate-900 rounded-2xl border border-slate-700">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div 
                key={i} 
                className={`rounded-xl transition-all duration-150 ${
                  activeSquare === i 
                    ? 'bg-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.6)] scale-105 border-2 border-indigo-300' 
                    : 'bg-slate-800 border-2 border-slate-700/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">
          {!isPlaying && !gameOver && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between bg-slate-900 rounded-xl p-2 border border-slate-700/50">
                <span className="text-sm text-slate-400 pl-3 font-medium">Difficulty Level:</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setNLevel(lvl)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
                        nLevel === lvl 
                          ? 'bg-indigo-500 text-white' 
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={startGame}
                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Play size={20} fill="currentColor" />
                Start Training
              </button>
            </div>
          )}

          {isPlaying && (
            <button 
              onClick={handleMatchClick}
              disabled={currentSequence.current.length <= nLevel}
              className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold text-xl transition-all active:scale-95 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20"
            >
              <span>Match!</span>
              <span className="text-xs font-normal opacity-80 mt-1">(or press Spacebar)</span>
            </button>
          )}

          {gameOver && (
             <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                 <h3 className="text-center font-bold text-lg text-slate-200 mb-4">Training Complete</h3>
                 <div className="grid grid-cols-3 gap-2 text-center text-sm">
                   <div className="bg-slate-800 p-2 rounded-lg">
                     <span className="block text-emerald-400 font-bold text-xl">{stats.hits}</span>
                     <span className="text-slate-500 text-xs uppercase">Hits</span>
                   </div>
                   <div className="bg-slate-800 p-2 rounded-lg">
                     <span className="block text-rose-400 font-bold text-xl">{stats.falseAlarms}</span>
                     <span className="text-slate-500 text-xs uppercase">Errors</span>
                   </div>
                   <div className="bg-slate-800 p-2 rounded-lg">
                     <span className="block text-orange-400 font-bold text-xl">{stats.misses}</span>
                     <span className="text-slate-500 text-xs uppercase">Missed</span>
                   </div>
                 </div>
               </div>
               
               <button 
                onClick={startGame}
                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
              >
                <RotateCcw size={20} />
                Play Again
              </button>
             </div>
          )}
        </div>

      </div>

      {/* Instructions footer */}
      <div className="max-w-md w-full mt-8 text-center text-sm text-slate-500 pb-12">
        <p>
          <strong>How to play:</strong> Watch the sequence of flashing squares. Tap "Match!" if the current square is in the exact same position as it was <strong className="text-indigo-400">{nLevel} step{nLevel > 1 ? 's' : ''}</strong> ago.
        </p>
      </div>
    </div>
  );
}