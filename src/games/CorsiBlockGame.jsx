import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Brain, Play, RotateCcw, LayoutGrid, ShieldCheck, AlertCircle } from 'lucide-react';

// Irregular positions to prevent easy grid-based chunking (simulating actual Corsi blocks)
const BLOCK_POSITIONS = [
  { top: '8%', left: '15%' },
  { top: '20%', left: '55%' },
  { top: '10%', left: '80%' },
  { top: '40%', left: '10%' },
  { top: '50%', left: '45%' },
  { top: '35%', left: '75%' },
  { top: '75%', left: '20%' },
  { top: '85%', left: '60%' },
  { top: '65%', left: '85%' },
];

export default function CorsiBlockGame({ onComplete }) {
  const [gameState, setGameState] = useState('start'); // 'start', 'memorize', 'recall', 'success', 'gameover'
  const [level, setLevel] = useState(3); // Starts with a sequence of 3
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [score, setScore] = useState(0);
  
  const [activeBlock, setActiveBlock] = useState(null);
  const [clickFlash, setClickFlash] = useState(null);

  const timeoutRefs = useRef([]);

  // Cleanup timeouts to prevent memory leaks if component unmounts mid-animation
  const clearAllTimeouts = () => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  const generateSequence = (seqLength) => {
    const newSeq = [];
    for (let i = 0; i < seqLength; i++) {
      let nextBlock;
      do {
        nextBlock = Math.floor(Math.random() * BLOCK_POSITIONS.length);
      } while (newSeq.length > 0 && nextBlock === newSeq[newSeq.length - 1]); // Prevent immediate double-taps
      newSeq.push(nextBlock);
    }
    return newSeq;
  };

  const playSequence = async (seq) => {
    setGameState('memorize');
    setPlayerSequence([]);
    setActiveBlock(null);
    clearAllTimeouts();

    // Initial pause before sequence starts
    await new Promise(resolve => {
      const t = setTimeout(resolve, 800);
      timeoutRefs.current.push(t);
    });

    for (let i = 0; i < seq.length; i++) {
      // Check if game was stopped
      if (timeoutRefs.current === null) return; 

      setActiveBlock(seq[i]);
      
      await new Promise(resolve => {
        const t = setTimeout(resolve, 500); // How long the block stays lit
        timeoutRefs.current.push(t);
      });

      setActiveBlock(null);

      await new Promise(resolve => {
        const t = setTimeout(resolve, 250); // Gap between blocks
        timeoutRefs.current.push(t);
      });
    }

    setGameState('recall');
  };

  const startLevel = (currentLevel) => {
    const newSeq = generateSequence(currentLevel);
    setSequence(newSeq);
    playSequence(newSeq);
  };

  const startGame = () => {
    setScore(0);
    setLevel(3);
    startLevel(3);
  };

  const handleBlockClick = (index) => {
    if (gameState !== 'recall') return;

    // Flash block on click
    setClickFlash(index);
    setTimeout(() => setClickFlash(null), 200);

    const newPlayerSeq = [...playerSequence, index];
    setPlayerSequence(newPlayerSeq);

    const currentIndex = newPlayerSeq.length - 1;

    // Check if the clicked block is correct
    if (sequence[currentIndex] !== index) {
      setGameState('gameover');
      if (onComplete) {
        onComplete(score, { maxLevel: level });
      }
      return;
    }

    // Check if sequence is complete
    if (newPlayerSeq.length === sequence.length) {
      setGameState('success');
      setScore(s => s + (level * 10));
      
      // Wait a moment, then start next level
      setTimeout(() => {
        setLevel(l => l + 1);
        startLevel(level + 1);
      }, 1500);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar pb-16 bg-slate-900 text-slate-100 flex flex-col items-center py-12 px-4 font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <div className="max-w-2xl w-full text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/20 rounded-2xl mb-4 text-indigo-400">
          <Brain size={32} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Corsi Block Task</h1>
        <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base">
          Train your visuospatial memory. Watch the sequence of glowing blocks and tap them in the exact same order.
        </p>
      </div>

      {/* Main Game Interface */}
      <div className="w-full max-w-md bg-slate-800 rounded-3xl p-6 shadow-2xl shadow-indigo-900/20 border border-slate-700">
        
        {/* Top Bar (Score & Status) */}
        <div className="flex justify-between items-center mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Score</span>
            <span className="text-2xl font-black text-indigo-400">{score}</span>
          </div>
          
          <div className="flex flex-col items-end">
             <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Sequence Length</span>
             <span className="text-2xl font-black text-slate-200">{level}</span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex justify-center mb-6 h-8">
          {gameState === 'memorize' && (
            <span className="inline-flex items-center gap-2 text-indigo-400 font-bold animate-pulse">
              <LayoutGrid size={18} /> Memorize the sequence...
            </span>
          )}
          {gameState === 'recall' && (
            <span className="inline-flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck size={18} /> Your turn! Repeat the pattern.
            </span>
          )}
          {gameState === 'success' && (
            <span className="inline-flex items-center gap-2 text-emerald-500 font-black">
              Perfect! Advancing...
            </span>
          )}
          {gameState === 'gameover' && (
            <span className="inline-flex items-center gap-2 text-rose-500 font-black">
              <AlertCircle size={18} /> Incorrect sequence.
            </span>
          )}
        </div>

        {/* The Play Area (Corsi Board) */}
        <div className="relative w-full aspect-square bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden mb-6 shadow-inner">
          {BLOCK_POSITIONS.map((pos, index) => {
            const isLit = activeBlock === index || clickFlash === index;
            
            return (
              <button
                key={index}
                onClick={() => handleBlockClick(index)}
                disabled={gameState !== 'recall'}
                className={`absolute w-[18%] h-[18%] rounded-xl transition-all duration-150 ${
                  isLit 
                    ? 'bg-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.8)] scale-110 border-2 border-indigo-300 z-10' 
                    : 'bg-slate-700 hover:bg-slate-600 border-b-4 border-slate-800'
                } ${gameState === 'recall' ? 'cursor-pointer' : 'cursor-default'}`}
                style={{ 
                  top: pos.top, 
                  left: pos.left,
                  transform: isLit ? 'scale(1.1)' : 'scale(1)',
                }}
                aria-label={`Block ${index + 1}`}
              />
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">
          {(gameState === 'start' || gameState === 'gameover') && (
            <button 
              onClick={startGame}
              className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              {gameState === 'start' ? <Play size={20} fill="currentColor" /> : <RotateCcw size={20} />}
              {gameState === 'start' ? 'Start Training' : 'Try Again'}
            </button>
          )}

          {gameState === 'gameover' && (
            <div className="text-center p-4 bg-slate-900 rounded-xl border border-rose-500/30">
              <p className="text-slate-300">You successfully recalled <strong className="text-emerald-400">{level - 1}</strong> blocks in a row.</p>
              <p className="text-sm text-slate-500 mt-2">Average adult baseline is 5 to 6 blocks.</p>
            </div>
          )}
        </div>

      </div>

      {/* Instructions footer */}
      <div className="max-w-md w-full mt-8 text-center text-sm text-slate-500">
        <p>
          <strong>Tip:</strong> Try not to memorize the blocks individually. Instead, try to trace an invisible "path" or "shape" connecting the blocks in your mind.
        </p>
      </div>
    </div>
  );
}