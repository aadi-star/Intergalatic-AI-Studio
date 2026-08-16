import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatAudioDataUri } from '../App';
import { 
  X, 
  Volume2, 
  Play, 
  Square, 
  Pause, 
  Check, 
  Sparkles, 
  Headphones, 
  Radio, 
  UserPlus, 
  Activity, 
  Music,
  Info
} from 'lucide-react';

interface Character {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  voice?: string;
  description: string;
}

interface VocalLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  onAssignVoice: (charId: string, voiceId: string) => void;
  playUIClick?: () => void;
}

interface VocalPreset {
  id: string;
  name: string;
  tone: string;
  gender: string;
  description: string;
  sampleText: string;
  origin: string;
  accent: string;
  frequency: string;
}

const VOCAL_PRESETS: VocalPreset[] = [
  {
    id: 'Puck',
    name: 'Neural Puck',
    tone: 'Gruff & Deep',
    gender: 'Male',
    description: 'A raspy, low-frequency baritone with subtle mechanical overtones. Excels at grit, gravity, and ground-level realism.',
    sampleText: 'Listen closely. The gears of the universe do not turn on dreams; they turn on raw power and cold steel.',
    origin: 'Forge Sector-4',
    accent: 'Industrial Sector Accent',
    frequency: '92Hz Deep Bass'
  },
  {
    id: 'Charon',
    name: 'Neural Charon',
    tone: 'Wise Elder',
    gender: 'Male',
    description: 'An ancient, steady voice carrying the dust of starfields. Slow, profound, and deeply resonant.',
    sampleText: 'Time is but a stream of light cascading through the cosmos. We are merely the ferrymen of its memories.',
    origin: 'Acheron Archive',
    accent: 'Ethereal Cosmic Dialect',
    frequency: '110Hz Warm Baritone'
  },
  {
    id: 'Kore',
    name: 'Neural Kore',
    tone: 'Ethereal & Smooth',
    gender: 'Female',
    description: 'Sleek, melodic, and exceptionally polished. Calm authority with clean, musical cadence.',
    sampleText: 'In the silence between the stars, a harmonic melody is playing. Can you hear the whisper of the code?',
    origin: 'Elysium Terminal',
    accent: 'Starlight High Vocal',
    frequency: '210Hz Soft Alto'
  },
  {
    id: 'Fenrir',
    name: 'Neural Fenrir',
    tone: 'Commanding',
    gender: 'Male',
    description: 'Deep, crisp, and authoritative. Carries an unyielding presence that demands immediate focus and obedience.',
    sampleText: 'We do not ask for consensus; we command the convergence of truth. Align your neural nodes immediately.',
    origin: 'Asgard Citadel',
    accent: 'Imperial Dreadnought Tone',
    frequency: '85Hz Heavy Sub-Bass'
  },
  {
    id: 'Zephyr',
    name: 'Neural Zephyr',
    tone: 'Sleek & Modern',
    gender: 'Vocal Stream',
    description: 'Fluid, fast, and highly analytical. Ideal for high-density diagnostic relays and rapid tactical coordination.',
    sampleText: 'Data stream analyzed. Vector trajectory optimized for maximum transmission efficiency across all warp lanes.',
    origin: 'Silicon Spire',
    accent: 'Synthesized Matrix Flow',
    frequency: '145Hz Tenor Stream'
  },
  {
    id: 'random',
    name: 'Randomized Matrix',
    tone: 'Procedural Cyberware',
    gender: 'Adaptive',
    description: 'A dynamic, unpredictable compilation of neural components that morphs with each transmission attempt.',
    sampleText: 'Warning. Unstable temporal fluctuations detected. Core parameters are undergoing chaotic reconstruction.',
    origin: 'Entropy Reef',
    accent: 'Fluctuating Cyphers',
    frequency: 'Variable Resonance'
  }
];

