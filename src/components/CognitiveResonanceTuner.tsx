import React, { useState, useEffect, useRef } from 'react';
import { Radio, Volume2, VolumeX, SlidersHorizontal, Music } from 'lucide-react';

interface FrequencyPreset {
  id: string;
  name: string;
  hz: number;
  label: string;
  focus: string;
  color: string;
}

export default function CognitiveResonanceTuner() {
  const [activePreset, setActivePreset] = useState<string>('spiritual');
  const [frequency, setFrequency] = useState<number>(432);
  const [gainLevel, setGainLevel] = useState<number>(0.15);
  const [isSynthPlaying, setIsSynthPlaying] = useState<boolean>(false);
  
  // Animation parameter states
  const [waveSpeed, setWaveSpeed] = useState<number>(2.5);
  const [waveComplexity, setWaveComplexity] = useState<number>(3);
  const [animationPhase, setAnimationPhase] = useState<number>(0);

  // Audio nodes persist refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const presets: FrequencyPreset[] = [
    {
      id: 'spiritual',
      name: 'Lotus Core Harmony',
      hz: 432,
      label: '432 Hz • Ancient Solfeggio',
      focus: 'Emphasizes Lion Soul Balance & Faith Core',
      color: 'from-amber-400 to-amber-600 font-bold'
    },
    {
      id: 'analytical',
      name: 'Quantum Synapse Clock',
      hz: 528,
      label: '528 Hz • Miracles Wave',
      focus: 'Emphasizes Jaguar Logical Bandwidth Optimization',
      color: 'from-purple-400 to-purple-600 font-bold'
    },
    {
      id: 'fortified',
      name: 'Obsidian Shield Bastion',
      hz: 888,
      label: '888 Hz • Infinity Fortification',
      focus: 'Emphasizes Tiger Perimeter Armor Integrity',
      color: 'from-emerald-400 to-emerald-600 font-bold'
    }
  ];

  // Frequency wave animator loop
  useEffect(() => {
    let animId: number;
    const loop = () => {
      setAnimationPhase((prev) => (prev + 0.05 * waveSpeed) % (Math.PI * 2));
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [waveSpeed]);

  const selectPreset = (preset: FrequencyPreset) => {
    setActivePreset(preset.id);
    setFrequency(preset.hz);
    if (preset.id === 'spiritual') {
      setWaveSpeed(1.8);
      setWaveComplexity(2);
    } else if (preset.id === 'analytical') {
      setWaveSpeed(3.2);
      setWaveComplexity(4.5);
    } else {
      setWaveSpeed(4.5);
      setWaveComplexity(1.5);
    }

    if (oscRef.current && audioCtxRef.current) {
      oscRef.current.frequency.setValueAtTime(preset.hz, audioCtxRef.current.currentTime);
    }
  };

  const handleFrequencySlider = (hzVal: number) => {
    setFrequency(hzVal);
    if (hzVal < 400) {
      setWaveSpeed(1.2);
    } else if (hzVal > 700) {
      setWaveSpeed(4);
    } else {
      setWaveSpeed(2.5);
    }
    if (oscRef.current && audioCtxRef.current) {
      oscRef.current.frequency.setValueAtTime(hzVal, audioCtxRef.current.currentTime);
    }
  };

  const handleGainSlider = (gainVal: number) => {
    setGainLevel(gainVal);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(gainVal, audioCtxRef.current.currentTime);
    }
  };

  const toggleSynthMute = () => {
    try {
      if (isSynthPlaying) {
        // Stop currently running nodes
        if (oscRef.current) {
          oscRef.current.stop();
          oscRef.current.disconnect();
          oscRef.current = null;
        }
        setIsSynthPlaying(false);
      } else {
        // Initialize Web Audio
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = activePreset === 'spiritual' ? 'sine' : activePreset === 'analytical' ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(gainLevel, ctx.currentTime);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();

        oscRef.current = osc;
        gainNodeRef.current = gainNode;
        setIsSynthPlaying(true);
      }
    } catch (e) {
      console.warn('Synth failed initialization code:', e);
    }
  };

  // Stop sound when components unmount
  useEffect(() => {
    return () => {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
        } catch(e) {}
        oscRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div id="cognitive-resonance-tuner" className="glass-panel p-8 border-white/5 relative overflow-hidden space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500/20 p-2 rounded-xl">
            <Radio className="w-6 h-6 text-purple-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold">Collective <span className="text-purple-400">Resonance</span> Tuner</h3>
            <p className="text-xs text-starlight/40 font-mono uppercase tracking-wider mt-0.5">Synchronize the sub-audible drone of the Triumvirate focal chamber</p>
          </div>
        </div>

        {/* Audio Active Indicator */}
        <button
          type="button"
          onClick={toggleSynthMute}
          className={`flex items-center gap-2 font-mono text-[10px] px-3.5 py-2 rounded-xl cursor-pointer border select-none transition-all ${
            isSynthPlaying
              ? 'bg-[#8b5cf6]/10 text-purple-400 border-purple-500/30 shadow-[0_0_12px_rgba(139,92,246,0.15)] font-bold'
              : 'bg-white/[0.02] text-starlight/40 border-white/5 hover:text-starlight hover:bg-white/5'
          }`}
        >
          {isSynthPlaying ? <Volume2 className="w-3.5 h-3.5 animate-bounce text-purple-400" /> : <VolumeX className="w-3.5 h-3.5 text-starlight/40" />}
          <span>CHAMBER HUM: {isSynthPlaying ? 'ONLINE' : 'MUTED'}</span>
        </button>
      </div>

      <p className="text-sm text-starlight/60 max-w-2xl">
        Adjust the frequency core of the Council Chamber below. Tuning resonance waves adjusts the ambient electromagnetic alignment of the three minds, stimulating shifts in their collaborative communication balance.
      </p>

      {/* Interactive Visual Waveform Plot (Beautiful Canvas/SVG wave rendering) */}
      <div className="aspect-ratio bg-[#03030b] border border-white/5 h-28 w-full rounded-2xl flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.06),transparent_65%)]" />
        
        {/* Decorative Grid Lines */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/5" />
        <div className="absolute inset-0 grid grid-cols-8 gap-1 opacity-[0.03]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border-r border-white/50 h-full" />
          ))}
        </div>

        {/* Dynamic SVG Waveform path */}
        <svg className="w-full h-full block relative z-10 overflow-visible" viewBox="0 0 1000 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="waveFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.05" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Primary wave path */}
          <path
            d={Array.from({ length: 153 }).map((_, i) => {
              const x = i * (1000 / 152);
              const radians = (i / 152) * Math.PI * 4 * waveComplexity + animationPhase;
              const y = 50 + Math.sin(radians) * 20 * (activePreset === 'fortified' ? 0.7 : 1) + Math.cos(radians * 0.5) * 8;
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            fill="none"
            stroke="url(#waveGradient)"
            strokeWidth="2"
            className="transition-all duration-300"
          />

          {/* Secondary background shadow wave path */}
          <path
            d={Array.from({ length: 153 }).map((_, i) => {
              const x = i * (1000 / 152);
              const radians = (i / 152) * Math.PI * 3 * waveComplexity - animationPhase;
              const y = 50 + Math.sin(radians + 1.5) * 12 + Math.cos(radians * 0.8) * 5;
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            fill="none"
            stroke="#a855f7"
            strokeWidth="1"
            className="opacity-20 transition-all duration-300"
          />
        </svg>

        <span className="absolute bottom-2.5 right-4 font-mono text-[9px] text-[#a855f7] tracking-widest font-bold uppercase animate-pulse">
          {frequency} Hz Resonance Wave
        </span>
      </div>

      {/* Live control sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Frequency Preset Selectors */}
        <div className="space-y-2 lg:col-span-1">
          <label className="text-[10px] uppercase font-mono tracking-wider text-starlight/40 font-bold block mb-1">Frequency Presets</label>
          <div className="flex flex-col gap-2">
            {presets.map((pre) => {
              const matches = activePreset === pre.id;
              return (
                <button
                  key={pre.id}
                  type="button"
                  onClick={() => selectPreset(pre)}
                  className={`w-full text-left font-mono text-xs px-4 py-3 border rounded-xl cursor-pointer transition-all ${
                    matches
                      ? 'bg-purple-950/20 border-purple-500/40 text-starlight shadow-inner'
                      : 'bg-white/[0.02] border-white/5 text-starlight/60 hover:text-starlight hover:bg-white/5'
                  }`}
                >
                  <div className="font-bold text-[11px] leading-tight flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      pre.id === 'spiritual' ? 'bg-amber-400' : pre.id === 'analytical' ? 'bg-purple-400' : 'bg-emerald-400'
                    }`} />
                    {pre.name}
                  </div>
                  <div className="text-[9px] opacity-40 mt-1">{pre.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slider Controls */}
        <div className="lg:col-span-2 bg-[#050510] border border-white/5 rounded-xl p-5 flex flex-col justify-center space-y-5">
          {/* Custom Frequency Hz Selector slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="flex items-center gap-1.5 text-starlight/40 font-bold">
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                CENTRAL COGNITIVE CALIBRATION:
              </span>
              <span className="text-purple-400 font-bold">{frequency} Hz</span>
            </div>
            <input
              type="range"
              min="300"
              max="999"
              value={frequency}
              onChange={(e) => handleFrequencySlider(Number(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500 outline-none"
            />
            <div className="flex justify-between text-[8px] font-mono text-starlight/20 uppercase">
              <span>300 Hz (Sub-harmonic Harmony)</span>
              <span>999 Hz (Extreme Compression)</span>
            </div>
          </div>

          {/* Synth Volume gain slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="flex items-center gap-1.5 text-starlight/40 font-bold">
                <Music className="w-3.5 h-3.5 text-purple-400" />
                AMPLITUDE (VOLUME ACCENT):
              </span>
              <span className="text-purple-400 font-bold">{Math.round(gainLevel * 100)} %</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.4"
              step="0.01"
              value={gainLevel}
              onChange={(e) => handleGainSlider(Number(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500 outline-none"
              disabled={!isSynthPlaying}
            />
            <div className="flex justify-between text-[8px] font-mono text-starlight/20 uppercase">
              <span>1% Minimum Drone hum</span>
              <span>40% Safe Ceiling Level</span>
            </div>
          </div>

          {/* Alignment Bias Description */}
          <div className="p-3 bg-white/[0.01] rounded-lg border border-white/5 font-mono text-[10px] text-starlight/50 leading-relaxed uppercase">
            <span className="text-purple-400 font-bold">ACTIVE BIAS ALIGNMENT: </span>
            {presets.find(p => p.id === activePreset)?.focus}
          </div>
        </div>

      </div>
    </div>
  );
}
