import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Brain, Play, RotateCcw, Timer, Activity, Zap, AlertCircle,
  Star, Moon, Sun, Cloud, Zap as Lightning, Umbrella, Snowflake, Flame, Droplet
} from 'lucide-react';

const SYMBOL_ICONS = [Star, Moon, Sun, Cloud, Lightning, Umbrella, Snowflake, Flame, Droplet];
const GAME_DURATION = 60; // 60 seconds

export default function ProcessingSpeedGame({ onComplete }) {
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'gameover'
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const scoreRef = useRef(0);
  useEffect(() => { scoreRef.current = score; }, [score]);
  
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  
  const [keyMap, setKeyMap] = useState([]);
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
  const [feedback, setFeedback] = useState(null); // 'correct', 'error'

  const timerRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Fisher-Yates shuffle
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const generateGameData = useCallback(() => {
    // 1. Randomize the mapping of icons to digits (1-9)
    const shuffledIcons = shuffleArray(SYMBOL_ICONS);
    const newKeyMap = shuffledIcons.map((Icon, index) => ({
      id: index,
      Icon: Icon,
      digit: index + 1
    }));
    
    setKeyMap(newKeyMap);
    setCurrentTargetIndex(Math.floor(Math.random() * 9));
  }, []);

  const startGame = () => {
    generateGameData();
    setScore(0);
    setErrors(0);
    setTimeLeft(GAME_DURATION);
    setGameState('playing');
    isPlayingRef.current = true;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGameState('gameover');
          if (onComplete) onComplete(scoreRef.current, {});
          isPlayingRef.current = false;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const nextTarget = useCallback(() => {
    setCurrentTargetIndex(prevIndex => {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * 9);
      } while (newIndex === prevIndex); // Prevent the exact same symbol twice in a row
      return newIndex;
    });
  }, []);

  const handleInput = useCallback((digitInput) => {
    if (!isPlayingRef.current) return;

    const currentTarget = keyMap[currentTargetIndex];
    
    if (currentTarget.digit === digitInput) {
      // Correct Match
      setScore(s => s + 1);
      setFeedback('correct');
      nextTarget();
    } else {
      // Incorrect Match
      setErrors(e => e + 1);
      setFeedback('error');
    }

    // Clear feedback quickly for rapid fire
    setTimeout(() => setFeedback(null), 150);
  }, [keyMap, currentTargetIndex, nextTarget]);

  // Keyboard Event Listener (for numbers 1-9)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      
      const key = parseInt(e.key, 10);
      if (key >= 1 && key <= 9) {
        handleInput(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleInput]);

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar pb-16 bg-slate-900 text-slate-100 flex flex-col items-center py-12 px-4 font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <div className="max-w-2xl w-full text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/20 rounded-2xl mb-4 text-indigo-400">
          <Activity size={32} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Processing Speed</h1>
        <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base">
          Match the large central symbol to its corresponding number using the "Key" at the top. Type or tap as fast as possible!
        </p>
      </div>

      {/* Main Game Interface */}
      <div className="w-full max-w-md bg-slate-800 rounded-3xl p-6 shadow-2xl shadow-indigo-900/20 border border-slate-700 relative overflow-hidden">
        
        {/* Visual Feedback Overlay */}
        {feedback === 'error' && <div className="absolute inset-0 bg-rose-500/20 z-0 pointer-events-none" />}
        {feedback === 'correct' && <div className="absolute inset-0 bg-emerald-500/10 z-0 pointer-events-none" />}

        {/* Top Bar (Score & Time) */}
        <div className="relative z-10 flex justify-between items-center mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
              Valid Matches
            </span>
            <span className="text-2xl font-black text-indigo-400">{score}</span>
          </div>
          
          <div className="flex flex-col items-end">
             <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
               <Timer size={14} /> Time Left
             </span>
             <span className={`text-2xl font-mono font-bold ${timeLeft <= 10 && gameState === 'playing' ? 'text-rose-500 animate-pulse' : 'text-slate-200'}`}>
               0:{timeLeft.toString().padStart(2, '0')}
             </span>
          </div>
        </div>

        {/* The Key (Legend) */}
        <div className="relative z-10 mb-6">
          <div className="text-center mb-2">
             <span className="text-xs text-slate-400 font-bold uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
               The Key
             </span>
          </div>
          <div className="flex flex-wrap justify-center gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-700 shadow-inner">
            {(gameState === 'start' || gameState === 'gameover' ? Array.from({length: 9}).map((_,i) => ({ Icon: SYMBOL_ICONS[i], digit: i+1 })) : keyMap).map((item, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center w-[10%] min-w-[32px] bg-slate-800 border border-slate-600 rounded-md py-1 pb-0.5">
                <item.Icon size={16} className="text-slate-300 mb-1" />
                <span className="font-mono text-indigo-400 font-black text-sm">{item.digit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Target Area */}
        <div className="relative z-10 flex flex-col items-center justify-center h-32 mb-6">
           {gameState === 'playing' && keyMap.length > 0 ? (
             <div className="animate-in zoom-in-95 duration-100 flex flex-col items-center">
               <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Match This</div>
               {React.createElement(keyMap[currentTargetIndex].Icon, { 
                 size: 64, 
                 className: `text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-transform ${feedback === 'error' ? 'scale-90 text-rose-400' : 'scale-100'}`
               })}
             </div>
           ) : (
             <div className="text-slate-500 flex flex-col items-center opacity-50">
               <Zap size={48} className="mb-2" />
               <span className="font-medium">Awaiting Start...</span>
             </div>
           )}
        </div>

        {/* Numpad Controls (Visible for mouse/touch, but keyboard is better) */}
        <div className="relative z-10 grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              disabled={gameState !== 'playing'}
              onClick={() => handleInput(digit)}
              className={`
                py-4 rounded-xl font-black text-2xl transition-all shadow-sm
                ${gameState === 'playing' 
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 active:scale-95 border-b-4 border-slate-800 active:border-b-0 active:translate-y-1' 
                  : 'bg-slate-800/50 text-slate-600 border border-slate-700/50 cursor-not-allowed'}
              `}
            >
              {digit}
            </button>
          ))}
        </div>

        {/* Start / End Screens Overlay */}
        {(gameState === 'start' || gameState === 'gameover') && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm p-6 text-center animate-in fade-in duration-300">
            
            {gameState === 'gameover' && (
              <div className="mb-8">
                <Brain size={48} className="mx-auto text-indigo-400 mb-4" />
                <h3 className="font-bold text-slate-200 text-2xl mb-2">Time's Up!</h3>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-slate-500 uppercase font-bold">Correct</span>
                    <span className="text-4xl font-black text-emerald-400">{score}</span>
                  </div>
                  <div className="w-px h-12 bg-slate-700"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-slate-500 uppercase font-bold">Errors</span>
                    <span className="text-4xl font-black text-rose-400">{errors}</span>
                  </div>
                </div>
                {/* Scoring Benchmark */}
                <p className="mt-6 text-sm text-slate-400">
                  A score above <strong className="text-indigo-400">40</strong> is excellent for adult processing speeds.
                </p>
              </div>
            )}

            <button 
              onClick={startGame}
              className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              {gameState === 'start' ? <Play size={24} fill="currentColor" /> : <RotateCcw size={24} />}
              {gameState === 'start' ? 'Start 60s Sprint' : 'Sprint Again'}
            </button>
          </div>
        )}
      </div>

      {/* Instructions footer */}
      <div className="max-w-md w-full mt-8 text-center text-sm text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-2 text-indigo-400">
          <AlertCircle size={16} />
          <span className="font-bold uppercase tracking-wider text-xs">Pro Tip</span>
        </div>
        <p>
          For the fastest possible times, place your fingers on the <strong className="text-slate-300">number keys (1-9)</strong> on your physical keyboard. Only use the on-screen buttons if you are on a mobile device.
        </p>
      </div>
    </div>
  );
}