export const VocalLibraryModal: React.FC<VocalLibraryModalProps> = ({
  isOpen,
  onClose,
  characters,
  onAssignVoice,
  playUIClick
}) => {
  const [selectedVoice, setSelectedVoice] = useState<VocalPreset>(VOCAL_PRESETS[0]);
  const [customText, setCustomText] = useState<string>(VOCAL_PRESETS[0].sampleText);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [audioWaves, setAudioWaves] = useState<number[]>(Array.from({ length: 24 }, () => 15));

  // Sync custom text when changing voice selection
  useEffect(() => {
    setCustomText(selectedVoice.sampleText);
    stopPlayback();
    setStatusMessage('');
  }, [selectedVoice]);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  const stopPlayback = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsPlaying(false);
    // Reset wave visualizer
    setAudioWaves(Array.from({ length: 24 }, () => 15));
  };

  const startWaveAnimation = () => {
    const updateWaves = () => {
      setAudioWaves(prev => prev.map(() => Math.floor(Math.random() * 45) + 10));
      animationFrameRef.current = requestAnimationFrame(updateWaves);
    };
    updateWaves();
  };

  const handlePreview = async () => {
    if (playUIClick) playUIClick();
    if (isPlaying) {
      stopPlayback();
      return;
    }

    try {
      setIsSynthesizing(true);
      setStatusMessage('FORGING NEURAL WAVESTREAM...');
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: customText, voice: selectedVoice.id }),
      });

      if (!response.ok) {
        throw new Error(`Synthesis failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.audioData) {
        throw new Error('No audio wave payload received from synthesizer.');
      }

      const audioUrl = formatAudioDataUri(data.audioData, data.mimeType || 'audio/wav');
      
      // Stop old playback if working
      stopPlayback();

      const audio = new Audio(audioUrl);
      activeAudioRef.current = audio;
      setIsPlaying(true);
      setStatusMessage('SPEECH STREAM ONLINE');
      startWaveAnimation();

      audio.onended = () => {
        stopPlayback();
        setStatusMessage('TRANSMISSION COMPLETED');
      };

      audio.onerror = () => {
        stopPlayback();
        setStatusMessage('SPEECH CHANNEL CORRUPTED');
      };

      audio.play().catch(err => {
        console.warn("Autoplay gesture blocked by browser:", err);
        stopPlayback();
        setStatusMessage('PLAYBACK BLOCKED - GESTURE REQUIRED');
      });

    } catch (err: any) {
      console.error(err);
      setStatusMessage(`INTERFACE ERROR: ${err.message || 'TRANSMISSION TIMEOUT'}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleAssign = (charId: string) => {
    if (playUIClick) playUIClick();
    onAssignVoice(charId, selectedVoice.id);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop glass blur overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            stopPlayback();
            onClose();
          }}
          className="absolute inset-0 bg-[#020208]/85 backdrop-blur-md cursor-pointer"
          id="vocal-library-backdrop"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl h-[85vh] max-h-[750px] bg-[#050510]/95 border border-purple-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(147,51,234,0.15)] flex flex-col z-10"
          id="vocal-library-modal-box"
        >
          {/* Glowing matrix bars and design grid */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/5" />
          
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between relative bg-black/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Volume2 className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-starlight">Neural Vocal Library</h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/30 text-[8px] font-mono font-black text-purple-400 uppercase tracking-widest">
                    V3.8 Transceiver
                  </span>
                </div>
                <p className="text-[10px] text-starlight/40 font-mono tracking-wider uppercase">PRE-AUDIT HIGH FIDELITY SYNTHESIS MATRICES FOR COUNCIL MEMBERS</p>
              </div>
            </div>

            <button
              onClick={() => {
                if (playUIClick) playUIClick();
                stopPlayback();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-starlight/60 hover:text-starlight hover:scale-105 active:scale-95 transition-all cursor-pointer"
              id="vocal-library-close-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Grid Body */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
            {/* Left Column: Voice Tape deck & Selection list */}
            <div className="md:col-span-5 border-r border-white/15 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-black/10">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Headphones className="w-3.5 h-3.5" />
                  Select Synapse Matrix ({VOCAL_PRESETS.length})
                </h4>
              </div>

              <div className="space-y-3">
                {VOCAL_PRESETS.map((preset) => {
                  const isCurSelected = selectedVoice.id === preset.id;
                  
                  // Count who in characters is assigned this voice
                  const assignedTo = characters.filter(c => (c.voice || 'random') === preset.id);

                  return (
                    <motion.div
                      key={preset.id}
                      onClick={() => {
                        if (playUIClick) playUIClick();
                        setSelectedVoice(preset);
                      }}
                      className={`relative p-4 rounded-2xl border transition-all cursor-pointer group flex items-start gap-4 ${
                        isCurSelected 
                          ? 'border-purple-500/50 bg-purple-500/[0.06] shadow-[0_0_20px_rgba(147,51,234,0.12)]' 
                          : 'border-white/5 bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.03]'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {/* Left color dot marker */}
                      <div className={`absolute top-4 left-0 w-[3px] h-8 rounded-r-md transition-colors ${
                        isCurSelected ? 'bg-purple-400' : 'bg-transparent group-hover:bg-white/20'
                      }`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`font-display text-sm font-bold transition-all ${
                            isCurSelected ? 'text-purple-300' : 'text-starlight/80 group-hover:text-starlight'
                          }`}>
                            {preset.name}
                          </p>
                          <span className="text-[9px] font-mono text-starlight/30 bg-white/5 px-2 py-0.5 rounded-md">
                            {preset.gender}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1.5 font-mono text-[9px] text-starlight/40">
                          <span className="text-purple-400/80">{preset.tone}</span>
                          <span>•</span>
                          <span>{preset.origin}</span>
                        </div>

                        {assignedTo.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                            <span className="text-[8px] font-mono uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              <Check className="w-2 h-2" />
                              Active Link:
                            </span>
                            {assignedTo.map(c => (
                              <span key={c.id} className="text-[8px] font-mono text-starlight/70 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md">
                                {c.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Console Terminal, Text editing, Play preview & Assignment controller */}
            <div className="md:col-span-7 overflow-y-auto custom-scrollbar p-6 space-y-6 flex flex-col justify-between" id="vocal-library-right-panel">
              {/* Profile Details Block */}
              <div className="space-y-4">
                <div className="glass-panel p-5 border-purple-500/20 bg-purple-950/[0.04] relative overflow-hidden rounded-2xl">
                  {/* Glowing orbital grid */}
                  <div className="absolute -right-16 -top-16 p-12 bg-purple-500/5 rounded-full blur-2xl" />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display text-2xl font-black text-starlight flex items-center gap-2">
                        {selectedVoice.name}
                        <Sparkles className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
                      </h4>
                      <p className="text-[10px] font-mono text-purple-400 tracking-widest uppercase mt-1">Origin Station: {selectedVoice.origin}</p>
                    </div>

                    <div className="text-right font-mono text-[9px] text-starlight/45 space-y-0.5">
                      <p>Wavelength: <span className="text-purple-300 font-bold">{selectedVoice.frequency}</span></p>
                      <p>Accent: <span className="text-purple-300 font-bold">{selectedVoice.accent}</span></p>
                    </div>
                  </div>

                  <p className="text-xs text-starlight/70 mt-4 leading-relaxed font-sans border-t border-white/5 pt-4">
                    {selectedVoice.description}
                  </p>
                </div>

                {/* Live Custom Script Synth Console */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono text-amber-500 uppercase tracking-widest flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-amber-500" />
                      Matrix Dialogue Sandbox
                    </label>
                    <button
                      onClick={() => {
                        if (playUIClick) playUIClick();
                        setCustomText(selectedVoice.sampleText);
                      }}
                      className="text-[9px] font-mono text-starlight/40 hover:text-starlight underline"
                    >
                      Reset default voice line
                    </button>
                  </div>

                  <div className="relative">
                    <textarea
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      maxLength={320}
                      className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-xs font-sans text-starlight focus:border-purple-400/40 outline-none h-24 resize-none transition-all"
                      placeholder="Type a custom phrase to hear this specific neural voice synthesize it..."
                    />
                    <div className="absolute bottom-3 right-3 text-[8px] font-mono text-starlight/35">
                      {customText.length}/320 CHARS
                    </div>
                  </div>
                </div>

                {/* Synthesis Output Waveform Trigger */}
                <div className="glass-panel p-4 border-white/10 bg-black/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex-1 w-full flex items-center gap-4">
                    <button
                      onClick={handlePreview}
                      disabled={isSynthesizing || !customText.trim()}
                      className={`h-11 px-5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                        isPlaying 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-purple-500 text-white hover:bg-purple-600'
                      }`}
                    >
                      {isSynthesizing ? (
                        <Activity className="w-4 h-4 animate-spin text-starlight" />
                      ) : isPlaying ? (
                        <Square className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                      <span>
                        {isSynthesizing 
                          ? 'CALIBRATING...' 
                          : isPlaying 
                            ? 'DISENGAGE AUDIO' 
                            : 'TEST PREVIEW'
                        }
                      </span>
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-mono text-starlight/40 uppercase tracking-widest">Synth Protocol State</p>
                      <p className={`text-[10px] font-mono font-bold truncate mt-0.5 ${
                        isSynthesizing ? 'text-amber-400 tracking-widest' : isPlaying ? 'text-emerald-400 animate-pulse' : 'text-purple-300'
                      }`}>
                        {statusMessage || 'IDLE CHANNEL - READY TO ENGAGE'}
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Soundwave animation */}
                  <div className="flex items-end gap-[2px] h-8 justify-center px-2">
                    {audioWaves.map((h, i) => (
                      <motion.div
                        key={i}
                        className={`w-[2px] rounded-full transition-colors ${
                          isPlaying ? 'bg-purple-400' : 'bg-white/10'
                        }`}
                        animate={{ height: isPlaying ? h : 4 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Council Assign Matrix Section */}
              <div className="space-y-4 pt-6 mt-6 border-t border-white/10">
                <h4 className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-widest flex items-center gap-2">
                  <UserPlus className="w-3.5 h-3.5" />
                  Apply This Voice To Council Members
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {characters.map((char) => {
                    const isAssigned = (char.voice || 'random') === selectedVoice.id;
                    const charColor = char.id === 'lion' ? 'border-amber-500/20 text-amber-400 bg-amber-500/[0.02]' : (char.id === 'jaguar' ? 'border-purple-500/20 text-purple-400 bg-purple-500/[0.02]' : 'border-red-500/20 text-red-400 bg-red-500/[0.02]');

                    return (
                      <div 
                        key={char.id} 
                        className={`glass-panel p-3 border rounded-xl flex flex-col justify-between h-28 relative ${charColor}`}
                      >
                        <div className="flex items-start gap-2.5">
                          {char.avatar ? (
                            <img 
                              src={char.avatar} 
                              alt={char.name} 
                              className="w-7 h-7 rounded-lg object-cover border border-white/10 flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center font-mono font-bold text-xs">
                              {char.name[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-starlight truncate">{char.name}</p>
                            <p className="text-[8px] font-mono text-starlight/40 truncate">{char.role}</p>
                          </div>
                        </div>

                        <div className="mt-2.5">
                          {isAssigned ? (
                            <div className="w-full py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center gap-1 text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                              <Check className="w-3 h-3" />
                              Active Voice
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAssign(char.id)}
                              className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[8px] font-mono font-bold text-starlight/75 hover:text-starlight hover:border-purple-400/40 uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                            >
                              Assign Voice
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
