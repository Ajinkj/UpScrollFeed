import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Brain, Play, RotateCcw, Timer, Shuffle, Zap, AlertCircle } from 'lucide-react';

const COLORS = [
  { name: 'Red', class: 'text-rose-500', bg: 'bg-rose-500' },
  { name: 'Blue', class: 'text-blue-500', bg: 'bg-blue-500' },
  { name: 'Green', class: 'text-emerald-500', bg: 'bg-emerald-500' },
  { name: 'Yellow', class: 'text-amber-400', bg: 'bg-amber-400' }
];

const SHAPES = ['circle', 'square', 'triangle'];
const COUNTS = [1, 2, 3];
const RULES = ['COLOR', 'SHAPE', 'COUNT'];
const GAME_DURATION = 60; // 60 seconds

export default function TaskSwitchingGame({ onComplete }) {
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'gameover'
  const [score, setScore] = useState(0);

  const scoreRef = useRef(0);
  useEffect(() => { scoreRef.current = score; }, [score]);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  
  const [currentRule, setCurrentRule] = useState('COLOR');
  const [ruleJustChanged, setRuleJustChanged] = useState(false);
  
  const [targetCard, setTargetCard] = useState(null);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(null); // 'correct', 'incorrect'

  const timerRef = useRef(null);

  // Helper to generate a random attribute
  const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Generate a random card
  const generateCard = () => ({
    color: getRandomItem(COLORS),
    shape: getRandomItem(SHAPES),
    count: getRandomItem(COUNTS)
  });

  const generateRound = useCallback((ruleToUse) => {
    const target = generateCard();
    setTargetCard(target);

    let newOptions = [];
    
    // 1. Generate the Correct Option
    let correctOption;
    do {
      correctOption = generateCard();
    } while (
      // It must match the current rule
      (ruleToUse === 'COLOR' && correctOption.color.name !== target.color.name) ||
      (ruleToUse === 'SHAPE' && correctOption.shape !== target.shape) ||
      (ruleToUse === 'COUNT' && correctOption.count !== target.count)
    );
    // Make sure it doesn't accidentally match ALL rules to keep it challenging
    if (correctOption.color.name === target.color.name && correctOption.shape === target.shape && correctOption.count === target.count) {
        // Tweak one off-rule attribute just to be safe
        if (ruleToUse !== 'COLOR') correctOption.color = COLORS.find(c => c.name !== target.color.name);
    }
    newOptions.push(correctOption);

    // 2. Generate Wrong Options
    while (newOptions.length < 3) {
      let wrongOption = generateCard();
      // It MUST NOT match the current rule
      const matchesColor = wrongOption.color.name === target.color.name;
      const matchesShape = wrongOption.shape === target.shape;
      const matchesCount = wrongOption.count === target.count;

      let isValidWrongOption = true;
      if (ruleToUse === 'COLOR' && matchesColor) isValidWrongOption = false;
      if (ruleToUse === 'SHAPE' && matchesShape) isValidWrongOption = false;
      if (ruleToUse === 'COUNT' && matchesCount) isValidWrongOption = false;

      // Cognitive interference: Try to make wrong options match the WRONG rule
      // (e.g., if rule is COLOR, make the shape match to trick the user)
      if (isValidWrongOption) {
        // Ensure it's not a duplicate of existing options
        const isDuplicate = newOptions.some(opt => 
          opt.color.name === wrongOption.color.name && 
          opt.shape === wrongOption.shape && 
          opt.count === wrongOption.count
        );
        if (!isDuplicate) {
           newOptions.push(wrongOption);
        }
      }
    }

    // Shuffle options
    setOptions(newOptions.sort(() => Math.random() - 0.5));
  }, []);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setStreak(0);
    setMultiplier(1);
    setTimeLeft(GAME_DURATION);
    
    const startingRule = getRandomItem(RULES);
    setCurrentRule(startingRule);
    generateRound(startingRule);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGameState('gameover');
          if (onComplete) onComplete(scoreRef.current, {});
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const handleOptionClick = (selectedOption) => {
    if (gameState !== 'playing') return;

    // Check match based on current rule
    let isCorrect = false;
    if (currentRule === 'COLOR' && selectedOption.color.name === targetCard.color.name) isCorrect = true;
    if (currentRule === 'SHAPE' && selectedOption.shape === targetCard.shape) isCorrect = true;
    if (currentRule === 'COUNT' && selectedOption.count === targetCard.count) isCorrect = true;

    if (isCorrect) {
      // Success
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      let currentMulti = multiplier;
      if (newStreak % 3 === 0 && multiplier < 5) {
        currentMulti += 1;
        setMultiplier(currentMulti);
      }
      
      setScore(s => s + (10 * currentMulti));
      setFeedback('correct');
      
      // Determine if we should change the rule (30% chance, or guaranteed every 4 streaks)
      if (Math.random() < 0.3 || newStreak % 4 === 0) {
        const otherRules = RULES.filter(r => r !== currentRule);
        const newRule = getRandomItem(otherRules);
        setCurrentRule(newRule);
        setRuleJustChanged(true);
        setTimeout(() => setRuleJustChanged(false), 800);
        generateRound(newRule);
      } else {
        generateRound(currentRule);
      }
      
    } else {
      // Failure
      setStreak(0);
      setMultiplier(1);
      setScore(s => Math.max(0, s - 10));
      setFeedback('incorrect');
      // Keep the same round to force them to get it right
    }

    setTimeout(() => setFeedback(null), 300);
  };

  // Shape rendering helper
  const renderShape = (shape, colorClass) => {
    if (shape === 'circle') return <div className={`w-8 h-8 rounded-full ${colorClass.replace('text-', 'bg-')} shadow-sm`} />;
    if (shape === 'square') return <div className={`w-8 h-8 rounded-md ${colorClass.replace('text-', 'bg-')} shadow-sm`} />;
    if (shape === 'triangle') return (
      <div 
        className={`w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[28px] drop-shadow-sm`} 
        style={{ borderBottomColor: colorClass === 'text-rose-500' ? '#f43f5e' : colorClass === 'text-blue-500' ? '#3b82f6' : colorClass === 'text-emerald-500' ? '#10b981' : '#fbbf24' }}
      />
    );
  };

  const Card = ({ data, onClick, isTarget = false }) => {
    if (!data) return null;
    return (
      <button 
        onClick={onClick}
        disabled={isTarget || gameState !== 'playing'}
        className={`
          flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-800 border-2 
          ${isTarget ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] w-40 h-40 mx-auto' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-750 active:scale-95 transition-all w-full h-32'}
        `}
      >
        {/* Render shapes based on count */}
        <div className={`flex flex-wrap items-center justify-center gap-2 ${isTarget ? 'scale-125' : 'scale-100'}`}>
          {Array.from({ length: data.count }).map((_, i) => (
            <React.Fragment key={i}>
              {renderShape(data.shape, data.color.class)}
            </React.Fragment>
          ))}
        </div>
      </button>
    );
  };

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar pb-16 bg-slate-900 text-slate-100 flex flex-col items-center py-12 px-4 font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <div className="max-w-2xl w-full text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/20 rounded-2xl mb-4 text-indigo-400">
          <Shuffle size={32} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Cognitive Flexibility</h1>
        <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base">
          Match the bottom cards to the target card based on the current rule. Watch out—the rule changes without warning!
        </p>
      </div>

      {/* Main Game Interface */}
      <div className="w-full max-w-md bg-slate-800 rounded-3xl p-6 shadow-2xl shadow-indigo-900/20 border border-slate-700 relative overflow-hidden">
        
        {/* Visual Feedback Overlay */}
        {feedback === 'correct' && <div className="absolute inset-0 bg-emerald-500/10 z-0 pointer-events-none" />}
        {feedback === 'incorrect' && <div className="absolute inset-0 bg-rose-500/20 animate-pulse z-0 pointer-events-none" />}

        {/* Top Bar (Score & Time) */}
        <div className="relative z-10 flex justify-between items-center mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
              Score
              {multiplier > 1 && <span className="text-amber-400 ml-1 text-[10px]">x{multiplier}</span>}
            </span>
            <span className={`text-2xl font-black ${multiplier > 1 ? 'text-amber-400' : 'text-indigo-400'}`}>{score}</span>
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

        {gameState === 'playing' && (
          <div className="relative z-10 flex flex-col gap-6">
            
            {/* The Rule */}
            <div className={`text-center transition-all duration-300 ${ruleJustChanged ? 'scale-110' : 'scale-100'}`}>
              <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">Current Rule:</span>
              <div className={`text-3xl font-black mt-1 uppercase tracking-tight
                ${currentRule === 'COLOR' ? 'text-rose-400' : ''}
                ${currentRule === 'SHAPE' ? 'text-blue-400' : ''}
                ${currentRule === 'COUNT' ? 'text-emerald-400' : ''}
                ${ruleJustChanged ? 'animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''}
              `}>
                Match By {currentRule}
              </div>
            </div>

            {/* Target Card */}
            <div className="relative">
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 px-3 py-1 rounded-full text-xs font-bold text-slate-400 border border-slate-700 z-10 uppercase tracking-wider">
                 Target
               </div>
               <Card data={targetCard} isTarget={true} />
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-700 w-full" />

            {/* Options */}
            <div className="grid grid-cols-3 gap-3">
              {options.map((opt, i) => (
                <Card key={i} data={opt} onClick={() => handleOptionClick(opt)} />
              ))}
            </div>
          </div>
        )}

        {/* Controls / End Screen */}
        <div className="relative z-10 flex flex-col gap-4 mt-2">
          {gameState === 'start' && (
            <button 
              onClick={startGame}
              className="w-full py-5 mt-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              <Play size={24} fill="currentColor" />
              Start 60s Session
            </button>
          )}

          {gameState === 'gameover' && (
            <div className="text-center p-6 bg-slate-900 rounded-xl border border-indigo-500/30 animate-in fade-in zoom-in duration-300 mt-4">
              <Zap size={40} className="mx-auto text-amber-400 mb-4" />
              <h3 className="font-bold text-slate-300 mb-1 text-lg">Brain Workout Complete!</h3>
              <p className="text-sm text-slate-400 mb-6">Your cognitive flexibility score:</p>
              <span className="text-6xl font-black text-indigo-400 block mb-8">{score}</span>
              
              <button 
                onClick={startGame}
                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
              >
                <RotateCcw size={20} />
                Train Again
              </button>
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
          Your brain will naturally want to keep matching by the old rule. Pay close attention to the <strong className="text-slate-300">"Current Rule"</strong> text—when it changes, you must instantly override your previous instinct.
        </p>
      </div>
    </div>
  );
}