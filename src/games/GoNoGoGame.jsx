import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Brain, Play, RotateCcw, Heart, Zap, ShieldAlert, Target } from 'lucide-react';

const MAX_STRIKES = 3;
const GO_PROBABILITY = 0.75; // 75% of signals will be "Go" to build a physical habit
const INITIAL_SPEED = 1200; // ms
const MIN_SPEED = 400; // ms

export default function GoNoGoGame({ onComplete }) {
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'gameover'
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  
  const [target, setTarget] = useState(null); // { id: number, type: 'go' | 'nogo' }
  const [feedback, setFeedback] = useState(null); // 'success', 'error'

  const gameLoopRef = useRef(null);
  const activeTargetTimerRef = useRef(null);
  const targetCounter = useRef(0);
  const isPlayingRef = useRef(false);

  // Clean up timers
  const clearTimers = useCallback(() => {
    if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    if (activeTargetTimerRef.current) clearTimeout(activeTargetTimerRef.current);
  }, []);

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  const scoreRef = useRef(0);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const stopGame = useCallback(() => {
    setGameState('gameover');
    isPlayingRef.current = false;
    setTarget(null);
    clearTimers();
    if (onComplete) {
      onComplete(scoreRef.current, {});
    }
  }, [clearTimers, onComplete]);

  const addStrike = useCallback(() => {
    setStrikes(s => {
      const newStrikes = s + 1;
      if (newStrikes >= MAX_STRIKES) {
        stopGame();
      }
      return newStrikes;
    });
    setFeedback('error');
    setTimeout(() => setFeedback(null), 300);
  }, [stopGame]);

  const scheduleNextTarget = useCallback((currentSpeed) => {
    if (!isPlayingRef.current) return;
    
    // Random gap between 300ms and 800ms to prevent rhythmic predictability
    const gap = Math.random() * 500 + 300; 
    
    gameLoopRef.current = setTimeout(() => {
      spawnTarget(currentSpeed);
    }, gap);
  }, []);

  const spawnTarget = useCallback((currentSpeed) => {
    if (!isPlayingRef.current) return;

    targetCounter.current += 1;
    const isGo = Math.random() < GO_PROBABILITY;
    const newTarget = { id: targetCounter.current, type: isGo ? 'go' : 'nogo' };
    
    setTarget(newTarget);

    // Set how long the user has to react
    activeTargetTimerRef.current = setTimeout(() => {
      handleTargetExpiry(newTarget, currentSpeed);
    }, currentSpeed);

  }, []);

  const handleTargetExpiry = useCallback((expiredTarget, currentSpeed) => {
    if (!isPlayingRef.current) return;

    setTarget(null);

    if (expiredTarget.type === 'go') {
      // Missed a GO signal
      addStrike();
    } else {
      // Successfully ignored a NO-GO signal!
      setScore(s => s + 15);
      setFeedback('success');
      setTimeout(() => setFeedback(null), 300);
    }

    scheduleNextTarget(currentSpeed);
  }, [addStrike, scheduleNextTarget]);

  const handleInteraction = useCallback(() => {
    if (!isPlayingRef.current) return;

    // Clicked while nothing is on screen (spam penalty)
    if (!target) {
      addStrike();
      return;
    }

    clearTimeout(activeTargetTimerRef.current);
    setTarget(null);

    if (target.type === 'go') {
      // Correctly hit a GO signal
      setScore(s => {
        const newScore = s + 10;
        // Increase speed slightly every 50 points
        if (newScore % 50 === 0) {
          setSpeed(prev => Math.max(MIN_SPEED, prev * 0.9));
        }
        return newScore;
      });
      setFeedback('success');
    } else {
      // Incorrectly hit a NO-GO signal (Impulse failure)
      addStrike();
    }

    setTimeout(() => setFeedback(null), 300);
    scheduleNextTarget(speed);

  }, [target, addStrike, scheduleNextTarget, speed]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setStrikes(0);
    setSpeed(INITIAL_SPEED);
    setTarget(null);
    setFeedback(null);
    isPlayingRef.current = true;
    
    // Initial delay before first spawn
    setTimeout(() => scheduleNextTarget(INITIAL_SPEED), 1000);
  };

  // Keyboard shortcut (Spacebar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && gameState === 'playing') {
        e.preventDefault();
        handleInteraction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInteraction, gameState]);

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar pb-16 bg-slate-900 text-slate-100 flex flex-col items-center py-12 px-4 font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <div className="max-w-2xl w-full text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/20 rounded-2xl mb-4 text-indigo-400">
          <Brain size={32} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Impulse Control (Go/No-Go)</h1>
        <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base">
          Train your reflex inhibition. Tap for <strong className="text-emerald-400">Green Targets</strong>, but do absolutely nothing for <strong className="text-rose-400">Red Hazards</strong>.
        </p>
      </div>

      {/* Main Game Interface */}
      <div className="w-full max-w-md bg-slate-800 rounded-3xl p-6 shadow-2xl shadow-indigo-900/20 border border-slate-700">
        
        {/* Top Bar (Score & Lives) */}
        <div className="flex justify-between items-center mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
              <Zap size={14} /> Score
            </span>
            <span className="text-2xl font-black text-indigo-400">{score}</span>
          </div>
          
          <div className="flex flex-col items-end">
             <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
               Lives
             </span>
             <div className="flex gap-1">
                {[...Array(MAX_STRIKES)].map((_, i) => (
                  <Heart 
                    key={i} 
                    size={20} 
                    className={`${i < (MAX_STRIKES - strikes) ? 'text-rose-500 fill-rose-500' : 'text-slate-700'} transition-all`}
                  />
                ))}
             </div>
          </div>
        </div>

        {/* The Play Area (Radar/Reaction Zone) */}
        <div 
          className={`relative w-full aspect-square bg-slate-900 rounded-full border-4 flex items-center justify-center overflow-hidden mb-8 transition-colors duration-200 cursor-pointer shadow-inner
            ${gameState === 'playing' ? 'border-slate-700 hover:border-slate-600' : 'border-slate-800'}
            ${feedback === 'error' ? 'bg-rose-950/40 border-rose-500/50' : ''}
            ${feedback === 'success' ? 'bg-emerald-950/30' : ''}
          `}
          onMouseDown={(e) => {
             e.preventDefault();
             if (gameState === 'playing') handleInteraction();
          }}
          onTouchStart={(e) => {
             e.preventDefault();
             if (gameState === 'playing') handleInteraction();
          }}
        >
          {/* Radar background circles */}
          <div className="absolute inset-0 rounded-full border border-slate-800 m-8" />
          <div className="absolute inset-0 rounded-full border border-slate-800 m-16" />
          <div className="absolute inset-0 rounded-full border border-slate-800 m-24" />

          {!target && gameState === 'playing' && (
            <div className="w-2 h-2 bg-slate-600 rounded-full animate-ping opacity-50" />
          )}

          {target && target.type === 'go' && (
             <div className="relative z-10 animate-in zoom-in duration-100 flex flex-col items-center justify-center">
               <div className="absolute w-24 h-24 bg-emerald-500/20 rounded-full animate-ping" />
               <div className="w-20 h-20 bg-emerald-500 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.8)] border-4 border-emerald-300 flex items-center justify-center">
                 <Target size={40} className="text-emerald-950" />
               </div>
             </div>
          )}

          {target && target.type === 'nogo' && (
             <div className="relative z-10 animate-in zoom-in duration-100 flex flex-col items-center justify-center">
               <div className="w-20 h-20 bg-rose-500 rounded-xl rotate-45 shadow-[0_0_40px_rgba(244,63,94,0.8)] border-4 border-rose-300 flex items-center justify-center">
                 <ShieldAlert size={36} className="text-rose-950 -rotate-45" />
               </div>
             </div>
          )}

          {gameState === 'start' && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-20">
               <span className="text-slate-400 font-medium">Awaiting Start...</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">
          {(gameState === 'start' || gameState === 'gameover') && (
            <button 
              onClick={startGame}
              className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              {gameState === 'start' ? <Play size={24} fill="currentColor" /> : <RotateCcw size={24} />}
              {gameState === 'start' ? 'Start Reactor' : 'Try Again'}
            </button>
          )}

          {gameState === 'gameover' && (
            <div className="text-center p-4 bg-slate-900 rounded-xl border border-rose-500/30 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-bold text-rose-400 mb-1">System Overload!</h3>
              <p className="text-slate-300">You scored <strong className="text-indigo-400 text-lg">{score}</strong> before losing control.</p>
            </div>
          )}
        </div>

      </div>

      {/* Instructions footer */}
      <div className="max-w-md w-full mt-8 text-center text-sm text-slate-500">
        <p>
          <strong>How to play:</strong> Click the radar or press <kbd className="px-2 py-1 bg-slate-800 rounded-md border border-slate-700 text-slate-300 font-mono text-xs">Spacebar</kbd> immediately when you see a Green Target. Do <strong>NOT</strong> click when you see a Red Hazard. Spamming clicks will result in a penalty!
        </p>
      </div>
    </div>
  );
}