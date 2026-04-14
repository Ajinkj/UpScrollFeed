import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, AlertTriangle, ShieldAlert, CheckCircle2, XCircle, 
  ChevronRight, RefreshCw, Terminal, Activity, BrainCircuit, Heart
} from 'lucide-react';

const MAX_LIVES = 3;

// High-quality curated scenarios ensuring perfect game balance
const CURATED_SCENARIOS = [
  {
    incident: "The main checkout API endpoint latency spiked to 15 seconds during a flash sale.",
    steps: [
      {
        why_question: "Why did the checkout API latency spike to 15 seconds?",
        correct_answer: "The database CPU hit 100% utilization, queuing all read/write requests.",
        wrong_answer_1: "The front-end React app was rendering too slowly.",
        wrong_answer_2: "We had too many users logging in at the same time."
      },
      {
        why_question: "Why did the database CPU hit 100% utilization?",
        correct_answer: "A specific inventory check query was scanning the entire table instead of using an index.",
        wrong_answer_1: "The database server didn't have enough RAM allocated.",
        wrong_answer_2: "A DDoS attack targeted our database ports directly."
      },
      {
        why_question: "Why was the inventory check query doing a full table scan?",
        correct_answer: "The database index for the 'product_id' column was accidentally dropped during a migration.",
        wrong_answer_1: "The ORM automatically prefers full table scans for safety.",
        wrong_answer_2: "The table had too many rows for an index to work."
      },
      {
        why_question: "Why was the database index dropped during a migration?",
        correct_answer: "A developer manually edited the auto-generated migration file and made a typo in the rollback sequence.",
        wrong_answer_1: "The cloud provider had a glitch that deleted the index.",
        wrong_answer_2: "The DBA team decided we didn't need that index anymore."
      },
      {
        why_question: "Why did a manual typo in the migration file make it to production?",
        correct_answer: "We do not have an automated CI/CD pipeline step that tests database migrations on a staging replica.",
        wrong_answer_1: "The code reviewer was too tired and missed it.",
        wrong_answer_2: "The developer ignored the warning signs."
      }
    ],
    root_cause_lesson: "Implement automated schema migration testing in CI/CD against a masked staging database to catch destructive operations before production."
  },
  {
    incident: "The user profile microservice crashed repeatedly with Out-Of-Memory (OOM) errors.",
    steps: [
      {
        why_question: "Why did the service crash with OOM errors?",
        correct_answer: "Memory consumption climbed steadily without releasing until the Kubernetes container was killed.",
        wrong_answer_1: "We under-provisioned the memory limits for the pods.",
        wrong_answer_2: "A traffic spike overwhelmed the service."
      },
      {
        why_question: "Why did memory consumption climb steadily without releasing?",
        correct_answer: "Database connection objects were being instantiated but never properly closed.",
        wrong_answer_1: "We were caching too many high-res user profile pictures in RAM.",
        wrong_answer_2: "The Node.js garbage collector was accidentally disabled."
      },
      {
        why_question: "Why were database connections never closed?",
        correct_answer: "A recent code refactor removed the 'finally' block that handled cleanup.",
        wrong_answer_1: "The database server refused to acknowledge the close commands.",
        wrong_answer_2: "The ORM library has a known bug in its current version."
      },
      {
        why_question: "Why did the refactor remove the 'finally' block?",
        correct_answer: "The developer misunderstood the new connection pooler, assuming it handled cleanup automatically.",
        wrong_answer_1: "It was an accidental git merge conflict resolution.",
        wrong_answer_2: "The IDE's auto-formatter deleted it."
      },
      {
        why_question: "Why wasn't this misunderstanding caught before deployment?",
        correct_answer: "We lack continuous load testing in our CI pipeline to detect memory degradation over time.",
        wrong_answer_1: "The code reviewer just approved the Pull Request blindly.",
        wrong_answer_2: "The developer bypassed the code review process entirely."
      }
    ],
    root_cause_lesson: "Implement continuous load testing and memory profiling in the pre-production pipeline to catch degradation issues that unit tests miss."
  },
  {
    incident: "A security researcher found 10,000 customer emails exposed on the public internet.",
    steps: [
      {
        why_question: "Why were the customer emails exposed?",
        correct_answer: "An AWS S3 bucket containing application backup data was set to public read access.",
        wrong_answer_1: "Our main production database was hacked via SQL injection.",
        wrong_answer_2: "An employee's laptop containing the data was stolen."
      },
      {
        why_question: "Why was the S3 bucket set to public read access?",
        correct_answer: "The infrastructure-as-code (Terraform) script for the bucket lacked the strict 'private' ACL configuration.",
        wrong_answer_1: "A rogue system administrator changed it manually in the AWS console.",
        wrong_answer_2: "AWS defaults all new buckets to public access."
      },
      {
        why_question: "Why did the Terraform script lack the 'private' ACL configuration?",
        correct_answer: "An engineer copy-pasted an insecure bucket snippet from an outdated stack overflow post.",
        wrong_answer_1: "Terraform doesn't support private buckets properly yet.",
        wrong_answer_2: "The engineer intentionally made it public to ease local testing."
      },
      {
        why_question: "Why was a copy-pasted, insecure snippet deployed to production?",
        correct_answer: "There is no automated static analysis running on our Infrastructure-as-Code files.",
        wrong_answer_1: "The Senior engineer who reviewed it didn't care enough to check.",
        wrong_answer_2: "We don't use version control (Git) for Terraform."
      },
      {
        why_question: "Why is there no automated static analysis on Infrastructure files?",
        correct_answer: "The DevOps team hasn't integrated security scanning tools (like tfsec or Checkov) into the deployment pipeline.",
        wrong_answer_1: "Those tools are too expensive for our current budget.",
        wrong_answer_2: "They take too long to run and slow down deployments."
      }
    ],
    root_cause_lesson: "Integrate Infrastructure-as-Code (IaC) security scanning tools directly into the CI/CD pipeline to automatically block insecure configurations."
  }
];

