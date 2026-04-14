"use client"
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { updateUserStats } from '@/lib/firebase/db';
import { GAME_REGISTRY } from '@/games/GameRegistry';
import { ChevronDown, Trophy, Activity, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SessionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Create a randomized session playlist
  const playlist = useMemo(() => {
    const list = [...GAME_REGISTRY];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }, []);

  const [completedGames, setCompletedGames] = useState({}); // { slideIndex: { score, stats } }
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Track which slide is currently fully snapped in view
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const slideHeight = container.clientHeight;
      const scrollY = container.scrollTop;
      const currentIndex = Math.round(scrollY / slideHeight);
      if (currentIndex !== activeSlide) {
        setActiveSlide(currentIndex);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeSlide]);

  const handleGameComplete = async (slideIndex, gameId, score, stats) => {
    // 1. Show local slick overlay instantly
    setCompletedGames(prev => ({
      ...prev,
      [slideIndex]: { score, stats }
    }));

    // 2. Update Firebase in background
    if (user) {
      updateUserStats(user.uid, score, gameId, stats).catch(console.error);
    }
  };

  const scrollToNext = () => {
    if (scrollContainerRef.current) {
      const slideHeight = scrollContainerRef.current.clientHeight;
      scrollContainerRef.current.scrollBy({
        top: slideHeight,
        behavior: 'smooth'
      });
    }
  };

  if (authLoading || !user) {
    return <div className="h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>;
  }

  return (
    <div className="h-[100dvh] w-full bg-black relative">
      
      {/* Top Floating Nav */}
      <div className="absolute top-4 left-4 z-50">
        <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-full text-slate-300 font-bold hover:text-white border border-slate-700/50 shadow-lg">
          <ArrowLeft size={18} /> Exit
        </Link>
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-1">
        {playlist.map((_, i) => (
          <div 
            key={i} 
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              completedGames[i] ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
              i === activeSlide ? 'bg-indigo-400 w-4 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Scroll Snapping Container */}
      <div 
        ref={scrollContainerRef}
        className="h-full w-full overflow-y-auto no-scrollbar snap-y snap-mandatory touch-pan-y"
      >
        {playlist.map((game, index) => {
          const GameComponent = game.component;
          const isCompleted = !!completedGames[index];
          const result = completedGames[index];

          return (
            <div 
              key={`${game.id}-${index}`} 
              className="h-[100dvh] w-full snap-start snap-always relative flex items-center justify-center p-2"
            >
              {/* Game Area Wrapper designed to look like a mobile app card */}
              <div className="w-full h-full max-w-md mx-auto bg-slate-900 md:rounded-[3rem] rounded-none overflow-hidden shadow-2xl relative border-x-0 md:border-x-4 md:border-y border-slate-800">
                
                {/* The Game */}
                <div className="w-full h-full relative z-0">
                  {/* Performance optimization: only mount games adjacent to the active slide to prevent massive DOM footprint */}
                  {Math.abs(activeSlide - index) <= 1 ? (
                    <GameComponent onComplete={(score, stats) => handleGameComplete(index, game.id, score, stats)} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 opacity-50">
                       <Activity size={48} className="text-slate-700 mb-4 animate-pulse" />
                       <span className="text-slate-600 font-bold uppercase tracking-widest">{game.name}</span>
                    </div>
                  )}
                </div>

                {/* Slick Completion Overlay */}
                {isCompleted && (
                  <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                    <div className="w-full max-w-sm bg-gradient-to-b from-indigo-500/20 to-slate-900 border border-indigo-500/30 p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Trophy size={120} className="text-indigo-500 -mt-10 -mr-10 rotate-12" />
                      </div>
                      
                      <Trophy size={48} className="mx-auto text-emerald-400 mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                      <h3 className="text-xl font-bold uppercase tracking-widest text-slate-400 mb-2">Training Complete</h3>
                      
                      <div className="py-4">
                        <span className="text-6xl font-black text-white px-2 py-1 rounded-xl bg-slate-900/50 block shadow-inner border border-slate-800">
                          +{result.score}
                        </span>
                        <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest mt-2 block">XP Earned</span>
                      </div>
                      
                      <p className="text-slate-400 text-sm mt-4 italic">
                        "Habits are the compound interest of self-improvement."
                      </p>
                    </div>

                    <button 
                      onClick={scrollToNext}
                      className="mt-12 flex flex-col items-center text-slate-400 hover:text-white transition-all animate-bounce"
                    >
                      <span className="font-bold text-sm uppercase tracking-widest mb-2 font-white">Keep Scrolling</span>
                      <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 hover:border-slate-500 hover:bg-slate-700 transition-colors">
                         <ChevronDown size={24} />
                      </div>
                    </button>
                  </div>
                )}
                
              </div>
            </div>
          );
        })}

        {/* End of Feed Screen */}
        <div className="h-[100dvh] w-full snap-start snap-always relative flex items-center justify-center p-4">
          <div className="w-full max-w-sm text-center">
            <h2 className="text-3xl font-black text-white mb-4">You're all caught up.</h2>
            <p className="text-slate-400 mb-8">You've completed all exercises in this session. Remember, consistency is key.</p>
            <Link 
              href="/dashboard"
              className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
