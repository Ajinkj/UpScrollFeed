export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-slate-100 overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/3 -translate-y-1/3 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-200 to-slate-500">
          A Productive Alternative <br className="hidden md:block"/> to Doomscrolling.
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 font-medium">
          Instead of scrolling endlessly through short-form videos, swipe through bite-sized cognitive drills, memory tests, and professional engineering scenarios.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a href="/login" className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(99,102,241,0.4)]">
            Start Training Now
          </a>
          <a href="#features" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-lg transition-all border border-slate-700 hover:border-slate-500">
            Learn More
          </a>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-slate-950/50 border-t border-slate-800/50 relative z-10 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-indigo-500/50 transition-colors group">
            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/30 group-hover:scale-110 transition-transform">
              <span className="text-2xl">🧠</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Cognitive Enhancers</h3>
            <p className="text-slate-400 leading-relaxed">Play classic psychology experiments like N-Back and the Stroop task, engineered to test working memory and inhibitory control.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-emerald-500/50 transition-colors group">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30 group-hover:scale-110 transition-transform">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-bold mb-3">TikTok-Style Feed</h3>
            <p className="text-slate-400 leading-relaxed">Built with an addictive full-screen vertical swipe interface, so redirecting your habits feels completely natural.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-amber-500/50 transition-colors group">
            <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/30 group-hover:scale-110 transition-transform">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Professional Scenarios</h3>
            <p className="text-slate-400 leading-relaxed">Practice '5 Whys' root cause analysis on realistic tech incidents to sharpen your DevOps and debugging intuition.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
