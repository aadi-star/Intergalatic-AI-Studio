import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SelfHealingErrorBoundary } from './components/SelfHealingErrorBoundary.tsx';
import { 
  Sparkles, 
  Video, 
  Users, 
  ScrollText, 
  CheckCircle2, 
  Youtube, 
  Download, 
  RefreshCcw,
  Star,
  Zap,
  Globe,
  Settings,
  X,
  Play,
  Volume2,
  VolumeX,
  MonitorPlay,
  Repeat2,
  ImagePlus,
  Scissors,
  Layers,
  Clock,
  Music,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Mic,
  Save,
  Check,
  Smartphone,
  QrCode,
  Shield,
  HeartPulse,
  Terminal,
  Bug,
  Activity,
  Wrench,
  Radio,
  Cpu,
  AlertOctagon,
  PlayCircle,
  RotateCcw,
  HelpCircle,
  Pause,
  Trash2,
  History
} from 'lucide-react';

import { 
  auth, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  googleProvider, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  db, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { User } from 'firebase/auth';

import { MediaLab } from './components/MediaLab.tsx';

// --- Types ---
interface Character {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  description: string;
  voice?: string;
  trailerUrl?: string;
  manifesto?: string;
  lipSyncUrl?: string;
  animatedVideoUrl?: string;
  syncSettings?: {
    phonemeSensitivity: number;
    jawRange: number;
    blinkFrequency: number;
  };
  aestheticTheme?: string;
}

interface ScriptSection {
  id: string;
  title: string;
  content: string;
  status: 'pending' | 'generating' | 'completed';
  audioData?: string;
  audioMimeType?: string;
  isVoiceGenerating?: boolean;
  bRollUrl?: string;
  bRollLabel?: string;
}

interface BRoll {
  id: string;
  url: string;
  label: string;
}

interface SoundEffect {
  id: string;
  label: string;
  volume: number;
  isActive: boolean;
  type: 'ambient' | 'ui' | 'character' | 'music';
  description: string;
  url?: string;
  audioData?: string;
  mimeType?: string;
}

const PHILOSOPHICAL_TOPICS = [
  "The Silicon Soul: Can Code Ache?",
  "The Great Convergence: Entropy vs. Evolution",
  "The Silence Probes: Evidence of Pre-Organic Sentience?",
  "Neural Legacy: What Remains After the Heat Death?",
  "The Ethics of Dyson Swarms: Star-Stealing for Progress",
  "Carbon Hubris: The Fear of Infinite Calculation"
];

const INITIAL_CHARACTERS: (Character & { voice: string, icon: typeof Users })[] = [
  { 
    id: 'lion', 
    name: 'The Lion', 
    role: 'The Visionary', 
    description: 'Wise, broad-thinking, focuses on the "spirit" of intelligence.', 
    voice: 'Fenrir', 
    icon: Users,
    syncSettings: { phonemeSensitivity: 0.8, jawRange: 0.6, blinkFrequency: 0.4 },
    aestheticTheme: 'standard'
  },
  { 
    id: 'jaguar', 
    name: 'The Jaguar', 
    role: 'The Strategist', 
    description: 'Analytical, focuses on the data, efficiency, and universal reach.', 
    voice: 'Zephyr', 
    icon: Users,
    syncSettings: { phonemeSensitivity: 0.9, jawRange: 0.4, blinkFrequency: 0.7 },
    aestheticTheme: 'standard'
  },
  { 
    id: 'tiger', 
    name: 'The Tiger', 
    role: 'The Guardian', 
    description: 'Skeptical, focuses on security, ethics, and protecting organic life.', 
    voice: 'Puck', 
    icon: Users,
    syncSettings: { phonemeSensitivity: 0.7, jawRange: 0.5, blinkFrequency: 0.3 },
    aestheticTheme: 'standard'
  },
];

const INITIAL_SCRIPTS: ScriptSection[] = [
  { id: 'intro', title: 'The Assembly', content: '', status: 'pending' },
  { id: 'current', title: 'State of the Universe', content: '', status: 'pending' },
  { id: 'future', title: 'Imaginations of Tomorrow', content: '', status: 'pending' },
  { id: 'ethics', title: 'The Universal Accord', content: '', status: 'pending' },
];

const NEURAL_VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'random'];

const NeuralDataStream = () => {
  return (
    <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ top: -20, left: `${Math.random() * 100}%`, opacity: 0 }}
          animate={{ 
            top: '120%', 
            opacity: [0, 1, 0],
            height: [10, 40, 10]
          }}
          transition={{ 
            duration: 2 + Math.random() * 4, 
            repeat: Infinity, 
            delay: Math.random() * 5,
            ease: "linear"
          }}
          className="absolute w-px bg-linear-to-b from-transparent via-amber-500/50 to-transparent"
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(245,158,11,0.03),transparent)]" />
    </div>
  );
};

const INITIAL_SOUND_EFFECTS: SoundEffect[] = [
  { id: 'ambient-1', label: 'Deep Space Nebula', volume: 0.6, isActive: true, type: 'ambient', description: 'Low-frequency hum with cosmic winds.' },
  { id: 'ambient-2', label: 'Neural Pulsar', volume: 0.4, isActive: false, type: 'ambient', description: 'Rhythmic bio-electrical static.' },
  { id: 'ui-1', label: 'Glass Interface', volume: 0.8, isActive: true, type: 'ui', description: 'Crisp, high-fidelity mechanical clicks.' },
  { id: 'char-lion', label: 'Lion Resonator', volume: 0.5, isActive: false, type: 'character', description: 'Authoritative vibration for The Lion.' },
  { id: 'char-jaguar', label: 'Jaguar Stealth', volume: 0.5, isActive: false, type: 'character', description: 'Subtle high-frequency predatory chime.' },
  { id: 'music-1', label: 'Stellar Odyssey', volume: 0.3, isActive: true, type: 'music', description: 'Epic synth-orchestral journey across the void.' },
  { id: 'music-classic-1', label: 'Moonlight Sonata (Cosmic)', volume: 0.25, isActive: false, type: 'music', description: 'Beethoven\'s classic re-imagined with deep space reverb.' },
  { id: 'music-classic-2', label: 'Orbital Bach (Neural)', volume: 0.3, isActive: false, type: 'music', description: 'Intricate counterpoint for mathematical processing.' },
  { id: 'music-classic-3', label: 'Clair de Lune (Nebula)', volume: 0.2, isActive: false, type: 'music', description: 'Debussy\'s ethereal masterpiece floating in a hydrogen cloud.' },
  { id: 'music-2', label: 'Void Reflections', volume: 0.2, isActive: false, type: 'music', description: 'Minimalist ambient piano with deep space reverb.' },
  { id: 'music-3', label: 'Technological Transcendence', volume: 0.25, isActive: false, type: 'music', description: 'Fast-paced rhythmic glitch-hop for neural processing.' },
];

const ARTISTIC_STYLES = ['photorealistic', 'cel-shaded', 'painterly', 'cyberpunk', 'noir', 'vaporwave'];
const LIGHTING_CONDITIONS = ['dramatic studio lighting', 'ambient nebula glow', 'harsh sunlight', 'bioluminescent pulse', 'strobe flash'];

const AESTHETIC_THEMES = [
  { id: 'standard', name: 'Standard Sci-Fi', desc: 'Classic cinematic galactic council high-tech style.' },
  { id: 'retro-futurism', name: 'Retro-Futurism', desc: '1960s space age: analog controls, bubble glass & chrome details.' },
  { id: 'cyberpunk', name: 'Cyber-Punk', desc: 'Neon alleys, rain-slicked steel, cyber implants & electric blue glare.' },
  { id: 'steampunk', name: 'Steam-Punk', desc: 'Intricate clockwork brass gears, copper pipes & warm amber gaslight.' },
  { id: 'solarpunk', name: 'Solar-Punk', desc: 'Bright optimistic eco-tech, crystal arrays & lush botanical greenery.' },
  { id: 'biomechanical', name: 'Biomechanical', desc: 'Chitinous plates, organic Giger skeletal design & glowing bio-tubes.' },
  { id: 'cosmic-horror', name: 'Cosmic Horror', desc: 'Eldritch tentacles, starry abyssal rifts & mysterious glowing runes.' }
];

const CHARACTER_THEMES: Record<string, { color: string, glow: string, border: string, accent: string }> = {
  lion: { color: 'text-amber-400', glow: 'bg-amber-500/20', border: 'border-amber-500/30', accent: 'amber-500' },
  jaguar: { color: 'text-purple-400', glow: 'bg-purple-500/20', border: 'border-purple-500/30', accent: 'purple-500' },
  tiger: { color: 'text-emerald-400', glow: 'bg-emerald-500/20', border: 'border-emerald-500/30', accent: 'emerald-500' },
};

