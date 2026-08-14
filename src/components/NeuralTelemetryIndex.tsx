import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Layers, HeartPulse, History } from 'lucide-react';

export default function NeuralTelemetryIndex() {
  // Configurable Tuning Variables
  const [neuralTension, setNeuralTension] = useState<number>(45);
  const [bufferPadding, setBufferPadding] = useState<number>(60);
  const [synapseSpeed, setSynapseSpeed] = useState<number>(75);

  // Computed Gauges Statuses
  const [consciousnessSync, setConsciousnessSync] = useState<number>(88.4);
  const [bandwidthLoad, setBandwidthLoad] = useState<number>(4.2);
  const [shieldResilience, setShieldResilience] = useState<number>(94.1);

  // Moving telemetry chart data
  const [historyPoints, setHistoryPoints] = useState<number[]>([74, 76, 75, 80, 84, 82, 85, 88, 87, 89, 90, 88]);

  // Recalculating statuses dynamically based on slider values!
  useEffect(() => {
    // Formula to calculate simulated values
    const calculatedSync = Math.min(100, Math.max(10, 40 + (synapseSpeed * 0.4) + (bufferPadding * 0.3) - (neuralTension * 0.1)));
    const calculatedBandwidth = Number((1.2 + (synapseSpeed * 0.08) + (neuralTension * 0.02)).toFixed(1));
    const calculatedShield = Math.min(100, Math.max(15, 30 + (bufferPadding * 0.8) - (neuralTension * 0.2)));

    setConsciousnessSync(Number(calculatedSync.toFixed(1)));
    setBandwidthLoad(calculatedBandwidth);
    setShieldResilience(Number(calculatedShield.toFixed(1)));
  }, [neuralTension, bufferPadding, synapseSpeed]);

  // Add points to scrolling chart over intervals
  useEffect(() => {
    const handleValueOscillation = () => {
      setHistoryPoints((prev) => {
        const nextVal = Math.min(100, Math.max(10, consciousnessSync + (Math.sin(Date.now() / 1500) * 3)));
        const sliced = prev.slice(1);
        return [...sliced, Number(nextVal.toFixed(0))];
      });
    };

    const interval = setInterval(handleValueOscillation, 1000);
    return () => clearInterval(interval);
  }, [consciousnessSync]);

  return (
    <div id="neural-telemetry-panel" className="glass-panel p-8 border-white/5 relative overflow-hidden space-y-8">
      <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
        <Activity className="w-56 h-56 text-[#10b981] animate-pulse" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-xl">
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold">Neural <span className="text-emerald-400">Telemetry</span> Index</h3>
            <p className="text-xs text-starlight/40 font-mono uppercase tracking-wider mt-0.5">Real-time biomechanical analysis matrices of systemic performance</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] bg-black/40 border border-white/5 px-3 py-1.5 rounded-lg text-emerald-400">
          <HeartPulse className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-bold uppercase">SYNAPSE FLOW STABLE</span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Section: Live Numerical Dials/Gauges */}
        <div className="xl:col-span-1 space-y-5">
          <h4 className="text-xs font-mono uppercase tracking-widest text-starlight/40 font-bold mb-1">Telemetry Metrics</h4>
          
          <div className="space-y-4">
            {/* Gauge 1: Consciousness Sync Index */}
            <div className="bg-[#050510] border border-white/5 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-starlight/60 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" /> Core Sync Index
                </span>
                <span className="text-amber-400 font-bold">{consciousnessSync}%</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div style={{ width: `${consciousnessSync}%` }} className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500" />
              </div>
            </div>

            {/* Gauge 2: Bandwidth Capacity (TB/s) */}
            <div className="bg-[#050510] border border-white/5 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-starlight/60 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" /> Systemic Bandwidth
                </span>
                <span className="text-purple-400 font-bold">{bandwidthLoad} TB/s</span>
              </div>
              {/* Derived progress relative to max cap (e.g. 15.0 TB/s) */}
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div style={{ width: `${(bandwidthLoad / 15.0) * 100}%` }} className="bg-gradient-to-r from-purple-500 to-purple-400 h-full rounded-full transition-all duration-500" />
              </div>
            </div>

            {/* Gauge 3: Firewall Shield Resilience */}
            <div className="bg-[#050510] border border-white/5 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-starlight/60 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" /> Shield Resilience
                </span>
                <span className="text-emerald-400 font-bold">{shieldResilience}%</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div style={{ width: `${shieldResilience}%` }} className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Center Section: scrolling real-time SVG line chart */}
        <div className="xl:col-span-1 bg-black/60 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between font-mono text-xs text-starlight/40 font-bold mb-3">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-400" /> CONSCIOUSNESS WAVE OSCILLATOR
            </span>
            <span className="text-[10px] bg-white/5 text-starlight/60 px-1.5 py-0.5 rounded uppercase">Realtime</span>
          </div>

          <div className="h-32 w-full relative flex items-end overflow-visible my-3 select-all">
            {/* Grid backgrounds */}
            <div className="absolute inset-y-0 left-0 w-full flex flex-col justify-between pointer-events-none opacity-[0.03]">
              <div className="border-t border-white/50 w-full" />
              <div className="border-t border-white/50 w-full" />
              <div className="border-t border-white/50 w-full" />
              <div className="border-t border-white/50 w-full" />
            </div>

            {/* Line chart plotting points */}
            <svg className="w-full h-full block relative z-10 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gridLineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area fill */}
              <path
                d={`M 0 100 ` + historyPoints.reduce((acc, val, idx) => {
                  const x = (idx / (historyPoints.length - 1)) * 100;
                  // Invert value so 100 is at top (y=0) and 0 is at bottom (y=100)
                  const y = 100 - val;
                  return acc + `L ${x} ${y} `;
                }, '') + `L 100 100 Z`}
                fill="url(#gridLineGrad)"
                className="transition-all duration-500"
              />

              {/* Stroke Line */}
              <path
                d={historyPoints.reduce((acc, val, idx) => {
                  const x = (idx / (historyPoints.length - 1)) * 100;
                  const y = 100 - val;
                  return acc + `${idx === 0 ? 'M' : 'L'} ${x} ${y} `;
                }, '')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                className="transition-all duration-500"
              />
            </svg>
          </div>

          <p className="text-[10px] font-mono text-starlight/30 uppercase mt-2 text-center text-ellipsis overflow-hidden">
            Calibration dynamic bounds responding to tension nodes
          </p>
        </div>

        {/* Right Section: Configurable Calibration Variables */}
        <div className="xl:col-span-1 bg-[#050510] border border-white/5 rounded-2xl p-5 flex flex-col justify-center space-y-5">
          <h4 className="text-xs font-mono uppercase tracking-widest text-[#10b981] font-bold block">Telemetry Controls</h4>
          
          {/* Tension Selector Slider */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[11px] text-starlight/60">
              <span>SYSTEM NEURAL TENSION</span>
              <span className="text-emerald-400 font-bold">{neuralTension} Pa</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={neuralTension}
              onChange={(e) => setNeuralTension(Number(e.target.value))}
              className="w-full h-1 h- bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500 outline-none"
            />
          </div>

          {/* Buffer Padding Selector Slider */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[11px] text-starlight/60">
              <span>BUFFER PADDING COEFFICIENT</span>
              <span className="text-emerald-400 font-bold">{bufferPadding} %</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={bufferPadding}
              onChange={(e) => setBufferPadding(Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500 outline-none"
            />
          </div>

          {/* Synapse Speed Settings Slider */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[11px] text-starlight/60">
              <span>SYNAPSE PROPAGATION VELOCITY</span>
              <span className="text-emerald-400 font-bold">{synapseSpeed} ms/f</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={synapseSpeed}
              onChange={(e) => setSynapseSpeed(Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500 outline-none"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
