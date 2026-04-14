import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Brain, Play, RotateCcw, Timer, Trophy, AlertCircle } from 'lucide-react';

const COLORS = [
  { id: 'RED', label: 'Red', hex: '#ef4444', key: 'r' },
  { id: 'BLUE', label: 'Blue', hex: '#3b82f6', key: 'b' },
  { id: 'GREEN', label: 'Green', hex: '#10b981', key: 'g' },
  { id: 'YELLOW', label: 'Yellow', hex: '#eab308', key: 'y' }
];

const GAME_DURATION = 45; // 45 seconds per round

export default function StroopGame({ onComplete }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
  
  const [currentWord, setCurrentWord] = useState(COLORS[0]);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect'

  const timerRef = useRef(null);
  const scoreRef = useRef(0);
  const statsRef = useRef({ correct: 0, incorrect: 0 });

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { statsRef.current = stats; }, [stats]);

  // Generate a new word/color pair, ensuring a high chance of mismatch
  const generateNextTurn = useCallback(() => {
    const wordIndex = Math.floor(Math.random() * COLORS.length);
    let colorIndex = Math.floor(Math.random() * COLORS.length);

    // 75% chance to force a mismatch to keep it challenging
    if (Math.random() < 0.75) {
      while (colorIndex === wordIndex) {
        colorIndex = Math.floor(Math.random() * COLORS.length);
      }
    }

    setCurrentWord(COLORS[wordIndex]);
    setCurrentColor(COLORS[colorIndex]);
  }, []);

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setStats({ correct: 0, incorrect: 0 });
    setTimeLeft(GAME_DURATION);
    generateNextTurn();
  };

  const stopGame = useCallback(() => {
    setIsPlaying(false);
    setGameOver(true);
    clearInterval(timerRef.current);
    if (onComplete) {
      onComplete(scoreRef.current, statsRef.current);
    }
  }, [onComplete]);

  // Timer effect
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [isPlaying, timeLeft, stopGame]);

  const handleColorSelection = useCallback((selectedColorId) => {
    if (!isPlaying) return;

    if (selectedColorId === currentColor.id) {
      // Correct
      setScore((s) => s + 10);
      setStats((s) => ({ ...s, correct: s.correct + 1 }));
      setFeedback('correct');
      generateNextTurn();
    } else {
      // Incorrect
      setScore((s) => Math.max(0, s - 5));
      setStats((s) => ({ ...s, incorrect: s.incorrect + 1 }));
      setFeedback('incorrect');
      // Do NOT generate next turn, force them to get it right
    }

    setTimeout(() => setFeedback(null), 300);
  }, [isPlaying, currentColor, generateNextTurn]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying) return;
      const key = e.key.toLowerCase();
      const matchedColor = COLORS.find(c => c.key === key);
      if (matchedColor) {
        handleColorSelection(matchedColor.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, handleColorSelection]);

  return (
    <div className="h-full w-full bg-slate-900 text-slate-100 flex flex-col items-center py-12 px-4 font-sans selection:bg-indigo-500/30 overflow-y-auto no-scrollbar pb-16">
      
      {/* Header */}
      <div className="max-w-2xl w-full text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/20 rounded-2xl mb-4 text-indigo-400">
          <Brain size={32} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Stroop Effect Task</h1>
        <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base">
          Train your inhibitory control. Select the button that matches the <strong className="text-indigo-400">INK COLOR</strong>, not the word you read.
        </p>
      </div>

      {/* Main Game Interface */}
      <div className="w-full max-w-md bg-slate-800 rounded-3xl p-6 shadow-2xl shadow-indigo-900/20 border border-slate-700">
        
        {/* Top Bar (Score & Time) */}
        <div className="flex justify-between items-center mb-8 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
              <Trophy size={14} /> Score
            </span>
            <span className="text-2xl font-black text-indigo-400">{score}</span>
          </div>
          
          <div className="flex flex-col items-end">
             <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
               <Timer size={14} /> Time Left
             </span>
             <span className={`text-2xl font-black ${timeLeft <= 10 && isPlaying ? 'text-rose-500 animate-pulse' : 'text-slate-200'}`}>
               0:{timeLeft.toString().padStart(2, '0')}
             </span>
          </div>
        </div>

        {/* The Play Area */}
        <div className="relative mb-8 h-48 flex items-center justify-center bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
          
          {/* Feedback Animations */}
          {feedback === 'incorrect' && (
            <div className="absolute inset-0 bg-rose-500/20 animate-pulse z-0" />
          )}
          {feedback === 'correct' && (
            <div className="absolute inset-0 bg-emerald-500/10 z-0" />
          )}

          {!isPlaying && !gameOver && (
            <div className="z-10 text-slate-500 flex flex-col items-center">
              <AlertCircle size={32} className="mb-2 opacity-50" />
              <p className="font-medium">Ready to test your focus?</p>
            </div>
          )}

          {isPlaying && (
            <div 
              className={`z-10 text-6xl md:text-7xl font-black tracking-tighter transition-transform duration-100 ${feedback === 'incorrect' ? 'scale-95' : 'scale-100'}`}
              style={{ color: currentColor.hex }}
            >
              {currentWord.id}
            </div>
          )}

          {gameOver && (
             <div className="z-10 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                <span className="text-slate-400 uppercase font-bold tracking-widest text-sm mb-1">Final Score</span>
                <span className="text-5xl font-black text-white">{score}</span>
             </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">
          {!isPlaying && !gameOver && (
            <button 
              onClick={startGame}
              className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Play size={20} fill="currentColor" />
              Start 45s Drill
            </button>
          )}

          {isPlaying && (
            <div className="grid grid-cols-2 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleColorSelection(color.id)}
                  className="py-6 rounded-xl font-bold text-xl transition-all active:scale-95 flex flex-col items-center justify-center border-2 border-slate-700/50 hover:brightness-110 shadow-lg"
                  style={{ backgroundColor: color.hex, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                >
                  {color.label}
                  <span className="text-xs font-normal opacity-70 mt-1 uppercase tracking-widest">
                    [ {color.key} ]
                  </span>
                </button>
              ))}
            </div>
          )}

          {gameOver && (
             <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                 <div className="grid grid-cols-2 gap-4 text-center">
                   <div className="bg-slate-800 p-3 rounded-lg">
                     <span className="block text-emerald-400 font-bold text-2xl mb-1">{stats.correct}</span>
                     <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Correct</span>
                   </div>
                   <div className="bg-slate-800 p-3 rounded-lg">
                     <span className="block text-rose-400 font-bold text-2xl mb-1">{stats.incorrect}</span>
                     <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Mistakes</span>
                   </div>
                 </div>
               </div>
               
               <button 
                onClick={startGame}
                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
              >
                <RotateCcw size={20} />
                Try Again
              </button>
             </div>
          )}
        </div>

      </div>

      {/* Instructions footer */}
      <div className="max-w-md w-full mt-8 text-center text-sm text-slate-500">
        <p>
          <strong>Pro Tip:</strong> You can use the keyboard shortcuts <strong className="text-slate-300">(R, B, G, Y)</strong> for faster reaction times. Try to beat a score of 300!
        </p>
      </div>
    </div>
  );
}