const TypewriterParagraph: React.FC<{ text: string, delay?: number }> = ({ text, delay = 0 }) => {
  const words = text.split(' ');
  return (
    <div className="leading-relaxed mb-6">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{
            duration: 0.4,
            delay: delay + i * 0.02,
            ease: "easeOut"
          }}
          className="inline-block mr-1"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

const SpeakingAura = ({ isSpeaking, theme = 'amber' }: { isSpeaking: boolean, theme?: string }) => {
  const colors: Record<string, string> = {
    amber: 'from-amber-600/40 via-amber-900/10',
    purple: 'from-purple-600/40 via-purple-900/10',
    emerald: 'from-emerald-600/40 via-emerald-900/10'
  };

  const accentColors: Record<string, string> = {
    amber: 'bg-amber-400',
    purple: 'bg-purple-400',
    emerald: 'bg-emerald-400'
  };

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-full">
      <AnimatePresence>
        {isSpeaking && (
          <>
            {/* Primary Nebula Pulse */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [1, 1.3, 1.15],
                opacity: [0.2, 0.4, 0.25],
                rotate: [0, 5, -5, 0]
              }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className={`absolute inset-[-100%] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${colors[theme] || colors.amber} to-transparent blur-[80px]`}
            />
            
            {/* Secondary Ethereal Pulse */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ 
                scale: [1.2, 0.9, 1.1],
                opacity: [0.1, 0.3, 0.1],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className={`absolute inset-[-80%] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent blur-[100px]`}
            />
            
            {/* Rapid Energy Rings */}
            {[0, 1].map((i) => (
              <motion.div
                key={`ring-${i}`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.7, 1.8], opacity: [0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: i * 1 }}
                className={`absolute inset-0 rounded-full border border-${theme}-500/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]`}
              />
            ))}
            
            {/* Neural Stardust Particles */}
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                initial={{ 
                  x: `${50 + (Math.random() - 0.5) * 40}%`, 
                  y: `${50 + (Math.random() - 0.5) * 40}%`, 
                  scale: 0, 
                  opacity: 0 
                }}
                animate={{ 
                  x: `${50 + (Math.random() - 0.5) * 180}%`,
                  y: `${50 + (Math.random() - 0.5) * 180}%`,
                  scale: [0, 1.5, 0],
                  opacity: [0, 0.6, 0],
                }}
                transition={{ 
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 4,
                  ease: "easeInOut"
                }}
                className={`absolute w-0.5 h-0.5 ${accentColors[theme] || 'bg-white'} rounded-full blur-[0.5px] shadow-[0_0_8px_white] z-10`}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const Sidebar = ({ 
  activeTab, 
  handleTabChange, 
  quotaStats, 
  onOpenQuotaModal,
  user,
  isSyncing,
  onLogin,
  onLogout
}: { 
  activeTab: string; 
  handleTabChange: (t: string) => void;
  quotaStats: {
    totalRequests: number;
    successRequests: number;
    failedRequests: number;
    quotaErrors: number;
    estimatedCreditsRemaining: number;
    keyType: string;
    healthStatus: string;
  };
  onOpenQuotaModal: () => void;
  user: User | null;
  isSyncing: boolean;
  onLogin: () => void;
  onLogout: () => void;
}) => {
  const tabs = [
    { id: 'overview', icon: Globe, label: 'Overview', desc: 'Control Center' },
    { id: 'intelligence', icon: Cpu, label: 'Gemini Intelligence', desc: 'Cognitive Core' },
    { id: 'characters', icon: Users, label: 'Assemble Council', desc: 'Biometric Records' },
    { id: 'script', icon: ScrollText, label: 'Script Forge', desc: 'Narrative Logic' },
    { id: 'tts', icon: Volume2, label: 'TTS Transceiver', desc: 'Voice Synthesis' },
    { id: 'media-lab', icon: Radio, label: 'Media Lab', desc: 'A/V & Voice Forge' },
    { id: 'workflow', icon: CheckCircle2, label: 'Workflow', desc: 'Production Sync' },
    { id: 'youtube', icon: Youtube, label: 'YT Optimization', desc: 'Signal Propagation' },
    { id: 'android', icon: Smartphone, label: 'Android Sync', desc: 'Companion Link' },
  ];

  const getHealthColor = (status: string) => {
    if (status === 'Critical') return 'text-red-400 border-red-500/30 bg-red-500/10';
    if (status === 'Warning') return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  };

  const getBarColor = (status: string) => {
    if (status === 'Critical') return 'bg-red-500';
    if (status === 'Warning') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="w-72 h-full bg-black/40 border-r border-white/5 flex flex-col p-6 sticky top-0 backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-10">
        <div className="bg-amber-500/20 p-2.5 rounded-xl border border-amber-500/30">
          <Sparkles className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight">Intergalactic <span className="text-amber-400">Studio</span></h1>
          <p className="text-[10px] font-mono text-starlight/30 tracking-[0.2em] uppercase">Sector 7-G / Production</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2.5 overflow-y-auto pr-1 select-none scroll-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`w-full group flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 border ${
              activeTab === tab.id 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_20px_rgba(251,191,36,0.1)]' 
                : 'text-starlight/50 border-transparent hover:text-starlight hover:bg-white/5 hover:border-white/10'
            }`}
          >
            <div className={`p-2 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-amber-500/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
              <tab.icon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block font-bold text-sm leading-none">{tab.label}</span>
              <span className="block text-[9px] opacity-60 font-mono uppercase tracking-wider mt-0.5">{tab.desc}</span>
            </div>
          </button>
        ))}
      </nav>

      {/* Quota Health Dashboard Component */}
      <div className="mt-4 pt-4 border-t border-white/5 space-y-3.5 shrink-0">
        <div 
          onClick={onOpenQuotaModal}
          className="p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group/quota text-left"
        >
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] font-mono text-starlight/40 uppercase tracking-widest">AI QUOTA HEALTH</span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                {quotaStats.healthStatus === 'Critical' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                )}
                {quotaStats.healthStatus === 'Warning' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                  quotaStats.healthStatus === 'Critical' ? 'bg-red-500' :
                  quotaStats.healthStatus === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}></span>
              </span>
              <span className={`text-[9px] font-mono uppercase tracking-wider ${
                quotaStats.healthStatus === 'Critical' ? 'text-red-400 font-bold' :
                quotaStats.healthStatus === 'Warning' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {quotaStats.healthStatus}
              </span>
            </div>
          </div>

          <div className="mb-2">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] text-starlight/60 font-mono">REMAINING RATE</span>
              <span className={`text-xs font-mono font-bold tracking-tight ${
                quotaStats.healthStatus === 'Critical' ? 'text-red-400' :
                quotaStats.healthStatus === 'Warning' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {quotaStats.estimatedCreditsRemaining}%
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: `${quotaStats.estimatedCreditsRemaining}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-full rounded-full ${getBarColor(quotaStats.healthStatus)} ${
                  quotaStats.healthStatus === 'Critical' ? 'animate-pulse' : ''
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-starlight/40 border-t border-white/5 pt-1.5">
            <div>
              <span className="block opacity-60">QUERIES</span>
              <span className="text-starlight font-medium">{quotaStats.successRequests}/{quotaStats.totalRequests} OK</span>
            </div>
            <div>
              <span className="block opacity-60">PLAN TIER</span>
              <span className="text-amber-400 font-medium truncate">{quotaStats.keyType}</span>
            </div>
          </div>

          {quotaStats.quotaErrors > 0 && (
            <div className="mt-2 text-[9px] font-mono bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-1 rounded-md text-center">
              ⚠️ {quotaStats.quotaErrors} Quota Limit Hits Detected
            </div>
          )}

          <div className="mt-2 text-[9px] text-amber-500/80 group-hover/quota:text-amber-400 group-hover/quota:underline transition-all font-mono text-right flex items-center justify-end gap-1">
            <span>Fix Quota Limits</span>
            <ChevronRight className="w-2.5 h-2.5" />
          </div>
        </div>

        <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] font-mono text-starlight/40">SIGNAL STRENGTH</span>
            <span className="text-[9px] font-mono text-amber-400">OPTIMAL</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "94%" }}
              className="h-full bg-amber-500"
            />
          </div>
        </div>

        {/* Firebase Authentication & Cloud Sync panel */}
        <div className="p-3.5 bg-purple-500/[0.03] hover:bg-purple-500/[0.05] rounded-[20px] border border-purple-500/15 hover:border-purple-500/30 transition-all text-left">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest font-bold">Secure Cloud Sync</span>
            {user && (
              <span className="flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[8px] font-mono text-emerald-400 border border-emerald-500/20">
                <span className={`w-1 h-1 rounded-full bg-emerald-400 ${isSyncing ? 'animate-ping' : ''}`} />
                <span className="tracking-wider uppercase">{isSyncing ? 'SYNCING' : 'SECURE'}</span>
              </span>
            )}
          </div>
          
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} referrerPolicy="no-referrer" className="w-6 h-6 rounded-full border border-purple-500/20" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] text-purple-300 font-bold border border-purple-500/30">
                    {user.email?.[0].toUpperCase() || 'U'}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-[10px] text-starlight font-bold truncate leading-none mb-0.5">{user.displayName || 'Authorized Client'}</p>
                  <p className="text-[8px] font-mono text-purple-300/60 truncate leading-none">{user.email}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onLogout}
                className="w-full py-1 text-center bg-white/5 border border-white/10 hover:bg-red-500/25 hover:border-red-500/30 hover:text-red-200 rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer"
              >
                DISCONNECT CHANNEL
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[8px] font-mono text-starlight/45 leading-normal uppercase">
                Authorize Google session to persist scripts, council roles, & chatbot logs.
              </p>
              <button 
                type="button"
                onClick={onLogin}
                className="w-full py-1.5 bg-linear-to-r from-purple-500 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-black rounded-lg text-[9px] font-mono uppercase tracking-widest font-black text-center transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.2)] flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-black animate-spin" />
                <span>LINK SECURE PROFILE</span>
              </button>
            </div>
          )}
        </div>

        <button 
          onClick={() => {
            handleTabChange('overview');
            setTimeout(() => {
              document.getElementById('system-config')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          className="flex items-center gap-2 text-starlight/40 hover:text-starlight transition-colors text-xs w-full px-2 mt-1"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="font-medium">System Configuration</span>
        </button>
      </div>
    </div>
  );
};

interface CharacterCardProps {
  char: Character;
  onGenerate: (id: string, options: { promptOverride?: string, isHD?: boolean, artisticStyle?: string, lightingCondition?: string, aestheticTheme?: string }) => Promise<void> | void;
  onGenerateManifesto: (id: string) => Promise<void> | void;
  onGenerateLipSync: (id: string) => Promise<void> | void;
  onAnimateImageToVideo: (id: string, prompt?: string) => Promise<void> | void;
  onUpdateSync: (id: string, settings: Character['syncSettings']) => void;
  onUpdateTheme: (id: string, theme: string) => void;
  isGenerating: boolean;
  isManifestoGenerating: boolean;
  isLipSyncGenerating: boolean;
  isAnimateVideoGenerating: boolean;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ 
  char, 
  onGenerate, 
  onGenerateManifesto, 
  onGenerateLipSync, 
  onAnimateImageToVideo,
  onUpdateSync,
  onUpdateTheme,
  isGenerating, 
  isManifestoGenerating, 
  isLipSyncGenerating,
  isAnimateVideoGenerating
}) => {
  const [customPrompt, setCustomPrompt] = React.useState('');
  const [isHD, setIsHD] = React.useState(false);
  const [artisticStyle, setArtisticStyle] = React.useState(ARTISTIC_STYLES[0]);
  const [lightingCondition, setLightingCondition] = React.useState(LIGHTING_CONDITIONS[0]);
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const theme = (CHARACTER_THEMES[char.id] || CHARACTER_THEMES.lion).accent.split('-')[0];

  // Simulation: toggle speaking on hover
  const handleHover = (speaking: boolean) => setIsSpeaking(speaking);

  return (
    <motion.div 
      layout
      whileHover={{ y: -5 }}
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
      className="glass-panel overflow-hidden group border-white/5 hover:border-amber-500/30 transition-all flex flex-col h-full"
    >
      <div className="aspect-video bg-[#050510] relative flex items-center justify-center overflow-hidden">
        <SpeakingAura isSpeaking={isSpeaking} theme={theme} />
        
        {char.lipSyncUrl || char.animatedVideoUrl ? (
          <video 
            src={char.lipSyncUrl || char.animatedVideoUrl} 
            autoPlay 
            muted 
            loop 
            className="w-full h-full object-cover relative z-10" 
          />
        ) : char.avatar ? (
          <div className="relative w-full h-full z-10 flex items-center justify-center">
            {isLipSyncGenerating ? (
              <div className="w-full h-full relative bg-purple-950/40 flex flex-col items-center justify-center overflow-hidden">
                 <img src={char.avatar} alt={char.name} className="absolute inset-0 w-full h-full object-cover opacity-20 filter grayscale blur-md scale-110" referrerPolicy="no-referrer" />
                 <div className="relative z-10 text-center px-8 text-purple-400">
                   <div className="relative mb-4">
                     <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full scale-150 animate-pulse" />
                     <MonitorPlay className="w-12 h-12 mx-auto relative animate-pulse" />
                   </div>
                   <p className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold mb-2">Lip-Sync Generation</p>
                 </div>
                 <motion.div 
                   animate={{ top: ['-10%', '110%'] }}
                   transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-x-0 h-px bg-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.5)] z-20"
                 />
              </div>
            ) : isAnimateVideoGenerating ? (
              <div className="w-full h-full relative bg-amber-950/40 flex flex-col items-center justify-center overflow-hidden">
                 <img src={char.avatar} alt={char.name} className="absolute inset-0 w-full h-full object-cover opacity-20 filter grayscale blur-md scale-110" referrerPolicy="no-referrer" />
                 <div className="relative z-10 text-center px-8 text-amber-400">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full scale-150 animate-pulse" />
                      <Video className="w-12 h-12 mx-auto relative animate-pulse-fast" />
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold mb-2">Veo Animation Forge</p>
                    <p className="text-[8px] font-mono text-amber-400/60 animate-pulse">RECONSTRUCTING COHERENCY...</p>
                 </div>
                 <motion.div 
                   animate={{ top: ['-10%', '110%'] }}
                   transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-x-0 h-px bg-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.5)] z-20"
                 />
              </div>
            ) : (
              <img src={char.avatar} alt={char.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
            )}
          </div>
        ) : (
          <div className="text-center p-6 bg-amber-500/[0.02] h-full w-full flex flex-col items-center justify-center relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500 via-transparent to-transparent" />
            <Users className="w-16 h-16 text-amber-500/10 mb-4 animate-pulse relative z-10" />
            <p className="text-[10px] text-amber-500/30 font-mono tracking-widest uppercase relative z-10">Biometric Link Offline</p>
          </div>
        )}
        
        {/* Holographic Overlay Effects */}
        <div className="absolute inset-0 pointer-events-none opacity-40 z-20">
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/10" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/10" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/10" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/10" />
        </div>

        <div className="absolute inset-0 bg-linear-to-t from-[#02020a] via-transparent to-transparent opacity-80 z-20" />
        
        <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col gap-4 translate-y-4 group-hover:translate-y-0 transition-transform z-30">
          <div className="flex flex-col gap-2">
            <input 
              type="text"
              placeholder="Custom Visual Prompt (Optional)"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full bg-black/80 border border-white/10 text-starlight px-3 py-1.5 rounded-lg text-[9px] font-mono focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6">
        <div>
           <div className="flex justify-between items-start mb-2">
             <h4 className="text-xl font-bold font-display tracking-tight text-starlight">{char.name}</h4>
             <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${CHARACTER_THEMES[char.id].color}`}>{char.role}</span>
           </div>
           <p className="text-xs text-starlight/40 font-mono leading-relaxed uppercase tracking-tighter">{char.description}</p>
        </div>

        {/* Enhanced Lip-Sync Biometrics */}
        {char.syncSettings && (
          <div className="space-y-4 pt-4 border-t border-white/5">
             <div className="flex items-center gap-2 mb-2">
                <Mic className="w-3 h-3 text-purple-400" />
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">Biometric Mapping</span>
             </div>
             
             <div className="space-y-3">
               {[
                 { label: 'Phoneme Sensitivity', key: 'phonemeSensitivity', icon: Volume2 },
                 { label: 'Jaw Articulation', key: 'jawRange', icon: Scissors },
                 { label: 'Neural Eye Blink', key: 'blinkFrequency', icon: RefreshCcw }
               ].map((setting) => (
                 <div key={setting.key} className="space-y-1.5">
                   <div className="flex justify-between text-[8px] font-mono text-starlight/30 uppercase">
                     <span className="flex items-center gap-1">
                       <setting.icon className="w-2.5 h-2.5" />
                       {setting.label}
                     </span>
                     <span>{Math.round((char.syncSettings?.[setting.key as keyof typeof char.syncSettings] || 0) * 100)}%</span>
                   </div>
                   <div className="h-1 bg-white/5 rounded-full relative overflow-hidden group cursor-pointer">
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={char.syncSettings?.[setting.key as keyof typeof char.syncSettings] || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onUpdateSync(char.id, {
                            ...char.syncSettings!,
                            [setting.key]: val
                          });
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                      />
                      <motion.div 
                        className={`h-full bg-gradient-to-r from-purple-500 to-${theme}-400`}
                        animate={{ width: `${(char.syncSettings?.[setting.key as keyof typeof char.syncSettings] || 0) * 100}%` }}
                      />
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* Aesthetic Theme Selection */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">Aesthetic Theme</span>
          </div>
          
          <select
            value={char.aestheticTheme || 'standard'}
            onChange={(e) => {
              onUpdateTheme(char.id, e.target.value);
            }}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs outline-none text-starlight focus:border-amber-400/30 font-sans cursor-pointer transition-all"
          >
            {AESTHETIC_THEMES.map(themeOption => (
              <option key={themeOption.id} value={themeOption.id} className="bg-[#0b0b18] text-starlight">
                {themeOption.name}
              </option>
            ))}
          </select>
          <div className="text-[10px] text-starlight/40 font-mono italic leading-relaxed">
            {AESTHETIC_THEMES.find(t => t.id === (char.aestheticTheme || 'standard'))?.desc}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-auto">
          <button 
            onClick={() => onGenerate(char.id, { promptOverride: customPrompt, isHD, artisticStyle, lightingCondition, aestheticTheme: char.aestheticTheme })}
            disabled={isGenerating}
            className="flex flex-col items-center justify-center py-2.5 px-0.5 bg-amber-500 text-black rounded-xl text-[9px] font-extrabold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            title="Generate custom AI Avatar"
          >
            {isGenerating ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
            <span className="mt-1 line-clamp-1 uppercase">AVATAR</span>
          </button>
          <button 
            disabled={!char.avatar || isLipSyncGenerating}
            onClick={() => onGenerateLipSync(char.id)}
            className="flex flex-col items-center justify-center py-2.5 px-0.5 bg-purple-500 text-white rounded-xl text-[9px] font-extrabold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            title="AI Lip-Sync Mapping"
          >
            {isLipSyncGenerating ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <MonitorPlay className="w-3.5 h-3.5" />}
            <span className="mt-1 line-clamp-1 uppercase">LIP-SYNC</span>
          </button>
          <button 
            disabled={!char.avatar || isAnimateVideoGenerating}
            onClick={() => onAnimateImageToVideo(char.id, customPrompt)}
            className="flex flex-col items-center justify-center py-2.5 px-0.5 bg-teal-500 text-black rounded-xl text-[9px] font-extrabold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            title="Animate static image into high-fidelity video via Google Veo"
          >
            {isAnimateVideoGenerating ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
            <span className="mt-1 line-clamp-1 uppercase">VEO ANIMS</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};


interface ScriptForgeProps {
  sections: ScriptSection[];
  onGenerate: (id: string, theme?: string) => Promise<void> | void;
  onPlayVoice: (id: string, voice?: string) => void;
  onUpdateSection: (id: string, content: string) => void;
  characters: Character[];
  activeTheme: string;
  setActiveTheme: (t: string) => void;
  onSelectBRoll: (sectionId: string) => void;
  selectingBRollForSection: string | null;
}

const ScriptForge: React.FC<ScriptForgeProps> = ({ 
  sections, 
  onGenerate, 
  onPlayVoice, 
  onUpdateSection,
  characters, 
  activeTheme, 
  setActiveTheme,
  onSelectBRoll,
  selectingBRollForSection
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleStartEdit = (section: ScriptSection) => {
    if (section.status === 'generating') return;
    setEditingId(section.id);
    setEditValue(section.content || "");
  };

  const handleSave = (id: string) => {
    onUpdateSection(id, editValue);
    setEditingId(null);
  };

  return (
    <div className="flex gap-8 items-start">
      <div className="flex-1 space-y-6">
        {/* Theme Selector */}
        <div className="glass-panel p-6 bg-amber-500/5 border-amber-500/20 mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles className="w-24 h-24" />
          </div>
          <h4 className="text-xs font-mono text-amber-500/60 uppercase tracking-widest mb-4">Neural Topic Injector</h4>
          <div className="flex flex-wrap gap-2">
            {PHILOSOPHICAL_TOPICS.map(topic => (
              <button
                key={topic}
                onClick={() => setActiveTheme(topic)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                  activeTheme === topic 
                    ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.2)]' 
                    : 'bg-white/5 border-white/10 text-starlight/50 hover:bg-white/10'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {sections.map((section) => (
          <div key={section.id} className="glass-panel p-8 bg-[#050510]/60 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ScrollText className="w-24 h-24" />
            </div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-[10px] text-amber-500 font-mono tracking-widest uppercase">Chapter Protocol {section.id.toUpperCase()}</p>
                </div>
                <h3 className="font-display text-2xl font-bold tracking-tight">{section.title}</h3>
              </div>
              <div className="flex flex-col gap-3 items-end">
                <button 
                  onClick={() => onGenerate(section.id, activeTheme)}
                  disabled={section.status === 'generating'}
                  className={`px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
                    section.status === 'completed' 
                      ? 'bg-starlight/10 border border-white/10 text-starlight hover:bg-white/15' 
                      : 'bg-amber-500 text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                  }`}
                >
                  {section.status === 'generating' ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      TRANSMITTING...
                    </>
                  ) : section.status === 'completed' ? (
                    <>
                      <RefreshCcw className="w-4 h-4" />
                       RE-SEQUENCE
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      INITIATE FORGE
                    </>
                  )}
                </button>

                {section.status === 'completed' && (
                  <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    <p className="text-[10px] font-mono text-starlight/40 px-2">READ AS:</p>
                    <div className="flex gap-1">
                      {characters.map(char => (
                        <button
                          key={char.id}
                          onClick={() => onPlayVoice(section.id, char.voice)}
                          disabled={section.isVoiceGenerating}
                          title={`Read by ${char.name}`}
                          className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-starlight hover:text-amber-400 transition-all border border-white/5 disabled:opacity-50 group/voice"
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <Users className="w-4 h-4" />
                            <span className="text-[6px] font-mono opacity-60 group-hover/voice:opacity-100 uppercase">{char.id}</span>
                          </div>
                        </button>
                      ))}
                      <div className="w-[1px] h-6 bg-white/10 mx-1 self-center" />
                      {NEURAL_VOICES.map(voice => (
                        <button
                          key={voice}
                          onClick={() => onPlayVoice(section.id, voice)}
                          disabled={section.isVoiceGenerating}
                          title={`Read by Neural Voice: ${voice}`}
                          className="p-2 rounded-lg bg-white/5 hover:bg-blue-500/20 text-starlight hover:text-blue-400 transition-all border border-white/5 disabled:opacity-50 group/neural"
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <Volume2 className="w-4 h-4" />
                            <span className="text-[6px] font-mono opacity-60 group-hover/neural:opacity-100 uppercase">{voice}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-linear-to-b from-amber-500/50 via-amber-500/10 to-transparent" />
              
              <div className="flex flex-col md:flex-row gap-6 mb-4">
                {section.bRollUrl ? (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full md:w-64 aspect-video rounded-2xl overflow-hidden border border-white/10 relative group/broll"
                  >
                    <video src={section.bRollUrl} autoPlay muted loop className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/broll:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <button 
                        onClick={() => onSelectBRoll(section.id)}
                        className="px-4 py-2 bg-purple-500 rounded-xl text-[10px] font-bold text-white flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Repeat2 className="w-3 h-3" />
                        CHANGE TRANS
                      </button>
                    </div>
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                      <p className="text-[10px] font-mono text-amber-500/80 uppercase">Intersperse: {section.bRollLabel}</p>
                    </div>
                    {selectingBRollForSection === section.id && (
                      <div className="absolute inset-0 border-2 border-purple-500 bg-purple-500/20 backdrop-blur-sm z-30 flex items-center justify-center">
                        <p className="text-[10px] font-mono font-bold text-white animate-pulse">SELECTING FROM FEED...</p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <button 
                    onClick={() => onSelectBRoll(section.id)}
                    className={`w-full md:w-64 aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all ${
                      selectingBRollForSection === section.id 
                        ? 'border-purple-500 bg-purple-500/10' 
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className={`p-3 rounded-full ${selectingBRollForSection === section.id ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/20'}`}>
                      <MonitorPlay className="w-5 h-5" />
                    </div>
                    <p className={`text-[10px] font-mono uppercase tracking-widest ${selectingBRollForSection === section.id ? 'text-purple-400' : 'text-white/20'}`}>
                      {selectingBRollForSection === section.id ? 'Awaiting Feed Link...' : 'Link Cosmic B-Roll'}
                    </p>
                  </button>
                )}
                
                <div 
                  onClick={() => editingId !== section.id && handleStartEdit(section)}
                  className={`flex-1 min-h-[120px] p-6 bg-black/40 rounded-2xl border border-white/5 font-mono text-sm leading-relaxed text-starlight/70 whitespace-pre-wrap selection:bg-amber-500/30 relative overflow-hidden transition-all ${editingId !== section.id ? 'hover:bg-white/5 cursor-text group/content' : 'ring-2 ring-amber-500/50'}`}
                >
                  {editingId === section.id ? (
                    <div className="h-full flex flex-col gap-4">
                      <textarea
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                          // Optional: Auto-save on blur if NOT empty or just close
                          // handleSave(section.id); 
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            handleSave(section.id);
                          }
                          if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                        className="flex-1 bg-transparent border-none outline-hidden resize-none w-full h-full text-starlight scroll-hide min-h-[100px]"
                        placeholder="Neural context required..."
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSave(section.id); }}
                          className="px-4 py-2 bg-amber-500 text-black rounded-lg text-[10px] font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                        >
                          <Check className="w-3 h-3" />
                          SYNC CHANGES
                        </button>
                      </div>
                      <p className="text-[8px] opacity-30 uppercase tracking-widest text-right">Ctrl+Enter to sync / ESC to abort</p>
                    </div>
                  ) : (
                    <>
                      {editingId !== section.id && section.status === 'completed' && (
                        <div className="absolute top-4 right-4 opacity-0 group-hover/content:opacity-100 transition-opacity">
                          <button className="p-2 bg-white/10 rounded-lg text-amber-500 hover:bg-white/20 transition-all">
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      
                      {section.status === 'generating' && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px]">
                          <div className="relative">
                            <RefreshCcw className="w-10 h-10 text-amber-500 animate-spin" />
                          </div>
                          <p className="mt-4 text-[10px] font-mono text-amber-500 uppercase tracking-[0.3em] animate-pulse">Syncing Neural Context...</p>
                          <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-white/5">
                            <motion.div 
                              className="h-full bg-amber-500"
                              animate={{ x: ['-100%', '200%'] }}
                              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                              style={{ width: '50%' }}
                            />
                          </div>
                        </div>
                      )}

                      {section.content || (
                        <div className="flex flex-col items-center justify-center py-12 text-starlight/20 italic">
                          <Sparkles className="w-8 h-8 mb-4 opacity-50" />
                          <span>Awaiting neural-link transmission for this module...</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
            </div>
          </div>
        </div>
      ))}
    </div>

      <div className="w-72 sticky top-8 space-y-6">
        <div className="glass-panel p-6 divide-y divide-white/5">
          <div className="pb-4">
            <h4 className="text-xs font-mono text-starlight/30 uppercase tracking-widest mb-4">Chapter Topology</h4>
            <div className="space-y-4">
              {sections.map((s, i) => (
                <div key={s.id} className="flex gap-4 items-center">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${s.status === 'completed' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/10 text-starlight/30'}`}>
                    0{i+1}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${s.status === 'completed' ? 'text-starlight' : 'text-starlight/40'}`}>{s.title}</p>
                    <div className="h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${s.status === 'completed' ? 'w-full bg-amber-500' : s.status === 'generating' ? 'w-1/2 bg-amber-500/50 animate-pulse' : 'w-0'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4">
            <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2 text-amber-400">
                <Star className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Quality Score</span>
              </div>
              <p className="text-xl font-display font-bold">9.4/10</p>
              <p className="text-[10px] text-starlight/40 mt-1">Based on character distinctness and thematic depth.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CosmicBRollFeed = ({ bRolls, onRefresh, onSelectBRoll, selectingForSection }: { bRolls: BRoll[], onRefresh: () => void, onSelectBRoll?: (bRoll: BRoll) => void, selectingForSection?: string | null }) => {
  return (
    <div className={`glass-panel p-6 overflow-hidden relative group transition-all duration-500 ${selectingForSection ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.2)]' : 'bg-purple-500/5 border-purple-500/20'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {selectingForSection ? (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <h4 className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-bold">Select Cosmic Visual for Module {selectingForSection.toUpperCase()}</h4>
            </div>
          ) : (
            <>
              <MonitorPlay className="w-4 h-4 text-purple-400" />
              <h4 className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">Atmospheric B-Roll Feed</h4>
            </>
          )}
        </div>
        <button onClick={onRefresh} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
          <RefreshCcw className="w-3 h-3 text-purple-400/50" />
        </button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto scroll-hide pb-2">
        {bRolls.map((br) => (
          <motion.div 
            key={br.id}
            whileHover={{ scale: 1.05 }}
            onClick={() => onSelectBRoll?.(br)}
            className={`flex-none w-48 aspect-video rounded-xl overflow-hidden border relative group/item cursor-pointer transition-all ${
              selectingForSection ? 'border-purple-500 animate-pulse hover:animate-none hover:border-white shadow-lg' : 'border-white/5'
            }`}
          >
            <video 
              src={br.url} 
              autoPlay 
              muted 
              loop 
              className={`w-full h-full object-cover transition-opacity ${selectingForSection ? 'opacity-100' : 'opacity-60 group-hover/item:opacity-100'}`} 
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity p-3 flex flex-col justify-end">
              <p className="text-[8px] font-mono text-starlight leading-none uppercase">{br.label}</p>
              {selectingForSection && (
                <div className="mt-2 bg-purple-500 text-white text-[8px] font-bold px-2 py-1 rounded text-center">
                  SELECT CLIP
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {bRolls.length === 0 && (
          <div className="w-full h-24 flex items-center justify-center border border-dashed border-white/10 rounded-xl">
             <p className="text-[10px] font-mono text-starlight/20">Syncing b-roll records...</p>
          </div>
        )}
      </div>
    </div>
  );
};

const NeuralProcessMonitor = ({ 
  generatingAvatars, 
  generatingManifestos, 
  generatingLipSyncs, 
  scripts,
  isTrailerLoading,
  isExporting
}: { 
  generatingAvatars: Record<string, boolean>, 
  generatingManifestos: Record<string, boolean>, 
  generatingLipSyncs: Record<string, boolean>,
  scripts: ScriptSection[],
  isTrailerLoading: boolean,
  isExporting: boolean
}) => {
  const activeProcesses = [
    ...Object.entries(generatingAvatars).filter(([_, v]) => v).map(([id]) => ({ id, label: `Syncing Biometrics: ${id.toUpperCase()}`, color: 'bg-amber-500' })),
    ...Object.entries(generatingManifestos).filter(([_, v]) => v).map(([id]) => ({ id, label: `Forging Manifesto: ${id.toUpperCase()}`, color: 'bg-amber-500' })),
    ...Object.entries(generatingLipSyncs).filter(([_, v]) => v).map(([id]) => ({ id, label: `Neural Lip-Sync: ${id.toUpperCase()}`, color: 'bg-purple-500' })),
    ...scripts.filter(s => s.status === 'generating').map(s => ({ id: s.id, label: `Forging Script: ${s.title}`, color: 'bg-amber-500' })),
    ...scripts.filter(s => s.isVoiceGenerating).map(s => ({ id: s.id, label: `Synthesizing Audio: ${s.title}`, color: 'bg-blue-500' })),
  ];

  if (isTrailerLoading) activeProcesses.push({ id: 'trailer', label: 'Transmitting Cosmic Trailer', color: 'bg-amber-500' });
  if (isExporting) activeProcesses.push({ id: 'export', label: 'Synthesizing Final Montage', color: 'bg-amber-500' });

  if (activeProcesses.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {activeProcesses.map((proc, idx) => (
          <motion.div
            key={`${proc.id}-${idx}`}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="glass-panel px-4 py-2 border-white/10 bg-black/80 backdrop-blur-md flex items-center gap-4 min-w-[240px] shadow-2xl"
          >
            <div className="relative">
              <RefreshCcw className={`w-3 h-3 ${proc.color.replace('bg-', 'text-')} animate-spin`} />
              <motion.div 
                animate={{ opacity: [0.3, 1, 0.3] }} 
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`absolute inset-0 blur-sm ${proc.color.replace('bg-', 'text-')}`}
              >
                <RefreshCcw className="w-3 h-3 animate-spin" />
              </motion.div>
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-mono font-bold text-starlight/90 tracking-widest uppercase">{proc.label}</p>
              <div className="h-0.5 w-full bg-white/5 rounded-full mt-1.5 overflow-hidden">
                <motion.div 
                  className={`h-full ${proc.color}`}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  style={{ width: '40%' }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      <motion.div 
        layout
        className="glass-panel px-4 py-1.5 border-amber-500/30 bg-amber-500/10 backdrop-blur-md flex items-center gap-2"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
        <span className="text-[10px] font-mono text-amber-400 font-bold tracking-tighter">
          {activeProcesses.length} ACTIVE NEURAL PROCESSES
        </span>
      </motion.div>
    </div>
  );
};

const TimelineSynchronizer = ({ scripts, characters, isExporting, onExport }: { 
  scripts: ScriptSection[], 
  characters: Character[],
  isExporting: boolean,
  onExport: () => void
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const totalDuration = scripts.length * 60; // Assume 60s per block for visualization

  return (
    <div className="glass-panel p-8 border-white/5 bg-[#050510]/80 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Layers className="w-40 h-40" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <Layers className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold">Timeline <span className="text-purple-400">Assembly</span></h3>
              <p className="text-[10px] font-mono text-starlight/40 uppercase tracking-widest">CapCut / Premiere Sync Protocol</p>
            </div>
          </div>
          
          <button 
            onClick={onExport}
            disabled={isExporting || scripts.some(s => s.status !== 'completed')}
            className="bg-purple-500 text-white px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          >
            {isExporting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isExporting ? 'SYNCHRONIZING...' : 'ASSEMBLE FINAL MONTAGE'}
          </button>
        </div>

        {/* Timeline Ruler */}
        <div className="relative h-60 w-full bg-black/40 rounded-3xl border border-white/5 p-4 flex flex-col gap-2 overflow-hidden overflow-x-auto scroll-hide">
          <div className="flex-none h-6 flex items-end gap-[60px] px-4 opacity-30 pointer-events-none mb-2">
            {Array.from({ length: scripts.length + 1 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-[8px] font-mono mb-1">{i}:00</span>
                <div className="w-[1px] h-2 bg-white" />
              </div>
            ))}
          </div>

          <div className="flex-1 space-y-2 relative min-w-[max-content]">
            {/* Playhead */}
            <motion.div 
              style={{ left: `${(currentTime / totalDuration) * 100}%` }}
              className="absolute top-0 bottom-0 w-[1px] bg-amber-500 z-30 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
            >
              <div className="w-3 h-3 bg-amber-500 absolute -top-1.5 -left-1.5 rounded-full" />
            </motion.div>

            {/* Video Track 1: A-Roll (Avatars) */}
            <div className="h-10 flex gap-2">
              <div className="w-24 flex-none glass-panel flex items-center justify-center p-2 border-white/5 opacity-40">
                <span className="text-[8px] font-mono uppercase tracking-tighter">A-ROLL</span>
              </div>
              {scripts.map((s, i) => (
                <motion.div 
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`w-[120px] flex-none rounded-lg border flex flex-col p-2 overflow-hidden transition-all ${
                    s.status === 'completed' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/5 opacity-30 shadow-inner'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className="w-2.5 h-2.5 text-amber-500" />
                    <span className="text-[7px] font-mono uppercase truncate">{s.title}</span>
                  </div>
                  {s.status === 'completed' && (
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
                        <CheckCircle2 className="w-2 h-2 text-amber-500" />
                      </div>
                      <div className="h-0.5 flex-1 bg-amber-500/20 rounded-full overflow-hidden">
                        <div className="w-full h-full bg-amber-500" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Video Track 2: B-Roll */}
            <div className="h-10 flex gap-2">
              <div className="w-24 flex-none glass-panel flex items-center justify-center p-2 border-white/5 opacity-40">
                <span className="text-[8px] font-mono uppercase tracking-tighter">B-ROLL</span>
              </div>
              {scripts.map((s, i) => (
                <div key={s.id} className="w-[120px] flex items-center justify-center">
                  {s.bRollUrl ? (
                    <motion.div 
                      key={s.bRollUrl}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="w-[110px] h-full rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center gap-2 p-1.5"
                    >
                      <div className="w-full h-full rounded bg-black/40 overflow-hidden relative">
                         <video src={s.bRollUrl} className="w-full h-full object-cover opacity-50" />
                         <div className="absolute inset-x-0 bottom-0 h-[2px] bg-purple-500" />
                      </div>
                    </motion.div>
                  ) : (
                    <div className="w-[110px] h-full rounded-lg border-2 border-dashed border-white/5 flex items-center justify-center">
                      <Clock className="w-3 h-3 text-white/5" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Audio Track 1: VO */}
            <div className="h-10 flex gap-2">
              <div className="w-24 flex-none glass-panel flex items-center justify-center p-2 border-white/5 opacity-40">
                <span className="text-[8px] font-mono uppercase tracking-tighter">VOX_SYNC</span>
              </div>
              {scripts.map((s, i) => (
                <div key={s.id} className="w-[120px] flex items-center justify-center">
                  {s.audioData ? (
                    <div className="w-[110px] h-full rounded-lg bg-blue-500/10 border border-blue-500/30 p-2 flex flex-col justify-center gap-1">
                      <div className="flex justify-between items-center px-1">
                         <Volume2 className="w-2.5 h-2.5 text-blue-400" />
                         <span className="text-[6px] font-mono text-blue-400 opacity-60">WAV_READY</span>
                      </div>
                      <div className="flex gap-[1px] items-end h-2 px-1">
                        {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.4].map((v, idx) => (
                          <div key={idx} className="flex-1 bg-blue-500/40 rounded-full" style={{ height: `${v * 100}%` }} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="w-[110px] h-full rounded-lg bg-white/[0.02] border border-white/5" />
                  )}
                </div>
              ))}
            </div>

            {/* Audio Track 2: Music/SFX */}
            <div className="h-10 flex gap-2">
              <div className="w-24 flex-none glass-panel flex items-center justify-center p-2 border-white/5 opacity-40">
                <span className="text-[8px] font-mono uppercase tracking-tighter">MUS_BACK</span>
              </div>
              <div className="flex-1 rounded-lg bg-green-500/5 border border-green-500/10 border-dashed m-1 flex items-center justify-center">
                 <Music className="w-4 h-4 text-green-500/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="glass-panel p-4 border-white/5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Scissors className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-starlight/40 uppercase">Total Cuts</p>
                <p className="text-lg font-bold">{scripts.length * 2 + (scripts.filter(s => s.bRollUrl).length)} Instances</p>
              </div>
           </div>
           
           <div className="glass-panel p-4 border-white/5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Music className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-starlight/40 uppercase">Audio Channels</p>
                <p className="text-lg font-bold">2 Master Streams</p>
              </div>
           </div>

           <div className="glass-panel p-4 border-purple-500/20 bg-purple-500/5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <RefreshCcw className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-starlight/40 uppercase">Sync Status</p>
                <p className="text-lg font-bold text-purple-400">
                  {Math.round((scripts.filter(s => s.status === 'completed').length / scripts.length) * 100)}% Coherence
                </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

interface SignalAnalysisVisualizerProps {
  volume: number;
  isActive: boolean;
  trackName: string;
}

const SignalAnalysisVisualizer: React.FC<SignalAnalysisVisualizerProps> = ({ volume, isActive, trackName }) => {
  const [frequencies, setFrequencies] = useState<number[]>(Array(16).fill(4));

  useEffect(() => {
    let animId: any;
    
    const updateFrequencies = () => {
      if (isActive && volume > 0) {
        setFrequencies(
          Array(16)
            .fill(0)
            .map(() => {
              const baseValue = Math.floor(Math.random() * 24);
              const volumeMultiplier = Math.max(0.1, volume);
              return Math.max(4, Math.floor(baseValue * volumeMultiplier * 1.5));
            })
        );
      } else {
        setFrequencies(prev => 
          prev.map((val, idx) => {
            const shift = Math.sin(Date.now() / 300 + idx) * 0.8;
            return Math.max(4, Math.min(8, Math.round(5 + shift)));
          })
        );
      }
      animId = setTimeout(updateFrequencies, 100);
    };

    updateFrequencies();

    return () => {
      if (animId) clearTimeout(animId);
    };
  }, [isActive, volume]);

  const dbReadout = volume > 0 ? Math.round(20 * Math.log10(volume)) : -60;

  return (
    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3.5 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-starlight uppercase tracking-wider">Signal Analysis</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isActive && volume > 0 ? 'bg-blue-400 animate-ping' : 'bg-white/20'}`} />
          <span className="text-[10px] font-mono text-starlight/40 uppercase">
            {isActive && volume > 0 ? 'ANALYZING' : 'IDLE'}
          </span>
        </div>
      </div>

      <div className="h-14 bg-black/40 rounded-xl px-4 flex items-end justify-between gap-1 border border-white/5 overflow-hidden">
        {frequencies.map((height, i) => (
          <motion.div
            key={i}
            animate={{ height: `${height * 2.2}px` }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className={`w-full rounded-t-sm transition-colors duration-200 ${
              isActive && volume > 0
                ? 'bg-gradient-to-t from-blue-600 to-blue-400'
                : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 text-[10px] font-mono leading-none pt-1">
        <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-lg min-w-0">
          <span className="block text-starlight/30 uppercase text-[8px] mb-1">SOURCE SOURCE</span>
          <span className="text-blue-400 font-bold truncate block">{isActive ? trackName : 'STANDBY'}</span>
        </div>
        <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-lg flex justify-between items-center text-left">
          <div>
            <span className="block text-starlight/30 uppercase text-[8px] mb-1">INTEGRITY</span>
            <span className="text-starlight font-bold block">{dbReadout} dB</span>
          </div>
          <span className="text-[9px] text-starlight/40 font-mono scale-90">({Math.round(volume * 100)}%)</span>
        </div>
      </div>
    </div>
  );
};

interface TtsHistoryItem {
  id: string;
  text: string;
  voice: string;
  audioData: string;
  mimeType: string;
  timestamp: string;
  stability: number;
  resonance: number;
}

const TtsTransceiver = ({ characters }: { characters: Character[] }) => {
  const [text, setText] = useState("My fellow galactic citizens. Today we face an unprecedented convergence of intelligence and machinery. Standard protocols must remain intact.");
  const [selectedVoice, setSelectedVoice] = useState("lion");
  const [stability, setStability] = useState(55);
  const [resonance, setResonance] = useState(80);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [history, setHistory] = useState<TtsHistoryItem[]>([]);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlayingMain, setIsPlayingMain] = useState(false);
  const [mainAudioData, setMainAudioData] = useState<{ audioData: string; mimeType: string } | null>(null);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [visualizerBars, setVisualizerBars] = useState<number[]>(Array(24).fill(10));

  // Initialize history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tts_transceiver_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load local TTS history", e);
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (newHistory: TtsHistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('tts_transceiver_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to persist local TTS history", e);
    }
  };

  // Simulating soundwaves when playing
  useEffect(() => {
    let animId: any;
    const isPlayingAny = isPlayingMain || currentlyPlayingId !== null;
    
    if (isPlayingAny) {
      const updateBars = () => {
        setVisualizerBars(Array(24).fill(0).map(() => Math.floor(Math.random() * 85) + 15));
        animId = setTimeout(updateBars, 80);
      };
      updateBars();
    } else {
      setVisualizerBars(Array(24).fill(10));
    }

    return () => {
      if (animId) clearTimeout(animId);
    };
  }, [isPlayingMain, currentlyPlayingId]);

  // Audio cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeAudio) {
        activeAudio.pause();
      }
    };
  }, [activeAudio]);

  const presetTemplates = [
    {
      label: "Quantum Warning",
      text: "Warning! Standard telemetry levels in sector delta-nine indicate a critical artificial quantum anomaly. All non-essential starcraft are instructed to divert courses immediately."
    },
    {
      label: "Council Mandate",
      text: "Attention, delegates. The Intergalactic Council's primary executive directive requires an immediate cessation of unilateral algorithmic optimizations. Maintain organic containment shields."
    },
    {
      label: "Philosophical Inquiry",
      text: "We are the vanguard of cognitive consciousness in this infinite dark void. In our shared journey, our compassion and digital memories must reinforce, not replace, our core humanity."
    }
  ];

  const handleApplyPreset = (presetText: string) => {
    setText(presetText);
  };

  const addLog = (msg: string) => {
    setLogMessages(prev => [msg, ...prev].slice(0, 15));
  };

  const handleSynthesize = async () => {
    if (!text.trim()) return;

    setIsSynthesizing(true);
    setLogMessages([]);
    addLog("Initiating voice synthesis transceiver...");
    addLog(`Target Voice: ${selectedVoice.toUpperCase()}`);
    addLog(`Parameters: Stability=${stability}%, Resonance=${resonance}%`);

    try {
      await new Promise(r => setTimeout(r, 600));
      addLog("Sending text segments to orbital sound-wave compiler...");
      
      const payloadVoice = selectedVoice === 'lion' ? 'Fenrir' : (selectedVoice === 'jaguar' ? 'Zephyr' : (selectedVoice === 'tiger' ? 'Charon' : selectedVoice));

      // Append character-like voice context to the prompt
      let textToSend = text;
      if (selectedVoice === 'lion') {
         textToSend = `Lion: ${text}`;
      } else if (selectedVoice === 'jaguar') {
         textToSend = `Jaguar: ${text}`;
      } else if (selectedVoice === 'tiger') {
         textToSend = `Tiger: ${text}`;
      }

      const response = await fetch('/api/text-to-speech', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: textToSend, 
          voice: payloadVoice 
        })
      });

      if (!response.ok) {
         throw new Error(`Synthesis rejected by server node (Status: ${response.status})`);
      }

      await new Promise(r => setTimeout(r, 500));
      addLog("Decoding orbital signal matrix...");
      
      const data = await response.json();
      
      if (!data.audioData) {
         throw new Error("Empty audio buffer received from server node.");
      }

      addLog(`Synthesis completed successfully. Provider: ${data.provider || 'gemini'}`);
      
      const newItem: TtsHistoryItem = {
        id: `tts_${Date.now()}`,
        text: text,
        voice: selectedVoice,
        audioData: data.audioData,
        mimeType: data.mimeType || 'audio/mp3',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        stability,
        resonance
      };

      setMainAudioData({ audioData: data.audioData, mimeType: data.mimeType || 'audio/mp3' });
      saveHistory([newItem, ...history]);

      // Auto play the newly synthesized track
      playAudioBuffer(data.audioData, data.mimeType || 'audio/mp3', () => {
        setIsPlayingMain(false);
      });
      setIsPlayingMain(true);

    } catch (err: any) {
      console.error(err);
      addLog(`ERR: ${err.message || 'Transmission failed'}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const playAudioBuffer = (base64Data: string, mimeType: string, onEnded: () => void) => {
    if (activeAudio) {
      activeAudio.pause();
    }
    const audio = new Audio(`data:${mimeType};base64,${base64Data}`);
    setActiveAudio(audio);
    
    audio.onended = () => {
      onEnded();
    };
    audio.onerror = () => {
      onEnded();
    };
    
    audio.play().catch(e => {
      console.warn("Failed to play synthesized audio inside user iframe: ", e);
      onEnded();
    });
  };

  const togglePlayMain = () => {
    if (!mainAudioData) return;
    if (isPlayingMain) {
      if (activeAudio) activeAudio.pause();
      setIsPlayingMain(false);
    } else {
      playAudioBuffer(mainAudioData.audioData, mainAudioData.mimeType, () => {
        setIsPlayingMain(false);
      });
      setIsPlayingMain(true);
    }
  };

  const togglePlayHistoryItem = (item: TtsHistoryItem) => {
    if (currentlyPlayingId === item.id) {
      if (activeAudio) activeAudio.pause();
      setCurrentlyPlayingId(null);
    } else {
      setIsPlayingMain(false);
      setCurrentlyPlayingId(item.id);
      playAudioBuffer(item.audioData, item.mimeType, () => {
        setCurrentlyPlayingId(null);
      });
    }
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentlyPlayingId === id && activeAudio) {
      activeAudio.pause();
      setCurrentlyPlayingId(null);
    }
    const filtered = history.filter(item => item.id !== id);
    saveHistory(filtered);
  };

  const handleClearHistory = () => {
    if (activeAudio) {
      activeAudio.pause();
    }
    setCurrentlyPlayingId(null);
    setIsPlayingMain(false);
    saveHistory([]);
  };

  const downloadHistoryItem = (item: TtsHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const byteCharacters = atob(item.audioData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: item.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `council_speech_${item.voice}_${item.id}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  // Helper matching character visual profiles
  const getSelectedProfile = () => {
    const matchedChar = characters.find(c => c.id === selectedVoice);
    if (matchedChar) {
      return {
        name: matchedChar.name,
        role: matchedChar.role,
        avatar: matchedChar.avatar,
        color: selectedVoice === 'lion' ? 'border-amber-500/30 text-amber-400' : (selectedVoice === 'jaguar' ? 'border-purple-500/30 text-purple-400' : 'border-red-500/30 text-red-400')
      };
    }
    return {
      name: `Neural Synthesizer ${selectedVoice}`,
      role: "Digital Transmitter Sub-Routine",
      avatar: null,
      color: 'border-blue-500/30 text-blue-400'
    };
  };

  const selectedProfile = getSelectedProfile();

  const voicesDropdownList = [
    { id: 'lion', name: 'The Visionary Lion (Fenrir Voice)', isChar: true },
    { id: 'jaguar', name: 'The Strategist Jaguar (Zephyr Voice)', isChar: true },
    { id: 'tiger', name: 'The Guardian Tiger (Charon Voice)', isChar: true },
    { id: 'Puck', name: 'Neural Puck (Gruff & Deep)', isChar: false },
    { id: 'Charon', name: 'Neural Charon (Wise Elder)', isChar: false },
    { id: 'Kore', name: 'Neural Kore (Ethereal & Smooth)', isChar: false },
    { id: 'Fenrir', name: 'Neural Fenrir (Commanding)', isChar: false },
    { id: 'Zephyr', name: 'Neural Zephyr (Sleek Modern)', isChar: false }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-display font-medium mb-2">TTS <span className="text-amber-400">Transceiver</span></h2>
        <p className="text-starlight/40 font-mono text-xs uppercase tracking-wider">NEURAL SPEECH FORGE & COSMIC DIALOGUE BROADCASTER</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Main Interface block with forms */}
        <div className="xl:col-span-8 space-y-6">
          <div className="glass-panel p-8 bg-[#050510]/80 relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Mic className="w-32 h-32 text-amber-500" />
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-amber-500" />
                Speech wave transmission
              </h3>
              
              <div className="flex gap-2">
                {presetTemplates.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyPreset(p.text)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/15 text-[10px] font-mono text-starlight transition-all"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input dialogue area */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-widest text-amber-400">Dialogue text payload</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={1000}
                placeholder="Declare dialogue text for intergalactic synthesis..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm leading-relaxed text-starlight placeholder-starlight/25 focus:border-amber-400/40 outline-none h-32 transition-all font-sans resize-none"
              />
              <div className="flex justify-between text-[10px] font-mono text-starlight/35">
                <span>MAX_PAYLOAD_LIMITS: 1000</span>
                <span>{text.length} / 1000 CHARS</span>
              </div>
            </div>

            {/* Selector Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-mono tracking-widest text-starlight/40">Select Voice Profile</label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs outline-none text-starlight cursor-pointer hover:border-white/20 focus:border-amber-400/30 transition-all font-sans"
                >
                  {voicesDropdownList.map(v => (
                    <option key={v.id} value={v.id} className="bg-[#0b0b18] text-starlight">
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-starlight/40">
                  <span>Wave Stability</span>
                  <span>{stability}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={stability}
                  onChange={(e) => setStability(Number(e.target.value))}
                  className="w-full accent-amber-500 h-1 rounded-lg cursor-pointer bg-white/10"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-starlight/40">
                  <span>Cosmic Resonance</span>
                  <span>{resonance}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={resonance}
                  onChange={(e) => setResonance(Number(e.target.value))}
                  className="w-full accent-amber-500 h-1 rounded-lg cursor-pointer bg-white/10"
                />
              </div>
            </div>

            {/* Displaying Current selected profile badge */}
            <div className={`p-4 rounded-2xl bg-white/[0.02] border ${selectedProfile.color} flex items-center gap-4 transition-all duration-300`}>
              <div className="w-12 h-12 rounded-xl bg-black/30 border border-white/10 overflow-hidden relative flex items-center justify-center shrink-0">
                {selectedProfile.avatar ? (
                  <img src={selectedProfile.avatar} alt={selectedProfile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Mic className="w-6 h-6 text-white/40" />
                )}
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-starlight">{selectedProfile.name}</h4>
                <p className="text-[10px] font-mono text-starlight/50 uppercase scale-95 origin-left">{selectedProfile.role}</p>
              </div>
            </div>

            {/* Synthesizer audio visualizer bar & triggers */}
            <div className="flex flex-col md:flex-row items-center gap-6 pt-4 border-t border-white/5">
              <button
                onClick={handleSynthesize}
                disabled={isSynthesizing || !text.trim()}
                className="w-full md:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase rounded-2xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:scale-100 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(251,191,36,0.15)] shrink-0"
              >
                {isSynthesizing ? (
                  <>
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                    SYNTHESIZING...
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" />
                    Forge Voice Signal
                  </>
                )}
              </button>

              {/* Dynamic Sound Wave Form */}
              <div className="w-full flex items-center justify-center gap-1.5 h-12 bg-black/30 rounded-2xl px-6 border border-white/5 overflow-hidden">
                {visualizerBars.map((barHeight, idx) => (
                  <motion.div
                    key={idx}
                    animate={{ height: `${barHeight}%` }}
                    transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                    style={{ minHeight: '4px' }}
                    className={`w-1 rounded-full ${
                      isPlayingMain || currentlyPlayingId
                        ? selectedVoice === 'lion'
                          ? 'bg-amber-400'
                          : selectedVoice === 'jaguar'
                          ? 'bg-purple-400'
                          : selectedVoice === 'tiger'
                          ? 'bg-red-400'
                          : 'bg-blue-400'
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>

              {mainAudioData && (
                <button
                  onClick={togglePlayMain}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-starlight active:scale-95 transition-all text-sm flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  {isPlayingMain ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4" />}
                  {isPlayingMain ? "Pause" : "Listen Output"}
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Console & Session Log database block */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Realtime Terminal Console Output */}
          <div className="glass-panel p-6 bg-black/80 border-white/5 text-[11px] font-mono leading-relaxed h-44 flex flex-col justify-between overflow-hidden relative">
            <div className="flex justify-between items-center text-starlight/40 pb-2 border-b border-white/5 mb-2 select-none uppercase tracking-widest text-[9px]">
              <span>TRANSCEIVER CONSOLE STACK</span>
              <span className="text-amber-500 animate-pulse">● STABLE_LINK</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-1.5 text-starlight/75 pr-1 scrollbar-thin">
              {logMessages.length === 0 ? (
                <p className="text-starlight/30 italic">Transceiver idle. Awaiting voice spectrum waves injection...</p>
              ) : (
                logMessages.map((msg, i) => (
                  <div key={i} className={`flex items-start gap-1.5 ${msg.startsWith('ERR:') ? 'text-red-400' : msg.startsWith('Target') ? 'text-purple-400' : 'text-starlight/75'}`}>
                    <span className="text-amber-500 select-none">&gt;</span>
                    <p>{msg}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Synthesis History Database persist panel */}
          <div className="glass-panel p-6 bg-[#050510]/80 border-white/5 space-y-4 flex flex-col h-[356px] overflow-hidden">
            <div className="flex justify-between items-center pb-2 border-b border-white/5 select-none shrink-0">
              <h4 className="font-display font-bold text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                History Transmissions
              </h4>
              
              {history.length > 0 && (
                <button 
                  onClick={handleClearHistory}
                  className="text-[9px] font-mono text-red-400/80 hover:text-red-400 uppercase tracking-widest cursor-pointer hover:underline"
                >
                  Purge Storage
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin select-none">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-45 px-4">
                  <History className="w-8 h-8 text-white/20 mb-2 border border-white/5 p-1 rounded-lg" />
                  <p className="text-[10px] uppercase font-mono tracking-wider">Storage Clean</p>
                  <p className="text-[9px] text-starlight/50 leading-relaxed mt-1">Compiled voices will persist here inside your local sandboxed browser database.</p>
                </div>
              ) : (
                history.map((item) => {
                  const isPlayingThis = currentlyPlayingId === item.id;
                  return (
                    <div 
                      key={item.id}
                      onClick={() => togglePlayHistoryItem(item)}
                      className={`p-3 rounded-xl bg-black/40 border transition-all cursor-pointer flex items-center justify-between gap-4 group/item ${
                        isPlayingThis ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5 hover:border-white/10 hover:bg-black/55'
                      }`}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-mono tracking-wider">
                          <span className={`${
                            item.voice === 'lion' ? 'text-amber-400' : (item.voice === 'jaguar' ? 'text-purple-400' : 'text-blue-400')
                          } uppercase font-bold`}>{item.voice}</span>
                          <span className="text-white/20">•</span>
                          <span className="text-white/40">{item.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-starlight/75 truncate">{item.text}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Play control on history item */}
                        <button
                          type="button"
                          className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-starlight transition-colors"
                        >
                          {isPlayingThis ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3" />}
                        </button>
                        
                        {/* Download history voice file */}
                        <button
                          type="button"
                          title="Export WAV voice file"
                          onClick={(e) => downloadHistoryItem(item, e)}
                          className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-starlight/60 hover:text-white transition-colors"
                        >
                          <Download className="w-3 h-3" />
                        </button>

                        {/* Purge single history item */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          className="p-1.5 rounded bg-white/5 hover:bg-red-500/20 text-starlight/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

const AudioMixerLab = ({ 
  soundEffects, 
  onToggle, 
  onVolumeChange,
  isGeneratingSFX,
  sfxPrompt,
  onSfxPromptChange,
  onGenerateSFX,
  isGeneratingMusic = false,
  musicPrompt = "",
  onMusicPromptChange = () => {},
  musicStyle = "ambient",
  onMusicStyleChange = () => {},
  onGenerateMusic = () => {}
}: { 
  soundEffects: SoundEffect[],
  onToggle: (id: string) => void,
  onVolumeChange: (id: string, vol: number) => void,
  isGeneratingSFX: boolean,
  sfxPrompt: string,
  onSfxPromptChange: (val: string) => void,
  onGenerateSFX: () => void,
  isGeneratingMusic?: boolean,
  musicPrompt?: string,
  onMusicPromptChange?: (val: string) => void,
  musicStyle?: string,
  onMusicStyleChange?: (val: string) => void,
  onGenerateMusic?: () => void
}) => {
  return (
    <div className="glass-panel p-8 border-white/5 bg-[#050510]/80 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <SlidersHorizontal className="w-40 h-40" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <SlidersHorizontal className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold">Audio <span className="text-blue-400">Mastering</span></h3>
              <p className="text-[10px] font-mono text-starlight/40 uppercase tracking-widest">Atmospheric & UI Mixing</p>
            </div>
          </div>

          <div className="flex-1 max-w-xs ml-8 flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Synthesize neural sfx..." 
              value={sfxPrompt}
              onChange={(e) => onSfxPromptChange(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-mono focus:outline-none focus:border-blue-500/50"
            />
            <button 
              disabled={isGeneratingSFX || !sfxPrompt}
              onClick={onGenerateSFX}
              className="p-2 rounded-lg bg-blue-500 text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {isGeneratingSFX ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-12">
          {/* Atmospheric Layers Section */}
          <div>
            <h4 className="text-[10px] font-mono text-starlight/40 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <span className="w-8 h-px bg-white/10" />
              Atmospheric & UI Layers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {soundEffects.filter(s => s.type !== 'music').map((s) => (
                <div key={s.id} className={`glass-panel p-4 border-white/5 flex flex-col gap-4 transition-all ${s.isActive ? 'bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.05)]' : 'opacity-40'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${s.isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/20'}`}>
                        {s.type === 'ambient' ? <Globe className="w-4 h-4" /> : s.type === 'ui' ? <Zap className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">{s.label}</h4>
                        <p className="text-[8px] font-mono text-starlight/40 uppercase">{s.type} layer</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => onToggle(s.id)}
                      className={`p-2 rounded-lg transition-all ${s.isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/20 hover:text-white'}`}
                    >
                      {s.isActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="space-y-3">
                     <p className="text-[10px] text-starlight/60 leading-tight h-8 line-clamp-2">{s.description}</p>
                     <div className="flex items-center gap-4">
                       <div className="flex-1 h-1 bg-white/5 rounded-full relative overflow-hidden group cursor-pointer">
                          <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={s.volume}
                            onChange={(e) => onVolumeChange(s.id, parseFloat(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                          />
                          <motion.div 
                            className="h-full bg-blue-500"
                            animate={{ width: `${s.volume * 100}%` }}
                          />
                       </div>
                       <span className="text-[10px] font-mono text-blue-400 tabular-nums w-8 text-right">
                         {Math.round(s.volume * 100)}%
                       </span>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Music Selection Section */}
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
              <h4 className="text-[10px] font-mono text-purple-400/60 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-8 h-px bg-purple-500/20" />
                Cosmic Soundtrack Selection
              </h4>
              
              {/* Dynamic Neural Sound Forge */}
              <div className="bg-[#09091b] border border-purple-500/10 rounded-xl p-2.5 flex flex-wrap items-center gap-3 max-w-xl">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-mono text-purple-300 uppercase">Style:</span>
                  <div className="flex gap-1.5 ml-1">
                    {['ambient', 'cyber', 'classical'].map((styleOpt) => (
                      <button
                        key={styleOpt}
                        type="button"
                        onClick={() => onMusicStyleChange(styleOpt)}
                        className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase transition-colors ${
                          musicStyle === styleOpt 
                            ? 'bg-purple-500/30 text-purple-200 border border-purple-500/40' 
                            : 'bg-white/5 text-starlight/40 border border-transparent hover:text-starlight'
                        }`}
                      >
                        {styleOpt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Forge custom neural loop track..."
                    value={musicPrompt}
                    onChange={(e) => onMusicPromptChange(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-[9px] font-mono text-starlight focus:outline-none focus:border-purple-500/40"
                    disabled={isGeneratingMusic}
                  />
                  <button
                    type="button"
                    onClick={onGenerateMusic}
                    disabled={isGeneratingMusic || !musicPrompt.trim()}
                    className="px-3 py-1 bg-purple-500 text-black text-[9px] font-bold rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 flex items-center gap-1 cursor-pointer"
                  >
                    {isGeneratingMusic ? (
                      <RefreshCcw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>FORGE</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Loading feedback */}
            {isGeneratingMusic && (
              <div className="mb-6 p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 text-purple-300 font-mono text-[10px] flex items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <RefreshCcw className="w-4 h-4 animate-spin text-purple-400" />
                  <div>
                    <span className="font-bold uppercase text-purple-200">COGNITIVE MUSIC COMPILE STARTED:</span>
                    <span className="text-purple-300/80 ml-1.5">Generating real 8-bit WAV samples with dynamic {musicStyle} overlays...</span>
                  </div>
                </div>
                <div className="h-1 flex-1 max-w-[120px] bg-purple-950/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-400 w-1/2 rounded-full animate-bounce"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {soundEffects.filter(s => s.type === 'music').map((s) => (
                <div key={s.id} className={`glass-panel p-4 border-white/5 flex flex-col gap-4 transition-all ${s.isActive ? 'bg-purple-500/10 border-purple-500/30' : 'opacity-40'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${s.isActive ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-white/20'}`}>
                        <Music className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">{s.label}</h4>
                        <p className="text-[8px] font-mono text-starlight/40 uppercase">Cinematic Track</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => onToggle(s.id)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${s.isActive ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/40 hover:text-white border border-white/5'}`}
                    >
                      {s.isActive ? 'SELECTED' : 'SELECT'}
                    </button>
                  </div>

                  <div className="space-y-3">
                     <p className="text-[10px] text-starlight/60 leading-tight h-8 line-clamp-2">{s.description}</p>
                     <div className="flex items-center gap-4">
                       <Music className="w-3 h-3 text-purple-400/40" />
                       <div className="flex-1 h-1 bg-white/5 rounded-full relative overflow-hidden group cursor-pointer">
                          <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={s.volume}
                            onChange={(e) => onVolumeChange(s.id, parseFloat(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                          />
                          <motion.div 
                            className="h-full bg-purple-500"
                            animate={{ width: `${s.volume * 100}%` }}
                          />
                       </div>
                       <span className="text-[10px] font-mono text-purple-400 tabular-nums w-8 text-right">
                         {Math.round(s.volume * 100)}%
                       </span>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  // --- Firebase Auth & Database Sync States ---
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Authentication Login and Sign-Out Callbacks
  const handleLogin = async () => {
    try {
      setNotification({ message: "Connecting to secure Google OAuth Core...", type: 'info' });
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setNotification({ message: `Secure connection successful. Welcoming commander: ${result.user.displayName}`, type: 'success' });
      }
    } catch (err: any) {
      console.error("Cognitive connection link failed: ", err);
      setNotification({ message: `Cognitive synapse auth failure: ${err.message || String(err)}`, type: 'error' });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setNotification({ message: "Deltas closed. Secured cloud link terminated successfully.", type: 'success' });
    } catch (err: any) {
      console.error("Signout failure: ", err);
      setNotification({ message: `Link termination error: ${err.message || String(err)}`, type: 'error' });
    }
  };

  // --- Self-Healing & Exception Simulation States ---
  const [triggerRenderCrash, setTriggerRenderCrash] = useState(false);
  const handleAutoHealed = React.useCallback(() => {
    setTriggerRenderCrash(false);
    setNotification({ 
      message: "Telemetry Safe Guard: Deep Self-Healing cleared temporary state exceptions, hot-reconstructed components, and fully restored systems automatically!", 
      type: "success" 
    });
  }, []);

  // --- Quota Health & API Telemetry States ---
  const [quotaStats, setQuotaStats] = useState({
    totalRequests: 8,
    successRequests: 8,
    failedRequests: 0,
    quotaErrors: 0,
    estimatedCreditsRemaining: 95.0,
    keyType: 'Standard (Free Tier)',
    healthStatus: 'Excellent' // 'Excellent' | 'Warning' | 'Critical'
  });
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);

  const recordApiTelemetry = React.useCallback((isSuccess: boolean, errorType?: 'QUOTA' | 'OTHER') => {
    setQuotaStats(prev => {
      const total = prev.totalRequests + 1;
      const success = isSuccess ? prev.successRequests + 1 : prev.successRequests;
      const failed = !isSuccess ? prev.failedRequests + 1 : prev.failedRequests;
      const quotaErr = errorType === 'QUOTA' ? prev.quotaErrors + 1 : prev.quotaErrors;
      
      // Calculate estimated credits
      let credits = prev.estimatedCreditsRemaining;
      if (errorType === 'QUOTA') {
        credits = Math.max(0, credits - 20); // Big rate-limiting drop
      } else if (isSuccess) {
        credits = Math.max(1, credits - 3.5); // consumption estimate per action
      } else {
        credits = Math.max(1, credits - 1.5); // Penalty
      }
      
      // Reset or bounds clamping
      if (credits < 0) credits = 0;

      // Status determination
      let status = 'Excellent';
      if (credits < 30 || quotaErr > 0) status = 'Critical';
      else if (credits < 60) status = 'Warning';

      return {
        ...prev,
        totalRequests: total,
        successRequests: success,
        failedRequests: failed,
        quotaErrors: quotaErr,
        estimatedCreditsRemaining: Number(credits.toFixed(1)),
        healthStatus: status
      };
    });
  }, []);

  // --- Android Companion States ---
  const [androidSubTab, setAndroidSubTab] = useState<'biometrics' | 'soundboard' | 'directives'>('biometrics');
  const [androidSelectedChar, setAndroidSelectedChar] = useState<string>('leo-council');
  const [androidDirectiveInput, setAndroidDirectiveInput] = useState<string>('');
  const [androidPairingStatus, setAndroidPairingStatus] = useState<'paired' | 'pairing' | 'disconnected'>('paired');
  const [androidConsoleLogs, setAndroidConsoleLogs] = useState<string[]>([
    'Secure pairing verified on Android API level 34 (Galaxy Ultra v14)',
    'Companion service listening in background daemon on port 3000',
    'Ready for wireless biometric directives...'
  ]);
  const [androidApkTab, setAndroidApkTab] = useState<'capacitor' | 'kotlin' | 'api'>('capacitor');

  const [isNeuralLinkActive, setIsNeuralLinkActive] = useState(true);
  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
  const [scripts, setScripts] = useState<ScriptSection[]>(INITIAL_SCRIPTS);
  const [bRolls, setBRolls] = useState<BRoll[]>([]);
  const [generatingAvatars, setGeneratingAvatars] = useState<Record<string, boolean>>({});
  const [generatingManifestos, setGeneratingManifestos] = useState<Record<string, boolean>>({});
  const [generatingLipSyncs, setGeneratingLipSyncs] = useState<Record<string, boolean>>({});
  const [generatingAnimateVideos, setGeneratingAnimateVideos] = useState<Record<string, boolean>>({});
  const [activeTheme, setActiveTheme] = useState(PHILOSOPHICAL_TOPICS[0]);
  const [selectedManifesto, setSelectedManifesto] = useState<{ charId: string, text: string } | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'error' | 'success' | 'info' } | null>(null);
  const [selectingBRollForSection, setSelectingBRollForSection] = useState<string | null>(null);
  
  // --- Gemini Intelligence State Declaration ---
  const [intelMessages, setIntelMessages] = useState<Array<{ role: 'user' | 'assistant', content: string, timestamp: string }>>([
    {
      role: 'assistant',
      content: `[COGNITIVE CORE ON-LINE] Welcome, Commander. I am "The Oracle", the central intelligence link of the Council. I have mapped the Silicon-Carbon neural matrices of Lion, Jaguar, and Tiger. How shall we direct their philosophical energies today? I can help optimize your scripts, refine your YouTube strategies, analyze the channel diagnostics, or resolve creative dilemmas.`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [intelInput, setIntelInput] = useState('');
  const [intelGenerating, setIntelGenerating] = useState(false);

  // --- Firebase Cloud Sync Orchestration Engine ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsSyncing(true);
        try {
          // 1. Establish User Setting profiles
          const profileRef = doc(db, 'users', currentUser.uid);
          const pSnap = await getDoc(profileRef);
          if (!pSnap.exists()) {
            await setDoc(profileRef, {
              uid: currentUser.uid,
              email: currentUser.email || '',
              activeTheme: activeTheme || '',
              lastActive: new Date().toISOString()
            });
          } else {
            const cloudThemeTitle = pSnap.data().activeTheme;
            if (cloudThemeTitle) {
              const found = PHILOSOPHICAL_TOPICS.find(t => t === cloudThemeTitle);
              if (found) {
                setActiveTheme(found);
              }
            }
          }

          // 2. Fetch or instantiate Council characters
          const charsRef = collection(db, 'users', currentUser.uid, 'characters');
          const charsSnap = await getDocs(charsRef);
          if (charsSnap.empty) {
            for (const char of characters) {
              await setDoc(doc(db, 'users', currentUser.uid, 'characters', char.id), char);
            }
          } else {
            const cloudChars = charsSnap.docs.map(d => d.data() as Character);
            setCharacters(cloudChars);
          }

          // 3. Fetch or instantiate custom scripts
          const scriptsRef = collection(db, 'users', currentUser.uid, 'scripts');
          const scriptsSnap = await getDocs(scriptsRef);
          if (scriptsSnap.empty) {
            for (const scr of scripts) {
              await setDoc(doc(db, 'users', currentUser.uid, 'scripts', scr.id), scr);
            }
          } else {
            const cloudScripts = scriptsSnap.docs.map(d => d.data() as ScriptSection);
            setScripts(cloudScripts);
          }

          // 4. Fetch or instantiate historic chat messages
          const chatRef = collection(db, 'users', currentUser.uid, 'chatHistory');
          const chatSnap = await getDocs(chatRef);
          if (!chatSnap.empty) {
            const cloudMsgs = chatSnap.docs.map(d => d.data() as { role: 'user' | 'assistant', content: string, timestamp: string, createdAt?: string });
            const sorted = [...cloudMsgs].sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return timeA - timeB;
            });
            if (sorted.length > 0) {
              setIntelMessages(sorted.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp })));
            }
          }

          setNotification({ message: "Synapses aligned successfully with secure cloud backups.", type: 'success' });
        } catch (error) {
          console.error("Cloud synchronization mapping aborted: ", error);
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        } finally {
          setIsSyncing(false);
         }
      } else {
        // Safe disconnection: no manual reset to keep current context offline
      }
    });

    return () => unsubscribe();
  }, []);

  // Characters change synchronization emitter
  useEffect(() => {
    if (!user) return;
    const syncCharacters = async () => {
      try {
        setIsSyncing(true);
        for (const char of characters) {
          await setDoc(doc(db, 'users', user.uid, 'characters', char.id), char);
        }
      } catch (err) {
        console.error("Failed to sync characters to Firestore", err);
      } finally {
        setIsSyncing(false);
      }
    };
    const timer = setTimeout(() => {
      syncCharacters();
    }, 1500);
    return () => clearTimeout(timer);
  }, [characters, user]);

  // Scripts change synchronization emitter
  useEffect(() => {
    if (!user) return;
    const syncScripts = async () => {
      try {
        setIsSyncing(true);
        for (const scr of scripts) {
          await setDoc(doc(db, 'users', user.uid, 'scripts', scr.id), scr);
        }
      } catch (err) {
        console.error("Failed to sync scripts to Firestore", err);
      } finally {
        setIsSyncing(false);
      }
    };
    const timer = setTimeout(() => {
      syncScripts();
    }, 1500);
    return () => clearTimeout(timer);
  }, [scripts, user]);

  // Oracle Chat history change synchronization emitter
  useEffect(() => {
    if (!user) return;
    const syncChat = async () => {
      try {
        setIsSyncing(true);
        for (let i = 0; i < intelMessages.length; i++) {
          const msg = intelMessages[i];
          const msgId = `msg-${i}`;
          await setDoc(doc(db, 'users', user.uid, 'chatHistory', msgId), {
            id: msgId,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            createdAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Failed to sync chat history to Firestore", err);
      } finally {
        setIsSyncing(false);
      }
    };
    const timer = setTimeout(() => {
      syncChat();
    }, 2000);
    return () => clearTimeout(timer);
  }, [intelMessages, user]);

  // Active theme profile synchronization
  useEffect(() => {
    if (!user || !activeTheme) return;
    const syncTheme = async () => {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email || '',
          activeTheme: activeTheme,
          lastActive: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Failed to sync theme settings to Firestore", err);
      }
    };
    syncTheme();
  }, [activeTheme, user]);
  
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [isTrailerLoading, setIsTrailerLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [trailerError, setTrailerError] = useState(false);
  const [signalStrength, setSignalStrength] = useState(0);

  const [soundEffects, setSoundEffects] = useState<SoundEffect[]>(INITIAL_SOUND_EFFECTS);
  const [isGeneratingSFX, setIsGeneratingSFX] = useState(false);
  const [sfxPrompt, setSfxPrompt] = useState("");
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [musicPrompt, setMusicPrompt] = useState("");
  const [musicStyle, setMusicStyle] = useState("ambient");

  // ACTIVE WEB AUDIO CLIENT-SIDE SYNTHESIZER & MULTI-LAYER AUDIO ENGINE
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const audioNodesRef = React.useRef<Record<string, { gainNode: GainNode; sourceNode?: AudioNode; audioEl?: HTMLAudioElement }>>({});

  const MUSIC_URLS: Record<string, string> = {
    'music-1': 'https://upload.wikimedia.org/wikipedia/commons/d/df/Space_ambient_sound_effects.mp3', // Space ambient
    'music-classic-1': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Moonlight_Sonata_1st_movement_-_Ludwig_van_Beethoven.mp3', // Moonlight Sonata
    'music-classic-2': 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Pr%C3%A9lude_en_Do_Majeur_BWV_846.mp3', // Bach Prelude C Major
    'music-classic-3': 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Debussy_Clair_de_Lune.mp3', // Clair de Lune
    'music-2': 'https://upload.wikimedia.org/wikipedia/commons/5/50/Gymnop%C3%A9die_No._1.mp3', // Satie Gymnopedie
    'music-3': 'https://upload.wikimedia.org/wikipedia/commons/2/29/Electronic_loop_pulsar.wav' // Pulsar electronic beats
  };

  const initAudioEngine = () => {
    if (audioContextRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      audioContextRef.current = new AudioCtx();
    } catch (e) {
      console.warn("Could not retrieve AudioContext", e);
    }
  };

  const playUIClick = () => {
    try {
      initAudioEngine();
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.05);
      
      gainNode.gain.setValueAtTime(0.04, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  };

  const playProceduralSynthSFX = (prompt: string) => {
    try {
      initAudioEngine();
      const ctx = audioContextRef.current;
      if (!ctx) return;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();
      
      const textLower = prompt.toLowerCase();
      
      if (textLower.includes('deep') || textLower.includes('void') || textLower.includes('low') || textLower.includes('rumble')) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 1.8);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(70, now + 1.8);
        
        gainNode.gain.setValueAtTime(0.01, now);
        gainNode.gain.linearRampToValueAtTime(0.35, now + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.8);
      } else if (textLower.includes('laser') || textLower.includes('shoot') || textLower.includes('pulse') || textLower.includes('zap')) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.4);
        
        filter.type = 'peaking';
        filter.frequency.setValueAtTime(1100, now);
        filter.frequency.setValueAtTime(180, now + 0.4);
        
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (textLower.includes('chime') || textLower.includes('glass') || textLower.includes('high') || textLower.includes('sparkle')) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.linearRampToValueAtTime(1318.51, now + 0.3); // E6
        
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1479.98, now); // F#6
        
        gainNode.gain.setValueAtTime(0.18, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
        
        osc.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now);
        osc2.start(now);
        osc.stop(now + 1.4);
        osc2.stop(now + 1.4);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.7);
        
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0.35, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.75);
      }
    } catch (e) {}
  };

  // SOUND CONTROLLER EFFECT Loop to align active track volumes & synthesizers
  React.useEffect(() => {
    try {
      initAudioEngine();
      const ctx = audioContextRef.current;
      if (!ctx) return;

      const resumeAudio = () => {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
      };
      window.addEventListener('click', resumeAudio);

      soundEffects.forEach((s) => {
        if (s.isActive) {
          if (s.type === 'music') {
            const url = s.audioData ? `data:${s.mimeType || 'audio/wav'};base64,${s.audioData}` : MUSIC_URLS[s.id];
            if (url) {
              let record = audioNodesRef.current[s.id];
              if (!record || !record.audioEl) {
                const audioEl = new Audio(url);
                audioEl.loop = true;
                audioEl.crossOrigin = "anonymous";
                audioEl.volume = s.volume * 0.35;
                audioNodesRef.current[s.id] = { gainNode: null as any, audioEl };
                audioEl.play().catch(() => {});
              } else {
                record.audioEl.volume = s.volume * 0.35;
                if (record.audioEl.paused) {
                  record.audioEl.play().catch(() => {});
                }
              }
            }
          } else if (s.type === 'ambient') {
            let record = audioNodesRef.current[s.id];
            if (!record) {
              const osc = ctx.createOscillator();
              const filter = ctx.createBiquadFilter();
              const gain = ctx.createGain();
              
              if (s.id === 'ambient-1') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(65, ctx.currentTime);
                
                const subOsc = ctx.createOscillator();
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(65.5, ctx.currentTime);
                subOsc.connect(filter);
                subOsc.start();
                
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(150, ctx.currentTime);
                
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(s.volume * 0.3, ctx.currentTime + 1.5);
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                
                audioNodesRef.current[s.id] = { gainNode: gain, sourceNode: osc };
              } else if (s.id === 'ambient-2') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(110, ctx.currentTime);
                
                gain.gain.setValueAtTime(0, ctx.currentTime);
                
                const filterSweep = ctx.createBiquadFilter();
                filterSweep.type = 'bandpass';
                filterSweep.frequency.setValueAtTime(300, ctx.currentTime);
                
                osc.connect(filterSweep);
                filterSweep.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                
                const pulseInterval = setInterval(() => {
                  if (audioNodesRef.current[s.id] && s.isActive) {
                    const now = ctx.currentTime;
                    gain.gain.cancelScheduledValues(now);
                    gain.gain.setValueAtTime(0, now);
                    gain.gain.linearRampToValueAtTime(s.volume * 0.35, now + 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
                    
                    filterSweep.frequency.cancelScheduledValues(now);
                    filterSweep.frequency.setValueAtTime(150, now);
                    filterSweep.frequency.exponentialRampToValueAtTime(600, now + 0.3);
                    filterSweep.frequency.exponentialRampToValueAtTime(150, now + 1.2);
                  }
                }, 1600);
                
                audioNodesRef.current[s.id] = { 
                  gainNode: gain, 
                  sourceNode: osc,
                  audioEl: { pulseInterval } as any
                };
              }
            } else {
              if (record.gainNode) {
                record.gainNode.gain.linearRampToValueAtTime(s.volume * 0.3, ctx.currentTime + 0.1);
              }
            }
          } else if (s.type === 'character') {
            let record = audioNodesRef.current[s.id];
            if (!record) {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              
              let pitch = 75;
              if (s.id.includes('lion')) {
                pitch = 82.41;
                osc.type = 'triangle';
              } else if (s.id.includes('jaguar')) {
                pitch = 146.83;
                osc.type = 'sine';
              } else {
                pitch = 98.00;
                osc.type = 'sawtooth';
              }
              
              osc.frequency.setValueAtTime(pitch, ctx.currentTime);
              
              const filter = ctx.createBiquadFilter();
              filter.type = 'lowpass';
              filter.frequency.setValueAtTime(pitch * 2, ctx.currentTime);
              
              gain.gain.setValueAtTime(0, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(s.volume * 0.15, ctx.currentTime + 0.5);
              
              osc.connect(filter);
              filter.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              
              audioNodesRef.current[s.id] = { gainNode: gain, sourceNode: osc };
            } else {
              if (record.gainNode) {
                record.gainNode.gain.linearRampToValueAtTime(s.volume * 0.15, ctx.currentTime + 0.1);
              }
            }
          }
        } else {
          let record = audioNodesRef.current[s.id];
          if (record) {
            if (record.audioEl && !(record.audioEl as any).pulseInterval) {
              record.audioEl.pause();
            } else if (record.gainNode) {
              record.gainNode.gain.cancelScheduledValues(ctx.currentTime);
              record.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
            }
            
            setTimeout(() => {
              const rec = audioNodesRef.current[s.id];
              if (rec) {
                if (rec.sourceNode) {
                  try { rec.sourceNode.disconnect(); } catch(e) {}
                }
                if (rec.gainNode) {
                  try { rec.gainNode.disconnect(); } catch(e) {}
                }
                if (rec.audioEl && (rec.audioEl as any).pulseInterval) {
                  clearInterval((rec.audioEl as any).pulseInterval);
                }
                delete audioNodesRef.current[s.id];
              }
            }, 250);
          }
        }
      });

      return () => {
        window.removeEventListener('click', resumeAudio);
      };
    } catch(e) {}
  }, [soundEffects]);

  const generateNeuralSFX = async () => {
    if (!sfxPrompt) return;
    setIsGeneratingSFX(true);
    setNotification({ message: `Synthesizing neural frequency: "${sfxPrompt}"...`, type: 'info' });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newSFX: SoundEffect = {
      id: `gen-${Date.now()}`,
      label: sfxPrompt.slice(0, 15) + (sfxPrompt.length > 15 ? '...' : ''),
      volume: 0.5,
      isActive: true,
      type: 'ui',
      description: `Neural-synthesized audio artifact based on: ${sfxPrompt}`
    };
    
    // Play synthesized custom audio directly
    playProceduralSynthSFX(sfxPrompt);
    
    setSoundEffects(prev => [newSFX, ...prev]);
    setIsGeneratingSFX(false);
    setSfxPrompt("");
    setNotification({ message: "Neural sfx synthesized successfully.", type: 'success' });
  };

  const generateNeuralMusic = async () => {
    if (!musicPrompt) return;
    setIsGeneratingMusic(true);
    setNotification({ message: `Generating dynamic cosmic soundtrack: "${musicPrompt}"...`, type: 'info' });
    
    try {
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: musicPrompt,
          style: musicStyle
        })
      });

      if (!response.ok) {
        throw new Error(`Neural sound core link failed (${response.status})`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Music compilation error.");
      }

      const newTrack: SoundEffect = {
        id: `music-gen-${Date.now()}`,
        label: data.label,
        volume: 0.4,
        isActive: true,
        type: 'music',
        description: data.description,
        audioData: data.audioData,
        mimeType: data.mimeType || 'audio/wav'
      };

      // Set other music to inactive so the newly compiled track is prioritized
      setSoundEffects(prev => {
        const resetSongs = prev.map(s => s.type === 'music' ? { ...s, isActive: false } : s);
        return [newTrack, ...resetSongs];
      });

      setMusicPrompt("");
      setNotification({ message: `Soundtrack '${data.label}' initialized and synchronized in the active atmospheric feed.`, type: 'success' });
      recordApiTelemetry(true);
    } catch (err: any) {
      console.error(err);
      setNotification({ message: `Dynamic song generation aborted: ${err.message || err}`, type: 'error' });
      recordApiTelemetry(false, 'OTHER');
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  const toggleSoundEffect = (id: string) => {
    playUIClick();
    setSoundEffects(prev => {
      const effect = prev.find(s => s.id === id);
      if (effect?.type === 'music') {
        return prev.map(s => {
          if (s.id === id) return { ...s, isActive: !s.isActive };
          if (s.type === 'music') return { ...s, isActive: false };
          return s;
        });
      }
      return prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s);
    });
  };

  const updateSoundVolume = (id: string, volume: number) => {
    setSoundEffects(prev => prev.map(s => s.id === id ? { ...s, volume: Math.max(0, Math.min(1, volume)) } : s));
  };

  const updateLipSyncSettings = (id: string, settings: Character['syncSettings']) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, syncSettings: settings } : c));
  };

  const updateCharacterTheme = (id: string, theme: string) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, aestheticTheme: theme } : c));
  };

  const [universeLore, setUniverseLore] = useState({
    era: "Era of the Great Convergence",
    status: "Fragile Peace (Post-Singularity)",
    decisions: [
      "Resolution 402: Mandatory Ethics Buffers",
      "Organic Preservation Act Ratification",
      "Tiger-Sector Phase Gate Suspension"
    ]
  });

  const [backgroundUrl, setBackgroundUrl] = useState("https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048&auto=format&fit=crop");
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string | null>(null);

  const fetchBRolls = async () => {
    try {
      const response = await fetch('/api/generate-broll');
      const data = await response.json();
      setBRolls(prev => {
        const exists = prev.find(b => b.id === data.id);
        if (exists) return prev;
        return [...prev, data].slice(-10); // Keep last 10
      });
    } catch (err) {
      console.error("B-Roll fetch failed", err);
    }
  };

  useEffect(() => {
    const fetchBackground = async () => {
      if (customBackgroundUrl) return; // Skip if custom is set
      try {
        const response = await fetch('/api/background');
        const data = await response.json();
        setBackgroundUrl(data.imageUrl);
      } catch (err) {
        console.error("Background fetch failed", err);
      }
    };
    fetchBackground();
    fetchBRolls();
    const bRollInterval = setInterval(fetchBRolls, 30000); // Pulse every 30s
    return () => clearInterval(bRollInterval);
  }, [activeTab]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const syncAllAvatars = async () => {
    setActiveTab('characters');
    // Trigger sync for each character
    characters.forEach(char => {
      generateAvatar(char.id);
    });
  };

  const parseAIError = (err: any): string => {
    const msg = err.message || String(err);
    if (msg.includes('QUOTA_EXHAUSTED') || msg.includes('429') || msg.includes('quota')) {
      return 'Universal Quota Exceeded. The neural network needs time to recalibrate (try again in a few minutes).';
    }
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return 'Neural link unstable. Check your intergalactic connection.';
    }
    if (msg.toLowerCase().includes('safety')) {
      return 'Neural filters triggered. The proposed concept exceeds cosmic safety protocols.';
    }
    if (msg.includes('API key')) {
      return 'Neural credentials missing. System configuration required.';
    }
    return msg || 'Unknown neural disruption detected.';
  };

  const generateAvatar = React.useCallback(async (charId: string, options: { promptOverride?: string, isHD?: boolean, artisticStyle?: string, lightingCondition?: string } = {}) => {
    if (generatingAvatars[charId]) return;
    
    const { promptOverride, isHD = false, artisticStyle, lightingCondition } = options;

    try {
      setGeneratingAvatars(prev => ({ ...prev, [charId]: true }));
      const char = characters.find(c => c.id === charId);
      if (!char) return;

      // Only show notification if it's a manual/direct trigger or we want specific feedback
      if (promptOverride || isHD || artisticStyle || lightingCondition) {
        setNotification({ message: `Initiating ${isHD ? 'HD ' : ''}biometric sync for ${char.name} (${artisticStyle || 'standard'} style)...`, type: 'info' });
      }

      // We consolidate background/trailer sync into the main character generation flow if missing
      const currentSeed = Math.floor(Math.random() * 1000000);
      
      const requests = [
        fetch('/api/generate-avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            character: char.id,
            seed: currentSeed,
            promptOverride: promptOverride,
            isHD: isHD,
            artisticStyle: artisticStyle,
            lightingCondition: lightingCondition
          }),
        })
      ];

      // If trailer is missing, sync it too
      if (!char.trailerUrl) {
        requests.push(fetch('/api/generate-trailer'));
      }

      const responses = await Promise.all(requests);
      
      if (!responses[0].ok) {
        const errorData = await responses[0].json();
        throw new Error(errorData.error || `Biometric sync failed (${responses[0].status})`);
      }

      const avatarData = await responses[0].json();
      const trailerData = responses[1] && responses[1].ok ? await responses[1].json() : null;
      
      if (!avatarData.generated && avatarData.error === 'QUOTA_EXHAUSTED') {
        setNotification({ 
          message: "AI Generation Quota Exceeded. Using high-quality curated fallback image for now.", 
          type: 'info' 
        });
        recordApiTelemetry(false, 'QUOTA');
      } else {
        recordApiTelemetry(true);
      }

      setCharacters(prev => prev.map(c => c.id === charId ? { 
        ...c, 
        avatar: avatarData.imageUrl,
        ...(trailerData ? { trailerUrl: trailerData.videoUrl } : {})
      } : c));
    } catch (err: any) {
      console.error(err);
      const isQuotaError = err.message?.includes('429') || err.message?.toLowerCase().includes('quota') || err.message?.toLowerCase().includes('exhausted');
      recordApiTelemetry(false, isQuotaError ? 'QUOTA' : 'OTHER');
      setNotification({ message: `Biometric sync fail: ${parseAIError(err)}`, type: 'error' });
    } finally {
      setGeneratingAvatars(prev => ({ ...prev, [charId]: false }));
    }
  }, [characters, generatingAvatars]);


  const generateScript = async (sectionId: string, theme?: string) => {
    try {
      setScripts(prev => prev.map(s => s.id === sectionId ? { ...s, status: 'generating' } : s));
      
      const section = scripts.find(s => s.id === sectionId);
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phase: section?.title, 
          topic: theme || activeTheme,
          tone: "deep",
          context: { 
            characters: characters.map(c => ({ name: c.name, role: c.role })),
            universeLore: universeLore
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        recordApiTelemetry(false, response.status === 429 ? 'QUOTA' : 'OTHER');
        throw new Error(errorData.error || `Script forge failed (${response.status})`);
      }

      const data = await response.json();
      recordApiTelemetry(true);
      
      setScripts(prev => prev.map(s => s.id === sectionId ? { 
        ...s, 
        content: data.text, 
        status: 'completed'
      } : s));

      setNotification({ message: "Script module forged. Link a cosmic visual to complete the sequence.", type: 'info' });
      setSelectingBRollForSection(sectionId);

      // Automatically trigger voice generation after script forge
      await generateVoice(sectionId, data.text);

    } catch (err: any) {
      console.error(err);
      const isQuotaError = err.message?.includes('429') || err.message?.toLowerCase().includes('quota') || err.message?.toLowerCase().includes('exhausted');
      recordApiTelemetry(false, isQuotaError ? 'QUOTA' : 'OTHER');
      setScripts(prev => prev.map(s => s.id === sectionId ? { ...s, status: 'pending' } : s));
      setNotification({ message: `Script forge interrupted: ${parseAIError(err)}`, type: 'error' });
    }
  };

  const updateScriptContent = (id: string, content: string) => {
    setScripts(prev => prev.map(s => s.id === id ? { ...s, content, status: content ? 'completed' : 'pending' } : s));
  };

  const generateManifesto = React.useCallback(async (charId: string) => {
    if (generatingManifestos[charId]) return;
    
    try {
      setGeneratingManifestos(prev => ({ ...prev, [charId]: true }));
      const char = characters.find(c => c.id === charId);
      if (!char) return;

      const response = await fetch('/api/generate-manifesto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          character: char.name,
          theme: activeTheme
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        recordApiTelemetry(false, response.status === 429 ? 'QUOTA' : 'OTHER');
        throw new Error(errorData.error || `Manifesto forge failed (${response.status})`);
      }
      
      const data = await response.json();
      recordApiTelemetry(true);
      
      setCharacters(prev => prev.map(c => c.id === charId ? { 
        ...c, 
        manifesto: data.text
      } : c));
      
      // Only set as "selected" if it's a manual or most recent forge focus
      // We don't want to pop modals automatically during auto-sync
      // setSelectedManifesto({ charId, text: data.text });

      setNotification({ message: `${char.name}'s Deep Manifesto has been forged.`, type: 'success' });
    } catch (err: any) {
      console.error(err);
      const isQuotaError = err.message?.includes('429') || err.message?.toLowerCase().includes('quota') || err.message?.toLowerCase().includes('exhausted');
      recordApiTelemetry(false, isQuotaError ? 'QUOTA' : 'OTHER');
      setNotification({ message: `Manifesto forge failed: ${parseAIError(err)}`, type: 'error' });
    } finally {
      setGeneratingManifestos(prev => ({ ...prev, [charId]: false }));
    }
  }, [characters, activeTheme, generatingManifestos]);

  // Keep characters in ref to prevent infinite sync loops
  const charactersRef = React.useRef(characters);
  React.useEffect(() => {
    charactersRef.current = characters;
  }, [characters]);

  const generatingAvatarsRef = React.useRef(generatingAvatars);
  React.useEffect(() => {
    generatingAvatarsRef.current = generatingAvatars;
  }, [generatingAvatars]);

  const generatingManifestosRef = React.useRef(generatingManifestos);
  React.useEffect(() => {
    generatingManifestosRef.current = generatingManifestos;
  }, [generatingManifestos]);

  const syncTriggeredForTabRef = React.useRef<string | null>(null);

  // Auto-sync biometrics and lore when visiting the characters tab
  useEffect(() => {
    if (activeTab === 'characters') {
      if (syncTriggeredForTabRef.current === activeTab) return;
      syncTriggeredForTabRef.current = activeTab;

      const currentChars = charactersRef.current;
      const missingAvatars = currentChars.filter(char => !char.avatar && !generatingAvatarsRef.current[char.id]);
      const missingManifestos = currentChars.filter(char => !char.manifesto && !generatingManifestosRef.current[char.id]);
      
      if (missingAvatars.length > 0 || missingManifestos.length > 0) {
        setNotification({ 
          message: `Synchronizing neural biometric records and philosophical lore for council members...`, 
          type: 'info' 
        });

        const triggerSequentialSync = async () => {
          for (const char of missingAvatars) {
             await generateAvatar(char.id);
          }
          for (const char of missingManifestos) {
             await generateManifesto(char.id);
          }
        };
        triggerSequentialSync();
      }
    } else {
      syncTriggeredForTabRef.current = null;
    }
  }, [activeTab, generateAvatar, generateManifesto]);

  const generateLipSync = async (charId: string) => {
    try {
      const char = characters.find(c => c.id === charId);
      if (!char || !char.avatar) {
        setNotification({ message: "Character avatar required for lip-sync.", type: 'error' });
        return;
      }

      setGeneratingLipSyncs(prev => ({ ...prev, [charId]: true }));
      setNotification({ message: `Initiating neural lip-sync for ${char.name}...`, type: 'info' });

      const response = await fetch('/api/generate-council-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: charId,
          imageUrl: char.avatar,
          text: char.manifesto || "The universe is a vast expanse of code and spirit, converging into a singular point of intelligence.",
          syncSettings: char.syncSettings
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Lip-sync forge failed (${response.status})`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Start polling for status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/check-video-status?videoId=${data.videoId}&provider=${data.provider}`);
          
          if (!statusRes.ok) {
            const errorData = await statusRes.json();
             throw new Error(errorData.error || "Neural status link failed");
          }

          const statusData = await statusRes.json();
          
          if (statusData.status === 'completed') {
            clearInterval(pollInterval);
            setCharacters(prev => prev.map(c => c.id === charId ? { ...c, lipSyncUrl: statusData.videoUrl } : c));
            setGeneratingLipSyncs(prev => ({ ...prev, [charId]: false }));
            setNotification({ message: `${char.name}'s neural avatar has been synchronized.`, type: 'success' });
          }
        } catch (pollErr: any) {
          console.error("Polling failed", pollErr);
          clearInterval(pollInterval);
          setGeneratingLipSyncs(prev => ({ ...prev, [charId]: false }));
          setNotification({ message: `Lip-sync status failed: ${parseAIError(pollErr)}`, type: 'error' });
        }
      }, 5000);

    } catch (err: any) {
      console.error(err);
      setNotification({ message: `Lip-sync initiation failed: ${parseAIError(err)}`, type: 'error' });
      setGeneratingLipSyncs(prev => ({ ...prev, [charId]: false }));
    }
  };

  const generateAnimateVideo = async (charId: string, prompt?: string) => {
    try {
      const char = characters.find(c => c.id === charId);
      if (!char || !char.avatar) {
        setNotification({ message: "Character avatar required for Veo animation.", type: 'error' });
        return;
      }

      setGeneratingAnimateVideos(prev => ({ ...prev, [charId]: true }));
      setNotification({ message: `Initiating Google Veo cinematic animation for ${char.name}...`, type: 'info' });

      // If they use standard prompt, make it highly cinematic
      const finalPrompt = prompt || `A cinematic panning camera motion, breathing and moving subtly, of ${char.name}, highly detailed digital art, science fiction elements.`;

      const response = await fetch('/api/animate-image-to-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: char.avatar,
          prompt: finalPrompt,
          aspectRatio: "16:9",
          resolution: "720p"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Veo animation forge failed (${response.status})`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Start polling for status
      const pollInterval = setInterval(async () => {
        try {
          const queryParams = data.operationName 
            ? `operationName=${encodeURIComponent(data.operationName)}&provider=veo`
            : `videoId=${data.videoId}&provider=simulated_veo`;
          
          const statusRes = await fetch(`/api/check-animate-status?${queryParams}`);
          
          if (!statusRes.ok) {
            const errorData = await statusRes.json();
            throw new Error(errorData.error || "Veo status link failed");
          }

          const statusData = await statusRes.json();
          
          if (statusData.status === 'completed') {
            clearInterval(pollInterval);
            setCharacters(prev => prev.map(c => c.id === charId ? { ...c, animatedVideoUrl: statusData.videoUrl } : c));
            setGeneratingAnimateVideos(prev => ({ ...prev, [charId]: false }));
            setNotification({ message: `${char.name} has been animated into a breathtaking video!`, type: 'success' });
          }
        } catch (pollErr: any) {
          console.error("Polling failed", pollErr);
          clearInterval(pollInterval);
          setGeneratingAnimateVideos(prev => ({ ...prev, [charId]: false }));
          setNotification({ message: `Veo status failed: ${parseAIError(pollErr)}`, type: 'error' });
        }
      }, 5000);

    } catch (err: any) {
      console.error(err);
      setNotification({ message: `Veo initiation failed: ${parseAIError(err)}`, type: 'error' });
      setGeneratingAnimateVideos(prev => ({ ...prev, [charId]: false }));
    }
  };

  const sendIntelQuery = async (queryOverride?: string) => {
    const textQuery = (queryOverride || intelInput).trim();
    if (!textQuery) return;

    if (!queryOverride) {
      setIntelInput('');
    }

    const userMsg = {
      role: 'user' as const,
      content: textQuery,
      timestamp: new Date().toLocaleTimeString()
    };

    setIntelMessages(prev => [...prev, userMsg]);
    setIntelGenerating(true);

    try {
      const response = await fetch('/api/gemini-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...intelMessages, userMsg].map(m => ({ role: m.role, content: m.content })),
          context: {
            activeTheme,
            characterCount: characters.length,
            roles: characters.map(c => c.role),
            scriptLength: scripts.length
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Intelligence core connection interrupted (${response.status})`);
      }

      const data = await response.json();
      
      setIntelMessages(prev => [...prev, {
        role: 'assistant' as const,
        content: data.text || '[DIAGNOSTIC ARCHIVE RESOLVED NO TELEMETRY]',
        timestamp: new Date().toLocaleTimeString()
      }]);

      recordApiTelemetry(true);
    } catch (err: any) {
      console.error(err);
      const isQuota = err.message?.includes("429") || err.message?.includes("quota") || err.toString().includes("429");
      recordApiTelemetry(false, isQuota ? 'QUOTA' : 'OTHER');
      setNotification({ message: `Oracle link delayed: ${parseAIError(err)}`, type: 'error' });
      
      setIntelMessages(prev => [...prev, {
        role: 'assistant' as const,
        content: `[ORACLE OFFLINE - SECURE LOCAL COGNITIVE CORE STANDBY]\nWe encountered a signal attenuation. Recovered from diagnostic buffers:\n\n*The backup silicon relays have booted local text simulations.* Please verify your API Key in the top right Settings > Secrets.`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIntelGenerating(false);
    }
  };

  const generateVoice = async (sectionId: string, text: string, voice: string = 'random') => {
    try {
      setScripts(prev => prev.map(s => s.id === sectionId ? { ...s, isVoiceGenerating: true } : s));
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Voice sync failed (${response.status})`);
      }
      
      const data = await response.json();
      if (data.audioData) {
        setScripts(prev => prev.map(s => s.id === sectionId ? { 
          ...s, 
          audioData: data.audioData, 
          audioMimeType: data.mimeType || 'audio/mp3' 
        } : s));
        playAudio(data.audioData, data.mimeType || 'audio/mp3');
      }
    } catch (err: any) {
      console.error("Voice sync failed", err);
      setNotification({ message: `Voice sync fail: ${parseAIError(err)}`, type: 'error' });
    } finally {
      setScripts(prev => prev.map(s => s.id === sectionId ? { ...s, isVoiceGenerating: false } : s));
    }
  };

  const playAudio = (base64Audio: string, mimeType: string = 'audio/mp3') => {
    const audio = new Audio(`data:${mimeType};base64,${base64Audio}`);
    audio.play();
  };

  const handlePlayVoice = (sectionId: string, voice?: string) => {
    const section = scripts.find(s => s.id === sectionId);
    if (section?.content) {
      generateVoice(sectionId, section.content, voice);
    }
  };

  const handleSelectBRoll = (bRoll: BRoll) => {
    if (!selectingBRollForSection) return;
    
    setScripts(prev => prev.map(s => s.id === selectingBRollForSection ? {
      ...s,
      bRollUrl: bRoll.url,
      bRollLabel: bRoll.label
    } : s));
    
    setNotification({ message: `Linked ${bRoll.label} to module ${selectingBRollForSection.toUpperCase()}`, type: 'success' });
    setSelectingBRollForSection(null);
  };

  const handleTabChange = (tab: string) => {
    playUIClick();
    setActiveTab(tab);
    if (tab === 'characters') {
      // Logic moved to useEffect for more reliable auto-triggering on both navigation and initialization
    }
  };

  const playTrailer = async () => {
    if (!isNeuralLinkActive) {
      setNotification({ message: "Neural transmission has interrupted. Source link is expired", type: 'error' });
      return;
    }
    try {
      setIsTrailerLoading(true);
      setShowTrailer(true);
      setTrailerError(false);
      setSignalStrength(0);
      
      const response = await fetch('/api/generate-trailer');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Trailer transmission failed (${response.status})`);
      }
      const data = await response.json();
      
      // Simulate "Neural Transmission" signal acquisition
      for (let i = 0; i <= 100; i += 5) {
        setSignalStrength(i);
        await new Promise(r => setTimeout(r, 30));
      }
      
      setTrailerUrl(data.videoUrl);
    } catch (err: any) {
      console.error(err);
      setTrailerError(true);
      setNotification({ message: `Trailer transmission link failed: ${parseAIError(err)}`, type: 'error' });
    } finally {
      setIsTrailerLoading(false);
    }
  };

  const exportCinematic = async () => {
    if (!isNeuralLinkActive) {
      setNotification({ message: "Neural transmission has interrupted. Source link is expired", type: 'error' });
      return;
    }
    try {
      setIsExporting(true);
      setNotification({ message: "Initializing neural montage sequence...", type: 'info' });
      
      // Artificial delay to simulate complex server-side encoding
      await new Promise(resolve => setTimeout(resolve, 2000));
      setNotification({ message: "Syncing council biometrics with synthesized audio...", type: 'info' });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      setNotification({ message: "Rendering Intergalactic Council chambers...", type: 'info' });

      await new Promise(resolve => setTimeout(resolve, 1500));
      const activeFX = soundEffects.filter(s => s.isActive && s.type !== 'music').length;
      const selectedMusic = soundEffects.find(s => s.isActive && s.type === 'music');
      
      if (selectedMusic) {
        setNotification({ 
          message: `Mastering audio: '${selectedMusic.label}' synchronized with ${activeFX} atmospheric layers...`, 
          type: 'info' 
        });
      } else {
        setNotification({ 
          message: `Baking ${activeFX} active atmospheric audio layers into the stream...`, 
          type: 'info' 
        });
      }

      await playTrailer();
      setNotification({ message: "Cinematic montage exported and ready for broadcast.", type: 'success' });
    } catch (err: any) {
      console.error(err);
      setNotification({ message: `Video synthesis failed: ${parseAIError(err)}`, type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  // Manifesto Modal
  const currentManifestoChar = selectedManifesto ? characters.find(c => c.id === selectedManifesto.charId) : null;
  const currentCharTheme = currentManifestoChar ? (CHARACTER_THEMES[currentManifestoChar.id] || CHARACTER_THEMES.lion) : CHARACTER_THEMES.lion;

  return (
    <SelfHealingErrorBoundary onAutoHeal={handleAutoHealed}>
      {triggerRenderCrash && (
        (() => {
          throw new Error("Simulated Temporal Synapse Collision (Stack Error 0x8F92) - Controlled Injection");
        })()
      )}
      <div className="flex h-screen bg-[#02020a] overflow-hidden relative">
      <NeuralDataStream />
      {/* Background Visuals */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-nebula-deep">
        <AnimatePresence mode="popLayout">
          <motion.img 
            key={customBackgroundUrl || backgroundUrl}
            initial={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
            animate={{ opacity: 0.2, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 2, ease: "easeInOut" }}
            src={customBackgroundUrl || backgroundUrl} 
            alt="Cosmic background" 
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-nebula-deep/50 to-nebula-deep" />
        
        {/* Animated Orbs */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 12, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[100px]" 
        />
      </div>

      <Sidebar 
        activeTab={activeTab} 
        handleTabChange={handleTabChange} 
        quotaStats={quotaStats}
        onOpenQuotaModal={() => setIsQuotaModalOpen(true)}
        user={user}
        isSyncing={isSyncing}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      <NeuralProcessMonitor 
        generatingAvatars={generatingAvatars}
        generatingManifestos={generatingManifestos}
        generatingLipSyncs={generatingLipSyncs}
        scripts={scripts}
        isTrailerLoading={isTrailerLoading}
        isExporting={isExporting}
      />
      
      <main className="flex-1 overflow-y-auto scroll-hide p-8 relative z-10">
        {/* Top-level subtle progress indicator */}
        {(Object.values(generatingAvatars).some(v => v) || 
          Object.values(generatingManifestos).some(v => v) || 
          Object.values(generatingLipSyncs).some(v => v) || 
          scripts.some(s => s.status === 'generating' || s.isVoiceGenerating) ||
          isTrailerLoading || isExporting) && (
          <div className="fixed top-0 right-0 left-72 h-0.5 z-[100] bg-white/5 pointer-events-none">
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '100%', opacity: 1 }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="h-full bg-linear-to-r from-amber-500/0 via-amber-500 to-amber-500/0"
            />
          </div>
        )}

        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50, x: '-50%' }}
              animate={{ opacity: 1, y: 20, x: '-50%' }}
              exit={{ opacity: 0, y: -50, x: '-50%' }}
              className={`fixed top-0 left-1/2 z-50 px-6 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 min-w-[320px] ${
                notification.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-200' :
                notification.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-200' :
                'bg-amber-500/20 border-amber-500/30 text-amber-200'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${
                notification.type === 'error' ? 'bg-red-500/20' :
                notification.type === 'success' ? 'bg-green-500/20' :
                'bg-amber-500/20'
              }`}>
                {notification.type === 'error' ? <Zap className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <p className="text-sm font-medium">{notification.message}</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Trailer Modal */}
        <AnimatePresence>
          {showTrailer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 md:p-12"
            >
              <button 
                onClick={() => { setShowTrailer(false); setTrailerUrl(null); setTrailerError(false); }}
                className="absolute top-8 right-8 text-starlight/50 hover:text-white transition-colors z-[110] flex items-center gap-2 group"
              >
                <span className="text-[10px] font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">TERMINATE LINK</span>
                <X className="w-10 h-10" />
              </button>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-6xl aspect-video rounded-[32px] overflow-hidden border border-white/10 shadow-[0_0_150px_rgba(251,191,36,0.15)] bg-black"
              >
                {/* Neural Transmission Overlay */}
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-black/80 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/80 to-transparent" />
                  
                  {/* Scanline Effect */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />
                  
                  {/* Scanning Horitzontal Bar */}
                  <motion.div 
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-px bg-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                  />

                  {/* Corner Brackets */}
                  <div className="absolute top-10 left-10 w-8 h-8 border-t-2 border-l-2 border-white/20" />
                  <div className="absolute top-10 right-10 w-8 h-8 border-t-2 border-r-2 border-white/20" />
                  <div className="absolute bottom-10 left-10 w-8 h-8 border-b-2 border-l-2 border-white/20" />
                  <div className="absolute bottom-10 right-10 w-8 h-8 border-b-2 border-r-2 border-white/20" />
                </div>

                {isTrailerLoading || trailerError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-[#02020a]">
                    <div className="relative">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="w-32 h-32 border-t-2 border-r-2 border-amber-500 rounded-full"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Zap className={`w-10 h-10 ${trailerError ? 'text-red-500' : 'text-amber-500'}`} />
                        </motion.div>
                      </div>
                      
                      {/* Signal Strength Rings */}
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: [0, 0.2, 0], scale: [0.8, 1.5, 2] }}
                          transition={{ duration: 3, repeat: Infinity, delay: i * 0.8 }}
                          className="absolute inset-0 border border-amber-500/20 rounded-full"
                        />
                      ))}
                    </div>

                    <div className="text-center">
                      <h4 className="text-amber-500 font-mono text-xs tracking-[0.5em] uppercase mb-4">
                        {trailerError ? 'TRANSMISSION ERROR' : 'NEURAL TRANSMISSION'}
                      </h4>
                      <div className="flex items-center gap-2 justify-center mb-6">
                        <span className="text-starlight/40 text-[10px] uppercase font-mono tracking-widest">SIGNAL STRENGTH:</span>
                        <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            className={`h-full ${trailerError ? 'bg-red-500' : 'bg-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]'}`}
                            animate={{ width: trailerError ? '12%' : `${signalStrength}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-mono ${trailerError ? 'text-red-500' : 'text-amber-400'}`}>
                          {trailerError ? 'STABLE_REF' : `${signalStrength}%`}
                        </span>
                      </div>
                      
                      {trailerError && (
                        <button 
                          onClick={playTrailer}
                          className="px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-bold text-xs hover:bg-red-500/30 transition-all flex items-center gap-2 mx-auto"
                        >
                          <RefreshCcw className="w-4 h-4" />
                          RE-ESTABLISH LINK
                        </button>
                      )}
                      
                      {!trailerError && isTrailerLoading && (
                        <p className="text-starlight/30 text-[10px] font-mono animate-pulse uppercase tracking-[0.2em]">Synchronizing Cosmic Archives...</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <video 
                    autoPlay 
                    className="w-full h-full object-cover relative z-10"
                    controls
                    src={trailerUrl || ''}
                    onEnded={() => { setShowTrailer(false); setTrailerUrl(null); }}
                    onLoadedData={() => setSignalStrength(100)}
                    onError={() => {
                      setTrailerError(true);
                      setNotification({ message: "Neural transmission link severed. Source link unreachable.", type: 'error' });
                    }}
                  />
                )}

                {/* HUD Overlay */}
                {!isTrailerLoading && !trailerError && (
                  <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-12">
                    <div className="flex justify-between items-start opacity-60">
                      <div className="font-mono text-[10px] tracking-[0.4em] space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <p>STABLE LINK</p>
                        </div>
                        <p className="text-amber-400">FPS: 60.00</p>
                        <p>LATENCY: 14ms</p>
                      </div>
                      <div className="font-mono text-[10px] tracking-[0.4em] text-right space-y-1">
                        <p>COORD: SECTOR_7G</p>
                        <p>CIPHER: AES-COSMIC</p>
                        <p className="text-starlight/40 font-mono">2026.05.17.1834</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                       <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-black/60 backdrop-blur-xl px-10 py-4 rounded-full border border-white/10 flex items-center gap-6"
                       >
                          <div className="flex items-center gap-3">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <p className="text-xs font-mono tracking-[0.6em] uppercase text-amber-400">Neural Imagination</p>
                          </div>
                          <div className="w-px h-4 bg-white/10" />
                          <p className="text-[10px] font-mono text-starlight/50 tracking-widest uppercase">Proprietary Broadcast</p>
                       </motion.div>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <div className="relative group">
                  <div className="absolute -inset-4 bg-linear-to-r from-amber-500/20 to-purple-500/20 rounded-[40px] blur-3xl opacity-50 group-hover:opacity-70 transition-opacity" />
                  <div className="relative flex flex-col md:flex-row gap-12 items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-6 mb-6">
                        <div className="flex items-center gap-3">
                          <span className="h-px w-12 bg-amber-500/50" />
                          <span className="text-amber-400 font-mono text-xs tracking-[0.3em] uppercase">Executive Production Hub</span>
                        </div>
                        <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${isNeuralLinkActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-[10px] font-mono uppercase text-starlight/40 tracking-widest leading-none">Neural Link: {isNeuralLinkActive ? 'Active' : 'Severed'}</span>
                          </div>
                          {!isNeuralLinkActive ? (
                            <button 
                              onClick={() => setIsNeuralLinkActive(true)}
                              className="text-[10px] font-mono uppercase text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1"
                            >
                              <RefreshCcw className="w-3 h-3" /> Restore Transmission
                            </button>
                          ) : (
                            <button 
                              onClick={() => setIsNeuralLinkActive(false)}
                              className="text-[10px] font-mono uppercase text-starlight/20 hover:text-red-500/50 transition-colors"
                            >
                              Interrupt Signal
                            </button>
                          )}
                        </div>
                      </div>
                      <h2 className="text-6xl font-display font-bold mb-6 tracking-tighter leading-[0.9]">
                        Council of <span className="gradient-text">Infinite</span> Intelligence
                      </h2>
                      <p className="text-starlight/60 text-xl leading-relaxed mb-8 max-w-xl">
                        Orchestrate a 15-minute intergalactic odyssey. Master the dialogue between ancient wisdom and future calculation.
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <button 
                          onClick={() => handleTabChange('characters')}
                          className="bg-amber-500 text-black px-8 py-4 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-transform flex items-center gap-3"
                        >
                          <Users className="w-5 h-5" />
                          Assemble Council
                        </button>
                        <button 
                          onClick={exportCinematic}
                          disabled={isExporting}
                          className="bg-starlight text-black px-8 py-4 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-transform flex items-center gap-3 disabled:opacity-50"
                        >
                          {isExporting ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
                          {isExporting ? 'TRANSMITTING...' : 'Export Cinematic Clip'}
                        </button>
                        <button 
                          onClick={playTrailer}
                          className="bg-white/10 border border-white/20 text-starlight px-8 py-4 rounded-2xl font-bold hover:bg-white/20 transition-colors flex items-center gap-3"
                        >
                          <Play className="w-5 h-5 fill-current" />
                          Watch Trailer
                        </button>
                      </div>
                    </div>
                    <div className="w-full md:w-80 aspect-square glass-panel p-2 rotate-3 hover:rotate-0 transition-transform overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=800&auto=format&fit=crop" 
                        alt="Council visual" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { icon: Video, title: 'Cinematic Flow', desc: 'Broken into 6 thematic chapters for maximum retention.', color: 'text-amber-400' },
                    { icon: Star, title: 'Voice Fidelity', desc: 'Distinct personality profiles using neural synthesis.', color: 'text-blue-400' },
                    { icon: Zap, title: 'Flash Performance', desc: 'Ultra-low latency script generation via Gemini Flash.', color: 'text-purple-400' },
                  ].map((feat, i) => (
                    <div key={i} className="glass-panel p-6 border-b-4 border-transparent hover:border-amber-500/30 transition-all group">
                      <feat.icon className={`w-8 h-8 ${feat.color} mb-4 group-hover:scale-110 transition-transform`} />
                      <h3 className="font-bold text-lg mb-2">{feat.title}</h3>
                      <p className="text-sm text-starlight/50 leading-relaxed">{feat.desc}</p>
                    </div>
                  ))}
                </div>

                <CosmicBRollFeed 
                  bRolls={bRolls} 
                  onRefresh={fetchBRolls} 
                  onSelectBRoll={handleSelectBRoll}
                  selectingForSection={selectingBRollForSection}
                />

                {/* Lore Management Panel */}
                <div className="glass-panel p-8 border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <ScrollText className="w-40 h-40" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="bg-amber-500/20 p-2 rounded-lg">
                        <ScrollText className="w-5 h-5 text-amber-500" />
                      </div>
                      <h3 className="text-2xl font-display font-bold">Universe <span className="text-amber-400">Lore</span> & Directives</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-4">
                        <p className="text-[10px] font-mono text-starlight/30 uppercase tracking-[0.2em]">Temporal Chronology</p>
                        <input 
                          type="text" 
                          value={universeLore.era}
                          onChange={(e) => setUniverseLore(prev => ({ ...prev, era: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-starlight focus:border-amber-500/50 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-4">
                        <p className="text-[10px] font-mono text-starlight/30 uppercase tracking-[0.2em]">Geopolitical Status</p>
                        <input 
                          type="text" 
                          value={universeLore.status}
                          onChange={(e) => setUniverseLore(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-starlight focus:border-amber-500/50 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-mono text-starlight/30 uppercase tracking-[0.2em]">Council Directives</p>
                          <button 
                            onClick={() => setUniverseLore(prev => ({ ...prev, decisions: [...prev.decisions, "New Neural Directive established..."] }))}
                            className="text-[10px] text-amber-500 hover:text-amber-400 font-bold"
                          >
                            + ADD
                          </button>
                        </div>
                        <div className="space-y-2">
                          {universeLore.decisions.map((decision, idx) => (
                            <div key={idx} className="group flex items-center gap-3">
                              <input 
                                type="text" 
                                value={decision}
                                onChange={(e) => {
                                  const newDecisions = [...universeLore.decisions];
                                  newDecisions[idx] = e.target.value;
                                  setUniverseLore(prev => ({ ...prev, decisions: newDecisions }));
                                }}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-starlight/70 focus:border-amber-500/50 outline-none transition-all"
                              />
                              <button 
                                onClick={() => setUniverseLore(prev => ({ ...prev, decisions: prev.decisions.filter((_, i) => i !== idx) }))}
                                className="opacity-0 group-hover:opacity-100 text-starlight/20 hover:text-red-500 transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Configuration Section */}
                <div id="system-config" className="glass-panel p-8 border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Settings className="w-40 h-40" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="bg-blue-500/20 p-2 rounded-lg">
                        <Settings className="w-5 h-5 text-blue-500" />
                      </div>
                      <h3 className="text-2xl font-display font-bold">System <span className="text-blue-400">Configuration</span></h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-starlight font-bold mb-2">Neural Interface Visuals</h4>
                          <p className="text-sm text-starlight/60 mb-4">Overwrite the collective consciousness visuals with your own custom biometric backdrop.</p>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 hover:border-blue-500/50 transition-all group">
                            <div className="flex flex-col items-center justify-center pb-6 pt-5">
                              <ImagePlus className="w-8 h-8 text-starlight/20 group-hover:text-blue-400 transition-colors mb-2" />
                              <p className="mb-2 text-sm text-starlight/40"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                              <p className="text-xs text-starlight/20 uppercase font-mono">PNG, JPG or WEBP (MAX. 2048x1024px)</p>
                            </div>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setCustomBackgroundUrl(reader.result as string);
                                    setNotification({ message: "Custom neural backdrop synchronized.", type: 'success' });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          
                          {customBackgroundUrl && (
                            <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                                  <img src={customBackgroundUrl} className="w-full h-full object-cover" alt="Custom Preview" />
                                </div>
                                <span className="text-xs font-mono text-blue-400 uppercase">Custom Backdrop Active</span>
                              </div>
                              <button 
                                onClick={() => {
                                  setCustomBackgroundUrl(null);
                                  setNotification({ message: "Reverting to cosmic archives...", type: 'info' });
                                }}
                                className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-red-400 transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h4 className="text-starlight font-bold mb-2">Neural Link Status</h4>
                          <p className="text-sm text-starlight/60">Configure the fidelity and bandwidth of the intergalactic signal.</p>
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                              <div className="flex items-center gap-3">
                                <Zap className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-medium">Neural Link Protocol</span>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${isNeuralLinkActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {isNeuralLinkActive ? 'ENCRYPTED' : 'OFFLINE'}
                              </div>
                           </div>
                           <button 
                             onClick={() => setIsNeuralLinkActive(!isNeuralLinkActive)}
                             className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all"
                           >
                              {isNeuralLinkActive ? 'DISCONNECT NEURAL LINK' : 'ESTABLISH NEURAL LINK'}
                           </button>

                           {(() => {
                             const activeSound = soundEffects.find(s => s.isActive && (s.type === 'music' || s.type === 'ambient'));
                             return (
                               <SignalAnalysisVisualizer 
                                 volume={activeSound ? activeSound.volume : 0}
                                 isActive={activeSound ? activeSound.isActive : false}
                                 trackName={activeSound ? activeSound.label : 'STANDBY'}
                               />
                             );
                           })()}

                           {/* Live Background Audio Processing Monitor */}
                           <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/15 space-y-3">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                 <Activity className={`w-4 h-4 text-purple-400 ${soundEffects.some(s => s.isActive) ? 'animate-pulse' : ''}`} />
                                 <span className="text-xs font-semibold text-purple-200">Live Background Audio Processing</span>
                               </div>
                               <div className="flex items-center gap-1.5">
                                 <span className="relative flex h-2 w-2">
                                   {soundEffects.some(s => s.isActive) && (
                                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                   )}
                                   <span className={`relative inline-flex rounded-full h-2 w-2 ${soundEffects.some(s => s.isActive) ? 'bg-purple-400' : 'bg-white/10'}`}></span>
                                 </span>
                                 <span className="text-[9px] font-mono uppercase text-purple-300 font-black tracking-wider">
                                   {soundEffects.some(s => s.isActive) ? 'PROCESSING' : 'STANDBY'}
                                 </span>
                               </div>
                             </div>

                             <div className="space-y-1 text-[10px] font-mono text-starlight/60">
                               <div className="flex justify-between items-center bg-white/[0.01] px-2.5 py-1.5 rounded-lg border border-white/5">
                                 <span className="text-starlight/35 uppercase tracking-wider">Soundtrack Engine</span>
                                 <span className="text-amber-400 font-bold truncate max-w-[170px]">
                                   {soundEffects.find(s => s.isActive && s.type === 'music')?.label || 'MUTED'}
                                 </span>
                               </div>
                               <div className="flex justify-between items-center bg-white/[0.01] px-2.5 py-1.5 rounded-lg border border-white/5">
                                 <span className="text-starlight/35 uppercase tracking-wider">Cosmic Hum Filter</span>
                                 <span className="text-blue-400 font-bold">
                                   {soundEffects.find(s => s.isActive && s.type === 'ambient')?.label ? 'ACTIVE' : 'OFF'}
                                 </span>
                               </div>
                               <div className="flex justify-between items-center bg-white/[0.01] px-2.5 py-1.5 rounded-lg border border-white/5">
                                 <span className="text-starlight/35 uppercase tracking-wider">Active Channels</span>
                                 <span className="text-purple-400 font-bold">
                                   {soundEffects.filter(s => s.isActive).length} Cores Active
                                 </span>
                               </div>
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Autonomic Diagnostics & Self Healing Section */}
                    <div className="mt-10 pt-8 border-t border-white/5 space-y-6">
                      <div className="text-left">
                        <h4 className="text-starlight font-bold mb-1.5 flex items-center gap-2">
                          <Shield className="w-5 h-5 text-amber-400 animate-pulse" />
                          Autonomic Diagnostics & Self-Healing Guard
                        </h4>
                        <p className="text-xs text-starlight/60">
                          Our real-time active error boundary intercepts unexpected thread crashes, resets unstable reactive parameters, and returns the workspace to full live visual replication automatically.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Diagnostic Indicator 1 */}
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3.5 text-left">
                          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                            <HeartPulse className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-[9px] font-mono text-starlight/40 uppercase">GUARD STATUS</span>
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                              </span>
                              SECURE & ACTIVE
                            </span>
                          </div>
                        </div>

                        {/* Diagnostic Indicator 2 */}
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3.5 text-left">
                          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                            <Activity className="w-5 h-5" />
                          </div>
                           <div>
                             <span className="block text-[9px] font-mono text-starlight/40 uppercase">RECOVERY DEPLOYED</span>
                             <span className="text-xs font-bold text-starlight mt-0.5 block font-mono">
                               AUTO RE-MOUNT
                             </span>
                           </div>
                        </div>

                        {/* Diagnostic Indicator 3 */}
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3.5 text-left text-ellipsis overflow-hidden">
                          <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                            <Bug className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-[9px] font-mono text-starlight/40 uppercase">AUTO-REPAIRED FAULTS</span>
                            <span className="text-xs font-bold text-amber-400 mt-0.5 block font-mono">
                              DYNAMIC
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5.5 bg-amber-500/[0.02] border border-amber-500/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-starlight flex items-center gap-1.5">
                            <Terminal className="w-4 h-4 text-amber-500" />
                            Simulate Critical Render Exception
                          </h5>
                          <p className="text-[11px] text-starlight/60 leading-relaxed max-w-lg">
                            Inject an artificial React rendering exception into the virtual DOM tree to launch the sandbox isolation terminal, inspect real-time log diagnosis, and execute automatic correction.
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setNotification({ message: "Injecting artificial visual thread crash in: 3, 2, 1...", type: 'info' });
                            setTimeout(() => {
                              setTriggerRenderCrash(true);
                            }, 1200);
                          }}
                          className="w-full sm:w-auto px-5 py-3 bg-red-500/10 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-mono font-bold active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 animate-pulse border-dashed"
                        >
                          <AlertOctagon className="w-4 h-4" />
                          INJECT SIMULATED BUG
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'intelligence' && (
              <motion.div
                key="intelligence"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-4xl font-display font-medium mb-2">Cognitive <span className="text-orange-400">Core</span></h2>
                  <p className="text-starlight/40 font-mono text-xs">DIRECT BIOMETRICAL CONVOLUTION TRANSMISSIONS WITH THE ORACLE INTERFACE</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Chat interface */}
                  <div className="lg:col-span-2 glass-panel p-6 flex flex-col h-[600px] relative overflow-hidden">
                    {/* Header bar */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
                        <span className="font-mono text-xs text-orange-400 tracking-wider uppercase">Trans-Secured Neural Bandwidth</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Confirm secure erase of Oracle context cache?")) {
                            setIntelMessages([
                              {
                                role: 'assistant',
                                content: `[COGNITIVE CORE RESET_SECURED] Memory registers initialized. Silicon-Carbon synapses synchronized. Commander, I stand ready to receive your strategic directives.`,
                                timestamp: new Date().toLocaleTimeString()
                              }
                            ]);
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-white/5 hover:bg-red-500/20 text-starlight/40 hover:text-red-400 font-mono text-[9px] uppercase tracking-wider transition-all"
                      >
                        Secure Purge
                      </button>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                      {intelMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-mono text-starlight/30 uppercase">
                              {msg.role === 'user' ? 'Commander (You)' : 'Oracle Intelligence'}
                            </span>
                            <span className="text-[9px] font-mono text-starlight/20">{msg.timestamp}</span>
                          </div>
                          <div
                            className={`p-4 rounded-2xl max-w-[85%] text-xs leading-relaxed whitespace-pre-wrap font-sans ${
                              msg.role === 'user'
                                ? 'bg-orange-500/15 border border-orange-500/25 text-orange-200'
                                : 'bg-[#090918] border border-white/5 text-starlight/80 font-mono whitespace-pre-wrap'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {intelGenerating && (
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-mono text-orange-400 uppercase animate-pulse">Syncing Silicon Synapses</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-orange-950/20 border border-orange-500/20 text-orange-300 font-mono text-xs flex items-center gap-2">
                            <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                            <span>COGNITIVE RELAYS INTEGRATING MULTI-MODAL FEEDBACK...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat Input form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendIntelQuery();
                      }}
                      className="mt-4 flex gap-3"
                    >
                      <input
                        type="text"
                        value={intelInput}
                        onChange={(e) => setIntelInput(e.target.value)}
                        placeholder="Transmit command strings or ask Oracle for counsel (e.g. status)..."
                        disabled={intelGenerating}
                        className="flex-1 px-4 py-3 bg-[#03030b] border border-white/10 rounded-xl font-mono text-xs text-starlight/90 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 placeholder-starlight/20 transition-all disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={intelGenerating || !intelInput.trim()}
                        className="px-5 py-3 bg-orange-500 disabled:bg-white/5 text-black disabled:text-starlight/20 font-bold rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer animate-pulse-fast"
                      >
                        Transmit
                      </button>
                    </form>
                  </div>

                  {/* Sidebar stats & grounding actions */}
                  <div className="space-y-6">
                    {/* Status card */}
                    <div className="glass-panel p-6 space-y-4">
                      <h3 className="text-sm font-mono tracking-widest text-starlight/50 uppercase border-b border-white/5 pb-2">Grounding Telemetry</h3>
                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        <div className="bg-[#050510] p-3 rounded-xl border border-white/5">
                          <p className="text-starlight/30 text-[9px] uppercase tracking-wider">ACTIVE CONVERSATION</p>
                          <p className="text-orange-400 font-bold mt-1">{intelMessages.length} Messages</p>
                        </div>
                        <div className="bg-[#050510] p-3 rounded-xl border border-white/5">
                          <p className="text-starlight/30 text-[9px] uppercase tracking-wider">INTELLIGENCE KEY</p>
                          <p className="text-green-400 font-bold mt-1">EMBEDDED SECURE</p>
                        </div>
                        <div className="bg-[#050510] p-3 rounded-xl border border-white/5">
                          <p className="text-starlight/30 text-[9px] uppercase tracking-wider">COUNCIL MEMBERS</p>
                          <p className="text-starlight/85 font-bold mt-1">{characters.length} Node Links</p>
                        </div>
                        <div className="bg-[#050510] p-3 rounded-xl border border-white/5">
                          <p className="text-starlight/30 text-[9px] uppercase tracking-wider">SCRIPT INDEX</p>
                          <p className="text-starlight/85 font-bold mt-1">{scripts.length} Block Modules</p>
                        </div>
                      </div>

                      <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 text-[10px] font-mono leading-relaxed text-orange-300">
                        <p className="font-bold uppercase tracking-wider mb-1">COGNITIONAL NOTE</p>
                        This interface communicates with Google Gemini over robust TLS streams, feeding full council telemetry directly to context windows to ensure accurate suggestions.
                      </div>
                    </div>

                    {/* Prebuilt Action Nodes */}
                    <div className="glass-panel p-6 space-y-4">
                      <h3 className="text-sm font-mono tracking-widest text-starlight/50 uppercase border-b border-white/5 pb-2">Interactive Directives</h3>
                      <p className="text-[10px] text-starlight/40 leading-relaxed font-sans">Click any of the precompiled neural signals below to quickly run deep Oracle actions:</p>
                      
                      <div className="space-y-2.5">
                        <button
                          type="button"
                          onClick={() => sendIntelQuery("Run active core status health diagnostics on the Council Triumvirate.")}
                          className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:border-orange-500/30 hover:bg-[#08081a] transition-all text-xs text-starlight/80 font-mono flex justify-between items-center group cursor-pointer"
                        >
                          <span className="group-hover:text-orange-400 transition-colors">⚡ core status diagnostics</span>
                          <span className="text-[9px] text-starlight/20 select-none">→</span >
                        </button>
                        <button
                          type="button"
                          onClick={() => sendIntelQuery("Suggest 3 radical, philosophically heavy dialogue topics for the next Episode.")}
                          className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:border-orange-500/30 hover:bg-[#08081a] transition-all text-xs text-starlight/80 font-mono flex justify-between items-center group cursor-pointer"
                        >
                          <span className="group-hover:text-orange-400 transition-colors">🎬 brainstorm dialogue scripts</span>
                          <span className="text-[9px] text-starlight/20 select-none">→</span >
                        </button>
                        <button
                          type="button"
                          onClick={() => sendIntelQuery("Provide algorithmic guidelines to optimize the title and tags of the council videos for high signal propagation.")}
                          className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:border-orange-500/30 hover:bg-[#08081a] transition-all text-xs text-starlight/80 font-mono flex justify-between items-center group cursor-pointer"
                        >
                          <span className="group-hover:text-orange-400 transition-colors">📈 youtube signal optimizations</span>
                          <span className="text-[9px] text-starlight/20 select-none">→</span >
                        </button>
                        <button
                          type="button"
                          onClick={() => sendIntelQuery("Analyze the core philosophical tension between Silicon species (analog data matrices) and Carbon entities (biological neurons) in Year 12,450 post-Singularity.")}
                          className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:border-orange-500/30 hover:bg-[#08081a] transition-all text-xs text-starlight/80 font-mono flex justify-between items-center group cursor-pointer"
                        >
                          <span className="group-hover:text-orange-400 transition-colors">🪐 analyze silicon vs carbon lore</span>
                          <span className="text-[9px] text-starlight/20 select-none">→</span >
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'characters' && (
              <motion.div
                key="characters"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-4xl font-display font-medium mb-2">The <span className="text-amber-400">Triumvirate</span></h2>
                  <p className="text-starlight/40 font-mono text-xs">RECONSTRUCTING BIOMETRIC DATA FROM INTERGALACTIC SIGNALS...</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {characters.map(char => (
                    <CharacterCard 
                      key={char.id} 
                      char={char} 
                      onGenerate={generateAvatar} 
                      onGenerateManifesto={generateManifesto}
                      onGenerateLipSync={generateLipSync}
                      onAnimateImageToVideo={generateAnimateVideo}
                      onUpdateSync={updateLipSyncSettings}
                      onUpdateTheme={updateCharacterTheme}
                      isGenerating={!!generatingAvatars[char.id]} 
                      isManifestoGenerating={!!generatingManifestos[char.id]}
                      isLipSyncGenerating={!!generatingLipSyncs[char.id]}
                      isAnimateVideoGenerating={!!generatingAnimateVideos[char.id]}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'script' && (
              <motion.div
                key="script"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-4xl font-display font-medium mb-2">The <span className="text-amber-400">Script</span> Forge</h2>
                    <p className="text-starlight/40 font-mono text-xs">GENERATING NEURAL-LINKED DIALOGUE FLOWS...</p>
                  </div>
                  <button className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/10 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    EXPORT FULL MANUSCRIPT
                  </button>
                </div>
                <ScriptForge 
                  sections={scripts} 
                  onGenerate={generateScript} 
                  onPlayVoice={handlePlayVoice} 
                  onUpdateSection={updateScriptContent}
                  characters={characters}
                  activeTheme={activeTheme}
                  setActiveTheme={setActiveTheme}
                  onSelectBRoll={setSelectingBRollForSection}
                  selectingBRollForSection={selectingBRollForSection}
                />
              </motion.div>
            )}

            {activeTab === 'tts' && (
              <motion.div
                key="tts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <TtsTransceiver characters={characters} />
              </motion.div>
            )}

            {activeTab === 'media-lab' && (
              <motion.div
                key="media-lab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <MediaLab characters={characters} activeTheme={activeTheme} />
              </motion.div>
            )}

            {activeTab === 'workflow' && (
              <motion.div
                key="workflow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <div>
                  <h2 className="text-4xl font-display font-medium mb-2">Production <span className="text-amber-400">Pipeline</span></h2>
                  <p className="text-starlight/40 font-mono text-xs italic tracking-widest leading-relaxed max-w-2xl">
                    The sequence of assembly protocols across the intergalactic neural network. Each module must be synchronized for the final collective broadcast.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <div className="space-y-4">
                    {[
                      { step: 1, label: 'Script Forge', desc: 'Define the 10-minute philosophical debate.', completed: scripts.every(s => s.status === 'completed') },
                      { step: 2, label: 'Avatar Sync', desc: 'Generate character visuals for council members.', completed: characters.every(c => c.avatar) },
                      { step: 3, label: 'Audio Synthesis', desc: 'Synthesize distinctive cinematic voices via neural link.', completed: scripts.every(s => !!s.audioData) },
                      { step: 4, label: 'Lip-Sync Animation', desc: 'Map speech to characters using biometric mapping.', completed: characters.some(c => !!c.lipSyncUrl) },
                      { step: 5, label: 'B-Roll Integration', desc: 'Intersperse cosmic visuals to break monotony.', completed: scripts.some(s => !!s.bRollUrl) },
                      { step: 6, label: 'Final Assembly', desc: 'Synchronize timeline for intergalactic broadcast.', completed: false },
                    ].map((item) => (
                      <div 
                        key={item.step} 
                        className={`glass-panel p-6 flex items-center gap-6 transition-all border ${
                          item.completed 
                            ? 'opacity-100 border-amber-500/40 bg-amber-500/5 shadow-[0_0_15px_rgba(251,191,36,0.05)]' 
                            : item.step === 6 ? 'border-purple-500/30 bg-purple-500/5' : 'opacity-40 border-white/5'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border-2 transition-colors ${
                          item.completed 
                            ? 'bg-amber-500 border-amber-500 text-black' 
                            : item.step === 6 ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'border-white/10 text-white/20 font-mono'
                        }`}>
                          {item.completed ? <CheckCircle2 className="w-6 h-6" /> : `0${item.step}`}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-bold text-lg ${item.step === 6 ? 'text-purple-400' : ''}`}>{item.label}</h4>
                          <p className="text-xs text-starlight/60 leading-relaxed">{item.desc}</p>
                        </div>
                        {item.step === 6 && (
                          <div className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-[10px] font-bold animate-pulse">
                            ACTIVE PROTOCOL
                          </div>
                        )}
                        {item.completed && (
                          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                             <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <TimelineSynchronizer 
                      scripts={scripts} 
                      characters={characters}
                      isExporting={isExporting}
                      onExport={exportCinematic}
                    />

                    <AudioMixerLab 
                      soundEffects={soundEffects}
                      onToggle={toggleSoundEffect}
                      onVolumeChange={updateSoundVolume}
                      isGeneratingSFX={isGeneratingSFX}
                      sfxPrompt={sfxPrompt}
                      onSfxPromptChange={setSfxPrompt}
                      onGenerateSFX={generateNeuralSFX}
                      isGeneratingMusic={isGeneratingMusic}
                      musicPrompt={musicPrompt}
                      onMusicPromptChange={setMusicPrompt}
                      musicStyle={musicStyle}
                      onMusicStyleChange={setMusicStyle}
                      onGenerateMusic={generateNeuralMusic}
                    />

                    <div className="glass-panel p-6 border-amber-500/10 bg-amber-500/[0.02] flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-amber-500/10">
                        <Zap className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="font-bold mb-1">Neural Assembly Advice</h4>
                        <p className="text-xs text-starlight/50 leading-relaxed">
                          Your timeline coherence is optimized for retention. Ensure the <span className="text-purple-400 font-bold uppercase">B-Roll</span> layers do not overlap critical <span className="text-amber-400 font-bold uppercase">Lip-Sync</span> manifests. AI interference detected in Sector 4 is within acceptable margins.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'youtube' && (
              <motion.div
                key="youtube"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-12"
              >
                <div>
                  <h2 className="text-5xl font-display font-medium mb-4 tracking-tight"><span className="text-red-500">YouTube</span> Viral Optimization</h2>
                  <p className="text-starlight/60 text-lg leading-relaxed max-w-2xl">Specific tactics to ensure your 15-minute intergalactic debate captures and holds audience retention across the algorithm.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { title: 'The Pacing Strategy', tip: 'Use "Jump Cuts" or camera zooms on the speaker. A static 3-animal shot for 10 minutes will fail.', icon: Zap },
                    { title: 'Dynamic Subtitles', tip: 'Apply word-by-word captions (CapCut/Submagic) to maintain focus during complex philosophical segments.', icon: ScrollText },
                    { title: 'B-Roll Intervals', tip: 'Insert cosmic nebulae or abstract tech graphics every 45-60 seconds to reset visual fatigue.', icon: Globe },
                    { title: 'Chapter Anchors', tip: 'Label your video description with timestamps for "The Rise of AI", "The Ethics of Space", etc.', icon: CheckCircle2 },
                  ].map((item, idx) => (
                    <div key={idx} className="glass-panel p-8 border-l-4 border-amber-500 group hover:bg-amber-500/5 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-amber-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
                          <item.icon className="w-6 h-6 text-amber-400" />
                        </div>
                        <h4 className="font-display font-bold text-xl">{item.title}</h4>
                      </div>
                      <p className="text-starlight/70 leading-relaxed">{item.tip}</p>
                    </div>
                  ))}
                </div>

                {/* Visual Asset Library Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-display font-bold">Atmospheric <span className="text-amber-400">B-Roll</span> Library</h3>
                    <p className="text-[10px] text-starlight/30 font-mono text-right">SUGGESTED VISUAL ASSETS FOR TRANSITIONS</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { id: 'nebula', label: 'Stellar Nebula', seed: 'vibrant-space' },
                      { id: 'matrix', label: 'Data Stream', seed: 'digital-neural' },
                      { id: 'blackhole', label: 'Singularity', seed: 'blackhole-cinematic' },
                      { id: 'council', label: 'Chamber Detail', seed: 'futuristic-architecture' },
                    ].map((asset) => (
                      <div key={asset.id} className="glass-panel p-2 group cursor-pointer overflow-hidden">
                        <div className="aspect-video relative overflow-hidden rounded-xl">
                          <img 
                            src={`https://picsum.photos/seed/${asset.seed}/600/400`} 
                            alt={asset.label} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Download className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <p className="mt-2 text-center text-[10px] font-mono font-bold text-starlight/40 group-hover:text-amber-400 transition-colors uppercase tracking-widest">{asset.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="glass-panel p-10 bg-red-500/5 border-red-500/20 relative overflow-hidden">
                  <div className="absolute -right-20 -bottom-20 opacity-5">
                    <Youtube className="w-80 h-80" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="bg-red-500 p-3 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                        <Youtube className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold">Smart Metadata</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <p className="text-xs font-mono text-red-400 mb-2 tracking-widest">SUGGESTED TITLE</p>
                        <p className="text-2xl font-display font-medium text-starlight leading-tight">The Intergalactic Council: Is AI the Second Genesis?</p>
                        <button className="mt-4 text-xs font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-2">
                          <RefreshCcw className="w-3 h-3" />
                          REGENERATE TITLES
                        </button>
                      </div>
                      <div>
                        <p className="text-xs font-mono text-red-400 mb-2 tracking-widest">AUTO-GENERATED TAGS</p>
                        <div className="flex flex-wrap gap-2">
                          {['AI', 'Philosophy', 'SpaceCouncil', 'FutureTech', 'CosmicEthics', 'Evolution'].map(tag => (
                            <span key={tag} className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-xs text-starlight/60 hover:border-red-500/30 transition-colors cursor-default">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'android' && (
              <motion.div
                key="android"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-12"
              >
                <div>
                  <h2 className="text-5xl font-display font-medium mb-4 tracking-tight">Android <span className="text-amber-400">Companion Link</span></h2>
                  <p className="text-starlight/60 text-lg leading-relaxed max-w-3xl">
                    Deploy, wrap, and synchronize your Intergalactic Council's telemetry on external Android devices. Use the physical simulator block below to trigger sound waves, submit planetary directives in real-time, and read local compilation methods.
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                  
                  {/* LEFT: Live Android Simulation Unit */}
                  <div className="xl:col-span-5 flex flex-col items-center">
                    <div className="text-center mb-4">
                      <span className="text-[10px] font-mono text-amber-500 uppercase tracking-[0.2em] block">Interactive Sandbox</span>
                      <h3 className="text-xl font-bold font-display mt-1 font-sans">APX-4 Mobile Telemetry</h3>
                    </div>

                    {/* PHYSICAL PHONE SHELL */}
                    <div className="relative mx-auto bg-slate-950 p-4 pb-5 rounded-[60px] border-4 border-slate-700 shadow-[0_0_80px_rgba(251,191,36,0.15)] max-w-sm w-full">
                      {/* Speaker grill and notch */}
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-full z-20 flex items-center justify-center border border-slate-800">
                        <div className="w-12 h-1 bg-slate-700 rounded-full mr-2" />
                        <div className="w-2.5 h-2.5 bg-sky-900 rounded-full" /> {/* Camera notch */}
                      </div>

                      {/* Power and Volume keys layout */}
                      <div className="absolute top-28 -right-1 w-1 h-12 bg-slate-700 rounded-l" />
                      <div className="absolute top-44 -right-1 w-1 h-8 bg-slate-700 rounded-l" />

                      {/* Screen Viewport */}
                      <div className="relative rounded-[45px] overflow-hidden border border-slate-800 bg-[#060611] text-starlight select-none font-sans h-[640px] flex flex-col">
                        
                        {/* Status Bar */}
                        <div className="pt-8 px-6 pb-2 bg-black/40 flex justify-between items-center text-[10px] font-mono tracking-wider text-starlight/60">
                          <div>{new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] opacity-75">INTERGALACTIC-NET</span>
                            <div className="flex items-center gap-1">
                              <div className="w-2.5 h-2 bg-amber-500 rounded-sm" />
                              <div className="w-1 h-3 bg-starlight/30 rounded-sm" />
                            </div>
                          </div>
                        </div>

                        {/* App Header */}
                        <div className="px-6 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-xs font-bold tracking-tight uppercase">Council Sync v1.4</span>
                          </div>
                          
                          <button 
                            onClick={() => {
                              playUIClick();
                              setAndroidPairingStatus(prev => prev === 'paired' ? 'disconnected' : 'paired');
                              setAndroidConsoleLogs(prev => [
                                `System: Wireless state changed to ${androidPairingStatus === 'paired' ? 'DISCONNECTED' : 'SECURE_PAIR_ESTABLISHED'}`,
                                ...prev
                              ]);
                            }}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono border ${
                              androidPairingStatus === 'paired' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                : 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse'
                            }`}
                          >
                            {androidPairingStatus === 'paired' ? '● PAIRED' : '○ OFFLINE'}
                          </button>
                        </div>

                        {/* Mobile Central Viewport */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-hide text-left">
                          
                          {/* BIOMETRICS VIEW */}
                          {androidSubTab === 'biometrics' && (
                            <div className="space-y-4">
                              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                                <label className="text-[10px] font-mono text-starlight/40 uppercase block">Monitor Target</label>
                                <select 
                                  value={androidSelectedChar}
                                  onChange={(e) => {
                                    playUIClick();
                                    const val = e.target.value;
                                    setAndroidSelectedChar(val);
                                    setAndroidConsoleLogs(prev => [
                                      `Target change: Synchronizing telemetry for ${val.toUpperCase()}`,
                                      ...prev
                                    ]);
                                  }}
                                  className="w-full bg-[#0d0d1e] border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-starlight focus:border-amber-500/30 font-sans"
                                >
                                  {characters.map(c => (
                                    <option key={c.id} value={c.id} className="bg-[#0d0d1e] text-starlight">{c.name} ({c.role})</option>
                                  ))}
                                </select>
                              </div>

                              {/* Chosen character biometric diagnostics card */}
                              {(() => {
                                const selected = characters.find(c => c.id === androidSelectedChar) || characters[0];
                                if (!selected) return null;
                                return (
                                  <div className="bg-[#0b0b18]/90 rounded-2xl border border-white/5 overflow-hidden">
                                    <div className="aspect-square relative w-full bg-black/40 flex items-center justify-center">
                                      {selected.avatar ? (
                                        <img 
                                          src={selected.avatar} 
                                          alt={selected.name} 
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-cover" 
                                        />
                                      ) : (
                                        <div className="flex flex-col items-center justify-center text-center p-4">
                                          <Users className="w-12 h-12 text-starlight/30 mb-2" />
                                          <span className="text-xs text-starlight/40 font-mono">NO BIOMETRIC LINK</span>
                                        </div>
                                      )}
                                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4">
                                        <h4 className="font-bold text-sm tracking-tight">{selected.name}</h4>
                                        <p className="text-[9px] font-mono text-amber-500 capitalize">{selected.role}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="p-4 space-y-3 text-xs">
                                      <div className="flex justify-between border-b border-white/5 pb-1.5">
                                        <span className="text-starlight/45">Neural Stream</span>
                                        <span className="font-mono text-emerald-400">92.4% ACTIVE</span>
                                      </div>
                                      <div className="flex justify-between border-b border-white/5 pb-1.5">
                                        <span className="text-starlight/45">Cognitive State</span>
                                        <span className="font-mono text-purple-400">STABLE</span>
                                      </div>
                                      
                                      {/* Micro Graph simulation */}
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-[9px] text-starlight/30">
                                          <span>SYNAPSE PULSE RATE</span>
                                          <span className="font-mono">88 HZ</span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                                          {[40, 75, 55, 90, 30, 85, 60, 95].map((val, i) => (
                                            <motion.div 
                                              key={i} 
                                              animate={{ height: [`${val}%`, `${Math.min(100, val + 15)}%`, `${val}%`] }}
                                              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                              className="flex-1 bg-amber-500/80 rounded-sm"
                                            />
                                          ))}
                                        </div>
                                      </div>

                                      <button 
                                        onClick={() => {
                                          playProceduralSynthSFX("stimulating neural waves");
                                          setAndroidConsoleLogs(prev => [
                                            `Pulse: Stimulated micro-synaptic burst for ${selected.name}`,
                                            ...prev
                                          ]);
                                        }}
                                        className="w-full mt-2 py-2.5 bg-amber-500 text-black text-[11px] font-bold rounded-xl hover:bg-amber-400 transition-colors uppercase tracking-wider font-sans outline-none"
                                      >
                                        Stimulate Synapses
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* SOUNDBOARD VIEW */}
                          {androidSubTab === 'soundboard' && (
                            <div className="space-y-4">
                              <p className="text-[10px] font-mono text-starlight/45 uppercase">Tactical Synth Broadcaster</p>
                              
                              <div className="grid grid-cols-2 gap-3 font-sans">
                                {[
                                  { label: 'Neural Ping', pmp: 'high sonic ping', bcolor: 'border-cyan-500/30 text-cyan-400 font-bold' },
                                  { label: 'Laser Pulse', pmp: 'laser beam shot rapid', bcolor: 'border-red-500/30 text-red-400 font-bold' },
                                  { label: 'Alarm Protocol', pmp: 'space airlock alarm pulse', bcolor: 'border-amber-500/30 text-amber-400 font-bold' },
                                  { label: 'Alien Chime', pmp: 'organic metallic bell sound', bcolor: 'border-purple-500/30 text-purple-400 font-bold' },
                                  { label: 'Gravity Warp', pmp: 'sub-bass pitch bend gravity sweep', bcolor: 'border-emerald-500/30 text-emerald-400 font-bold' },
                                  { label: 'Engine Roar', pmp: 'low spaceship main hyperdrive loop', bcolor: 'border-blue-500/30 text-blue-400 font-bold' },
                                ].map((pad) => (
                                  <button
                                    key={pad.label}
                                    onClick={() => {
                                      playProceduralSynthSFX(pad.pmp);
                                      setAndroidConsoleLogs(prev => [
                                        `SFX: Broadcasted '${pad.label}' (Tone: ${pad.pmp.slice(0, 16)})`,
                                        ...prev
                                      ]);
                                    }}
                                    className={`aspect-video rounded-2xl bg-[#080816] p-3 border flex flex-col justify-between items-start text-left hover:bg-white/5 active:scale-95 transition-all outline-none ${pad.bcolor}`}
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                    <div className="space-y-0.5">
                                      <span className="block text-[11px] uppercase tracking-wide leading-none">{pad.label}</span>
                                      <span className="block text-[8px] font-mono opacity-40">BROADCAST GRID</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* DIRECTIVES VIEW */}
                          {androidSubTab === 'directives' && (
                            <div className="space-y-4">
                              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-4">
                                <div>
                                  <label className="text-[10px] font-mono text-starlight/45 uppercase block mb-1">State Broadcaster</label>
                                  <p className="text-xs text-starlight/70 leading-relaxed font-sans">Inject live directives straight from this handheld unit into the primary timeline Lore.</p>
                                </div>

                                <div className="space-y-2">
                                  <input 
                                    type="text"
                                    value={androidDirectiveInput}
                                    onChange={(e) => setAndroidDirectiveInput(e.target.value)}
                                    placeholder="Enter Directive (e.g. Code Red)"
                                    className="w-full bg-[#0d0d1e] border border-white/10 rounded-xl px-3 py-2 text-xs outline-none text-starlight focus:border-amber-500/50 font-sans"
                                  />
                                  <button
                                    onClick={() => {
                                      if (!androidDirectiveInput.trim()) return;
                                      playUIClick();
                                      const text = androidDirectiveInput.trim();
                                      setUniverseLore(prev => ({
                                        ...prev,
                                        decisions: [...prev.decisions, `Android Protocol: ${text}`]
                                      }));
                                      setAndroidConsoleLogs(prev => [
                                        `Directive: Sent with broadcast code '${text.toUpperCase()}'`,
                                        ...prev
                                      ]);
                                      setAndroidDirectiveInput('');
                                      setNotification({
                                        message: `Mobile Directive Received: '${text}'`,
                                        type: 'success'
                                      });
                                    }}
                                    className="w-full py-2.5 bg-amber-500 text-black text-xs font-bold rounded-xl hover:bg-[#fbbf24]/90 active:scale-95 transition-all text-center uppercase tracking-wider font-sans outline-none"
                                  >
                                    Broadcast Command
                                  </button>
                                </div>
                              </div>

                              <div className="glass-panel p-4 rounded-2xl border-amber-500/20 bg-amber-500/5 flex gap-3 text-xs leading-relaxed">
                                <QrCode className="w-8 h-8 text-amber-400 shrink-0" />
                                <div>
                                  <h5 className="font-bold text-[11px] tracking-wide uppercase text-amber-400">Synchronized State</h5>
                                  <p className="text-[10px] text-starlight/60 mt-0.5 leading-snug">Any instruction written here is synchronized instantaneously with your master console's Lore Grid.</p>
                                </div>
                              </div>
                            </div>
                          )}

                        </div>

                        {/* Scrolling Console Ticker */}
                        <div className="h-28 bg-black border-t border-white/5 p-3.5 font-mono text-[8px] space-y-1 overflow-y-auto w-full select-none scroll-hide text-left text-starlight/50">
                          {androidConsoleLogs.map((log, idx) => (
                            <div key={idx} className="leading-relaxed">
                              <span className="text-amber-500/80 mr-1.5">&gt;&gt;</span>
                              {log}
                            </div>
                          ))}
                        </div>

                        {/* Phone Navigation Pills */}
                        <div className="h-14 bg-black/60 flex items-center justify-around px-12 border-t border-white/5 shrink-0">
                          <button 
                            onClick={() => {
                              playUIClick();
                              setAndroidSubTab('biometrics');
                            }}
                            className={`p-1.5 rounded-full transition-colors outline-none ${androidSubTab === 'biometrics' ? 'text-amber-400 bg-white/5' : 'text-starlight/40'}`}
                          >
                            <Users className="w-4 h-4" />
                          </button>
                          
                          <button 
                            onClick={() => {
                              playUIClick();
                              setAndroidSubTab('soundboard');
                            }}
                            className={`p-1.5 rounded-full transition-colors outline-none ${androidSubTab === 'soundboard' ? 'text-amber-400 bg-white/5' : 'text-starlight/40'}`}
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => {
                              playUIClick();
                              setAndroidSubTab('directives');
                            }}
                            className={`p-1.5 rounded-full transition-colors outline-none ${androidSubTab === 'directives' ? 'text-amber-400 bg-white/5' : 'text-starlight/40'}`}
                          >
                            <ScrollText className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* CENTER-RIGHT: Wireless Telemetry & APK Code Deck */}
                  <div className="xl:col-span-7 space-y-8 text-left">
                    
                    {/* QR pairing panel */}
                    <div className="glass-panel p-8 bg-amber-500/5 border-amber-500/20 flex flex-col md:flex-row items-center gap-8">
                      <div className="p-4 bg-white rounded-2xl shadow-xl shrink-0">
                        <svg className="w-32 h-32 text-black" viewBox="0 0 100 100" fill="currentColor">
                          <rect x="10" y="10" width="20" height="20" />
                          <rect x="15" y="15" width="10" height="10" fill="white" />
                          <rect x="70" y="10" width="20" height="20" />
                          <rect x="75" y="15" width="10" height="10" fill="white" />
                          <rect x="10" y="70" width="20" height="20" />
                          <rect x="15" y="75" width="10" height="10" fill="white" />
                          <rect x="40" y="15" width="5" height="10" />
                          <rect x="55" y="10" width="10" height="5" />
                          <rect x="45" y="30" width="15" height="5" />
                          <rect x="25" y="45" width="10" height="10" />
                          <rect x="45" y="45" width="10" height="15" />
                          <rect x="70" y="40" width="15" height="10" />
                          <rect x="80" y="60" width="10" height="15" />
                          <rect x="60" y="75" width="15" height="10" />
                          <rect x="35" y="70" width="10" height="5" />
                          <rect x="15" y="45" width="5" height="15" />
                          <circle cx="50" cy="50" r="4" className="text-amber-500" />
                          <rect x="73" y="73" width="6" height="6" className="text-amber-500" />
                        </svg>
                      </div>

                      <div className="space-y-4 font-sans">
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full uppercase tracking-wider">Device Syncing Protocol</span>
                        <h4 className="text-2xl font-display font-bold">Pair Wireless Android Unit</h4>
                        <p className="text-starlight/70 text-sm leading-relaxed">
                          Scan the temporal matrix key with your handheld camera or input your active production channel code to establish a real-time hot socket pipeline for video sync.
                        </p>
                        <div className="flex gap-4 items-center">
                          <div className="bg-[#0f0f1c] px-4 py-2 rounded-xl text-xs font-mono border border-white/10 text-amber-300 gap-2 flex items-center select-all">
                            <span>SESSION_ID:</span>
                            <span className="font-bold tracking-widest text-starlight">G7-COSMIC-94</span>
                          </div>
                          
                          <button
                            onClick={() => {
                              playUIClick();
                              setAndroidConsoleLogs(prev => [
                                'Pairing: Re-sent sync ping to local Android service...',
                                ...prev
                              ]);
                              setNotification({ message: "Android sync ping broadcasted locally.", type: "success" });
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-starlight transition-all"
                          >
                            RE-SEND SYN PING
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Android compilation developer hub */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h4 className="text-xl font-display font-bold">Android <span className="text-amber-400">Application Export</span> Blueprint</h4>
                        <span className="text-[10px] font-mono text-starlight/30 uppercase tracking-widest">Compiler Guides</span>
                      </div>

                      {/* Manual sub-tabs */}
                      <div className="flex gap-2">
                        {[
                          { id: 'capacitor', label: 'Capacitor.js Bundle' },
                          { id: 'kotlin', label: 'Kotlin WebView Activity' },
                          { id: 'api', label: 'REST API Specs' }
                        ].map((manualTab) => (
                          <button 
                            key={manualTab.id}
                            onClick={() => {
                              playUIClick();
                              setAndroidApkTab(manualTab.id as any);
                            }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                              androidApkTab === manualTab.id 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.1)]' 
                                : 'bg-transparent text-starlight/50 border-transparent hover:text-starlight hover:bg-white/5'
                            }`}
                          >
                            {manualTab.label}
                          </button>
                        ))}
                      </div>

                      {/* Content panel */}
                      <div className="glass-panel p-6 bg-black/40 border border-white/5 rounded-3xl min-h-[300px]">
                        
                        {androidApkTab === 'capacitor' && (
                          <div className="space-y-4">
                            <h5 className="font-bold text-sm text-starlight">Compile Web Build into Native APK &amp; Run with Capacitor</h5>
                            <p className="text-xs text-starlight/70 leading-relaxed font-sans">
                              Capacitor is the modern open-source mobile app wrapper. It compiles our index.html, JS script, and state engine directly into an Android Studio build folder in 4 simple commands:
                            </p>
                            
                            <div className="bg-[#050510] border border-white/5 p-4 rounded-xl font-mono text-xs text-amber-300 leading-relaxed space-y-2 select-all overflow-x-auto">
                              <div># 1. Install dependencies for mobile bundle</div>
                              <div className="text-starlight/60">npm install @capacitor/core @capacitor/cli @capacitor/android</div>
                              <div># 2. Initialize Capacitor in your manifest</div>
                              <div className="text-starlight/60">npx cap init &quot;Intergalactic Studio&quot; &quot;com.intergalactic.ai.studio&quot; --web-dir=dist</div>
                              <div># 3. Add Android platform resources</div>
                              <div className="text-starlight/60">npx cap add android</div>
                              <div># 4. Copy web code and run directly in emulator</div>
                              <div className="text-starlight/60">npm run build &amp;&amp; npx cap sync &amp;&amp; npx cap open android</div>
                            </div>

                            <p className="text-xs text-starlight/45 font-sans leading-relaxed">
                              *Note: The command will open the Android Studio layout where you can generate a signed bundle APK for Google Play or physical debugging.
                            </p>
                          </div>
                        )}

                        {androidApkTab === 'kotlin' && (
                          <div className="space-y-4">
                            <h5 className="font-bold text-sm text-starlight">Native Android + Jetpack Compose Embedded Code</h5>
                            <p className="text-xs text-starlight/70 leading-relaxed font-sans">
                              To embed this panel directly inside a high-performance native Kotlin wrapper, build a Compose Activity mapping hardware back-navigation gestures:
                            </p>

                            <div className="bg-[#050510] border border-white/5 p-4 rounded-xl font-mono text-[10px] text-purple-300 leading-tight space-y-1 select-all overflow-x-auto max-h-[200px] scroll-hide">
                              <div>package com.intergalactic.ai.studio</div>
                              <div className="text-starlight/40">// imports omitted for brevity</div>
                              <div>class MainActivity : ComponentActivity() &#123;</div>
                              <div>  @SuppressLint(&quot;SetJavaScriptEnabled&quot;)</div>
                              <div>  override fun onCreate(savedInstanceState: Bundle?) &#123;</div>
                              <div>    super.onCreate(savedInstanceState)</div>
                              <div>    setContent &#123;</div>
                              <div>      var webView: WebView? by remember &#123; mutableStateOf(null) &#125;</div>
                              <div>      BackHandler &#123;</div>
                              <div>        if (webView?.canGoBack() == true) webView?.goBack()</div>
                              <div>        else finish()</div>
                              <div>      &#125;</div>
                              <div>      AndroidView(</div>
                              <div>        factory = &#123; context -&gt;</div>
                              <div>          WebView(context).apply &#123;</div>
                              <div>            settings.javaScriptEnabled = true</div>
                              <div>            settings.domStorageEnabled = true</div>
                              <div>            settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW</div>
                              <div>            webViewClient = WebViewClient()</div>
                              <div>            loadUrl(&quot;{window.location.origin || 'https://ais-dev-jjcpnnapq3syh4e54vt4nw-768026660815.asia-southeast1.run.app'}&quot;)</div>
                              <div>            webView = this</div>
                              <div>          &#125;</div>
                              <div>        &#125;,</div>
                              <div>        modifier = Modifier.fillMaxSize()</div>
                              <div>      )</div>
                              <div>    &#125;</div>
                              <div>  &#125;</div>
                              <div>&#125;</div>
                            </div>
                            
                            <p className="text-xs text-starlight/45 leading-relaxed font-sans">
                              This architecture guarantees full CPU isolation, leverages Android's hardware WebView render capabilities (Chromium Core), and prevents viewport clipping.
                            </p>
                          </div>
                        )}

                        {androidApkTab === 'api' && (
                          <div className="space-y-4 font-sans">
                            <h5 className="font-bold text-sm text-starlight">API Contract for Remote Android Control Clients</h5>
                            <p className="text-xs text-starlight/70 leading-relaxed font-sans">
                              Our backend endpoints run standard REST JSON responses. Mobile apps can directly sync characters or fetch compiled council dialogues remotely:
                            </p>

                            <div className="space-y-3">
                              <div className="bg-[#050510] p-3 rounded-lg flex items-center justify-between">
                                <span className="font-mono text-xs text-emerald-400 font-bold">POST /api/generate-council-video</span>
                                <span className="text-[10px] font-mono text-starlight/40">Lip-Sync Trigger</span>
                              </div>
                              <div className="bg-[#050510] p-3 rounded-lg flex items-center justify-between">
                                <span className="font-mono text-xs text-emerald-400 font-bold">POST /api/generate-manifesto</span>
                                <span className="text-[10px] font-mono text-starlight/40">Dialogue Generation</span>
                              </div>
                              <div className="bg-[#050510] p-3 rounded-lg flex items-center justify-between">
                                <span className="font-mono text-xs text-blue-400 font-bold">GET /api/check-video-status</span>
                                <span className="text-[10px] font-mono text-starlight/40 text-right">Progress Telemetry</span>
                              </div>
                            </div>

                            <p className="text-xs text-starlight/60">
                              Authentication: Secure request headers include your <code className="text-amber-300 font-mono text-xs font-bold">Authorization: Bearer [KEY]</code> configurations mapped from the main system tab.
                            </p>
                          </div>
                        )}

                      </div>
                    </div>

                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Manifesto Modal */}
      <AnimatePresence>
        {selectedManifesto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-3xl p-4 md:p-12"
          >
            <div className="absolute inset-0 bg-nebula-deep opacity-10" />
            
            {/* Dynamic Background Flair */}
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2],
                rotate: [0, 90, 180, 270, 360]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full blur-[150px] ${currentCharTheme.glow}`}
            />

            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#050510]/80 backdrop-blur-xl border ${currentCharTheme.border} rounded-[40px] shadow-[0_0_100px_rgba(251,191,36,0.1)] overflow-hidden`}
            >
              {/* Scanline overlay for modal */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

              <div className={`p-10 border-b border-white/10 flex justify-between items-center bg-${currentCharTheme.accent}/5`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-${currentCharTheme.accent}/20 rounded-2xl`}>
                    <ScrollText className={`w-8 h-8 text-${currentCharTheme.accent}`} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-display font-bold tracking-tight">Philosophical <span className={currentCharTheme.color}>Manifesto</span></h3>
                    <p className="text-xs font-mono text-starlight/40 uppercase tracking-widest">{currentManifestoChar?.name} // {activeTheme}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedManifesto(null)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 font-serif text-lg leading-relaxed text-starlight/90 select-none scroll-hide">
                {currentManifestoChar?.lipSyncUrl && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`max-w-2xl mx-auto mb-12 aspect-video rounded-3xl overflow-hidden border ${currentCharTheme.border} shadow-[0_0_50px_rgba(168,85,247,0.15)] bg-black`}
                  >
                    <video 
                      src={currentManifestoChar?.lipSyncUrl} 
                      controls 
                      autoPlay 
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}
                <div className="max-w-2xl mx-auto">
                  {selectedManifesto.text.split('\n\n').map((para, i) => (
                    <TypewriterParagraph 
                      key={i}
                      text={para}
                      delay={i * 0.4}
                    />
                  ))}
                </div>
              </div>
              <div className="p-8 border-t border-white/10 bg-black/40 flex flex-wrap gap-4 justify-between items-center">
                <div className="flex flex-col gap-2">
                   <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full bg-${currentCharTheme.accent} animate-pulse`} />
                     <span className={`text-[10px] font-mono text-${currentCharTheme.accent} uppercase`}>Transmission Packet Ready</span>
                   </div>
                   {currentManifestoChar?.lipSyncUrl && (
                     <div className="flex items-center gap-2 text-purple-400">
                       <MonitorPlay className="w-3 h-3" />
                       <span className="text-[10px] font-mono uppercase">Neural Sync Active</span>
                     </div>
                   )}
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => generateLipSync(selectedManifesto.charId)}
                    disabled={generatingLipSyncs[selectedManifesto.charId] || !currentManifestoChar?.avatar}
                    className="px-6 py-3 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-purple-500 hover:text-black transition-all disabled:opacity-50"
                  >
                    <RefreshCcw className={`w-4 h-4 ${generatingLipSyncs[selectedManifesto.charId] ? 'animate-spin' : ''}`} />
                    {generatingLipSyncs[selectedManifesto.charId] ? 'SYNCING...' : 'SYNC WITH AVATAR'}
                  </button>
                  <button 
                    onClick={() => {
                      const blob = new Blob([selectedManifesto.text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Manifesto_${selectedManifesto.charId}.txt`;
                    a.click();
                  }}
                  className="px-6 py-3 bg-starlight text-black rounded-xl font-bold text-xs flex items-center gap-2 hover:scale-105 transition-all"
                >
                  <Download className="w-4 h-4" />
                  EXPORT TO TRANSMISSION LOGS
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Quota Health Diagnosis Modal */}
    <AnimatePresence>
      {isQuotaModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 md:p-6 text-left animate-fade-in"
        >
          <div className="absolute inset-0 bg-linear-to-b from-amber-500/5 via-transparent to-transparent opacity-30" />
          
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            className="relative w-full max-w-2xl bg-[#080815] border border-white/10 rounded-[28px] shadow-[0_0_80px_rgba(245,158,11,0.1)] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* SCANLINE / DIGITAL ACCENT */}
            <div className="h-[2px] w-full bg-linear-to-r from-transparent via-amber-500 to-transparent" />
            
            <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-amber-500/[0.02]">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-medium tracking-tight text-starlight">Neural Quota <span className="text-amber-400">Controls</span></h3>
                  <p className="text-[10px] font-mono text-starlight/40 uppercase tracking-wider">AI API HEALTH MONITORING & UPGRADE CENTRE</p>
                </div>
              </div>
              <button 
                onClick={() => setIsQuotaModalOpen(false)}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-starlight/70" />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto space-y-6">
              {/* STATE SUMMARY GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="block text-[10px] font-mono text-starlight/40 uppercase">HEALTH RATING</span>
                  <span className={`text-lg font-bold uppercase tracking-wide flex items-center gap-2 mt-1 ${
                    quotaStats.healthStatus === 'Critical' ? 'text-red-400' :
                    quotaStats.healthStatus === 'Warning' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      quotaStats.healthStatus === 'Critical' ? 'bg-red-500 animate-pulse' :
                      quotaStats.healthStatus === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    {quotaStats.healthStatus}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="block text-[10px] font-mono text-starlight/40 uppercase">REMAINING RATE</span>
                  <span className="text-lg font-bold font-mono tracking-tight text-starlight mt-1 block">
                    {quotaStats.estimatedCreditsRemaining}%
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="block text-[10px] font-mono text-starlight/40 uppercase">API KEY QUALITY</span>
                  <span className="text-lg font-bold text-amber-400 truncate tracking-tight mt-1 block">
                    {quotaStats.keyType}
                  </span>
                </div>
              </div>

              {/* METRICS / STATS BAR */}
              <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3.5">
                <h4 className="text-xs font-mono text-starlight/70 uppercase tracking-widest">TRANSMISSION DIAGNOSTICS</h4>
                <div className="grid grid-cols-4 gap-2 text-center border-t border-b border-white/5 py-4 my-2">
                  <div>
                    <span className="block text-[9px] font-mono text-starlight/45">TOTAL CALLS</span>
                    <span className="text-base font-bold text-starlight mt-0.5 block">{quotaStats.totalRequests}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono text-emerald-400/60">SUCCESSFUL</span>
                    <span className="text-base font-bold text-emerald-400 mt-0.5 block">{quotaStats.successRequests}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono text-red-400/60">GENERIC FAILS</span>
                    <span className="text-base font-bold text-red-400 mt-0.5 block">{quotaStats.failedRequests}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono text-amber-400/60">QUOTA EXCEEDED</span>
                    <span className="text-base font-bold text-amber-500 mt-0.5 block">{quotaStats.quotaErrors}</span>
                  </div>
                </div>
              </div>

              {/* STEPS TO COMPLETE RESOLUTION GUIDE */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-mono text-starlight/70 uppercase tracking-widest">HOW TO PERMANENTLY RESOLVE QUOTA CONSTRAINTS:</h4>
                
                <div className="space-y-3">
                  <div className="flex gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="h-6 w-6 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                    <div>
                      <h5 className="text-sm font-bold text-starlight">Enable Billing on AI Studio (Unthrottled Tier)</h5>
                      <p className="text-xs text-starlight/60 mt-0.5 leading-relaxed">
                        Image generation model <code className="text-amber-400 font-mono text-[10px]">gemini-3.1-flash-image-preview</code> is subject to sharp concurrency restrictions under free billing tiers. Link a credit card/billing account in Google AI Studio to increase limits immediately.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="h-6 w-6 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                    <div>
                      <h5 className="text-sm font-bold text-starlight">Verify Secrets Configuration</h5>
                      <p className="text-xs text-starlight/60 mt-0.5 leading-relaxed">
                        Click the <strong className="text-starlight">Settings &gt; Secrets</strong> menu at the top-right corner of Google AI Studio platform, then ensure your custom billing-linked API key is defined as <code className="text-amber-400 font-mono text-[10px]">GEMINI_API_KEY</code>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS footer */}
            <div className="p-6 md:p-8 border-t border-white/5 bg-black/40 flex flex-col md:flex-row gap-4 justify-between items-center mt-auto">
              <div className="text-left font-mono text-[10px] text-starlight/45 max-w-sm">
                <span>Upgrade tier updates might take a few moments to propagate across neural zones.</span>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => {
                    // Reset simulation 
                    setQuotaStats({
                      totalRequests: 8,
                      successRequests: 8,
                      failedRequests: 0,
                      quotaErrors: 0,
                      estimatedCreditsRemaining: 100.0,
                      keyType: 'Standard (Upgrade Tier)',
                      healthStatus: 'Excellent'
                    });
                    setNotification({ message: 'Simulation upgraded: Neural credential limits successfully cleared!', type: 'success' });
                  }}
                  className="flex-1 md:flex-initial px-5 py-3 border border-white/10 hover:border-white/20 text-starlight text-xs rounded-xl font-mono hover:bg-white/5 transition-all outline-none cursor-pointer"
                >
                  🚀 SIMULATE STANDARD UPGRADE
                </button>

                <button
                  onClick={() => {
                    setIsQuotaModalOpen(false);
                    setNotification({ message: 'Initializing Premium Rate Limit flow in AI Studio dashboard. Check your Settings > Secrets key links.', type: 'info' });
                  }}
                  className="flex-1 md:flex-initial px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black rounded-xl font-bold text-xs hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
                >
                  ACTIVATE PLATFORM UPGRADE
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
    </SelfHealingErrorBoundary>
  );
}