export default function FiveWhyGame({ onComplete }) {
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'gameover', 'victory'
  const [scenario, setScenario] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [options, setOptions] = useState([]);
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState(null); // { status: 'correct' | 'error', text: '' }

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const setupRound = (scen, stepIndex) => {
    const stepData = scen.steps[stepIndex];
    const newOptions = shuffleArray([
      { text: stepData.correct_answer, isCorrect: true },
      { text: stepData.wrong_answer_1, isCorrect: false },
      { text: stepData.wrong_answer_2, isCorrect: false }
    ]);
    setOptions(newOptions);
  };

  const startNewGame = () => {
    setLives(MAX_LIVES);
    setCurrentStep(0);
    setHistory([]);
    setFeedback(null);
    
    // Pick a random scenario from our curated list
    const randomScenario = CURATED_SCENARIOS[Math.floor(Math.random() * CURATED_SCENARIOS.length)];
    
    setScenario(randomScenario);
    setupRound(randomScenario, 0);
    setGameState('playing');
  };

  const handleOptionClick = (option) => {
    if (gameState !== 'playing' || feedback) return;

    if (option.isCorrect) {
      // Correct Path
      setFeedback({ status: 'correct', text: 'Correct diagnosis.' });
      
      const newHistory = [...history, {
        question: scenario.steps[currentStep].why_question,
        answer: option.text
      }];
      setHistory(newHistory);

      setTimeout(() => {
        setFeedback(null);
        if (currentStep === 4) {
          setGameState('victory');
          if(onComplete) onComplete(100, { result: 'victory' });
        } else {
          const nextStep = currentStep + 1;
          setCurrentStep(nextStep);
          setupRound(scenario, nextStep);
        }
      }, 1200);

    } else {
      // Wrong Path (Symptom/Red Herring)
      const newLives = lives - 1;
      setLives(newLives);
      setFeedback({ status: 'error', text: 'Incorrect. You focused on a symptom or red herring, not the root cause.' });
      
      setTimeout(() => {
        setFeedback(null);
        if (newLives <= 0) {
          setGameState('gameover');
          if(onComplete) onComplete(0, { result: 'gameover' });
        }
      }, 2000);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar pb-16 bg-slate-900 text-slate-100 flex flex-col items-center py-12 px-4 font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <div className="max-w-3xl w-full text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/20 rounded-2xl mb-4 text-indigo-400">
          <Search size={32} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">5 Whys Detective</h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
          Drill down past the symptoms to find the true root cause. Ask "Why" 5 times to solve highly realistic corporate incidents.
        </p>
      </div>

      {/* Main Game Interface */}
      <div className="w-full max-w-3xl bg-slate-800 rounded-3xl shadow-2xl shadow-indigo-900/20 border border-slate-700 relative overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Top Status Bar */}
        <div className="flex justify-between items-center bg-slate-900/80 px-6 py-4 border-b border-slate-700/50 relative z-10">
          <div className="flex items-center gap-2">
            <BrainCircuit className="text-indigo-400" size={20} />
            <span className="font-bold uppercase tracking-widest text-xs text-slate-400">Root Cause Analysis</span>
          </div>
          <div className="flex items-center gap-1">
             {[...Array(MAX_LIVES)].map((_, i) => (
                <Heart 
                  key={i} 
                  size={18} 
                  className={`transition-all duration-300 ${i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700 fill-slate-800'}`}
                />
             ))}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 p-6 md:p-8 flex flex-col relative z-10">
          
          {gameState === 'start' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
              <ShieldAlert size={64} className="text-slate-600 mb-6" />
              <h2 className="text-2xl font-bold mb-4">Ready to Investigate?</h2>
              <p className="text-slate-400 max-w-md mb-8">
                You will be presented with a critical incident. You must choose the most logical underlying cause at each step. Beware of red herrings and superficial blame.
              </p>
              <button 
                onClick={startNewGame}
                className="flex items-center gap-2 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-transform active:scale-95 shadow-lg shadow-indigo-500/20 text-lg"
              >
                <Terminal size={20} /> Generate Incident
              </button>
            </div>
          )}

          {gameState === 'playing' && scenario && (
            <div className="flex-1 flex flex-col animate-in fade-in duration-500">
              
              {/* Progress Tracker */}
              <div className="flex justify-between mb-8 relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-700 -translate-y-1/2 z-0 rounded-full" />
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-indigo-500 -translate-y-1/2 z-0 rounded-full transition-all duration-500" 
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
                {[0, 1, 2, 3, 4].map((step) => (
                  <div 
                    key={step}
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300
                      ${step < currentStep ? 'bg-indigo-500 text-white' : 
                        step === currentStep ? 'bg-indigo-400 text-slate-900 border-4 border-slate-800 ring-2 ring-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.5)]' : 
                        'bg-slate-800 text-slate-500 border-2 border-slate-700'}`}
                  >
                    {step + 1}
                  </div>
                ))}
              </div>

              {/* The Situation / History */}
              <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50 mb-8 max-h-48 overflow-y-auto custom-scrollbar">
                <div className="mb-4">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block mb-1">Initial Incident</span>
                  <p className="font-medium text-slate-200">{scenario.incident}</p>
                </div>
                
                {history.map((h, i) => (
                  <div key={i} className="mb-4 pl-4 border-l-2 border-indigo-500/30 opacity-70">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">Why?</span>
                    <p className="text-sm text-slate-300 mb-1">{h.question}</p>
                    <p className="text-sm italic text-slate-400">"{h.answer}"</p>
                  </div>
                ))}
              </div>

              {/* Current Question */}
              <div className="mb-6 text-center">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  {scenario.steps[currentStep].why_question}
                </h3>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-3 mt-auto relative">
                
                {/* Feedback Overlay inside Options area */}
                {feedback && (
                  <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl backdrop-blur-sm border-2 animate-in zoom-in-95 duration-200
                    ${feedback.status === 'correct' ? 'bg-emerald-900/90 border-emerald-500/50' : 'bg-rose-900/90 border-rose-500/50'}`}
                  >
                    {feedback.status === 'correct' ? <CheckCircle2 size={48} className="text-emerald-400 mb-2" /> : <XCircle size={48} className="text-rose-400 mb-2" />}
                    <p className={`font-bold text-center px-4 ${feedback.status === 'correct' ? 'text-emerald-100' : 'text-rose-100'}`}>
                      {feedback.text}
                    </p>
                  </div>
                )}

                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleOptionClick(opt)}
                    disabled={!!feedback}
                    className="flex items-center text-left p-4 bg-slate-800 border-2 border-slate-700 hover:border-indigo-500 hover:bg-slate-700/50 rounded-xl transition-all active:scale-[0.98] group"
                  >
                    <ChevronRight className="text-slate-500 group-hover:text-indigo-400 mr-3 shrink-0 transition-colors" size={20} />
                    <span className="text-sm md:text-base text-slate-200 font-medium leading-relaxed">{opt.text}</span>
                  </button>
                ))}
              </div>

            </div>
          )}

          {gameState === 'gameover' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in slide-in-from-bottom-8 duration-500">
              <AlertTriangle size={64} className="text-rose-500 mb-6" />
              <h2 className="text-3xl font-black text-white mb-2">Investigation Failed</h2>
              <p className="text-slate-400 max-w-md mb-8">
                You ran out of attempts. By focusing on symptoms instead of root causes, the true underlying issue remains unresolved.
              </p>
              <button 
                onClick={startNewGame}
                className="flex items-center gap-2 px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-transform active:scale-95"
              >
                <RefreshCw size={20} /> Investigate New Incident
              </button>
            </div>
          )}

          {gameState === 'victory' && scenario && (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in slide-in-from-bottom-8 duration-500">
              <CheckCircle2 size={64} className="text-emerald-500 mb-4" />
              <h2 className="text-3xl font-black text-white mb-2">Root Cause Identified</h2>
              <p className="text-slate-400 mb-6">You successfully drilled down through 5 layers of "Why".</p>
              
              <div className="bg-slate-900 w-full p-6 rounded-2xl border border-emerald-500/30 mb-8 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Activity size={100} />
                </div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-2">System Lesson Learned</span>
                <p className="text-emerald-50 text-lg leading-relaxed relative z-10">
                  {scenario.root_cause_lesson}
                </p>
              </div>

              <button 
                onClick={startNewGame}
                className="flex items-center gap-2 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-transform active:scale-95 shadow-lg shadow-indigo-500/20"
              >
                <Terminal size={20} /> Generate Next Incident
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-3xl w-full mt-8 p-4 bg-slate-800/50 border border-slate-700 rounded-2xl flex gap-4 text-sm text-slate-400">
        <div className="text-indigo-400 shrink-0">
          <BrainCircuit size={24} />
        </div>
        <p>
          <strong>Why this works:</strong> The "5 Whys" is an iterative interrogative technique originally developed by Sakichi Toyoda (founder of Toyota). By actively training your brain to reject superficial answers, you become much more effective at solving systemic failures in business, tech, and life.
        </p>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #334155;
          border-radius: 10px;
        }
      `}} />
    </div>
  );
}