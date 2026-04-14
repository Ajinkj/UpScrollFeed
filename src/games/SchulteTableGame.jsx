import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Brain, Play, RotateCcw, Timer, Focus, AlertCircle } from 'lucide-react';

const GRID_SIZE = 25; // 5x5 grid

export default function SchulteTableGame({ onComplete }) {
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'finished'
  const [numbers, setNumbers] = useState([]);
  const [expectedNumber, setExpectedNumber] = useState(1);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [errorSquare, setErrorSquare] = useState(null);
  
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

  // Fisher-Yates shuffle for a truly random, unbiased distribution
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const generateGrid = useCallback(() => {
    const baseArray = Array.from({ length: GRID_SIZE }, (_, i) => i + 1);
    setNumbers(shuffleArray(baseArray));
  }, []);

  const startGame = () => {
    generateGrid();
    setExpectedNumber(1);
    setTimeElapsed(0);
    setErrorSquare(null);
    setGameState('playing');
    
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeElapsed(Date.now() - startTimeRef.current);
    }, 10); // Update every 10ms for smooth milliseconds
  };

  const stopGame = useCallback(() => {
    clearInterval(timerRef.current);
    setGameState('finished');
    if (onComplete) onComplete(Math.max(0, 1000 - Math.floor((Date.now() - startTimeRef.current) / 50)), { timeSpent: (Date.now() - startTimeRef.current) });
  }, [onComplete]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const handleNumberClick = (clickedNumber, index) => {
    if (gameState !== 'playing') return;

    if (clickedNumber === expectedNumber) {
      // Correct click
      if (expectedNumber === GRID_SIZE) {
        stopGame();
      } else {
        setExpectedNumber(expectedNumber + 1);
      }
    } else if (clickedNumber > expectedNumber) {
      // Incorrect click (only flash if they clicked a future number, ignore already clicked ones)
      setErrorSquare(index);
      setTimeout(() => setErrorSquare(null), 300);
      
      // Optional: Add a time penalty for mistakes?
      // startTimeRef.current -= 1000; // Adds 1 second penalty
    }
  };

  // Format time as SS.ms
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, '0')}s`;
  };

  // Calculate performance rating
  const getRating = (ms) => {
    const secs = ms / 1000;
    if (secs < 20) return { title: "Grandmaster", color: "text-purple-400" };
    if (secs < 25) return { title: "Exceptional", color: "text-emerald-400" };
    if (secs < 35) return { title: "Good", color: "text-blue-400" };
    if (secs < 45) return { title: "Average", color: "text-yellow-400" };
    return { title: "Needs Practice", color: "text-rose-400" };
  };

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar pb-16 bg-slate-900 text-slate-100 flex flex-col items-center py-12 px-4 font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <div className="max-w-2xl w-full text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/20 rounded-2xl mb-4 text-indigo-400">
          <Focus size={32} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Schulte Table</h1>
        <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base">
          Find and tap the numbers in ascending order from <strong className="text-indigo-400">1 to 25</strong> as fast as you can. Keep your eyes in the center!
        </p>
      </div>

      {/* Main Game Interface */}
      <div className="w-full max-w-md bg-slate-800 rounded-3xl p-6 shadow-2xl shadow-indigo-900/20 border border-slate-700">
        
        {/* Top Bar (Target & Time) */}
        <div className="flex justify-between items-center mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
              Next Target
            </span>
            <span className="text-3xl font-black text-indigo-400">
              {gameState === 'finished' ? '-' : expectedNumber}
            </span>
          </div>
          
          <div className="flex flex-col items-end">
             <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
               <Timer size={14} /> Elapsed Time
             </span>
             <span className="text-2xl font-mono font-bold text-slate-200">
               {formatTime(timeElapsed)}
             </span>
          </div>
        </div>

        {/* The Grid */}
        <div className="relative mb-6">
          {gameState === 'start' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700">
              <span className="text-slate-400 font-medium">Ready to scan?</span>
            </div>
          )}

          <div className="grid grid-cols-5 gap-2 w-full aspect-square bg-slate-900 p-3 rounded-2xl border border-slate-700 shadow-inner">
            {(gameState === 'start' ? Array.from({length: 25}, (_, i) => i + 1) : numbers).map((num, index) => {
              const isFound = num < expectedNumber && gameState === 'playing';
              const isError = errorSquare === index;
              
              // Determine if this is the absolute center square (index 12 in a 5x5 grid)
              const isCenter = index === 12;
              
              return (
                <button
                  key={index}
                  onClick={() => handleNumberClick(num, index)}
                  disabled={gameState !== 'playing' || isFound}
                  className={`
                    flex items-center justify-center text-xl sm:text-2xl font-black rounded-xl transition-all duration-150 select-none
                    ${isFound ? 'bg-slate-800 text-slate-700 shadow-none border border-slate-800' : 'shadow-md active:scale-90 hover:brightness-110'}
                    ${isError ? 'bg-rose-500 text-white border-2 border-rose-400 animate-pulse' : ''}
                    ${!isFound && !isError ? 'bg-slate-700 text-slate-100 border-b-4 border-slate-800 hover:bg-slate-600' : ''}
                    ${isCenter && !isFound && gameState === 'playing' ? 'relative' : ''}
                  `}
                >
                  {num}
                  {/* Subtle visual anchor for the center square to help peripheral vision training */}
                  {isCenter && !isFound && gameState === 'playing' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">
          {(gameState === 'start' || gameState === 'finished') && (
            <button 
              onClick={startGame}
              className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              {gameState === 'start' ? <Play size={24} fill="currentColor" /> : <RotateCcw size={24} />}
              {gameState === 'start' ? 'Start Timer' : 'Play Again'}
            </button>
          )}

          {gameState === 'finished' && (
            <div className="text-center p-4 bg-slate-900 rounded-xl border border-indigo-500/30 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-bold text-slate-300 mb-1">Board Cleared!</h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-4xl font-black text-indigo-400">{formatTime(timeElapsed)}</span>
              </div>
              <p className="text-sm mt-3 text-slate-400">
                Performance Rating: <strong className={getRating(timeElapsed).color}>{getRating(timeElapsed).title}</strong>
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Instructions footer */}
      <div className="max-w-md w-full mt-8 text-center text-sm text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-2 text-indigo-400">
          <AlertCircle size={16} />
          <span className="font-bold uppercase tracking-wider text-xs">Training Tip</span>
        </div>
        <p>
          Do not move your eyes to look for numbers! Fix your gaze on the <strong>center square</strong> (it has a tiny dot) and use only your peripheral vision to locate the next target.
        </p>
      </div>
    </div>
  );
}