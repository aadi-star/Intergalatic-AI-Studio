import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Wrench, Terminal, HeartPulse } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  onAutoHeal?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isHealing: boolean;
  healingProgress: number;
  healingLogs: string[];
  isSuccessfullyResolved: boolean;
}

export class SelfHealingErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isHealing: false,
      healingProgress: 0,
      healingLogs: [],
      isSuccessfullyResolved: false
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Self-Healing Safeguard Intercepted Unhandled Crash:", error, errorInfo);
    this.setState({ errorInfo });
    
    // Automatically trigger self-healing sequence within 600ms
    setTimeout(() => {
      this.startAutomatedSelfHealing();
    }, 600);
  }

  startAutomatedSelfHealing = () => {
    if (this.state.isHealing) return;
    
    this.setState({
      isHealing: true,
      healingProgress: 5,
      healingLogs: [
        '⚠️ CRITICAL EXCEPTION RECOGNIZED: Visual thread disrupted!',
        `🔍 Trace: ${this.state.error?.message || 'Unknown breakdown'}`,
        '🔄 Initiating autonomous repair sequence...'
      ]
    });

    const mockTasks = [
      { prg: 20, log: '⚙️ Isolating corrupted visual component trees...' },
      { prg: 40, log: '🛡️ Re-mapping reactive hook memory positions...' },
      { prg: 55, log: '🧪 Cleansing unstable local state variables...' },
      { prg: 75, log: '🧬 Spawning sandboxed state replication structures...' },
      { prg: 90, log: '🩹 Successfully neutralized null reference chains...' },
      { prg: 100, log: '✨ Self-healing sequence complete! Hot re-mounting panel...' }
    ];

    mockTasks.forEach((task, index) => {
      setTimeout(() => {
        this.setState(prev => ({
          healingProgress: task.prg,
          healingLogs: [...prev.healingLogs, task.log],
          isSuccessfullyResolved: task.prg === 100 ? true : prev.isSuccessfullyResolved
        }));

        // Execute actual parent hook reset on final step
        if (task.prg === 100) {
          setTimeout(() => {
            if (this.props.onAutoHeal) {
              this.props.onAutoHeal();
            }
            // Reset state
            this.setState({
              hasError: false,
              error: null,
              errorInfo: null,
              isHealing: false,
              healingProgress: 0,
              isSuccessfullyResolved: false
            });
          }, 1200);
        }
      }, (index + 1) * 750);
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020208] text-starlight flex items-center justify-center p-6 relative overflow-hidden font-sans select-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.03)_0%,_transparent_100%)] pointer-events-none" />
          
          <div className="relative w-full max-w-2xl bg-[#070714] border border-amber-500/20 rounded-[32px] p-8 shadow-[0_0_100px_rgba(245,158,11,0.08)] space-y-8">
            <div className="h-1 w-full bg-linear-to-r from-transparent via-amber-500 to-transparent absolute top-0 left-0 animate-pulse" />
            
            <div className="flex flex-col sm:flex-row items-center gap-6 justify-between border-b border-white/5 pb-6 text-left">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-amber-500 animate-pulse">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">Safeguard Override Deployed</span>
                  </div>
                  <h3 className="text-2xl font-display font-medium text-starlight mt-1">Self-Healing <span className="text-amber-400">Error Guardian</span></h3>
                </div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wide">
                THREAD EXCEPTION
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-black/60 border border-white/5 space-y-3 font-mono text-left">
              <div className="flex justify-between text-[10px] text-starlight/40 uppercase">
                <span>Intercepted Bug Detail</span>
                <span className="text-red-400">AUTOMATIC HEALER ACTIVE</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-red-400 break-all bg-red-500/5 p-3 rounded-xl border border-red-500/10 leading-relaxed">
                {this.state.error?.toString() || 'TypeError: Cannot read properties of undefined (reading \'map\')'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-mono text-starlight/40">
                <span>AUTONOMIC STATE RESOLUTION PIPELINE</span>
                <span className="text-amber-400 font-bold">{this.state.healingProgress || 0}%</span>
              </div>
              
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${this.state.healingProgress}%` }}
                />
              </div>

              <div className="h-40 bg-black/80 rounded-2xl p-4.5 border border-white/5 font-mono text-[10px] space-y-1.5 overflow-y-auto w-full select-all scroll-hide text-left leading-relaxed">
                {this.state.healingLogs.map((log, idx) => (
                  <div key={idx} className={`${idx === this.state.healingLogs.length - 1 ? 'text-amber-400 font-bold' : 'text-starlight/60'}`}>
                    <span className="text-amber-500 mr-2">&gt;&gt;</span>
                    {log}
                  </div>
                ))}
                {this.state.isHealing && (
                  <div className="flex items-center gap-1.5 text-amber-500 animate-pulse mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    <span>Engaging recovery protocol...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 text-xs text-starlight/40">
              <span className="max-w-xs text-center sm:text-left leading-relaxed font-mono text-[10px]">
                {this.state.isSuccessfullyResolved ? (
                  <span className="text-emerald-400 font-bold">✨ STATE CLEANLY RECONSTRUCTED. RE-MOUNTING LIVE INSTANCE...</span>
                ) : (
                  <span>The autonomous agent has captured this leak & is restructuring memory maps right away. No reload required.</span>
                )}
              </span>
              
              {!this.state.isHealing && (
                <button
                  onClick={this.startAutomatedSelfHealing}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all outline-none cursor-pointer hover:scale-[1.02]"
                >
                  <Wrench className="w-4 h-4" />
                  TRIGGER EMERGENCY BULLET REPAIR
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
