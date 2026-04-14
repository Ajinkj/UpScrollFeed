"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useUserStats } from '@/hooks/useUserStats';
import { Flame, Trophy, Activity, ArrowRight, Loader2, PlaySquare } from 'lucide-react';
import { GAME_REGISTRY } from '@/games/GameRegistry';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, gameStats, loading: statsLoading } = useUserStats();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || statsLoading || !user) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>;
  }

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-1">Welcome back, {profile?.displayName || 'Brainiac'}!</h1>
            <p className="text-slate-400">Ready to sharpen your focus today?</p>
          </div>

          <Link
            href="/session"
            className="group flex relative z-10 items-center gap-3 bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
          >
            <PlaySquare size={24} className="fill-indigo-700/50" />
            Start Training Session
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Global Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Total XP */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Trophy size={32} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Total XP Earned</p>
              <h2 className="text-4xl font-black text-white">{profile?.totalXP?.toLocaleString() || 0}</h2>
            </div>
          </div>

          {/* Daily Streak */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center gap-6 relative overflow-hidden">
             {(profile?.currentStreak || 0) > 2 && (
               <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-rose-500/5 pointer-events-none z-0 mix-blend-screen" />
             )}
            <div className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center border shrink-0 
              ${(profile?.currentStreak || 0) > 0 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-slate-800 text-slate-500 border-slate-700'}
            `}>
              <Flame size={32} className={(profile?.currentStreak || 0) > 2 ? 'fill-orange-400/20' : ''} />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Current Streak</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-black text-white">{profile?.currentStreak || 0}</h2>
                <span className="text-slate-400 font-medium">days</span>
              </div>
            </div>
          </div>

        </div>

        {/* High Scores per Game */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="text-indigo-400" size={24} /> 
            Training Records
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GAME_REGISTRY.map((game) => {
              const stat = gameStats?.[game.id] || { highScore: 0, playCount: 0 };
              
              return (
                <div key={game.id} className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl hover:bg-slate-900 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-slate-200">{game.name}</h3>
                    {stat.highScore > 0 && (
                      <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20">
                        {stat.playCount} {stat.playCount === 1 ? 'play' : 'plays'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">High Score</span>
                      <span className="text-2xl font-black text-emerald-400">{stat.highScore.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
