import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BookOpen, Play, Pause, RotateCcw, FastForward, 
  ChevronRight, Activity, Info, BookMarked, Settings, RefreshCw, Terminal
} from 'lucide-react';

const TECH_TOPICS = [
  "Software_engineering", "Artificial_intelligence", "Cloud_computing",
  "Computer_security", "Machine_learning", "Microservices",
  "Agile_software_development", "DevOps", "Blockchain",
  "Quantum_computing", "Internet_of_things", "Data_structure",
  "Continuous_integration", "Kubernetes", "API",
  "Large_language_model", "Version_control", "Open-source_software",
  "Distributed_computing", "Cryptography", "System_design"
];

export default function RSVPSpeedReaderGame({ onComplete }) {
  const [gameState, setGameState] = useState('setup'); // 'setup', 'playing', 'paused', 'finished'
  const [article, setArticle] = useState({ title: '', text: '', url: '' });
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [wpm, setWpm] = useState(300); // Words Per Minute
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);

  // Fetch a random Tech Wikipedia article summary
  const fetchArticle = async () => {
    setLoading(true);
    setError(null);
    try {
      // Pick a random tech concept
      const randomTopic = TECH_TOPICS[Math.floor(Math.random() * TECH_TOPICS.length)];
      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${randomTopic}`);
      if (!response.ok) throw new Error('Failed to fetch content');
      
      const data = await response.json();
      
      // Ensure we get a decent amount of text
      if (data.extract && data.extract.split(' ').length > 20) {
        setArticle({
          title: data.title,
          text: data.extract,
          url: data.content_urls?.desktop?.page || '#'
        });
        setWords(data.extract.split(/\s+/));
        setCurrentIndex(0);
        setGameState('setup');
      } else {
        // If the article is too short, fetch another one
        fetchArticle();
      }
    } catch (err) {
      setError('Could not load article. Please check your connection.');
      // Fallback IT/Tech text if API fails
      const fallback = "In modern software development, the ability to rapidly process documentation, API references, and pull requests is a superpower. By eliminating saccades and subvocalization, engineers can dramatically reduce the time spent reading technical specifications and debugging logs. This tool utilizes Rapid Serial Visual Presentation to train your brain to ingest text at the speed of tech.";
      setArticle({ title: "Reading Code & Specs", text: fallback, url: "#" });
      setWords(fallback.split(/\s+/));
      setCurrentIndex(0);
      setGameState('setup');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchArticle();
  }, []);

  // The core RSVP playback engine
  useEffect(() => {
    if (gameState === 'playing' && currentIndex < words.length) {
      const currentWord = words[currentIndex];
      
      // Calculate base delay from WPM
      let delayMs = 60000 / wpm;

      // Add slight cognitive pauses for punctuation (comprehension boosts)
      if (currentWord.endsWith('.') || currentWord.endsWith('!') || currentWord.endsWith('?')) {
        delayMs *= 2.2; // Longer pause at end of sentence
      } else if (currentWord.endsWith(',') || currentWord.endsWith(';') || currentWord.endsWith(':')) {
        delayMs *= 1.5; // Slight pause at commas
      } else if (currentWord.length > 10) {
        delayMs *= 1.2; // Slight pause for very long words
      }

      timerRef.current = setTimeout(() => {
        setCurrentIndex(prev => {
          if (prev + 1 >= words.length) {
            return prev;
          }
          return prev + 1;
        });
      }, delayMs);
    }

    return () => clearTimeout(timerRef.current);
  }, [gameState, currentIndex, words, wpm]);

  useEffect(() => {
    if (gameState === 'playing' && words.length > 0 && currentIndex === words.length - 1) {
      setGameState('finished');
      if (onComplete) onComplete(Math.round(wpm * 1.5), { wpm });
    }
  }, [currentIndex, gameState, words.length, wpm, onComplete]);

  const togglePlay = () => {
    if (gameState === 'setup' || gameState === 'paused') {
      setGameState('playing');
    } else if (gameState === 'playing') {
      setGameState('paused');
    } else if (gameState === 'finished') {
      setCurrentIndex(0);
      setGameState('playing');
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setGameState('setup');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Component to render the Optimal Recognition Point (ORP)
  const RSVPWord = ({ word }) => {
    if (!word) return null;
    
    // Clean punctuation from start/end for calculation (rough)
    const cleanWord = word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
    let orpIndex = Math.floor((cleanWord.length - 1) / 2);
    
    // Adjust ORP index back to the original word including punctuation
    const actualOrpIndex = word.indexOf(cleanWord) !== -1 ? word.indexOf(cleanWord) + orpIndex : Math.floor((word.length - 1) / 2);

    const left = word.substring(0, actualOrpIndex);
    const center = word[actualOrpIndex];
    const right = word.substring(actualOrpIndex + 1);

    return (
      <div className="flex items-center justify-center w-full font-mono text-4xl sm:text-5xl md:text-6xl tracking-wide">
        <div className="flex-1 text-right text-slate-300">{left}</div>
        <div className="text-rose-500 font-black flex-none text-center w-[1ch]">{center}</div>
        <div className="flex-1 text-left text-slate-300">{right}</div>
      </div>
    );
  };

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar pb-16 bg-slate-900 text-slate-100 flex flex-col items-center py-12 px-4 font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <div className="max-w-2xl w-full text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/20 rounded-2xl mb-4 text-indigo-400">
          <BookOpen size={32} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">RSVP Speed Reader</h1>
        <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base">
          Train yourself to read reports and emails at 2x-3x speed. Keep your eyes locked on the <strong className="text-rose-400">red letter</strong>.
        </p>
      </div>

      {/* Main Interface */}
      <div className="w-full max-w-3xl bg-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl shadow-indigo-900/20 border border-slate-700 relative overflow-hidden">
        
        {/* Article Info Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
          <div className="flex-1">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
              <Terminal size={14} /> Tech Concept (Wikipedia)
            </span>
            <h2 className="text-lg font-bold text-slate-200 line-clamp-1" title={article.title}>
              {loading ? 'Loading tech topic...' : article.title}
            </h2>
          </div>
          
          <button 
            onClick={fetchArticle}
            disabled={loading || gameState === 'playing'}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Fetch New
          </button>
        </div>

        {/* The RSVP Reader Area */}
        <div className="relative w-full h-48 md:h-64 bg-slate-900 rounded-2xl border-2 border-slate-700 flex flex-col items-center justify-center mb-8 shadow-inner overflow-hidden">
          
          {/* ORP Alignment Guidelines (Subtle) */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-700/50 -translate-x-1/2 pointer-events-none" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700/50 -translate-y-1/2 pointer-events-none" />

          {loading ? (
            <div className="text-slate-500 animate-pulse font-medium">Fetching knowledge...</div>
          ) : (
            <>
              {gameState === 'setup' && (
                <div className="text-center z-10 p-6 bg-slate-900/90 backdrop-blur">
                  <p className="text-slate-400 mb-4 font-medium max-w-md">
                    Average reading speed is 250 WPM. Set your target below and press play. Don't let your eyes move left or right.
                  </p>
                  <button 
                    onClick={togglePlay}
                    className="mx-auto flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-transform active:scale-95 shadow-lg shadow-indigo-500/20"
                  >
                    <Play size={20} fill="currentColor" /> Begin Reading
                  </button>
                </div>
              )}

              {(gameState === 'playing' || gameState === 'paused') && (
                <div className="w-full flex items-center justify-center h-full px-4 relative z-10">
                   <RSVPWord word={words[currentIndex]} />
                </div>
              )}

              {gameState === 'finished' && (
                <div className="text-center z-10 p-6 bg-slate-900/90 backdrop-blur animate-in fade-in zoom-in">
                  <Activity size={40} className="mx-auto text-emerald-400 mb-2" />
                  <h3 className="text-2xl font-bold text-slate-200 mb-1">Article Completed</h3>
                  <p className="text-slate-400 mb-6">
                    You just read {words.length} words at {wpm} WPM.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button 
                      onClick={restart}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors border border-slate-600"
                    >
                      <RotateCcw size={18} /> Replay
                    </button>
                    <button 
                      onClick={fetchArticle}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-transform active:scale-95 shadow-lg shadow-indigo-500/20"
                    >
                      <FastForward size={18} /> Next Article
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Pause Overlay */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
              <span className="text-slate-300 font-bold text-xl mb-4 uppercase tracking-widest">Paused</span>
              <button 
                onClick={togglePlay}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-transform active:scale-95"
              >
                <Play size={20} fill="currentColor" /> Resume
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Progress</span>
            <span>{Math.min(words.length, currentIndex + 1)} / {words.length} words</span>
          </div>
          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700">
            <div 
              className="h-full bg-indigo-500 transition-all duration-100 ease-linear"
              style={{ width: `${words.length > 0 ? (currentIndex / (words.length - 1)) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          {/* Playback Controls */}
          <div className="flex items-center justify-center md:justify-start gap-4">
            <button
              onClick={restart}
              disabled={gameState === 'setup'}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl disabled:opacity-50 transition-colors border border-slate-700"
              title="Restart"
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={togglePlay}
              disabled={loading || gameState === 'setup'}
              className="w-16 h-16 flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl disabled:opacity-50 disabled:hover:bg-indigo-500 transition-transform active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              {gameState === 'playing' ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </button>
          </div>

          {/* Speed Controller */}
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <div className="flex justify-between items-end mb-3">
              <span className="text-sm font-bold text-slate-400 flex items-center gap-1">
                <Settings size={16} /> Reading Speed
              </span>
              <span className="text-2xl font-black text-emerald-400">{wpm} <span className="text-xs text-slate-500 font-bold uppercase">WPM</span></span>
            </div>
            <input 
              type="range" 
              min="150" 
              max="1000" 
              step="25"
              value={wpm}
              onChange={(e) => setWpm(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-slate-500 font-bold mt-2">
              <span>Slow (150)</span>
              <span>Fast (1000)</span>
            </div>
          </div>
          
        </div>

      </div>

      {/* Corporate Tip Footer */}
      <div className="max-w-3xl w-full mt-8 p-4 bg-slate-800/50 border border-slate-700 rounded-2xl flex gap-4 text-sm text-slate-400">
        <div className="text-indigo-400 shrink-0">
          <Info size={24} />
        </div>
        <p>
          <strong>Tech Worker Tip:</strong> As an IT professional, you read thousands of words of documentation and logs daily. By training with RSVP, you bypass the physical bottleneck of eye-tracking. Use this tool to process new technical concepts and documentation significantly faster.
        </p>
      </div>
    </div>
  );
}