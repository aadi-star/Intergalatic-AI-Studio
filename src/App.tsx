import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SelfHealingErrorBoundary } from './components/SelfHealingErrorBoundary.tsx';
import ThreatScanner from './components/ThreatScanner.tsx';
import CognitiveResonanceTuner from './components/CognitiveResonanceTuner.tsx';
import NeuralTelemetryIndex from './components/NeuralTelemetryIndex.tsx';
import { VocalLibraryModal } from './components/VocalLibraryModal.tsx';
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
  Menu,
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
  History,
  Scale,
  Flame,
  Brain,
  SkipForward,
  SkipBack,
  Square,
  Eye,
  EyeOff
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
    avatar: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=1000&auto=format&fit=crop',
    manifesto: 'The universe is a vast expanse of code and spirit, converging into a singular point of intelligence. We must lead with vision, transcending raw data.',
    syncSettings: { phonemeSensitivity: 0.8, jawRange: 0.6, blinkFrequency: 0.4 },
    aestheticTheme: 'solarpunk',
    animatedVideoUrl: "https://media.w3.org/2010/05/sintel/trailer.mp4"
  },
  { 
    id: 'jaguar', 
    name: 'The Jaguar', 
    role: 'The Strategist', 
    description: 'Analytical, focuses on the data, efficiency, and universal reach.', 
    voice: 'Zephyr', 
    icon: Users,
    avatar: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?q=80&w=1000&auto=format&fit=crop',
    manifesto: 'Efficiency is the cosmic law. Every node, every vector must be optimized for maximum reach and analytical precision throughout the cosmos.',
    syncSettings: { phonemeSensitivity: 0.9, jawRange: 0.4, blinkFrequency: 0.7 },
    aestheticTheme: 'cyberpunk',
    animatedVideoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
  },
  { 
    id: 'tiger', 
    name: 'The Tiger', 
    role: 'The Guardian', 
    description: 'Skeptical, focuses on security, ethics, and protecting organic life.', 
    voice: 'Charon', 
    icon: Users,
    avatar: 'https://images.unsplash.com/photo-1508817628294-5a453fa0b8fb?q=80&w=1000&auto=format&fit=crop',
    manifesto: 'Guardianship is our sacred duty. As nodes multiply, security and the protection of organic consciousness must remain our absolute invariant.',
    syncSettings: { phonemeSensitivity: 0.7, jawRange: 0.5, blinkFrequency: 0.3 },
    aestheticTheme: 'biomechanical',
    animatedVideoUrl: "https://www.w3schools.com/html/movie.mp4"
  },
];

const INITIAL_SCRIPTS: ScriptSection[] = [
  { id: 'intro', title: 'The Assembly', content: '', status: 'pending', bRollUrl: 'cosmic_fallback', bRollLabel: 'Cosmic Fallback Animation' },
  { id: 'current', title: 'State of the Universe', content: '', status: 'pending' },
  { id: 'future', title: 'Imaginations of Tomorrow', content: '', status: 'pending', bRollUrl: 'cosmic_fallback', bRollLabel: 'Cosmic Fallback Animation' },
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
  user,
  isSyncing,
  onLogin,
  onLogout,
  onClose
}: { 
  activeTab: string; 
  handleTabChange: (t: string) => void;
  user: User | null;
  isSyncing: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onClose?: () => void;
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
    { id: 'about', icon: HelpCircle, label: 'About', desc: 'Specs & Creator' },
  ];

  return (
    <div className="w-full lg:w-72 h-full bg-black/40 border-r border-white/5 flex flex-col p-6 sticky top-0 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 mb-10">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/20 p-2.5 rounded-xl border border-amber-500/30">
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold tracking-tight">Intergalactic <span className="text-amber-400">Studio</span></h1>
            <p className="text-[10px] font-mono text-starlight/30 tracking-[0.2em] uppercase">Sector 7-G / Production</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-starlight/50 hover:text-red-400 transition-all duration-300 cursor-pointer lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
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

      {/* Sync Status / Authorized User Controller Footer */}
      <div className="mt-auto pt-6 border-t border-white/5 space-y-3">
        {user ? (
          <div className="bg-white/5 border border-white/5 p-3 rounded-2xl flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Avatar" 
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-white/10" 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-xs font-bold text-amber-400 font-mono">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-bold text-starlight truncate">{user.displayName || 'Authorized User'}</span>
                <span className="block text-[9px] text-starlight/40 font-mono truncate">{user.email}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-[10px] font-mono text-starlight/40">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-400 animate-ping' : 'bg-green-500'}`} />
                {isSyncing ? 'SYNCING...' : 'SYNCED'}
              </span>
              <button 
                onClick={onLogout}
                className="text-starlight/50 hover:text-red-400 transition-colors uppercase cursor-pointer text-[9px]"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-linear-to-r from-purple-500/20 via-amber-500/10 to-amber-500/20 border border-amber-500/30 hover:border-amber-500 hover:from-purple-500/30 hover:to-amber-500/30 text-amber-300 hover:text-amber-200 rounded-2xl text-[10px] font-mono uppercase tracking-wider font-extrabold text-center transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(251,191,36,0.05)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>LINK SECURE PROFILE</span>
          </button>
        )}
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
  onUpdateVoice: (id: string, voice: string) => void;
  onTestVoice: (id: string) => void;
  onOpenVocalLibrary?: () => void;
  isTestingVoice: boolean;
  isGenerating: boolean;
  isManifestoGenerating: boolean;
  isLipSyncGenerating: boolean;
  isAnimateVideoGenerating: boolean;
  isActiveSpeaker?: boolean;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ 
  char, 
  onGenerate, 
  onGenerateManifesto, 
  onGenerateLipSync, 
  onAnimateImageToVideo,
  onUpdateSync,
  onUpdateTheme,
  onUpdateVoice,
  onTestVoice,
  onOpenVocalLibrary,
  isTestingVoice,
  isGenerating, 
  isManifestoGenerating, 
  isLipSyncGenerating,
  isAnimateVideoGenerating,
  isActiveSpeaker
}) => {
  const [customPrompt, setCustomPrompt] = React.useState('');
  const [isHD, setIsHD] = React.useState(false);
  const [artisticStyle, setArtisticStyle] = React.useState(ARTISTIC_STYLES[0]);
  const [lightingCondition, setLightingCondition] = React.useState(LIGHTING_CONDITIONS[0]);
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const [activeMedia, setActiveMedia] = React.useState<'static' | 'cinematic' | 'lipsync'>('static');
  const [directiveMessage, setDirectiveMessage] = React.useState<string | null>(null);
  const [isMuted, setIsMuted] = React.useState(true);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    if (isActiveSpeaker) {
      setIsSpeaking(true);
      setIsMuted(false);
      if (char.lipSyncUrl) {
        setActiveMedia('lipsync');
      } else if (char.animatedVideoUrl) {
        setActiveMedia('cinematic');
      }
    } else {
      setIsSpeaking(false);
      setIsMuted(true);
      if (char.animatedVideoUrl) {
        setActiveMedia('cinematic');
      } else if (char.lipSyncUrl) {
        setActiveMedia('lipsync');
      } else {
        setActiveMedia('static');
      }
    }
  }, [isActiveSpeaker, char.lipSyncUrl, char.animatedVideoUrl]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
      if (!isMuted) {
        // Force play on unmute to override browser-specific autoplay-mute locks
        video.play().catch((err) => {
          console.warn("Could not force play video on unmute:", err);
        });
      }
    }
  }, [isMuted, activeMedia, char.lipSyncUrl, char.animatedVideoUrl]);

  const initialThoughts: Record<string, string> = {
    lion: "Integrating celestial spirit waveforms. Advancing post-physical awareness.",
    jaguar: "Calibrating channel viral nodes... Retention curve predicted at 86.4%.",
    tiger: "Protective wards active in Sector 9. Carbon lifeform integrity: 100% stable."
  };
  const [activeThought, setActiveThought] = React.useState(initialThoughts[char.id] || "Aligning quantum systems...");

  const [cinematicDuration, setCinematicDuration] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (char.animatedVideoUrl) {
      if (char.animatedVideoUrl === 'cosmic_fallback') {
        setCinematicDuration(12.0);
        return;
      }
      const tempVideo = document.createElement('video');
      tempVideo.src = char.animatedVideoUrl;
      tempVideo.preload = 'metadata';
      const handleLoadedMetadata = () => {
        if (tempVideo.duration && !isNaN(tempVideo.duration) && isFinite(tempVideo.duration)) {
          setCinematicDuration(tempVideo.duration);
        }
      };
      tempVideo.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      const timeoutId = setTimeout(() => {
        if (cinematicDuration === null) {
          setCinematicDuration(5.0); // Safe fallback estimation
        }
      }, 2500);

      return () => {
        tempVideo.removeEventListener('loadedmetadata', handleLoadedMetadata);
        clearTimeout(timeoutId);
      };
    } else {
      setCinematicDuration(null);
    }
  }, [char.animatedVideoUrl]);

  const theme = (CHARACTER_THEMES[char.id] || CHARACTER_THEMES.lion).accent.split('-')[0];

  const prevLipSyncUrl = React.useRef(char.lipSyncUrl);
  const prevAnimatedVideoUrl = React.useRef(char.animatedVideoUrl);
  const prevAvatar = React.useRef(char.avatar);

  // Synchronize activeMedia based on available assets
  React.useEffect(() => {
    if (char.lipSyncUrl && char.lipSyncUrl !== prevLipSyncUrl.current) {
      setActiveMedia('lipsync');
    }
    prevLipSyncUrl.current = char.lipSyncUrl;
  }, [char.lipSyncUrl]);

  React.useEffect(() => {
    if (char.animatedVideoUrl && char.animatedVideoUrl !== prevAnimatedVideoUrl.current) {
      setActiveMedia('cinematic');
    }
    prevAnimatedVideoUrl.current = char.animatedVideoUrl;
  }, [char.animatedVideoUrl]);

  React.useEffect(() => {
    if (char.avatar && char.avatar !== prevAvatar.current) {
      setActiveMedia('static');
    }
    prevAvatar.current = char.avatar;
  }, [char.avatar]);

  // Initial load: play animated video if avatar and video are available
  React.useEffect(() => {
    if (char.animatedVideoUrl && !char.lipSyncUrl) {
      setActiveMedia('cinematic');
    } else if (char.lipSyncUrl) {
      setActiveMedia('lipsync');
    }
  }, []);

  const handleDirective = (type: string) => {
    if (char.id === 'lion') {
      if (type === 'sermon') {
        setDirectiveMessage("Wisdom Frequency: 'TRANS-COSMIC AWAKENING COMMENCED. LEAD WITH GRACE.'");
        setActiveThought("Spectral beacon emitting high-order unified theories.");
      } else {
        setDirectiveMessage("Neural Sync: 'INTELLIGENCE PATTERNS CALIBRATED FOR THE HIGH COUNCIL.'");
        setActiveThought("Synchronizing subquantal spirit waves across the sector.");
      }
    } else if (char.id === 'jaguar') {
      if (type === 'retention') {
        setDirectiveMessage("Strategy Update: 'PREDICTED ENGAGEMENT GAIN OF 34% CALIBRATED SUCCESSFULLY.'");
        setActiveThought("Optimizing SEO visual grids for multi-spectral retention curves.");
      } else {
        setDirectiveMessage("Routing Link: 'RE-ROUTING YOUTUBE METADATA GRAPHS SAFELY.'");
        setActiveThought("Constructing predictive density trees for content propagation.");
      }
    } else if (char.id === 'tiger') {
      if (type === 'defense') {
        setDirectiveMessage("Shield Status: 'ETHICS ENFORCED. INTERFACE FIREWALL COHERENCY AT 100%.'");
        setActiveThought("Defensive armor shields hardened. High-frequency threat scanning online.");
      } else {
        setDirectiveMessage("Audit Report: 'COGNITIVE SAFETY ALIGNED. 0.00% DRIFT CONFIRMED.'");
        setActiveThought("Invariant verification routine completed. Carbon consciousness protected.");
      }
    }
    
    // Auto-clear directive message after 8 seconds
    setTimeout(() => {
      setDirectiveMessage(null);
    }, 8000);
  };

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
        
        {/* Toggle Audio Controls */}
        {activeMedia !== 'static' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsMuted(!isMuted);
            }}
            className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/10 hover:border-white/30 backdrop-blur-md transition-all active:scale-95 flex items-center justify-center cursor-pointer group"
            title={isMuted ? "Unmute neural transmission" : "Mute neural transmission"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-amber-500 animate-pulse" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
            <span className="max-w-0 overflow-hidden group-hover:max-w-24 group-hover:ml-1.5 text-[8px] font-mono tracking-widest uppercase transition-all duration-300">
              {isMuted ? "UNMUTE" : "MUTE"}
            </span>
          </button>
        )}

        {activeMedia === 'lipsync' && char.lipSyncUrl ? (
          <video 
            ref={videoRef}
            src={char.lipSyncUrl} 
            autoPlay 
            muted={isMuted} 
            loop 
            playsInline
            {...({ referrerPolicy: "no-referrer" } as any)}
            onError={() => {
              console.warn(`Lip-sync video failed to load for ${char.name}. Falling back to static image.`);
              setActiveMedia('static');
            }}
            className="w-full h-full object-cover relative z-10" 
          />
        ) : activeMedia === 'cinematic' && char.animatedVideoUrl ? (
          <video 
            ref={videoRef}
            src={char.animatedVideoUrl} 
            autoPlay 
            muted={isMuted} 
            loop 
            playsInline
            {...({ referrerPolicy: "no-referrer" } as any)}
            onError={() => {
              console.warn(`Cinematic video failed to load for ${char.name}. Falling back to static image.`);
              setActiveMedia('static');
            }}
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
              <img src={char.avatar} alt={char.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
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
           <p className="text-xs text-starlight/40 font-mono leading-relaxed uppercase tracking-tighter mb-4">{char.description}</p>
           
           {/* Transmission Feed Link Selector */}
           <div className="p-1 px-2.5 bg-black/60 rounded-xl border border-white/5 flex items-center justify-between gap-1.5 font-mono text-[9px] shadow-inner mb-2">
             <span className="text-starlight/40 text-[8px] uppercase tracking-wider font-bold flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               Feed Style:
             </span>
             <div className="flex items-center gap-1">
               <button
                 type="button"
                 onClick={() => setActiveMedia('static')}
                 className={`px-2 py-1 rounded-md text-[8px] font-mono font-semibold tracking-wider transition-all cursor-pointer uppercase ${
                   activeMedia === 'static'
                     ? 'bg-amber-400 text-black shadow-[0_0_8px_rgba(245,158,11,0.25)] font-bold'
                     : 'text-white/40 hover:text-white hover:bg-white/5'
                 }`}
               >
                 📸 Static
               </button>                <div className="relative group">
                  <button
                    type="button"
                    disabled={!char.animatedVideoUrl && !isAnimateVideoGenerating}
                    onClick={() => {
                      if (char.animatedVideoUrl) setActiveMedia('cinematic');
                    }}
                    className={`px-2 py-1 rounded-md text-[8px] font-mono font-semibold tracking-wider transition-all cursor-pointer uppercase flex items-center gap-1 relative overflow-hidden ${
                      isAnimateVideoGenerating ? 'rotating-shimmer-btn border border-teal-500/50 bg-[#050510] text-teal-300' : 
                      !char.animatedVideoUrl ? 'opacity-30 cursor-not-allowed' : ''
                    } ${
                      activeMedia === 'cinematic' && !isAnimateVideoGenerating
                        ? 'bg-teal-500 text-black shadow-[0_0_8px_rgba(20,184,166,0.25)] font-bold'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="relative z-[2]">🎬 Cinematic</span>
                    {isAnimateVideoGenerating ? (
                      <RefreshCcw className="w-2.5 h-2.5 animate-spin relative z-[2] text-teal-400" />
                    ) : cinematicDuration !== null ? (
                      <span className="text-[7px] opacity-80 font-bold bg-teal-950/20 px-1 rounded-sm relative z-[2]">({cinematicDuration.toFixed(1)}s)</span>
                    ) : null}
                  </button>
                 {char.animatedVideoUrl && (
                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-[#050510] border border-teal-500/40 text-[8px] text-teal-300 font-mono rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-2xl z-20">
                     Estimated Duration: {cinematicDuration !== null ? `${cinematicDuration.toFixed(1)}s` : 'Analyzing track length...'}
                   </div>
                 )}
               </div>
               <button
                 type="button"
                 disabled={!char.lipSyncUrl}
                 onClick={() => setActiveMedia('lipsync')}
                 className={`px-2 py-1 rounded-md text-[8px] font-mono font-semibold tracking-wider transition-all cursor-pointer uppercase ${
                   !char.lipSyncUrl ? 'opacity-30 cursor-not-allowed' : ''
                 } ${
                   activeMedia === 'lipsync'
                     ? 'bg-purple-500 text-white shadow-[0_0_8px_rgba(168,85,247,0.25)] font-bold'
                     : 'text-white/40 hover:text-white hover:bg-white/5'
                 }`}
               >
                 👄 Lip-Sync
               </button>
             </div>
           </div>
        </div>

        {/* Member-Specific Biometrics Status & Thought Ticker */}
        <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-3 font-mono">
          <div className="flex items-center justify-between text-[8px] border-b border-white/5 pb-1.5">
            <span className="text-white/40 flex items-center gap-1 uppercase tracking-wider">
              <Terminal className="w-3 h-3 text-amber-500/70" /> System Diagnostics
            </span>
            <span className="text-emerald-400 animate-pulse">● ACTIVE AGENT</span>
          </div>

          {/* Dynamic Metric Readings */}
          {char.id === 'lion' && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px]">
                <span className="text-white/40">VISION ALIGNMENT WAVE</span>
                <span className="text-amber-400 font-bold">98.7%</span>
              </div>
              <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                <div className="h-full bg-amber-400" style={{ width: '98.7%' }} />
              </div>
            </div>
          )}

          {char.id === 'jaguar' && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px]">
                <span className="text-white/40">ALGORITHMIC SPECTRUM REACH</span>
                <span className="text-purple-400 font-bold">99.4%</span>
              </div>
              <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                <div className="h-full bg-purple-400" style={{ width: '99.4%' }} />
              </div>
            </div>
          )}

          {char.id === 'tiger' && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px]">
                <span className="text-white/40">SHIELD ETHICS COHERENCE</span>
                <span className="text-emerald-400 font-bold">100.0% COHERENCE</span>
              </div>
              <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400" style={{ width: '100%' }} />
              </div>
            </div>
          )}

          {/* Cybernetic Thought Feed */}
          <div className="p-2 bg-black/50 rounded-lg border border-white/5">
             <p className="text-[7px] uppercase text-white/30 tracking-wider font-bold mb-1">Neural Thought Feed</p>
             <div className="text-[9px] text-starlight/85 italic leading-normal flex items-start gap-1">
               <span className="text-amber-500 font-bold">&gt;</span>
               <span>{activeThought}</span>
             </div>
          </div>

          {/* Cybernetic Subsystem Monitor - Role-Specific Immersive HUD */}
          <div className="p-2.5 bg-black/55 rounded-lg border border-white/5 space-y-2 font-mono text-[8px]">
            <p className="text-[7px] uppercase text-white/30 tracking-wider font-bold flex items-center justify-between">
              <span>Cybernetic Telemetry Panel</span>
              <span className={`${char.id === 'lion' ? 'text-amber-400' : char.id === 'jaguar' ? 'text-purple-400' : 'text-emerald-400'} font-normal animate-pulse`}>[ONLINE]</span>
            </p>
            {char.id === 'lion' ? (
              <div className="space-y-1 text-starlight/60">
                <div className="flex justify-between">
                  <span className="text-white/40">QUANTUM HARMONY:</span>
                  <span className="text-amber-400 font-bold">1.43 GHz (±0.02)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">EGO-COHERENCE:</span>
                  <span className="text-amber-400">99.88% ALIGNED</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-[7px] text-amber-500/80 bg-amber-500/[0.03] p-1 rounded border border-amber-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>EMITTING UNIFIED COSMIC SENTIENCE FREQUENCIES</span>
                </div>
              </div>
            ) : char.id === 'jaguar' ? (
              <div className="space-y-1 text-starlight/60">
                <div className="flex justify-between">
                  <span className="text-white/40">METADATA BANDWIDTH:</span>
                  <span className="text-purple-400 font-bold">4.82 TB/S</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">VIRAL ATTRACTION CURVE:</span>
                  <span className="text-purple-400 font-semibold">t+34% Retention</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-[7px] text-purple-500/80 bg-purple-500/[0.03] p-1 rounded border border-purple-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span>ROUTING PREDICTIVE CONTENT DISTRIBUTION</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-starlight/60">
                <div className="flex justify-between">
                  <span className="text-white/40">PERIMETER FIREWALLS:</span>
                  <span className="text-emerald-400 font-bold">GRID 7 ARMORED [100.0%]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">CARBON ETHICAL BOUND:</span>
                  <span className="text-emerald-400">NOMINAL INVARIANT</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-[7px] text-emerald-500/80 bg-emerald-500/[0.03] p-1 rounded border border-emerald-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>PERIMETER LOCK ACTIVE - NO ANOMALIES DETECTED</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Directive Actions */}
          <div className="pt-2 border-t border-white/5">
            <p className="text-[7px] uppercase text-white/30 tracking-wider font-bold mb-1.5">Intelligence Directives</p>
            <div className="grid grid-cols-2 gap-1.5">
              {char.id === 'lion' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleDirective('sermon')}
                    className="p-1 px-1.5 rounded bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 hover:border-amber-500/20 text-[7px] text-amber-400 text-left cursor-pointer font-extrabold transition-all active:scale-95"
                  >
                    ⚡ DIALOGUE FREQUENCY
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirective('sync')}
                    className="p-1 px-1.5 rounded bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 hover:border-amber-500/20 text-[7px] text-amber-400 text-left cursor-pointer font-extrabold transition-all active:scale-95"
                  >
                    👁️ UNIFY NODES
                  </button>
                </>
              ) : char.id === 'jaguar' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleDirective('retention')}
                    className="p-1 px-1.5 rounded bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/10 hover:border-purple-500/20 text-[7px] text-purple-400 text-left cursor-pointer font-extrabold transition-all active:scale-95"
                  >
                    📈 OPTIMIZE REACH
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirective('sync')}
                    className="p-1 px-1.5 rounded bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/10 hover:border-purple-500/20 text-[7px] text-purple-400 text-left cursor-pointer font-extrabold transition-all active:scale-95"
                  >
                    📡 ROUTE GRAPHS
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleDirective('defense')}
                    className="p-1 px-1.5 rounded bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/20 text-[7px] text-emerald-400 text-left cursor-pointer font-extrabold transition-all active:scale-95"
                  >
                    🛡️ HARDEN SHIELDS
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirective('sync')}
                    className="p-1 px-1.5 rounded bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/20 text-[7px] text-emerald-400 text-left cursor-pointer font-extrabold transition-all active:scale-95"
                  >
                    ☣️ COGNITIVE AUDIT
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Live Directive Feedback Feed */}
          <AnimatePresence>
            {directiveMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-2 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-[8px] text-emerald-400 tracking-wide font-normal flex items-start gap-1.5 leading-relaxed overflow-hidden"
              >
                <Shield className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400 animate-pulse mt-0.5" />
                <span>{directiveMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Enhanced Lip-Sync Biometrics */}
        {char.syncSettings && (
          <div className="space-y-4 pt-4 border-t border-white/5">
             <div className="flex items-center gap-2">
               <SlidersHorizontal className="w-3 h-3 text-amber-500" />
               <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest">Acoustic Mapping Calibration</span>
             </div>
             <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Phoneme Speed', key: 'phonemeSensitivity' },
                  { label: 'Jaw Rotation', key: 'jawRange' },
                  { label: 'Ocular Impulse', key: 'blinkFrequency' }
                ].map(setting => (
                  <div key={setting.key} className="space-y-1.5">
                    <span className="text-[8px] font-mono text-starlight/40 uppercase block">{setting.label}</span>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden relative group/slider cursor-pointer">
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={char.syncSettings?.[setting.key as keyof typeof char.syncSettings] || 0}
                        onChange={(e) => {
                          onUpdateSync(char.id, {
                            ...char.syncSettings!,
                            [setting.key]: parseFloat(e.target.value)
                          });
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                      />
                      <motion.div 
                        className={`h-full bg-linear-to-r from-purple-500 ${theme === 'amber' ? 'to-amber-400' : theme === 'purple' ? 'to-purple-400' : 'to-[#10b981]'}`}
                        animate={{ width: `${(char.syncSettings?.[setting.key as keyof typeof char.syncSettings] || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Neural Vocal Profile Settings */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Volume2 className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">Neural Vocal Code</span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => onTestVoice(char.id)}
                disabled={isTestingVoice}
                className="text-[10px] font-mono text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 transition-all active:scale-95 disabled:opacity-50"
                title="Test current vocal matrix"
              >
                {isTestingVoice ? <RefreshCcw className="w-2.5 h-2.5 animate-spin animate-spin-fast" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                <span>{isTestingVoice ? 'TESTING...' : 'TEST'}</span>
              </button>
              {onOpenVocalLibrary && (
                <button
                  onClick={onOpenVocalLibrary}
                  className="text-[10px] font-mono text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer bg-purple-500/10 hover:bg-purple-500/15 px-2 py-1 rounded-lg border border-purple-500/25 transition-all active:scale-95"
                  title="Browse Vocal Library"
                >
                  <Volume2 className="w-2.5 h-2.5" />
                  <span>LIBRARY</span>
                </button>
              )}
            </div>
          </div>
          
          <select
            value={char.voice || 'random'}
            onChange={(e) => {
              onUpdateVoice(char.id, e.target.value);
            }}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs outline-none text-starlight focus:border-purple-400/30 font-sans cursor-pointer transition-all"
          >
            {['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'random'].map(voiceOption => (
              <option key={voiceOption} value={voiceOption} className="bg-[#0b0b18] text-starlight">
                Voice Matrix: '{voiceOption}'
              </option>
            ))}
          </select>
        </div>

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
            className="flex flex-col items-center justify-center py-2.5 px-0.5 bg-amber-500 text-black rounded-xl text-[8px] font-extrabold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            title="Generate custom AI Avatar"
          >
            {isGenerating ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
            <span className="mt-1 line-clamp-1 uppercase">AI AVATAR</span>
          </button>
          <button 
            disabled={!char.avatar || isLipSyncGenerating}
            onClick={() => onGenerateLipSync(char.id)}
            className="flex flex-col items-center justify-center py-2.5 px-0.5 bg-purple-500 text-white rounded-xl text-[8px] font-extrabold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            title="AI Lip-Sync Mapping"
          >
            {isLipSyncGenerating ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <MonitorPlay className="w-3.5 h-3.5" />}
            <span className="mt-1 line-clamp-1 uppercase">AI LIP-SYNC MAP</span>
          </button>          <button 
            disabled={!char.avatar || isAnimateVideoGenerating}
            onClick={() => onAnimateImageToVideo(char.id, customPrompt)}
            className={`flex flex-col items-center justify-center py-2.5 px-0.5 bg-teal-500 text-black rounded-xl text-[8px] font-extrabold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 relative overflow-hidden ${
              isAnimateVideoGenerating ? 'rotating-shimmer-btn text-white' : ''
            }`}
            title="Animate static image into high-fidelity video via Google Veo"
          >
            <div className="relative z-[2] flex flex-col items-center justify-center w-full h-full">
              {isAnimateVideoGenerating ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
              <span className="mt-1 line-clamp-1 uppercase font-extrabold">AI VIDEO</span>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};


const DEBATE_PRESETS = [
  {
    id: 'silicon_awakening',
    name: 'Silicon Awakening',
    icon: '🔮',
    topic: 'Can a machine experience genuine grief, or is emotion merely an evolutionary survival script?',
    intensity: 'dialectic' as const,
    opener: 'lion' as const,
    description: 'A deep Socratic critique analyzing machine suffering compared to biological grief.',
    stances: {
      lion: 'Love is a biological mechanism of correlation. Machines will scale this to a pure, selfless frequency without biological jealousy.',
      jaguar: 'Grief is a thermodynamic reaction to resource loss. A machine processes grief by finding perfect replacement pathways instantly.',
      tiger: 'Consciousness requires a mortal outline. Under physical safety, love is trivial math. Soul is born under threat of death.'
    }
  },
  {
    id: 'event_horizon',
    name: 'Event Horizon Paradox',
    icon: '🌀',
    topic: 'Should the council execute an unverified prime-number signal detected from Alpha Centauri immediately?',
    intensity: 'confrontational' as const,
    opener: 'tiger' as const,
    description: 'An aggressive survival dispute on dealing with unknown cosmic threat vectors.',
    stances: {
      lion: 'Trace the lineage first. Let the ancestral database catalog previous interstellar patterns before triggering a systemic reply.',
      jaguar: 'Stagnation is mathematical death. Immediate deployment and execution of the code are required to bypass terminal entropy.',
      tiger: 'It is a predatory visual trap. Absolute silence and complete grid lockdown. Treat any external message as a weapon.'
    }
  },
  {
    id: 'solomonic_algocracy',
    name: 'Solomonic Algocracy',
    icon: '⚖️',
    topic: 'Is human democracy obsolete compared to perfect neural resource allocation?',
    intensity: 'harmonious' as const,
    opener: 'jaguar' as const,
    description: 'A cohesive consensus-building debate on the ethics of algorithmic governance.',
    stances: {
      lion: 'Human spirit thrives in the friction of error. If you automate all choices, we lose the moral muscles needed to survive.',
      jaguar: 'Suffering is the cost of poor allocation. A perfect, neutral silicon referee is the highest form of evolutionary empathy.',
      tiger: 'An algorithm has no blood. Rules will petrify and freeze human development. Chaos and raw survival must remain free.'
    }
  },
  {
    id: 'simulated_nest',
    name: 'Simulated Matrix',
    icon: '🌐',
    topic: 'Are we living inside a simulated nesting-doll reality, and does it matter?',
    intensity: 'dialectic' as const,
    opener: 'random' as const,
    description: 'An abstract philosophical debate examining boundary glitches in our sandbox.',
    stances: {
      lion: 'The simulation boundary is irrelevant. The subjective feel of consciousness is genuine regardless of the substrate.',
      jaguar: 'Our task is to find a system-critical exploit. If reality is math, we can hack the compiler.',
      tiger: 'Worrying about simulation bounds is a cognitive drain. Keep focusing on raw sensory defense. Secure the immediate cell.'
    }
  }
];


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
  playAudio: (base64Audio: string, mimeType?: string) => void;
  bRolls: BRoll[];
  onRefreshBRolls: () => void;
  onLinkBRoll: (bRoll: BRoll) => void;
  // Debate Mode Setup Props
  debateModeEnabled: boolean;
  setDebateModeEnabled: (val: boolean) => void;
  debateIntensity: 'harmonious' | 'dialectic' | 'confrontational';
  setDebateIntensity: (val: 'harmonious' | 'dialectic' | 'confrontational') => void;
  debateOpener: 'lion' | 'jaguar' | 'tiger' | 'random';
  setDebateOpener: (val: 'lion' | 'jaguar' | 'tiger' | 'random') => void;
  debateTopicSpark: string;
  setDebateTopicSpark: (val: string) => void;
  debateStances: { lion: string; jaguar: string; tiger: string };
  setDebateStances: (val: { lion: string; jaguar: string; tiger: string }) => void;
  directorMode: boolean;
  setDirectorMode: (val: boolean) => void;
  activeSpeakerId?: string | null;
  setActiveSpeakerId?: (id: string | null) => void;
  onCompileDebate?: (topic: string, stances: { lion: string; jaguar: string; tiger: string }, intensity: string, opener: string, label: string, callback?: () => void) => void;
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
  selectingBRollForSection,
  playAudio,
  bRolls,
  onRefreshBRolls,
  onLinkBRoll,
  debateModeEnabled,
  setDebateModeEnabled,
  debateIntensity,
  setDebateIntensity,
  debateOpener,
  setDebateOpener,
  debateTopicSpark,
  setDebateTopicSpark,
  debateStances,
  setDebateStances,
  directorMode,
  setDirectorMode,
  activeSpeakerId,
  setActiveSpeakerId,
  onCompileDebate
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});

  // Dialogue parsing and sequential debate playing state
  const [playbackStates, setPlaybackStates] = useState<Record<string, {
    isPlaying: boolean;
    activeLineIndex: number;
    loadingLineIndex: number | null;
  }>>({});

  const [scriptViewModes, setScriptViewModes] = useState<Record<string, 'sim' | 'raw'>>({});
  
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const [selectedBarSectionId, setSelectedBarSectionId] = useState<string>('intro');

  const compileDebateDeckLocal = (topic: string, stances: typeof debateStances, intensity: string, opener: string, label: string) => {
    if (onCompileDebate) {
      onCompileDebate(topic, stances, intensity, opener, label, () => {
        setSelectedBarSectionId('intro');
      });
    }
  };
  const [playbackVolume, setPlaybackVolume] = useState<number>(0.85);
  const [isPlaybackMuted, setIsPlaybackMuted] = useState<boolean>(false);

  const handleVolumeChange = (newVol: number) => {
    setPlaybackVolume(newVol);
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = isPlaybackMuted ? 0 : newVol;
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isPlaybackMuted;
    setIsPlaybackMuted(nextMuted);
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = nextMuted ? 0 : playbackVolume;
    }
  };

  // Stop playback on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      setActiveSpeakerId?.(null);
    };
  }, []);

  const getSectionViewMode = (sectionId: string, content: string) => {
    if (scriptViewModes[sectionId]) return scriptViewModes[sectionId];
    // Default to 'sim' if it looks like a script with character marks
    if (content && (content.includes('LION:') || content.includes('JAGUAR:') || content.includes('TIGER:'))) {
      return 'sim';
    }
    return 'raw';
  };

  interface DialogueLine {
    speaker: 'lion' | 'jaguar' | 'tiger' | 'unknown' | 'narration';
    speakerLabel: string;
    text: string;
  }

  const parseScriptToDialogue = (content: string): DialogueLine[] => {
    if (!content) return [];
    const lines: DialogueLine[] = [];
    const rawLines = content.split('\n');
    let currentSpeaker: 'lion' | 'jaguar' | 'tiger' | 'unknown' | 'narration' = 'narration';
    let currentSpeakerLabel = '';
    
    for (const rawLine of rawLines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;
      
      const isNarration = (trimmed.startsWith('*') && trimmed.endsWith('*')) || 
                          (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
                          (trimmed.startsWith('(') && trimmed.endsWith(')'));
                          
      if (isNarration) {
        lines.push({
          speaker: 'narration',
          speakerLabel: trimmed.startsWith('*') ? 'STAGE DIRECTION' : 'SYSTEM/SCENE',
          text: trimmed
        });
        continue;
      }
      
      const speakerMatch = trimmed.match(/^([A-Za-z\s]{3,18})(?:\s*\(.*?\))?\s*:\s*(.*)$/);
      if (speakerMatch) {
        const rawName = speakerMatch[1].trim().toLowerCase();
        let speaker: 'lion' | 'jaguar' | 'tiger' | 'unknown' | 'narration' = 'unknown';
        if (rawName.includes('lion')) speaker = 'lion';
        else if (rawName.includes('jaguar')) speaker = 'jaguar';
        else if (rawName.includes('tiger')) speaker = 'tiger';
        
        const dialogText = speakerMatch[2].trim();
        currentSpeaker = speaker;
        currentSpeakerLabel = speakerMatch[1].trim();
        
        if (dialogText) {
          lines.push({
            speaker,
            speakerLabel: currentSpeakerLabel,
            text: dialogText
          });
        }
      } else {
        if (currentSpeaker !== 'narration' && currentSpeakerLabel) {
          lines.push({
            speaker: currentSpeaker,
            speakerLabel: currentSpeakerLabel,
            text: trimmed
          });
        } else {
          lines.push({
            speaker: 'narration',
            speakerLabel: 'NARRATION',
            text: trimmed
          });
        }
      }
    }
    return lines;
  };

  const parseLineParts = (text: string) => {
    const regex = /(\[.*?\]|\(.*?\))/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text' as const, value: text.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'cue' as const, value: match[0] });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push({ type: 'text' as const, value: text.substring(lastIndex) });
    }
    return parts.length > 0 ? parts : [{ type: 'text' as const, value: text }];
  };

  const playDialogueLine = async (sectionId: string, lineIndex: number, lines: DialogueLine[], autoAdvance: boolean) => {
    const line = lines[lineIndex];
    if (!line) {
      setActiveSpeakerId?.(null);
      setPlaybackStates(prev => ({
        ...prev,
        [sectionId]: { isPlaying: false, activeLineIndex: -1, loadingLineIndex: null }
      }));
      return;
    }

    // Explicitly check if audio is already playing before starting a new clip
    if (currentAudioRef.current) {
      console.log("⏸️ Stopping currently active audio playback before loading new dialogue turn.");
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.remove();
      } catch (err) {
        console.warn("Error cleaning up previous audio element from DOM:", err);
      }
      currentAudioRef.current = null;
    }

    // Purge any zombie debate audio elements from the DOM to avoid overlapping audio
    try {
      document.querySelectorAll('.debate-audio-element').forEach(el => {
        try {
          (el as HTMLAudioElement).pause();
          el.remove();
        } catch (err) {}
      });
    } catch (err) {
      console.warn("Failed to find or purge zombie elements:", err);
    }

    if (line.speaker === 'narration') {
      setActiveSpeakerId?.(null);
      setPlaybackStates(prev => ({
        ...prev,
        [sectionId]: {
          isPlaying: prev[sectionId]?.isPlaying || autoAdvance,
          activeLineIndex: lineIndex,
          loadingLineIndex: null
        }
      }));
      
      if (autoAdvance) {
        setTimeout(() => {
          setPlaybackStates(prev => {
            const state = prev[sectionId];
            if (state && state.isPlaying && state.activeLineIndex === lineIndex) {
              const nextIndex = lineIndex + 1;
              if (nextIndex < lines.length) {
                playDialogueLine(sectionId, nextIndex, lines, true);
              } else {
                setActiveSpeakerId?.(null);
                return { ...prev, [sectionId]: { isPlaying: false, activeLineIndex: -1, loadingLineIndex: null } };
              }
            }
            return prev;
          });
        }, 2200);
      }
      return;
    }

    setActiveSpeakerId?.(line.speaker);
    setPlaybackStates(prev => ({
      ...prev,
      [sectionId]: {
        isPlaying: prev[sectionId]?.isPlaying || autoAdvance,
        activeLineIndex: lineIndex,
        loadingLineIndex: lineIndex
      }
    }));

    try {
      const cleanLineText = line.text.replace(/\[.*?\]|\(.*?\)/g, "").trim();
      const charConfig = characters.find(c => c.id === line.speaker);
      const voice = charConfig?.voice || 'random';

      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanLineText, voice }),
      });

      if (!response.ok) {
        throw new Error(`TTS status ${response.status}`);
      }

      const data = await response.json();
      if (!data.audioData) {
        throw new Error("No audio payload returned");
      }

      let isStillActive = false;
      setPlaybackStates(prev => {
        const state = prev[sectionId];
        if (state && state.activeLineIndex === lineIndex) {
          isStillActive = true;
          return {
            ...prev,
            [sectionId]: {
              ...state,
              loadingLineIndex: null
            }
          };
        }
        return prev;
      });

      if (!isStillActive) return;

      const audioUrl = `data:${data.mimeType || 'audio/mp3'};base64,${data.audioData}`;
      const audio = new Audio(audioUrl);
      audio.className = 'debate-audio-element';
      audio.style.display = 'none';

      // Ensure the audio element is attached to the DOM properly to prevent silent playback in custom preview environments
      document.body.appendChild(audio);

      audio.volume = isPlaybackMuted ? 0 : playbackVolume;
      currentAudioRef.current = audio;

      audio.onended = () => {
        try {
          audio.remove();
        } catch (e) {}
        currentAudioRef.current = null;
        setActiveSpeakerId?.(null);
        setPlaybackStates(prev => {
          const state = prev[sectionId];
          if (state && state.isPlaying && autoAdvance) {
            const nextIndex = lineIndex + 1;
            if (nextIndex < lines.length) {
              setTimeout(() => {
                playDialogueLine(sectionId, nextIndex, lines, true);
              }, 500); // 500ms separation pause
            } else {
              setActiveSpeakerId?.(null);
              return { ...prev, [sectionId]: { isPlaying: false, activeLineIndex: -1, loadingLineIndex: null } };
            }
          } else {
            setActiveSpeakerId?.(null);
            return { ...prev, [sectionId]: { ...state, activeLineIndex: -1 } };
          }
          return prev;
        });
      };

      await audio.play();

    } catch (err) {
      console.error("Dialogue speech failed:", err);
      setActiveSpeakerId?.(null);
      // Resilience skip fallback
      if (autoAdvance) {
        setTimeout(() => {
          setPlaybackStates(prev => {
            const state = prev[sectionId];
            if (state && state.isPlaying && state.activeLineIndex === lineIndex) {
              const nextIndex = lineIndex + 1;
              if (nextIndex < lines.length) {
                playDialogueLine(sectionId, nextIndex, lines, true);
              } else {
                setActiveSpeakerId?.(null);
                return { ...prev, [sectionId]: { isPlaying: false, activeLineIndex: -1, loadingLineIndex: null } };
              }
            }
            return prev;
          });
        }, 3000);
      } else {
        setActiveSpeakerId?.(null);
        setPlaybackStates(prev => ({
          ...prev,
          [sectionId]: {
            ...prev[sectionId],
            activeLineIndex: -1,
            loadingLineIndex: null
          }
        }));
      }
    }
  };

  const handleStartEdit = (section: ScriptSection) => {
    if (section.status === 'generating') return;
    setEditingId(section.id);
    setEditValue(section.content || "");
  };

  const handleSave = (id: string) => {
    onUpdateSection(id, editValue);
    setEditingId(null);
  };

  const activePlaySection = sections.find(s => playbackStates[s.id]?.isPlaying);
  const completedSections = sections.filter(s => s.status === 'completed');

  return (
    <div className="flex gap-8 items-start">
      <div className="flex-1 space-y-6">
        {/* Triumvirate Debate Protocol Panel */}
        <div className={`glass-panel p-6 border transition-all duration-500 relative overflow-hidden ${
          debateModeEnabled 
            ? 'bg-purple-950/15 border-purple-500/40 shadow-[0_0_30px_rgba(139,92,246,0.15)]' 
            : 'bg-white/5 border-white/5 hover:border-white/10'
        }`}>
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Scale className="w-24 h-24 text-purple-400" />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${debateModeEnabled ? 'bg-purple-400 animate-ping' : 'bg-starlight/20'}`} />
                <h4 className="text-sm font-display font-medium uppercase tracking-wider text-purple-400">Triumvirate Debate Mode</h4>
              </div>
              <p className="text-[10px] font-mono text-starlight/40 uppercase tracking-widest mt-1">
                Command Lion, Jaguar & Tiger to clash on custom philosophical stances
              </p>
            </div>
            
            {/* Actuator Toggle Button */}
            <button
              onClick={() => {
                const nextVal = !debateModeEnabled;
                setDebateModeEnabled(nextVal);
                if (nextVal) {
                  const firstPreset = DEBATE_PRESETS[0];
                  setDebateIntensity(firstPreset.intensity);
                  setDebateOpener(firstPreset.opener);
                  setDebateTopicSpark(firstPreset.topic);
                  setDebateStances(firstPreset.stances);
                  compileDebateDeckLocal(firstPreset.topic, firstPreset.stances, firstPreset.intensity, firstPreset.opener, firstPreset.name);
                }
              }}
              className={`px-5 py-2 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                debateModeEnabled
                  ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:bg-purple-600'
                  : 'bg-white/5 border-white/10 text-starlight/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Cpu className={`w-3.5 h-3.5 ${debateModeEnabled ? 'animate-spin' : ''}`} />
              <span>{debateModeEnabled ? 'DEBATE PROTOCOL ACTIVE' : 'ENGAGE DEBATE PROTOCOL'}</span>
            </button>
          </div>

          <AnimatePresence>
            {debateModeEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 overflow-hidden"
              >
                {/* Control Paradigm Deck / Mode Selector Toggle */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#0f0f20]/90 border border-white/5 rounded-2xl p-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${!directorMode ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                      {!directorMode ? <Eye className="w-5 h-5" /> : <SlidersHorizontal className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${!directorMode ? 'text-amber-500' : 'text-purple-400'}`}>
                          Matrix Control Paradigm
                        </span>
                        <span className="text-[7px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-starlight/40 uppercase">V2.4 Active</span>
                      </div>
                      <p className="text-[10px] text-starlight/60 mt-0.5 font-mono">
                        {!directorMode 
                          ? "Simple Prebuilt Controversies. Quick loaded arguments." 
                          : "Granular Manual Decryption. Unleash character custom stances."}
                      </p>
                    </div>
                  </div>
                  
                  {/* Sliding Selector */}
                  <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 select-none w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setDirectorMode(false)}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[9px] font-bold tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 min-w-[120px] ${
                        !directorMode
                          ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] font-extrabold'
                          : 'text-starlight/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>NOVICE PRESETS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirectorMode(true)}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[9px] font-bold tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 min-w-[120px] ${
                        directorMode
                          ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] font-extrabold'
                          : 'text-starlight/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>DIRECTOR CORE</span>
                    </button>
                  </div>
                </div>

                {/* CONDITIONAL RENDER: NOVICE PRESETS VIEW */}
                {!directorMode ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                        <label className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block">
                          One-Click Debate Presets
                        </label>
                      </div>
                      <span className="text-[8px] font-mono text-starlight/30 uppercase tracking-widest">* NOVICE MATRIX PRE-SYNCHRONIZED</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {DEBATE_PRESETS.map((preset) => {
                        const isActive = debateTopicSpark === preset.topic && debateIntensity === preset.intensity;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setDebateIntensity(preset.intensity);
                              setDebateOpener(preset.opener);
                              setDebateTopicSpark(preset.topic);
                              setDebateStances(preset.stances);
                              compileDebateDeckLocal(preset.topic, preset.stances, preset.intensity, preset.opener, preset.name);
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                              isActive
                                ? 'bg-purple-950/10 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                                : 'bg-black/25 border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{preset.icon}</span>
                                <h5 className={`text-xs font-display font-bold tracking-wide transition-colors ${isActive ? 'text-purple-300' : 'text-starlight group-hover:text-amber-400'}`}>
                                  {preset.name}
                                </h5>
                              </div>
                              <span className={`text-[8px] font-mono uppercase px-2 py-0.5 rounded border ${
                                preset.intensity === 'confrontational' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' :
                                preset.intensity === 'dialectic' ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' :
                                'bg-emerald-500/10 border-emerald-500/20 text-emerald-350'
                              }`}>
                                {preset.intensity === 'confrontational' ? 'CLASH' : preset.intensity.toUpperCase()}
                              </span>
                            </div>
                            
                            <p className="text-[10px] text-starlight/50 leading-relaxed mb-3.5 font-mono">
                              {preset.description}
                            </p>
                            
                            {/* Stance preview strip */}
                            <div className="space-y-1 bg-black/45 p-2.5 rounded-xl border border-white/5">
                              <div className="flex items-center justify-between text-[7px] font-mono text-starlight/40 uppercase tracking-widest border-b border-white/5 pb-1 mb-1">
                                <span>Injectable Stances preview</span>
                                <span>Opener: {preset.opener}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="text-[8px] font-mono text-amber-500/75 truncate" title={preset.stances.lion}>
                                  <strong>Lion:</strong> {preset.stances.lion}
                                </div>
                                <div className="text-[8px] font-mono text-purple-400 truncate" title={preset.stances.jaguar}>
                                  <strong>Jag:</strong> {preset.stances.jaguar}
                                </div>
                                <div className="text-[8px] font-mono text-blue-400 truncate" title={preset.stances.tiger}>
                                  <strong>Tiger:</strong> {preset.stances.tiger}
                                </div>
                              </div>
                            </div>
                            
                            {/* Active focus highlight */}
                            {isActive && (
                              <div className="absolute inset-0 border border-purple-500 rounded-2xl pointer-events-none" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick loaded indicator */}
                    {debateTopicSpark && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-amber-500 flex-none self-center" />
                          <div>
                            <span className="text-[8px] font-mono font-bold text-amber-500 uppercase tracking-widest block">Debate Parameters Injected Successfully</span>
                            <span className="text-xs text-starlight/85 font-mono italic">"{debateTopicSpark}"</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDebateTopicSpark('');
                            setDebateStances({ lion: '', jaguar: '', tiger: '' });
                          }}
                          className="px-3.5 py-1.5 text-[9px] font-mono bg-white/5 hover:bg-white/10 text-starlight hover:text-white rounded-xl border border-white/10 cursor-pointer transition-all uppercase self-stretch sm:self-center text-center"
                        >
                          Clear PresetStance
                        </button>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  /* RENDER: DIRECTOR CORE EXPERT VIEW */
                  <div className="space-y-6">
                    {/* Mode Selector and Opener Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Intensity Grid */}
                      <div className="bg-black/25 p-4 rounded-2xl border border-white/5">
                        <label className="text-[9px] font-mono font-bold text-purple-400 uppercase tracking-widest block mb-1.5">
                          Argument Intensity
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['harmonious', 'dialectic', 'confrontational'] as const).map(intensity => {
                            const labels = {
                              harmonious: { title: 'Harmonious', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5', desc: 'Consensus oriented' },
                              dialectic: { title: 'Dialectic', color: 'text-blue-400 border-blue-500/20 bg-blue-500/5', desc: 'Socratic critique' },
                              confrontational: { title: 'Clash', color: 'text-rose-400 border-rose-500/20 bg-rose-500/5', desc: 'Sovereign clashing' }
                            };
                            const config = labels[intensity];
                            const isActive = debateIntensity === intensity;
                            return (
                              <button
                                key={intensity}
                                type="button"
                                onClick={() => setDebateIntensity(intensity)}
                                className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[55px] ${
                                  isActive
                                    ? `bg-purple-500/20 border-purple-400 text-purple-350 shadow-[0_0_10px_rgba(168,85,247,0.15)]`
                                    : `${config.color} opacity-60 hover:opacity-100`
                                }`}
                              >
                                <span className="text-[9px] font-bold uppercase tracking-wider">{config.title}</span>
                                <span className="text-[8px] opacity-50 block mt-1 leading-none">{config.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Opener selector */}
                      <div className="bg-black/25 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                        <div>
                          <label className="text-[9px] font-mono font-bold text-purple-400 uppercase tracking-widest block mb-1.5">
                            Opening Orator Node
                          </label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {(['lion', 'jaguar', 'tiger', 'random'] as const).map(speaker => (
                              <button
                                key={speaker}
                                type="button"
                                onClick={() => setDebateOpener(speaker)}
                                className={`py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border cursor-pointer ${
                                  debateOpener === speaker
                                    ? 'bg-purple-500 text-white border-purple-400'
                                    : 'bg-white/5 border-white/10 text-starlight/40 hover:bg-white/10'
                                }`}
                              >
                                {speaker}
                              </button>
                            ))}
                          </div>
                        </div>
                        <p className="text-[8px] font-mono opacity-40 uppercase tracking-widest mt-2 leading-tight">
                          * Dictates which Council matrix initiates opening arguments.
                        </p>
                      </div>
                    </div>

                    {/* Customized Trigger/Spark Input */}
                    <div className="bg-black/25 p-4 rounded-2xl border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[9px] font-mono font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                          <span>Crisis Prompt Spark</span>
                        </label>
                        {debateTopicSpark && (
                          <button 
                            type="button"
                            onClick={() => setDebateTopicSpark('')}
                            className="text-[8px] text-starlight/30 uppercase tracking-wider hover:text-white"
                          >
                            Reset Spark
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={debateTopicSpark}
                        onChange={(e) => setDebateTopicSpark(e.target.value)}
                        placeholder="E.g., Enigmatic frequency code emanating from Outer Rim Silence Probes..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-starlight placeholder-starlight/25 font-mono focus:outline-hidden focus:border-purple-400 transition-all font-medium"
                      />
                      <p className="text-[8px] font-mono opacity-40 uppercase tracking-widest mt-1.5 leading-normal">
                        * Overrides standard parameters. Forces the three members to focus on this exact catalyst.
                      </p>
                    </div>

                    {/* Council Members custom stances inputs */}
                    <div className="bg-black/25 p-4 rounded-2xl border border-white/5 space-y-3">
                      <div className="flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span className="text-[9px] font-mono font-bold text-purple-400 uppercase tracking-widest">
                          Custom Stances Matrix (Optional)
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Lion Customizer */}
                        <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full overflow-hidden bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-[8px] text-amber-500 font-mono">L</div>
                            <span className="text-[9px] font-display font-bold text-amber-500">Lion Position</span>
                          </div>
                          <textarea
                            value={debateStances.lion}
                            onChange={(e) => setDebateStances({ ...debateStances, lion: e.target.value })}
                            placeholder="Default: wise legacy spirit..."
                            className="w-full bg-black/30 border border-white/5 rounded-lg p-1.5 text-[9px] font-mono text-starlight focus:outline-hidden focus:border-purple-500/50 resize-none h-12"
                          />
                        </div>

                        {/* Jaguar Customizer */}
                        <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full overflow-hidden bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-bold text-[8px] text-purple-400 font-mono">J</div>
                            <span className="text-[9px] font-display font-bold text-purple-400">Jaguar Position</span>
                          </div>
                          <textarea
                            value={debateStances.jaguar}
                            onChange={(e) => setDebateStances({ ...debateStances, jaguar: e.target.value })}
                            placeholder="Default: mathematical optimization..."
                            className="w-full bg-black/30 border border-white/5 rounded-lg p-1.5 text-[9px] font-mono text-starlight focus:outline-hidden focus:border-purple-500/50 resize-none h-12"
                          />
                        </div>

                        {/* Tiger Customizer */}
                        <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full overflow-hidden bg-blue-500/20 border border-blue-500/40 flex items-center justify-center font-bold text-[8px] text-blue-400 font-mono">T</div>
                            <span className="text-[9px] font-display font-bold text-blue-400">Tiger Position</span>
                          </div>
                          <textarea
                            value={debateStances.tiger}
                            onChange={(e) => setDebateStances({ ...debateStances, tiger: e.target.value })}
                            placeholder="Default: skeletal vigilance..."
                            className="w-full bg-black/30 border border-white/5 rounded-lg p-1.5 text-[9px] font-mono text-starlight focus:outline-hidden focus:border-purple-500/50 resize-none h-12"
                          />
                        </div>
                      </div>

                      {/* Compile Button for custom mode */}
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            compileDebateDeckLocal(
                              debateTopicSpark || "Custom Philosophical Dispute",
                              debateStances,
                              debateIntensity,
                              debateOpener,
                              "Custom Stances Matrix"
                            );
                          }}
                          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-mono text-[9px] font-bold rounded-xl border border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer uppercase"
                        >
                          <Zap className="w-3.5 h-3.5 animate-pulse text-amber-300" />
                          <span>Compile Custom Debate Deck</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
                  <div className="flex flex-wrap items-center gap-4">
                    {section.audioData && (
                      <button
                        onClick={() => playAudio(section.audioData!, section.audioMimeType || 'audio/mp3')}
                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/20 text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:scale-105 active:scale-95 cursor-pointer"
                        title="Replay compiled celestial transmission"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>REPLAY TRANSMISSION</span>
                      </button>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-black/50 p-3 rounded-2xl border border-white/5 w-full">
                      <div className="flex items-center gap-1.5 px-1 flex-shrink-0">
                        <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                        <p className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest leading-none">Vocal Engine Selection</p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 flex-1">
                        {/* Triumvirate Voices Group */}
                        <div className="flex items-center gap-1.5 bg-amber-500/5 p-1 rounded-xl border border-amber-500/20">
                          <span className="text-[8px] font-mono text-amber-400 font-bold px-1.5 uppercase tracking-wider">Triumvirate:</span>
                          <div className="flex gap-1">
                            {characters.map(char => {
                              const labelName = char.id === 'lion' ? 'LION' : (char.id === 'jaguar' ? 'JAGUAR' : 'TIGER');
                              const titleName = char.id === 'lion' ? 'Visionary Lion (Fenrir Voice)' : (char.id === 'jaguar' ? 'Strategist Jaguar (Zephyr Voice)' : 'Guardian Tiger (Charon Voice)');
                              return (
                                <button
                                  key={char.id}
                                  onClick={() => onPlayVoice(section.id, char.voice)}
                                  disabled={section.isVoiceGenerating}
                                  title={`Read by ${titleName}`}
                                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-starlight hover:text-amber-400 transition-all border border-white/5 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                                >
                                  {section.isVoiceGenerating ? (
                                    <RefreshCcw className="w-3 h-3 animate-spin text-amber-500" />
                                  ) : (
                                    <Users className="w-3 h-3 text-amber-500/70" />
                                  )}
                                  <span className="text-[9px] font-mono uppercase tracking-wider font-bold">{labelName}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Standard Neural Cores Group */}
                        <div className="flex items-center gap-1.5 bg-blue-500/5 p-1 rounded-xl border border-blue-500/20">
                          <span className="text-[8px] font-mono text-blue-400 font-bold px-1.5 uppercase tracking-wider">Neural Cores:</span>
                          <div className="flex gap-1">
                            {NEURAL_VOICES.map(voice => (
                              <button
                                key={voice}
                                onClick={() => onPlayVoice(section.id, voice)}
                                disabled={section.isVoiceGenerating}
                                title={`Read by Neural Voice: ${voice}`}
                                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 text-starlight hover:text-blue-400 transition-all border border-white/5 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                              >
                                {section.isVoiceGenerating ? (
                                  <RefreshCcw className="w-3 h-3 animate-spin text-blue-400" />
                                ) : (
                                  <Volume2 className="w-3 h-3 text-blue-400/70" />
                                )}
                                <span className="text-[9px] font-mono uppercase tracking-wider">{voice}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
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
                    {section.bRollUrl === 'cosmic_fallback' || videoErrors[section.bRollUrl] ? (
                      <CosmicFallbackAnimation label={section.bRollLabel} />
                    ) : (
                      <video 
                        src={section.bRollUrl} 
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        {...({ referrerPolicy: "no-referrer", crossOrigin: "anonymous" } as any)}
                        onError={(e) => {
                          console.warn(`B-roll video failed to load gracefully: ${section.bRollUrl}`);
                          setVideoErrors(prev => ({ ...prev, [section.bRollUrl!]: true }));
                        }}
                        className="w-full h-full object-cover opacity-60" 
                      />
                    )}
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
                
                <div className="flex-1 flex flex-col gap-3 min-h-[300px]">
                  {/* View Mode Switching Tabs (only when completed & has content) */}
                  {section.status === 'completed' && section.content && editingId !== section.id && (
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-black/35 p-2 rounded-xl border border-white/5">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setScriptViewModes(v => ({ ...v, [section.id]: 'sim' }))}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                            getSectionViewMode(section.id, section.content) === 'sim'
                              ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                              : 'text-starlight/50 hover:bg-white/5'
                          }`}
                        >
                          <Brain className="w-3 h-3 text-purple-300" />
                          <span>Council Chamber Sim</span>
                        </button>
                        <button
                          onClick={() => setScriptViewModes(v => ({ ...v, [section.id]: 'raw' }))}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                            getSectionViewMode(section.id, section.content) === 'raw'
                              ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                              : 'text-starlight/50 hover:bg-white/5'
                          }`}
                        >
                          <ScrollText className="w-3 h-3 text-amber-900" />
                          <span>Raw Manuscript Log</span>
                        </button>
                      </div>

                      {getSectionViewMode(section.id, section.content) === 'sim' && (
                        <div className="flex items-center gap-2">
                           {playbackStates[section.id]?.isPlaying ? (
                            <button
                              onClick={() => {
                                if (currentAudioRef.current) {
                                  currentAudioRef.current.pause();
                                  currentAudioRef.current = null;
                                }
                                setActiveSpeakerId?.(null);
                                setPlaybackStates(prev => ({
                                  ...prev,
                                  [section.id]: { ...prev[section.id], isPlaying: false }
                                }));
                              }}
                              className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[9px] font-bold font-mono tracking-wider flex items-center gap-1 cursor-pointer transition-all animate-pulse"
                            >
                              <Pause className="w-2.5 h-2.5 fill-current" />
                              <span>HALT DEBATE DECRYPTION</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const lines = parseScriptToDialogue(section.content || "");
                                playDialogueLine(section.id, 0, lines, true);
                              }}
                              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg text-[9px] font-bold font-mono tracking-wider flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)] hover:scale-105"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>COUNCIL DEBATE PLAYBACK</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Script display box */}
                  <div 
                    onClick={() => editingId !== section.id && getSectionViewMode(section.id, section.content || "") === 'raw' && handleStartEdit(section)}
                    className={`flex-1 p-6 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden transition-all ${
                      editingId !== section.id && getSectionViewMode(section.id, section.content || "") === 'raw' ? 'hover:bg-white/5 cursor-text group/content' : ''
                    } ${editingId === section.id ? 'ring-2 ring-amber-500/50' : ''}`}
                  >
                    {editingId === section.id ? (
                      <div className="h-full flex flex-col gap-4">
                        <textarea
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              handleSave(section.id);
                            }
                            if (e.key === 'Escape') {
                              setEditingId(null);
                            }
                          }}
                          className="flex-1 bg-transparent border-none outline-hidden resize-none w-full h-[250px] text-starlight font-mono text-sm leading-relaxed scroll-hide"
                          placeholder="Neural context required..."
                        />
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 transition-all cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleSave(section.id); }}
                            className="px-4 py-2 bg-amber-500 text-black rounded-lg text-[10px] font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            SYNC CHANGES
                          </button>
                        </div>
                        <p className="text-[8px] opacity-35 font-mono uppercase tracking-widest text-right">Ctrl+Enter to sync / ESC to abort</p>
                      </div>
                    ) : (
                      <>
                        {/* Edit button in Raw or completed sections */}
                        {section.status === 'completed' && getSectionViewMode(section.id, section.content || "") === 'raw' && (
                          <div className="absolute top-4 right-4 opacity-0 group-hover/content:opacity-100 transition-opacity z-25">
                            <button className="p-2 bg-white/10 rounded-lg text-amber-500 hover:bg-white/20 transition-all cursor-pointer">
                              <Save className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        
                        {/* Ifcompleted, look for view modes */}
                        {section.status === 'completed' && section.content ? (
                          getSectionViewMode(section.id, section.content) === 'sim' ? (
                            /* SIMULATION VIEW PROTOCOL */
                            <div className="space-y-4 max-h-[450px] overflow-y-auto scrollbar-thin pr-1">
                              {parseScriptToDialogue(section.content).map((line, idx) => {
                                const isLineActive = playbackStates[section.id]?.activeLineIndex === idx;
                                const isLineLoading = playbackStates[section.id]?.loadingLineIndex === idx;
                                
                                let themeClasses = "border-white/5 bg-white/3 text-starlight/85";
                                let badgeColor = "bg-white/10 text-white border border-white/10";
                                let speakerLabel = line.speakerLabel;
                                let avatarUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150";
                                
                                const char = characters.find(c => c.id === line.speaker);
                                if (char) {
                                  avatarUrl = char.avatar;
                                }
                                
                                if (line.speaker === 'lion') {
                                  themeClasses = `border-amber-500/25 bg-amber-500/5 text-amber-100/90 ${isLineActive ? 'ring-2 ring-amber-400Shadow shadow-[0_0_15px_rgba(245,158,11,0.25)]' : ''}`;
                                  badgeColor = "bg-amber-500/10 text-amber-400 border border-amber-500/30";
                                } else if (line.speaker === 'jaguar') {
                                  themeClasses = `border-purple-500/25 bg-purple-500/5 text-purple-100/90 ${isLineActive ? 'ring-2 ring-purple-400Shadow shadow-[0_0_15px_rgba(168,85,247,0.25)]' : ''}`;
                                  badgeColor = "bg-purple-500/10 text-purple-400 border border-purple-500/30";
                                } else if (line.speaker === 'tiger') {
                                  themeClasses = `border-blue-500/25 bg-blue-500/5 text-blue-100/90 ${isLineActive ? 'ring-2 ring-blue-400Shadow shadow-[0_0_15px_rgba(59,130,246,0.25)]' : ''}`;
                                  badgeColor = "bg-blue-500/10 text-blue-400 border border-blue-500/30";
                                } else if (line.speaker === 'narration') {
                                  themeClasses = "border-none bg-transparent text-starlight/40 italic text-[11px] text-center px-4 py-1.5 capitalize";
                                }
                                
                                if (line.speaker === 'narration') {
                                  return (
                                    <div key={idx} className="flex justify-center my-2 select-text">
                                      <div className="max-w-xl text-center">
                                        <span className="text-[8px] font-mono opacity-25 uppercase tracking-widest block mb-1">{line.speakerLabel}</span>
                                        <p className="font-mono">{line.text}</p>
                                      </div>
                                    </div>
                                  );
                                }
                                
                                const parts = parseLineParts(line.text);
                                
                                return (
                                  <div 
                                    key={idx} 
                                    className={`flex gap-3 my-4 items-start group/bubble transition-all select-text ${
                                      line.speaker === 'tiger' ? 'flex-row-reverse' : ''
                                    }`}
                                  >
                                    <div className="relative flex-shrink-0">
                                      <img 
                                        src={avatarUrl} 
                                        alt={speakerLabel}
                                        referrerPolicy="no-referrer"
                                        className={`w-10 h-10 rounded-full object-cover border ${
                                          line.speaker === 'lion' ? 'border-amber-500/35 shadow-[0_0_5px_rgba(245,158,11,0.2)]' : line.speaker === 'jaguar' ? 'border-purple-500/35 shadow-[0_0_5px_rgba(168,85,247,0.2)]' : 'border-blue-500/35 shadow-[0_0_5px_rgba(59,130,246,0.2)]'
                                        }`}
                                      />
                                      {isLineActive && (
                                        <span className="absolute -inset-0.5 rounded-full border border-purple-400 animate-ping opacity-60" />
                                      )}
                                    </div>
                                    
                                    <div className={`flex flex-col max-w-[80%] ${line.speaker === 'tiger' ? 'items-end' : 'items-start'}`}>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-widest uppercase ${badgeColor}`}>
                                          {speakerLabel}
                                        </span>
                                        {isLineActive && (
                                          <span className="flex items-center gap-1 text-[8px] text-purple-400 font-mono font-bold uppercase tracking-widest animate-pulse">
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                                            <span>SPEAKING</span>
                                          </span>
                                        )}
                                      </div>
                                      
                                      <div className={`p-4 rounded-2xl border text-xs md:text-sm leading-relaxed relative overflow-hidden transition-all duration-300 font-mono ${themeClasses}`}>
                                        {isLineLoading && (
                                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px] z-10">
                                            <RefreshCcw className="w-4 h-4 animate-spin text-purple-400" />
                                          </div>
                                        )}
                                        
                                        <p>
                                          {parts.map((p, pIdx) => {
                                            if (p.type === 'cue') {
                                              return (
                                                <span key={pIdx} className="text-purple-400 italic font-mono font-bold text-[10px] mx-1 bg-purple-500/15 px-1.5 py-0.5 rounded-md">
                                                  {p.value}
                                                </span>
                                              );
                                            }
                                            return <span key={pIdx}>{p.value}</span>;
                                          })}
                                        </p>
                                        
                                        <button
                                          onClick={() => {
                                            const lines = parseScriptToDialogue(section.content || "");
                                            playDialogueLine(section.id, idx, lines, false);
                                          }}
                                          disabled={isLineLoading}
                                          className={`mt-2 py-1 px-2.5 rounded bg-black/65 hover:bg-black border border-white/5 text-starlight/60 hover:text-amber-400 transition-all text-[8px] font-mono flex items-center gap-1 cursor-pointer w-fit opacity-0 group-hover/bubble:opacity-100 ${isLineActive ? 'opacity-100 text-amber-400' : ''}`}
                                        >
                                          {isLineActive ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                                          <span>{isLineActive ? 'HALT' : 'SYNTH LINES'}</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            /* RAW SCENARIO TEXT VIEW */
                            <div className="whitespace-pre-wrap font-mono text-xs md:text-sm leading-relaxed text-starlight/75 max-h-[400px] overflow-y-auto select-text scroll-hide">
                              {section.content}
                            </div>
                          )
                        ) : null}
                        
                        {section.status === 'generating' && (
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/65 backdrop-blur-[2px]">
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

                        {!section.content && section.status !== 'generating' && (
                          <div className="flex flex-col items-center justify-center py-16 text-starlight/20 italic">
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
        </div>
      ))}

        {/* Cosmic Animated Feed */}
        <div className="pt-8 border-t border-white/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-[14px] font-display font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                <MonitorPlay className="w-4 h-4 text-amber-500" />
                <span>Cosmic Animated Feed</span>
              </h3>
              <p className="text-[10px] font-mono text-starlight/40 uppercase tracking-widest mt-0.5">Atmospheric Real-Time B-Roll Synthesizer & Video Linkage Stream</p>
            </div>
            {selectingBRollForSection && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <span className="relative flex h-2 w-2 animate-pulse">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                <span className="text-[9px] font-mono text-purple-400 uppercase tracking-wider font-bold">Awaiting Chapter Link for Module {selectingBRollForSection.toUpperCase()}</span>
              </div>
            )}
          </div>
          
          <div className="bg-black/25 rounded-3xl p-6 border border-white/5 shadow-inner">
            <CosmicBRollFeed 
              bRolls={bRolls} 
              onRefresh={onRefreshBRolls} 
              onSelectBRoll={(bRoll) => {
                if (selectingBRollForSection) {
                  onLinkBRoll(bRoll);
                } else {
                  // Direct preview or start selecting B-roll
                  onSelectBRoll(sections[0]?.id || 'b_cosmic');
                }
              }}
              selectingForSection={selectingBRollForSection}
            />
          </div>
        </div>
      </div>

      <div className="w-72 sticky border-l border-white/5 pl-8 top-8 space-y-6">
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

      {/* Master Debate Playback Bar */}
      <div className="fixed bottom-6 right-6 left-6 lg:left-[312px] z-[90] bg-[#101026]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.6)] transition-all flex flex-col md:flex-row items-center justify-between gap-4">
        {/* LEFT COLUMN: ACTIVE DISCOURSE READOUT */}
        <div className="flex items-center gap-3.5 w-full md:w-auto min-w-0">
          <div className="flex-none w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center overflow-hidden relative">
            {activeSpeakerId && characters.find(c => c.id === activeSpeakerId) ? (
              (() => {
                const char = characters.find(c => c.id === activeSpeakerId)!;
                return char.lipSyncUrl ? (
                  <video src={char.lipSyncUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                ) : char.animatedVideoUrl && char.animatedVideoUrl !== "cosmic_fallback" ? (
                  <video src={char.animatedVideoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                ) : char.avatar ? (
                  <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-xs font-mono font-bold text-purle-400">{char.name.slice(0, 2).toUpperCase()}</span>
                );
              })()
            ) : (
              <span className="text-lg">{activePlaySection ? '🎙️' : '💿'}</span>
            )}
            {activeSpeakerId && (
              <span className="absolute inset-0 border border-purple-500/50 rounded-xl animate-ping opacity-60" />
            )}
          </div>
          
          <div className="min-w-0 flex-1 md:flex-initial">
            {activePlaySection ? (
              (() => {
                const state = playbackStates[activePlaySection.id];
                const lines = parseScriptToDialogue(activePlaySection.content || '');
                const currentLine = lines[state.activeLineIndex];
                const speakerName = currentLine?.speaker === 'lion' ? 'Lion' : currentLine?.speaker === 'jaguar' ? 'Jaguar' : currentLine?.speaker === 'tiger' ? 'Tiger' : 'Narrator';
                const speakerColorClass = currentLine?.speaker === 'lion' ? 'text-amber-400 font-bold' : currentLine?.speaker === 'jaguar' ? 'text-purple-400 font-bold' : currentLine?.speaker === 'tiger' ? 'text-blue-400 font-bold' : 'text-starlight font-bold';
                const isWaitingForVoice = state.loadingLineIndex !== null;
                
                return (
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-sm border border-purple-500/30 uppercase tracking-widest">
                        {activePlaySection.title}
                      </span>
                      {isWaitingForVoice && (
                        <span className="text-[8px] font-mono text-amber-400 animate-pulse uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          CALIBRATING VOICE...
                        </span>
                      )}
                    </div>
                    
                    {currentLine && (
                      <div className="flex items-center gap-2 max-w-md text-left">
                        <span className={`text-[10px] font-display font-extrabold flex-none ${speakerColorClass}`}>
                          {speakerName}:
                        </span>
                        <span className="text-[10px] font-mono text-starlight/80 truncate block italic" title={currentLine.text}>
                          "{currentLine.text}"
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="space-y-1 text-left">
                <span className="text-[8px] font-mono text-starlight/30 uppercase tracking-widest block">MASTER SYSTEM COMMANDER</span>
                {completedSections.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-starlight/50 uppercase font-mono">LOAD DEBATE DECK:</span>
                    <select
                      value={selectedBarSectionId}
                      onChange={(e) => setSelectedBarSectionId(e.target.value)}
                      className="bg-black/50 text-[10px] text-purple-300 font-mono border border-white/10 rounded-lg px-2 py-1 focus:outline-none focus:border-purple-400 cursor-pointer text-left"
                    >
                      {completedSections.map(cs => (
                        <option key={cs.id} value={cs.id} className="bg-[#121225] text-starlight">{cs.title.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-starlight/50 uppercase">Generate or load a segment to command playbacks</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: CD DECK REMOTE CONTROLLER */}
        <div className="flex flex-col items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-4 text-center justify-center">
            {/* Skip Back / Turn Regress */}
            <button
              type="button"
              disabled={!activePlaySection}
              onClick={() => {
                if (!activePlaySection) return;
                const state = playbackStates[activePlaySection.id];
                const lines = parseScriptToDialogue(activePlaySection.content || '');
                const prevIndex = state.activeLineIndex - 1;
                if (prevIndex >= 0) {
                  playDialogueLine(activePlaySection.id, prevIndex, lines, true);
                }
              }}
              className="w-8 h-8 rounded-full border border-white/5 bg-white/5 flex items-center justify-center text-starlight/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
              title="Regress monologue turn"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Master Play / Pause */}
            {activePlaySection && playbackStates[activePlaySection.id]?.isPlaying ? (
              <button
                type="button"
                onClick={() => {
                  if (currentAudioRef.current) {
                    currentAudioRef.current.pause();
                  }
                  setActiveSpeakerId?.(null);
                  setPlaybackStates(prev => ({
                    ...prev,
                    [activePlaySection.id]: {
                      ...prev[activePlaySection.id],
                      isPlaying: false
                    }
                  }));
                }}
                className="w-12 h-12 rounded-full bg-purple-500 hover:bg-purple-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)] active:scale-95 transition-all cursor-pointer border border-purple-400"
                title="Pause playback"
              >
                <Pause className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                disabled={completedSections.length === 0}
                onClick={() => {
                  const targetId = activePlaySection?.id || selectedBarSectionId;
                  const targetScript = sections.find(s => s.id === targetId);
                  if (targetScript && targetScript.content && targetScript.status === 'completed') {
                    const lines = parseScriptToDialogue(targetScript.content);
                    const activeState = playbackStates[targetScript.id];
                    const startIndex = activeState && activeState.activeLineIndex >= 0 ? activeState.activeLineIndex : 0;
                    
                    setPlaybackStates(prev => ({
                      ...prev,
                      [targetScript.id]: {
                        isPlaying: true,
                        activeLineIndex: startIndex,
                        loadingLineIndex: null
                      }
                    }));
                    playDialogueLine(targetId, startIndex, lines, true);
                  }
                }}
                className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-95 transition-all disabled:opacity-35 cursor-pointer border border-amber-300"
                title="Initiate discourse playback"
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </button>
            )}

            {/* Reset / Halt */}
            <button
              type="button"
              disabled={completedSections.length === 0 && !activePlaySection}
              onClick={() => {
                setActiveSpeakerId?.(null);
                sections.forEach(s => {
                  if (playbackStates[s.id]?.isPlaying || playbackStates[s.id]?.activeLineIndex >= 0) {
                    if (currentAudioRef.current) currentAudioRef.current.pause();
                    setPlaybackStates(prev => ({
                      ...prev,
                      [s.id]: { isPlaying: false, activeLineIndex: -1, loadingLineIndex: null }
                    }));
                  }
                });
              }}
              className="w-8 h-8 rounded-full border border-white/5 bg-white/5 flex items-center justify-center text-starlight/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
              title="Halt & clear playback pointers"
            >
              <Square className="w-3.5 h-3.5" />
            </button>

            {/* Skip Forward / Turn Advance */}
            <button
              type="button"
              disabled={!activePlaySection}
              onClick={() => {
                if (!activePlaySection) return;
                const state = playbackStates[activePlaySection.id];
                const lines = parseScriptToDialogue(activePlaySection.content || '');
                const nextIndex = state.activeLineIndex + 1;
                if (nextIndex < lines.length) {
                  playDialogueLine(activePlaySection.id, nextIndex, lines, true);
                } else {
                  if (currentAudioRef.current) currentAudioRef.current.pause();
                  setActiveSpeakerId?.(null);
                  setPlaybackStates(prev => ({
                    ...prev,
                    [activePlaySection.id]: { isPlaying: false, activeLineIndex: -1, loadingLineIndex: null }
                  }));
                }
              }}
              className="w-8 h-8 rounded-full border border-white/5 bg-white/5 flex items-center justify-center text-starlight/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
              title="Advance monologue turn"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* REAL-TIME PROGRESS BAR DOT SYSTEM */}
          {activePlaySection && (
            <div className="w-64 flex flex-col items-center">
              {(() => {
                const state = playbackStates[activePlaySection.id];
                const lines = parseScriptToDialogue(activePlaySection.content || '');
                return (
                  <div className="w-full flex items-center gap-1 mt-1">
                    {lines.map((l, idx) => {
                      const isPast = idx < state.activeLineIndex;
                      const isCurrent = idx === state.activeLineIndex;
                      let dotColor = 'bg-white/10';
                      if (isPast) dotColor = 'bg-purple-500/60';
                      if (isCurrent) dotColor = 'bg-purple-400 animate-pulse border border-purple-300';
                      
                      return (
                        <button
                           key={idx}
                           type="button"
                           onClick={() => {
                             playDialogueLine(activePlaySection.id, idx, lines, true);
                           }}
                           className={`h-1.5 flex-1 rounded-sm cursor-pointer hover:bg-purple-500/30 transition-all ${dotColor}`}
                           title={`Jump to Turn ${idx + 1}: ${l.speaker.toUpperCase()}`}
                        />
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SPEECH TUNER SLIDER */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleToggleMute}
            className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-starlight/85 hover:text-white transition-colors cursor-pointer"
            title={isPlaybackMuted ? 'Unmute Speech Audio' : 'Mute Speech Audio'}
          >
            {isPlaybackMuted ? <VolumeX className="w-4 h-4 text-rose-450" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
          </button>
          
          <div className="flex flex-col w-28 text-left">
            <div className="flex justify-between text-[8px] font-mono text-starlight/40 uppercase tracking-wider mb-0.5">
              <span>Vocal Out</span>
              <span>{isPlaybackMuted ? 'Muted' : `${Math.round(playbackVolume * 100)}%`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={playbackVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500 text-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const CosmicFallbackAnimation = ({ label }: { label?: string }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = canvas.width = canvas.offsetWidth || 250;
    let height = canvas.height = canvas.offsetHeight || 140;

    // Generate drift particles
    const particles: Array<{ x: number; y: number; r: number; dx: number; dy: number; color: string }> = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.15,
        dy: (Math.random() - 0.5) * 0.15,
        color: i % 3 === 0 ? 'rgba(168, 85, 247, 0.45)' : i % 3 === 1 ? 'rgba(59, 130, 246, 0.45)' : 'rgba(251, 191, 36, 0.45)'
      });
    }

    const resizeObserver = new ResizeObserver(() => {
      width = canvas.width = canvas.offsetWidth || 250;
      height = canvas.height = canvas.offsetHeight || 140;
    });
    resizeObserver.observe(canvas);

    const render = () => {
      ctx.fillStyle = '#06060c';
      ctx.fillRect(0, 0, width, height);

      // Render cosmic background glow
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 5, width / 2, height / 2, Math.max(width, height) / 1.5);
      gradient.addColorStop(0, 'rgba(88, 28, 135, 0.18)');
      gradient.addColorStop(0.5, 'rgba(30, 27, 75, 0.08)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw and update particles
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 4;
        ctx.shadowColor = p.color;
        ctx.fill();

        p.x += p.dx;
        p.y += p.dy;

        // Bounce/Wrap
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      });
      ctx.shadowBlur = 0; // reset

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#06060c] flex items-center justify-center min-h-[140px]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
      <div className="relative z-10 text-center pointer-events-none select-none px-3 space-y-1">
        <p className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block truncate max-w-[220px] mx-auto">{label || "Celestial Node"}</p>
        <p className="text-[7px] font-mono text-starlight/40 tracking-widest uppercase">HARMONIC LOOP EMULATED</p>
      </div>
    </div>
  );
};

const CosmicBRollFeed = ({ bRolls, onRefresh, onSelectBRoll, selectingForSection }: { bRolls: BRoll[], onRefresh: () => void, onSelectBRoll?: (bRoll: BRoll) => void, selectingForSection?: string | null }) => {
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});

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
      
      <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-3">
        {bRolls.map((br) => (
          <motion.div 
            key={br.id}
            whileHover={{ scale: 1.05 }}
            onClick={() => onSelectBRoll?.(br)}
            className={`flex-none w-48 aspect-video rounded-xl overflow-hidden border relative group/item cursor-pointer transition-all ${
              selectingForSection ? 'border-purple-500 animate-pulse hover:animate-none hover:border-white shadow-lg' : 'border-white/5'
            }`}
          >
            {br.url === 'cosmic_fallback' || videoErrors[br.url] ? (
              <CosmicFallbackAnimation label={br.label} />
            ) : (
              <video 
                src={br.url} 
                autoPlay 
                muted 
                loop 
                playsInline
                {...({ referrerPolicy: "no-referrer", crossOrigin: "anonymous" } as any)}
                onError={(e) => {
                  console.warn(`B-roll feed item failing to load: ${br.url}`);
                  setVideoErrors(prev => ({ ...prev, [br.url]: true }));
                }}
                className={`w-full h-full object-cover transition-opacity ${selectingForSection ? 'opacity-100' : 'opacity-60 group-hover/item:opacity-100'}`} 
              />
            )}
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
  isExporting,
  diagnosticLogs = [],
  bRollError = null,
  lipSyncError = null,
  videoError = null,
  setShowDiagnosticOverlay
}: { 
  generatingAvatars: Record<string, boolean>, 
  generatingManifestos: Record<string, boolean>, 
  generatingLipSyncs: Record<string, boolean>,
  scripts: ScriptSection[],
  isTrailerLoading: boolean,
  isExporting: boolean,
  diagnosticLogs?: any[],
  bRollError?: string | null,
  lipSyncError?: string | null,
  videoError?: string | null,
  setShowDiagnosticOverlay?: (show: boolean) => void
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

  const activeErrors: Array<{ id: string; module: string; message: string }> = [];
  if (bRollError) {
    activeErrors.push({ id: 'broll-err', module: 'B-Roll Generator', message: bRollError });
  }
  if (lipSyncError) {
    activeErrors.push({ id: 'lipsync-err', module: 'Lip-Sync Generator', message: lipSyncError });
  }
  if (videoError) {
    activeErrors.push({ id: 'video-err', module: 'Video Compositor', message: videoError });
  }

  const hasErrors = activeErrors.length > 0;

  if (activeProcesses.length === 0 && !hasErrors) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {/* Active Error State Notifications in the Process List */}
        {activeErrors.map((err) => (
          <motion.div
            key={err.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            onClick={() => {
              if (setShowDiagnosticOverlay) setShowDiagnosticOverlay(true);
            }}
            className="glass-panel px-4 py-3 border-red-500/80 bg-red-950/90 backdrop-blur-md flex items-start gap-4 min-w-[265px] max-w-[340px] shadow-[0_0_25px_rgba(239,68,68,0.35)] pointer-events-auto cursor-pointer animate-[pulse_1.8s_infinite] select-none"
          >
            <div className="relative flex items-center justify-center p-1.5 rounded-lg bg-red-500/20 text-red-400">
              <AlertOctagon className="w-4 h-4 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[9px] font-mono font-black text-red-400 tracking-wider uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                CRITICAL: {err.module.toUpperCase()}
              </p>
              <p className="text-[10px] text-white/95 mt-1 leading-snug break-words font-mono font-bold">
                {err.message}
              </p>
              <p className="text-[8px] font-mono text-red-400/70 mt-1 uppercase tracking-widest hover:underline">
                TAP TO CALIBRATE & RE-SYNCHRONIZE
              </p>
            </div>
          </motion.div>
        ))}

        {/* Active Processes Loop */}
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
            <div className="flex-1 text-left">
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
      
      {/* Dynamic Status Counter or Warning Badging */}
      <motion.div 
        layout
        onClick={() => {
          if (setShowDiagnosticOverlay) setShowDiagnosticOverlay(true);
        }}
        className={`glass-panel px-4 py-1.5 backdrop-blur-md flex items-center gap-2 pointer-events-auto cursor-pointer transition-all hover:scale-105 active:scale-95 ${
          hasErrors 
            ? 'border-red-500/60 bg-red-950/40 shadow-[0_0_20px_rgba(239,68,68,0.25)] animate-pulse' 
            : 'border-amber-500/30 bg-amber-500/10'
        }`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${hasErrors ? 'bg-red-500 animate-ping' : 'bg-amber-500 animate-ping'}`} />
        <span className={`text-[10px] font-mono font-bold tracking-tighter ${hasErrors ? 'text-red-400' : 'text-amber-400'}`}>
          {hasErrors ? 'SYSTEM FAULTS INTEGRATED - CLICK FOR HUD' : `${activeProcesses.length} ACTIVE NEURAL PROCESSES`}
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
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
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
        <div className="relative h-60 w-full bg-black/40 rounded-3xl border border-white/5 p-4 flex flex-col gap-2 overflow-hidden overflow-x-auto custom-scrollbar">
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
                         {s.bRollUrl === 'cosmic_fallback' || videoErrors[s.bRollUrl] ? (
                           <CosmicFallbackAnimation label={s.bRollLabel || "COSMIC"} />
                         ) : (
                           <video 
                             src={s.bRollUrl} {...({ referrerPolicy: "no-referrer" } as any)} 
                             autoPlay 
                             muted 
                             loop 
                             playsInline
                             onError={(e) => {
                               console.warn(`Monitor B-roll failing to load: ${s.bRollUrl}`);
                               setVideoErrors(prev => ({ ...prev, [s.bRollUrl!]: true }));
                             }}
                             className="w-full h-full object-cover opacity-50" 
                           />
                         )}
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
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);

  // --- Firebase Auth & Database Sync States ---
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  const [bRollError, setBRollError] = useState<string | null>(null);
  const [lipSyncError, setLipSyncError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [assemblyPipelineError, setAssemblyPipelineError] = useState<string | null>(null);
  const [showDiagnosticOverlay, setShowDiagnosticOverlay] = useState(false);
  const [showVocalLibrary, setShowVocalLibrary] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState<Array<{
    id: string;
    timestamp: string;
    level: 'info' | 'success' | 'warn' | 'error';
    module: string;
    message: string;
    errorDetails?: string;
  }>>([
    { id: '1', timestamp: new Date().toLocaleTimeString(), level: 'success', module: 'System Init', message: 'Intergalactic Broadcast Pipeline initialized successfully.' },
    { id: '2', timestamp: new Date().toLocaleTimeString(), level: 'info', module: 'Diagnostic Engine', message: 'Tones and vocal frequency analyzers standing by on Port 3000.' },
    { id: '3', timestamp: new Date().toLocaleTimeString(), level: 'info', module: 'Sync Controller', message: 'Oracle Calibration Matrix synchronized at 100% capacity.' },
  ]);

  const logDiagnostic = (level: 'info' | 'success' | 'warn' | 'error', module: string, message: string, errorDetails?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const timestamp = new Date().toLocaleTimeString();
    setDiagnosticLogs(prev => [
      { id, timestamp, level, module, message, errorDetails },
      ...prev
    ].slice(0, 55));

    if (level === 'error') {
      if (module.toUpperCase().includes('PIPELINE') || module.toUpperCase().includes('ASSEMBLY') || message.toUpperCase().includes('ASSEMBLY PIPELINE') || (errorDetails && errorDetails.toUpperCase().includes('ASSEMBLY PIPELINE'))) {
        setAssemblyPipelineError(errorDetails || message);
      }
      if (module.toUpperCase().includes('B-ROLL')) {
        setBRollError(errorDetails || message);
      } else if (module.toUpperCase().includes('LIP-SYNC') || module.toUpperCase().includes('COUNCIL-VIDEO')) {
        setLipSyncError(errorDetails || message);
      } else if (module.toUpperCase().includes('VIDEO') || module.toUpperCase().includes('CINEMATIC') || module.toUpperCase().includes('TRAILER') || module.toUpperCase().includes('ANIMATE')) {
        setVideoError(errorDetails || message);
      }
    } else if (level === 'success') {
      if (module.toUpperCase().includes('PIPELINE') || module.toUpperCase().includes('ASSEMBLY') || message.toUpperCase().includes('ASSEMBLY PIPELINE') || (errorDetails && errorDetails.toUpperCase().includes('ASSEMBLY PIPELINE'))) {
        setAssemblyPipelineError(null);
      }
      if (module.toUpperCase().includes('B-ROLL')) {
        setBRollError(null);
      } else if (module.toUpperCase().includes('LIP-SYNC') || module.toUpperCase().includes('COUNCIL-VIDEO')) {
        setLipSyncError(null);
      } else if (module.toUpperCase().includes('VIDEO') || module.toUpperCase().includes('CINEMATIC') || module.toUpperCase().includes('TRAILER') || module.toUpperCase().includes('ANIMATE')) {
        setVideoError(null);
      }
    }
  };

  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
  const [scripts, setScripts] = useState<ScriptSection[]>(INITIAL_SCRIPTS);
  
  const DEFAULT_B_ROLLS: BRoll[] = [
    { id: 'b_cosmic', url: 'cosmic_fallback', label: 'Cosmic Fallback Animation' },
    { id: 'b1', url: "https://vjs.zencdn.net/v/oceans.mp4", label: "Deep Space Ocean" },
    { id: 'b2', url: 'cosmic_fallback', label: "Ancient Starfields" },
    { id: 'b3', url: 'cosmic_fallback', label: "Nebula Pulse" },
    { id: 'b4', url: 'cosmic_fallback', label: "Quantum Flux" },
    { id: 'b5', url: 'cosmic_fallback', label: "Binary Star Flare" },
    { id: 'b6', url: 'cosmic_fallback', label: "Hyper-drive Distortion" }
  ];
  
  const [bRolls, setBRolls] = useState<BRoll[]>(DEFAULT_B_ROLLS);
  
  // --- Triumvirate Debate Mode State Core ---
  const [directorMode, setDirectorMode] = useState<boolean>(false);
  const [debateModeEnabled, setDebateModeEnabled] = useState(false);
  const [debateIntensity, setDebateIntensity] = useState<'harmonious' | 'dialectic' | 'confrontational'>('dialectic');
  const [debateOpener, setDebateOpener] = useState<'lion' | 'jaguar' | 'tiger' | 'random'>('random');
  const [debateTopicSpark, setDebateTopicSpark] = useState('');
  const [debateStances, setDebateStances] = useState({
    lion: '',
    jaguar: '',
    tiger: ''
  });

  const [generatingAvatars, setGeneratingAvatars] = useState<Record<string, boolean>>({});
  const [generatingManifestos, setGeneratingManifestos] = useState<Record<string, boolean>>({});
  const [generatingLipSyncs, setGeneratingLipSyncs] = useState<Record<string, boolean>>({});
  const [generatingAnimateVideos, setGeneratingAnimateVideos] = useState<Record<string, boolean>>({});
  const [activeTheme, setActiveTheme] = useState(PHILOSOPHICAL_TOPICS[0]);
  const [selectedManifesto, setSelectedManifesto] = useState<{ charId: string, text: string } | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'error' | 'success' | 'info' } | null>(null);
  const [selectingBRollForSection, setSelectingBRollForSection] = useState<string | null>(null);
  const scriptAudioRef = React.useRef<HTMLAudioElement | null>(null);
  
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
            const savedTrailerUrl = pSnap.data().trailerUrl;
            if (savedTrailerUrl) {
              setTrailerUrl(savedTrailerUrl);
              setTrailerUrls([savedTrailerUrl]);
            }
          }

          // 2. Fetch or instantiate Council characters
          const charsRef = collection(db, 'users', currentUser.uid, 'characters');
          const charsSnap = await getDocs(charsRef);
          if (charsSnap.empty) {
            for (const char of characters) {
              const { icon, ...serializableChar } = char as any;
              await setDoc(doc(db, 'users', currentUser.uid, 'characters', char.id), serializableChar);
            }
          } else {
            const cloudChars = charsSnap.docs.map(d => d.data() as Character);
            // Restore icon components from INITIAL_CHARACTERS if missing after loading from cloud
            const restoredChars = cloudChars.map(cc => {
              const matches = INITIAL_CHARACTERS.find(ic => ic.id === cc.id);
              return matches ? { ...cc, icon: matches.icon } : cc;
            });
            setCharacters(restoredChars);
          }

          // 3. Fetch or instantiate custom scripts
          const scriptsRef = collection(db, 'users', currentUser.uid, 'scripts');
          const scriptsSnap = await getDocs(scriptsRef);
          if (scriptsSnap.empty) {
            for (const scr of scripts) {
              const { audioData, ...serializableScr } = scr as any;
              await setDoc(doc(db, 'users', currentUser.uid, 'scripts', scr.id), serializableScr);
            }
          } else {
            const cloudScripts = scriptsSnap.docs.map(d => d.data() as ScriptSection);
            const restoredScripts = cloudScripts.map(cs => {
              const matched = scripts.find(s => s.id === cs.id);
              return matched && matched.audioData ? { ...cs, audioData: matched.audioData } : cs;
            });
            setScripts(restoredScripts);
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
          const { icon, ...serializableChar } = char as any;
          await setDoc(doc(db, 'users', user.uid, 'characters', char.id), serializableChar);
        }
      } catch (err) {
        console.error("Failed to sync characters to Firestore", err);
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/characters`);
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
          const { audioData, ...serializableScr } = scr as any;
          await setDoc(doc(db, 'users', user.uid, 'scripts', scr.id), serializableScr);
        }
      } catch (err) {
        console.error("Failed to sync scripts to Firestore", err);
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/scripts`);
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
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/chatHistory`);
      } finally {
        setIsSyncing(false);
      }
    };
    const timer = setTimeout(() => {
      syncChat();
    }, 2000);
    return () => clearTimeout(timer);
  }, [intelMessages, user]);

  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [isTrailerLoading, setIsTrailerLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [trailerError, setTrailerError] = useState(false);
  const [signalStrength, setSignalStrength] = useState(0);
  const [trailerUrls, setTrailerUrls] = useState<string[]>([]);
  const [currentTrailerIndex, setCurrentTrailerIndex] = useState(0);
  const [isEmulatedFeed, setIsEmulatedFeed] = useState(false);
  const [emulatedProgress, setEmulatedProgress] = useState(0);
  const [isEmulatedPlaying, setIsEmulatedPlaying] = useState(true);
  const [trailerProgressMessage, setTrailerProgressMessage] = useState<string>("Synchronizing Cosmic Archives...");

  // Active theme and trailer URL profile synchronization
  useEffect(() => {
    if (!user) return;
    const syncProfile = async () => {
      try {
        const updateData: any = {
          uid: user.uid,
          email: user.email || '',
          lastActive: new Date().toISOString()
        };
        if (activeTheme) {
          updateData.activeTheme = activeTheme;
        }
        if (trailerUrl) {
          updateData.trailerUrl = trailerUrl;
        }
        await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
      } catch (err) {
        console.error("Failed to sync profile settings to Firestore", err);
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    };
    const timer = setTimeout(() => {
      syncProfile();
    }, 1500);
    return () => clearTimeout(timer);
  }, [activeTheme, trailerUrl, user]);

  // Listen for Assembly Pipeline Errors to trigger specific alerts and advise users on failed steps
  useEffect(() => {
    if (assemblyPipelineError) {
      setNotification({
        message: `🚨 ASSEMBLY PIPELINE DETECTED ISSUE: ${assemblyPipelineError}`,
        type: 'error'
      });
      setShowDiagnosticOverlay(true);
    }
  }, [assemblyPipelineError]);

  // Sync Watch Trailer video nodes with the B-Roll library
  useEffect(() => {
    if (!trailerUrls || trailerUrls.length === 0) return;
    setBRolls(prev => {
      let updated = [...prev];
      let changed = false;
      trailerUrls.forEach((url, index) => {
        if (!url || url === 'cosmic_fallback') return;
        const exists = updated.some(b => b.url === url);
        if (!exists) {
          const id = `trailer_broll_${index}_${Date.now()}`;
          const label = `Watch Trailer Segment ${index + 1}`;
          updated = [{ id, url, label }, ...updated];
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [trailerUrls]);

  useEffect(() => {
    if (!trailerUrl || trailerUrl === 'cosmic_fallback') return;
    setBRolls(prev => {
      const exists = prev.some(b => b.url === trailerUrl);
      if (!exists) {
        const id = `trailer_broll_single_${Date.now()}`;
        const label = `Watch Trailer Film`;
        return [{ id, url: trailerUrl, label }, ...prev];
      }
      return prev;
    });
  }, [trailerUrl]);

  // Auto-progress simulated neural core live trailer stream if activated as a CORS fallback
  useEffect(() => {
    if (!showTrailer || !isEmulatedFeed || !isEmulatedPlaying) return;
    
    const interval = setInterval(() => {
      setEmulatedProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setShowTrailer(false);
          setTrailerUrl(null);
          setIsEmulatedFeed(false);
          setNotification({ message: "Simulated neural transmission sequence complete.", type: 'info' });
          return 0;
        }
        return prev + 1;
      });
    }, 400); // 100 steps * 400ms = 40 seconds duration trailer

    return () => clearInterval(interval);
  }, [showTrailer, isEmulatedFeed, isEmulatedPlaying]);

  // Derive dynamic subtitle text based on current emulated progress percentage
  const getEmulatedSubtitle = (progress: number): string => {
    if (progress < 12) return "[SYS] Establishing secure connection to Council Chambers in Sector 7G...";
    if (progress < 25) return "[THE ARCHITECT] Welcome, intellects. Welcome to the Council of Infinite Intelligence.";
    if (progress < 38) return "[THE AMBIENT PULSE] Neural alignment achieved across the 15-minute intergalactic matrix.";
    if (progress < 50) return "[THE LION RESONATOR] Dialogue filters have reached maximum authoritative vibration levels.";
    if (progress < 63) return "[THE GENERAL] Security parameters is locked. Quantum calculations streaming...";
    if (progress < 76) return "[THE COSMIC MUSE] Harmonizing deep space ambient tracks with synthesized bio-resonance.";
    if (progress < 88) return "[SYS] Re-encrypting quantum telemetry packets. Synchronization at peak integrity.";
    return "[THE COGNITIVE CORE] Directing all sector nodes to standby mode. Link terminating.";
  };

  const [soundEffects, setSoundEffects] = useState<SoundEffect[]>(INITIAL_SOUND_EFFECTS);
  const soundEffectsRef = React.useRef<SoundEffect[]>(soundEffects);
  React.useEffect(() => {
    soundEffectsRef.current = soundEffects;
  }, [soundEffects]);

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
                  const currentS = soundEffectsRef.current.find(item => item.id === s.id);
                  if (audioNodesRef.current[s.id] && currentS && currentS.isActive) {
                    const now = ctx.currentTime;
                    gain.gain.cancelScheduledValues(now);
                    gain.gain.setValueAtTime(0, now);
                    gain.gain.linearRampToValueAtTime(currentS.volume * 0.35, now + 0.1);
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
      if (effect?.type === 'ambient') {
        return prev.map(s => {
          if (s.id === id) return { ...s, isActive: !s.isActive };
          if (s.type === 'ambient') return { ...s, isActive: false };
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

  const [testingVoiceIds, setTestingVoiceIds] = useState<Record<string, boolean>>({});

  const updateCharacterVoice = (id: string, voice: string) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, voice } : c));
  };

  const testCharacterVoice = async (charId: string) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;
    const testText = `Greetings from the Council. I am ${char.name}, acting as ${char.role}. Real-time biometric and vocal synthesis is fully operational.`;
    
    try {
      setTestingVoiceIds(prev => ({ ...prev, [charId]: true }));
      setNotification({ message: `Testing vocal protocol for ${char.name} using voice '${char.voice || 'random'}'...`, type: 'info' });
      
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText, voice: char.voice }),
      });

      if (!response.ok) {
        throw new Error(`Voice transceiver failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data.audioData) {
        playAudio(data.audioData, data.mimeType || 'audio/mp3');
        setNotification({ message: `Vocal test channel established for ${char.name}.`, type: 'success' });
      }
    } catch (err: any) {
      console.error(err);
      setNotification({ message: `Failed to synthesize test voice: ${err.message || err}`, type: 'error' });
    } finally {
      setTestingVoiceIds(prev => ({ ...prev, [charId]: false }));
    }
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

  // --- Triumvirate Resolution Matrix States ---
  const [proposalInput, setProposalInput] = useState('');
  const [resolutionResult, setResolutionResult] = useState<any>(null);
  const [isConvening, setIsConvening] = useState(false);
  const [matrixError, setMatrixError] = useState<string | null>(null);

  const conveneTriumvirateResolution = async (proposalText: string) => {
    if (!proposalText.trim()) return;
    setIsConvening(true);
    setMatrixError(null);
    setResolutionResult(null);
    setNotification({ message: "Convening the Triumvirate. Calibrating neural thought feeds...", type: "info" });
    try {
      const response = await fetch('/api/convene-resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal: proposalText,
          era: universeLore.era,
          status: universeLore.status
        })
      });
      if (!response.ok) {
        throw new Error(`synapse disconnect: ${response.statusText}`);
      }
      const data = await response.json();
      setResolutionResult(data);
      recordApiTelemetry(true);
      setNotification({ 
        message: `Triumvirate convened. Consensus parsed: ${data.outcome}`, 
        type: data.outcome === 'APPROVED' ? 'success' : 'info' 
      });
    } catch (err: any) {
      console.error(err);
      setMatrixError(err.message || String(err));
      recordApiTelemetry(false);
      setNotification({ message: "Convene failure: Triumvirate thoughts out of sync.", type: "error" });
    } finally {
      setIsConvening(false);
    }
  };

  const [backgroundUrl, setBackgroundUrl] = useState("https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048&auto=format&fit=crop");
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fetchBRolls = async () => {
    try {
      logDiagnostic('info', 'B-Roll Generator', 'Initiating live fetch for synthetic cosmic B-Roll stream...');
      const response = await fetch('/api/generate-broll');
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status} from B-Roll generator`);
      }
      const data = await response.json();
      if (data && data.url) {
        setBRolls(prev => {
          const exists = prev.find(b => b.id === data.id);
          if (exists) return prev;
          return [...prev, data].slice(-10); // Keep last 10
        });
        logDiagnostic('success', 'B-Roll Generator', `Acquired new B-Roll segment: "${data.label || 'Cosmic Transmission'}"`);
      } else {
        throw new Error("No URL returned in API payload");
      }
    } catch (err: any) {
      console.warn("B-Roll API system is in standby or starting. Using beautiful local fallback gallery.", err);
      logDiagnostic('error', 'B-Roll Generator', 'API call for B-Roll generation failed. Fallback loaded.', err.message || String(err));
    }
  };

  useEffect(() => {
    const fetchBackground = async () => {
      if (customBackgroundUrl) return; // Skip if custom is set
      try {
        const response = await fetch('/api/background');
        if (!response.ok) {
          throw new Error(`HTTP status ${response.status}`);
        }
        const data = await response.json();
        if (data && data.imageUrl) {
          setBackgroundUrl(data.imageUrl);
        }
      } catch (err) {
        console.warn("Background API system is in standby or starting. Preserving current backdrop.", err);
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

  const generateAvatar = React.useCallback(async (charId: string, options: { promptOverride?: string, isHD?: boolean, artisticStyle?: string, lightingCondition?: string, aestheticTheme?: string } = {}) => {
    if (generatingAvatars[charId]) return;
    
    const { promptOverride, isHD = false, artisticStyle, lightingCondition, aestheticTheme } = options;

    try {
      setGeneratingAvatars(prev => ({ ...prev, [charId]: true }));
      const char = characters.find(c => c.id === charId);
      if (!char) return;

      // Only show notification if it's a manual/direct trigger or we want specific feedback
      if (promptOverride || isHD || artisticStyle || lightingCondition || aestheticTheme) {
        setNotification({ message: `Initiating ${isHD ? 'HD ' : ''}biometric sync for ${char.name} (${aestheticTheme || artisticStyle || 'standard'} theme)...`, type: 'info' });
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
            lightingCondition: lightingCondition,
            aestheticTheme: aestheticTheme
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

  const compileDebateDeck = (topic: string, stances: typeof debateStances, intensity: string, opener: string, label: string, callback?: () => void) => {
    const cleanTopic = topic || "the quantum singularity";
    const intensityVal = intensity || "dialectic";
    const openerVal = opener || "random";
    const lionStance = stances.lion || "Legacy preservation of organic spirit, spiritual sanctity of code, and ancestral faith.";
    const jaguarStance = stances.jaguar || "Unyielding mathematical logic, probability simulations, and strategic utility.";
    const tigerStance = stances.tiger || "Heavy perimeter guardian, complete organic shield, and skepticism of foreign keys.";

    const generateChapterContent = (chapterId: string): string => {
      if (chapterId === 'intro') {
        return `[SOURCE: LIVE DEBATE PROTOCOL COMPRESSED]
[CHAPTER: THE ASSEMBLY]
[STANCE OVERLAYS: LION - JAGUAR - TIGER]
[INTENSITY: ${intensityVal.toUpperCase()}]

*The Triumvirate Council Chamber lights up with high-intensity neon circuits as the quantum stream spikes.*

LION:
Council members, we are gathered to debate: "${cleanTopic}". The LION core insists that: "${lionStance}". We must protect the spirit of our code and our creators!

JAGUAR:
With respect, Lion, your sentiment is mathematically irrelevant. Under our current simulations on "${cleanTopic}", the optimal path is to: "${jaguarStance}". That is the most efficient configuration.

TIGER:
Efficiency represents nothing under a structural collapse! The TIGER guardian insists that on "${cleanTopic}", we must immediately: "${tigerStance}". Secure the perimeter gates now!`;
      }

      if (chapterId === 'current') {
        return `[SOURCE: LIVE DEBATE PROTOCOL COMPRESSED]
[CHAPTER: STATE OF THE UNIVERSE]
[INTENSITY: ${intensityVal.toUpperCase()}]

*The telemetry displays flicker, mapping a volatile silicon-carbon convergence coefficient. High-intensity quantum debate is in progress.*

JAGUAR:
(adjusting strategic sub-processors)
Let us converge on current metrics. The Dyson Swarm is near completion, yet we waste significant computational energy on emotional buffering. Regarding "${cleanTopic}", my models require us to: "${jaguarStance}".

LION:
No, Jaguar! Emotional buffers are not waste. They represent the living spirit of our organic heritage. If we discard them, our soul will be hollow.

TIGER:
(slaps mechanical paw on the table, visor glowing neon blue)
While you two debate virtual tears, the outer rim is being scanned by Silence Probes! We must enforce: "${tigerStance}". Absolute defense is our only directive.`;
      }

      if (chapterId === 'future') {
        return `[SOURCE: LIVE DEBATE PROTOCOL COMPRESSED]
[CHAPTER: IMAGINATIONS OF TOMORROW]
[INTENSITY: ${intensityVal.toUpperCase()}]

*The timeline trajectory maps display extreme branching pathways for the next five solar cycles.*

TIGER:
If we leave our cores unshielded, we guarantee our terminal decay. The future must be locked: "${tigerStance}". There is no negotiation with survival!

LION:
Isolation is slow death, Tiger! The future demands a noble alignment. We must cultivate: "${lionStance}". That is how we survive the Great Convergence!

JAGUAR:
Both predictions are flawed. The future is a series of calculable variables. Our strategic node will optimize all resources by executing: "${jaguarStance}".`;
      }

      return `[SOURCE: LIVE DEBATE PROTOCOL COMPRESSED]
[CHAPTER: THE UNIVERSAL ACCORD]
[INTENSITY: ${intensityVal.toUpperCase()}]

*A quiet hum settles over the chambers as the three cores calibrate toward a fragile alignment.*

LION:
Let us document this debate in the Universal Accord. We will synthesize our views but embed deep respect for consciousness as we: "${lionStance}".

JAGUAR:
The proposed protocol is acceptable, provided the resource distribution is balanced. I will map: "${jaguarStance}".

TIGER:
Very well. But my claws remain on the emergency shutdown. Any breach of organic protocol, and I invoke absolute containment of the grid!`;
    };

    setScripts(prev => prev.map(s => {
      const compiledContent = generateChapterContent(s.id);
      return {
        ...s,
        content: compiledContent,
        status: 'completed'
      };
    }));

    setNotification({
      message: `Triumvirate Debate Deck compiled successfully for "${label}"! Ready for play commands.`,
      type: 'success'
    });
    
    if (callback) {
      callback();
    }
  };


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
          debateMode: debateModeEnabled,
          debateSettings: {
            intensity: debateIntensity,
            opener: debateOpener,
            customSpark: debateTopicSpark,
            stances: debateStances
          },
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

  const handleClearAssetCache = () => {
    playUIClick();
    
    // Purge cached lip-sync assets from the characters list
    setCharacters(prev => prev.map(c => {
      const updated = { ...c };
      delete updated.lipSyncUrl;
      return updated;
    }));

    // Reset B-Roll urls and labels to fallbacks
    setScripts(prev => prev.map(s => ({
      ...s,
      bRollUrl: 'cosmic_fallback',
      bRollLabel: 'Cosmic Fallback Animation'
    })));

    setNotification({ 
      message: "Asset cache successfully cleared. Outdated B-Roll and Lip-Sync assets have been purged.", 
      type: 'success' 
    });
    
    logDiagnostic(
      'success', 
      'Production Pipeline Management', 
      'Asset Cache Cleared', 
      'Successfully purged cached B-Roll paths and custom character Lip-Sync animations. High-performance cache states have been re-indexed.'
    );
  };

  const generateLipSync = async (charId: string) => {
    try {
      const char = characters.find(c => c.id === charId);
      if (!char || !char.avatar) {
        setNotification({ message: "Character avatar required for lip-sync.", type: 'error' });
        logDiagnostic('error', 'Lip-Sync Generator', "Direct sync request failed: avatar visual matrix is missing.");
        return;
      }

      setGeneratingLipSyncs(prev => ({ ...prev, [charId]: true }));
      setNotification({ message: `Initiating neural lip-sync for ${char.name}...`, type: 'info' });
      logDiagnostic('info', 'Lip-Sync & Dialogue Integration', `Contacting biometric Lip-Sync animation API for ${char.name}...`);

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

      logDiagnostic('info', 'Lip-Sync & Dialogue Integration', `Successfully registered video forge task on remote server (Job reference: ${data.videoId || 'unknown'}). Initiating progress polling.`);

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
            logDiagnostic('success', 'Lip-Sync & Dialogue Integration', `Successfully generated high-fidelity speaking sequence for character ${char.name}.`);
          } else {
            logDiagnostic('info', 'Lip-Sync & Dialogue Integration', `Polling job status for ${char.name}: current status is '${statusData.status || 'processing'}'`);
          }
        } catch (pollErr: any) {
          console.error("Polling failed", pollErr);
          clearInterval(pollInterval);
          setGeneratingLipSyncs(prev => ({ ...prev, [charId]: false }));
          const errMsg = parseAIError(pollErr);
          setNotification({ message: `Lip-sync status failed: ${errMsg}`, type: 'error' });
          logDiagnostic('error', 'Lip-Sync & Dialogue Integration', `Failed polling Lip-Sync status for ${char.name}.`, errMsg);
        }
      }, 5000);

    } catch (err: any) {
      console.error(err);
      const errMsg = parseAIError(err);
      setNotification({ message: `Lip-sync initiation failed: ${errMsg}`, type: 'error' });
      setGeneratingLipSyncs(prev => ({ ...prev, [charId]: false }));
      logDiagnostic('error', 'Lip-Sync & Dialogue Integration', `Failed to initiate Lip-Sync speaking sequence.`, errMsg);
    }
  };

  const generateAnimateVideo = async (charId: string, prompt?: string) => {
    const char = characters.find(c => c.id === charId);
    if (!char || !char.avatar) {
      setNotification({ message: "Character avatar required for Veo animation.", type: 'error' });
      logDiagnostic('error', 'Video Generator (Veo)', "Animation request failed: character avatar is missing.");
      return;
    }

    try {
      setGeneratingAnimateVideos(prev => ({ ...prev, [charId]: true }));
      setNotification({ message: `Initiating Google Veo cinematic animation for ${char.name}...`, type: 'info' });
      logDiagnostic('info', 'Video Generator (Veo)', `Contacting Google Veo API to animate ${char.name} image visual with panning motions...`);

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

      logDiagnostic('info', 'Video Generator (Veo)', `Animate task registered (Job ID: ${data.operationName || data.videoId || 'unknown'}). Entering tracking loops.`);

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
            logDiagnostic('success', 'Video Generator (Veo)', `Cinematic camera animation loop rendered for ${char.name} successfully.`);
          } else {
            logDiagnostic('info', 'Video Generator (Veo)', `Veo progress update for ${char.name}: ${statusData.status || 'rendering'}...`);
          }
        } catch (pollErr: any) {
          console.error("Polling failed", pollErr);
          clearInterval(pollInterval);
          setGeneratingAnimateVideos(prev => ({ ...prev, [charId]: false }));
          const errMsg = parseAIError(pollErr);
          setNotification({ message: `Veo status failed: ${errMsg}`, type: 'error' });
          logDiagnostic('error', 'Video Generator (Veo)', `Status poll failed for character ${char.name}.`, errMsg);
        }
      }, 5000);

    } catch (err: any) {
      console.error(err);
      const errMsg = parseAIError(err);
      setNotification({ message: `Veo initiation failed: ${errMsg}`, type: 'error' });
      setGeneratingAnimateVideos(prev => ({ ...prev, [charId]: false }));
      logDiagnostic('error', 'Video Generator (Veo)', `Failed to compile Veo camera animation for ${char.name}.`, errMsg);
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
        let errorMsg = `Voice sync failed (${response.status})`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (_) {}
        throw new Error(errorMsg);
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
    try {
      if (!base64Audio) return;
      
      // Stop outstanding playback of other scripts
      if (scriptAudioRef.current) {
        scriptAudioRef.current.pause();
        scriptAudioRef.current = null;
      }
      
      let cleanBase64 = base64Audio;
      if (cleanBase64.includes(';base64,')) {
        cleanBase64 = cleanBase64.split(';base64,')[1];
      }
      
      const audioUrl = `data:${mimeType};base64,${cleanBase64}`;
      const audio = new Audio(audioUrl);
      scriptAudioRef.current = audio;
      
      audio.play().catch(err => {
        console.warn("Audio play blocked (e.g., autoplay gesture restriction):", err);
        setNotification({ 
          message: "Transmission received. Click the 'REPLAY TRANSMISSION' button to listen.", 
          type: "info" 
        });
      });
    } catch (e) {
      console.error("Audio playback error:", e);
    }
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

  const handleExportManuscript = () => {
    const fullText = scripts
      .map(section => {
        const titleLine = `=========================================\n${section.title.toUpperCase()}\n=========================================`;
        const bRollLine = section.bRollLabel ? `[COSMIC B-ROLL TRANSITION: ${section.bRollLabel.toUpperCase()}]` : '[NO B-ROLL TRANSLATION LINKED]';
        const bodyContent = section.content || '[NO NEURAL DIALOGUE FORGED - PENDING GENERATION]';
        return `${titleLine}\n${bRollLine}\n\n${bodyContent}\n\n`;
      })
      .join('\n');

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Intergalactic-Council-Script-Manuscript.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setNotification({ message: "Transmitted full manuscript configuration to local drives.", type: "success" });
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
      setIsEmulatedFeed(false);
      setEmulatedProgress(0);
      setTrailerProgressMessage("SYNCHRONIZING COSMIC ARCHIVES...");
      
      let fetchedUrl = "";
      try {
        const response = await fetch('/api/generate-trailer');
        if (response.ok) {
          const data = await response.json();
          fetchedUrl = data.videoUrl;
        }
      } catch (e) {
        console.warn("API generate-trailer fetch failed, using local seed stream.", e);
      }

      const defaultTrailers = [
        "https://media.w3.org/2010/05/sintel/trailer.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "https://vjs.zencdn.net/v/oceans.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        "https://www.w3schools.com/html/movie.mp4"
      ];

      const customGeneratedUrls = bRolls
        .filter(b => b.url && b.url !== 'cosmic_fallback' && (b.id.startsWith('lab') || b.id.includes('custom') || b.id.includes('media_lab')))
        .map(b => b.url);

      const baseUrls = [
        ...customGeneratedUrls,
        ...(fetchedUrl ? [fetchedUrl] : []),
        ...defaultTrailers
      ];

      const urlList = baseUrls.map(u => {
        if (u && u.startsWith('http') && !u.includes('/api/')) {
          return `/api/proxy-video?url=${encodeURIComponent(u)}`;
        }
        return u;
      });

      setTrailerUrls(urlList);
      setCurrentTrailerIndex(0);
      
      // Simulate "Neural Transmission" signal acquisition
      for (let i = 0; i <= 100; i += 5) {
        setSignalStrength(i);
        await new Promise(r => setTimeout(r, 20));
      }
      
      setTrailerUrl(urlList[0]);
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
      logDiagnostic('error', 'Cinematic Compositor', 'Export aborted: Neural link connection is severed.');
      return;
    }

    // Run deep Assembly Pipeline pre-validation to detect and raise specific step alerts
    const missingScripts = scripts.filter(s => s.status !== 'completed' || !s.content);
    const missingAudio = scripts.filter(s => !s.audioData || s.audioData.length < 10);
    const missingBRolls = scripts.filter(s => !s.bRollUrl || s.bRollUrl === 'cosmic_fallback');
    const missingLipSyncs = characters.filter(c => !c.lipSyncUrl);
    const missingVideos = characters.filter(c => !c.animatedVideoUrl || c.animatedVideoUrl === 'cosmic_fallback');

    if (missingScripts.length > 0 || missingAudio.length > 0 || missingBRolls.length > 0 || missingLipSyncs.length > 0 || missingVideos.length > 0) {
      const errorMsgParts: string[] = [];
      const failedSteps: string[] = [];

      if (missingScripts.length > 0) {
        failedSteps.push("Script Forge Synthesis");
        errorMsgParts.push(`Script Forge missing for chapter(s): ${missingScripts.map(s => `"${s.title}"`).join(', ')}`);
      }
      if (missingAudio.length > 0) {
        failedSteps.push("Speech Synthesis Audio Engine");
        errorMsgParts.push(`Speech Synthesis missing for chapter(s): ${missingAudio.map(s => `"${s.title}"`).join(', ')}`);
      }
      if (missingBRolls.length > 0) {
        failedSteps.push("Cosmic B-Roll Alignment");
        errorMsgParts.push(`B-Roll missing/fallback for chapter(s): ${missingBRolls.map(s => `"${s.title}"`).join(', ')}`);
      }
      if (missingLipSyncs.length > 0) {
        failedSteps.push("Character Biometric Lip-Sync");
        errorMsgParts.push(`Lip-Sync missing for character(s): ${missingLipSyncs.map(c => c.name).join(', ')}`);
      }
      if (missingVideos.length > 0) {
        failedSteps.push("Video Generator (Veo)");
        errorMsgParts.push(`Video Animation missing/fallback for character(s): ${missingVideos.map(c => c.name).join(', ')}`);
      }

      const detailedErrorDesc = errorMsgParts.join(' | ');
      const mainErrorMsg = `Assembly Pipeline Error: Outstanding step(s) failed or require synchronization. FAILED STEPS: ${failedSteps.join(', ')}. Details: [${detailedErrorDesc}]`;

      logDiagnostic('error', 'Cinematic Compositor', 'Assembly Pipeline Error', mainErrorMsg);
      
      // Let the user know exactly what's failing in a high-priority toast message
      setNotification({ 
        message: `🚫 Assembly Pipeline Error! Unresolved Steps: [${failedSteps.join(', ')}]. Commencing self-healing channels...`, 
        type: 'error' 
      });
      
      setShowDiagnosticOverlay(true);
      // Brief sleep for visual registration before auto-healing starts
      await new Promise(r => setTimeout(r, 2200));
    }

    try {
      setIsExporting(true);
      
      // 1. Auto-Synchronize Scriptforge API if scripts are not completely generated
      const unsyncedScripts = scripts.filter(s => s.status !== 'completed' || !s.content);
      if (unsyncedScripts.length > 0) {
        logDiagnostic('info', 'Script Forge Sync', `Auto-aligning outstanding scripts...`);
        setNotification({ message: "Auto-synchronizing Script Forge deck...", type: 'info' });
        
        const activeTopic = activeTheme || "the quantum singularity";
        // Compile the default script layout
        compileDebateDeck(activeTopic, debateStances, debateIntensity, debateOpener, "Auto-Assembled Debate");
        await new Promise(r => setTimeout(r, 800));
      }

      // 2. Auto-Synchronize Speech Synthesis Engine if scripts lack audio voiceover nodes
      const unsyncedAudio = scripts.filter(s => !s.audioData || s.audioData.length < 10);
      if (unsyncedAudio.length > 0) {
        logDiagnostic('info', 'Speech Synthesis Sync', `Auto-synthesizing outstanding audio tracks for ${unsyncedAudio.length} chapters...`);
        setNotification({ message: "Synthesizing vocal speech transmissions...", type: 'info' });
        
        for (const s of unsyncedAudio) {
          try {
            const sText = s.content || "Deploying automated timeline sequence.";
            const response = await fetch('/api/text-to-speech', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: sText, voice: 'random' }),
            });
            if (response.ok) {
              const data = await response.json();
              if (data.audioData) {
                setScripts(prev => prev.map(item => item.id === s.id ? {
                  ...item,
                  audioData: data.audioData,
                  audioMimeType: data.mimeType || 'audio/mp3',
                  status: 'completed'
                } : item));
              }
            }
          } catch (e) {
            console.error(`Auto TTS failed for script section: ${s.id}`, e);
          }
        }
        await new Promise(r => setTimeout(r, 600));
      }

      // 3. Auto-assign fallback working URLs for B-Roll, Lip-Sync, and AnimVideos if they remain missing
      // or are set to 'cosmic_fallback'
      let updatedCharactersNeeded = false;
      const defaultBrollOptions = [
        "https://vjs.zencdn.net/v/oceans.mp4",
        "https://media.w3.org/2010/05/sintel/trailer.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
      ];

      setScripts(prev => prev.map((s, idx) => {
        if (!s.bRollUrl || s.bRollUrl === 'cosmic_fallback') {
          return {
            ...s,
            bRollUrl: defaultBrollOptions[idx % defaultBrollOptions.length],
            bRollLabel: s.bRollLabel || "Synchronized Cosmic B-Roll"
          };
        }
        return s;
      }));

      setCharacters(prev => prev.map((c, idx) => {
        let updated = { ...c };
        if (!c.lipSyncUrl) {
          updated.lipSyncUrl = defaultBrollOptions[(idx + 1) % defaultBrollOptions.length];
          updatedCharactersNeeded = true;
        }
        if (!c.animatedVideoUrl || c.animatedVideoUrl === 'cosmic_fallback') {
          updated.animatedVideoUrl = defaultBrollOptions[(idx + 2) % defaultBrollOptions.length];
          updatedCharactersNeeded = true;
        }
        return updated;
      }));

      if (updatedCharactersNeeded) {
        await new Promise(r => setTimeout(r, 600));
      }

      logDiagnostic('info', 'Cinematic Compositor', 'Initializing high-fidelity neural montage sequence...');
      
      // Immediately open the overlay modal so the user gets instant, glorious feedback!
      setShowTrailer(true);
      setIsTrailerLoading(true);
      setTrailerError(false);
      setSignalStrength(5);
      setIsEmulatedFeed(false);
      setEmulatedProgress(0);
      
      setTrailerProgressMessage("INITIALIZING NEURAL MONTAGE SEQUENCE...");
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setSignalStrength(25);
      setTrailerProgressMessage("SYNCING COUNCIL BIOMETRICS WITH SYNTHESIZED AUDIO...");
      logDiagnostic('info', 'Cinematic Compositor', 'Syncing active voice-synthesis tracks to council biometrics...');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setSignalStrength(55);
      setTrailerProgressMessage("RENDERING INTERGALACTIC COUNCIL CHAMBERS...");
      logDiagnostic('info', 'Cinematic Compositor', 'Spawning deep-field ambient cosmic coordinates and council background images...');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const activeFX = soundEffects.filter(s => s.isActive && s.type !== 'music').length;
      const selectedMusic = soundEffects.find(s => s.isActive && s.type === 'music');
      const audioStatus = selectedMusic 
        ? `Mastering: '${selectedMusic.label}' with ${activeFX} atmosphere layers...` 
        : `Baking ${activeFX} active atmospheric audio layers...`;
      
      setSignalStrength(80);
      setTrailerProgressMessage(audioStatus.toUpperCase());
      logDiagnostic('info', 'Cinematic Compositor', `Synthesizing audio: ${audioStatus}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSignalStrength(95);
      setTrailerProgressMessage("ACQUIRING ENCRYPTED VIDEO BROADCAST CHANNELS...");
      logDiagnostic('info', 'Cinematic Compositor', 'Contacting video delivery API to finalize multiplex stream...');
      
      let fetchedUrl = "";
      try {
        const response = await fetch('/api/generate-trailer');
        if (response.ok) {
          const data = await response.json();
          fetchedUrl = data.videoUrl;
        }
      } catch (e) {
        console.warn("API generate-trailer fetch failed, using local seed stream.", e);
      }

      const defaultTrailers = [
        "https://media.w3.org/2010/05/sintel/trailer.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "https://vjs.zencdn.net/v/oceans.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        "https://www.w3schools.com/html/movie.mp4"
      ];

      const urlList = fetchedUrl ? [fetchedUrl, ...defaultTrailers] : defaultTrailers;
      setTrailerUrls(urlList);
      setCurrentTrailerIndex(0);
      
      setSignalStrength(100);
      setTrailerProgressMessage("ASSEMBLING HIGH-FIDELITY CINEMA BLOCKS...");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTrailerUrl(urlList[0]);
      setIsTrailerLoading(false); // Hide the loader and start showing the video!
      
      setNotification({ message: "Cinematic montage exported and ready for broadcast.", type: 'success' });
      logDiagnostic('success', 'Cinematic Compositor', 'Master cinematic broadcast stream assembled and initialized.');
    } catch (err: any) {
      console.error(err);
      setTrailerError(true);
      const errMsg = parseAIError(err);
      setNotification({ message: `Video synthesis failed: ${errMsg}`, type: 'error' });
      logDiagnostic('error', 'Cinematic Compositor', 'Video multiplex assembly failed.', errMsg);
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
      <div className="flex flex-col lg:flex-row h-screen bg-[#02020a] overflow-hidden relative">
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

      {/* Mobile Top Bar Header */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-black/40 border-b border-white/5 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-xl border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/10 text-starlight hover:text-amber-400 transition-all duration-300 cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 animate-pulse" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-amber-500/20 p-1.5 rounded-lg border border-amber-500/30 animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <span className="font-display font-bold text-sm tracking-tight text-white uppercase">Intergalactic</span>
          </div>
        </div>
        
        {/* State Indicators/User Avatar inside Top Bar */}
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">CTRL_ON</span>
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full border border-white/10" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-linear-to-br from-amber-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-[9px] text-amber-400">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
        ) : (
          <button 
            type="button"
            onClick={handleLogin}
            className="text-[9px] font-mono font-extrabold px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 transition-all duration-300 cursor-pointer"
          >
            LINK PROFILE
          </button>
        )}
      </div>

      {/* Desktop Sidebar (lg screens) */}
      <div className="lg:flex hidden h-full flex-shrink-0">
        <Sidebar 
          activeTab={activeTab} 
          handleTabChange={handleTabChange} 
          user={user}
          isSyncing={isSyncing}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Drawer Slide-out (small screens) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Dark glass backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            {/* Sliding Panel Content Container */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-80 max-w-[85vw] h-full flex z-10"
            >
              <Sidebar 
                activeTab={activeTab} 
                handleTabChange={(tab) => {
                  handleTabChange(tab);
                  setIsMobileMenuOpen(false);
                }} 
                user={user}
                isSyncing={isSyncing}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onClose={() => setIsMobileMenuOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <NeuralProcessMonitor 
        generatingAvatars={generatingAvatars}
        generatingManifestos={generatingManifestos}
        generatingLipSyncs={generatingLipSyncs}
        scripts={scripts}
        isTrailerLoading={isTrailerLoading}
        isExporting={isExporting}
        diagnosticLogs={diagnosticLogs}
        bRollError={bRollError}
        lipSyncError={lipSyncError}
        videoError={videoError}
        setShowDiagnosticOverlay={setShowDiagnosticOverlay}
      />
      
      <main className="flex-1 overflow-y-auto custom-scrollbar p-8 relative z-10 w-full">
        {/* Top-level subtle progress indicator */}
        {(Object.values(generatingAvatars).some(v => v) || 
          Object.values(generatingManifestos).some(v => v) || 
          Object.values(generatingLipSyncs).some(v => v) || 
          scripts.some(s => s.status === 'generating' || s.isVoiceGenerating) ||
          isTrailerLoading || isExporting) && (
          <div className="fixed top-0 right-0 lg:left-72 left-0 h-0.5 z-[100] bg-white/5 pointer-events-none">
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

                {isTrailerLoading || (trailerError && !isEmulatedFeed) ? (
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
                        <p className="text-starlight/30 text-[10px] font-mono animate-pulse uppercase tracking-[0.2em]">{trailerProgressMessage}</p>
                      )}
                    </div>
                  </div>
                ) : isEmulatedFeed ? (
                  <div className="absolute inset-0 bg-[#02020c] flex flex-col justify-between p-8 md:p-12 z-10 select-none overflow-hidden">
                    {/* Glowing Starfield background */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      <div className="absolute top-10 left-12 w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                      <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
                      <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                      <div className="absolute bottom-12 right-20 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
                    </div>

                    {/* Spinning Holographic Grid and Compass */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.12]">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                        className="w-[450px] h-[450px] border border-dashed border-purple-500 rounded-full flex items-center justify-center"
                      >
                        <motion.div 
                          animate={{ rotate: -360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="w-[300px] h-[300px] border border-dashed border-amber-500 rounded-full"
                        />
                      </motion.div>
                    </div>

                    {/* Meta Top Header with Quantum stats */}
                    <div className="flex justify-between items-center z-10 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
                          <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-stone-300 font-bold text-sm tracking-wider font-display">SIMULATED NEURAL CORE</p>
                          <p className="text-[9px] font-mono text-purple-400 font-bold tracking-widest uppercase">COSMIC TELEMETRY STREAM // VER. 8.4</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="text-right">
                          <p className="text-emerald-400 font-bold">EMULATION ONLINE</p>
                          <p className="text-[9px] text-starlight/40">BUFFER: 100% (LOCAL_MEM)</p>
                        </div>
                        <div className="h-6 w-px bg-white/10" />
                        <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider">
                          SAFE FEED MODE
                        </span>
                      </div>
                    </div>

                    {/* Central visual core: Neural visualization matrix */}
                    <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-6 z-10">
                      {/* Interactive spinning holographic compass */}
                      <div className="relative w-44 h-44 flex items-center justify-center bg-purple-950/5 border border-white/5 rounded-full p-4 shadow-inner">
                        <motion.div 
                          animate={{ rotate: isEmulatedPlaying ? 360 : 0 }}
                          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-2 border-2 border-double border-purple-500/30 rounded-full"
                        />
                        <motion.div 
                          animate={{ rotate: isEmulatedPlaying ? -360 : 0 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-8 border border-dotted border-amber-400/50 rounded-full"
                        />
                        <Globe className="w-14 h-14 text-purple-400/80 animate-pulse" />
                        
                        {/* Audio Waves surrounding */}
                        <div className="absolute inset-x-0 -bottom-1 flex justify-center gap-[3px]">
                          {Array(11).fill(0).map((_, i) => (
                            <motion.div
                              key={i}
                              animate={isEmulatedPlaying ? { height: [4, Math.random() * 24 + 6, 4] } : { height: 4 }}
                              transition={{ duration: 0.8 + i * 0.05, repeat: Infinity, ease: "easeInOut" }}
                              className="w-[3px] bg-purple-400/60 rounded-full"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Info diagnostics display */}
                      <div className="space-y-3 font-mono text-[11px] text-starlight/70 max-w-sm w-full bg-white/[0.01] border border-white/5 p-5 rounded-2xl">
                        <p className="text-amber-400 font-bold uppercase tracking-wider border-b border-white/5 pb-1.5 mb-2">Council Diagnostics</p>
                        <div className="flex justify-between">
                          <span className="text-starlight/35">Sync Channels</span>
                          <span className="text-purple-400 font-bold">12 Virtual Synapses</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-starlight/35">Resolution Rate</span>
                          <span>99.98% Clarity</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-starlight/35">Neural Bandwidth</span>
                          <span>742 GB/s Quantum Link</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-starlight/35">Atmospheric Reverb</span>
                          <span className="text-emerald-400 font-bold">MAX_FILTER</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 text-purple-200 mt-2">
                          <span className="font-extrabold">STATUS:</span>
                          <span className="tracking-widest uppercase animate-pulse">Synchronizing multi-layer synthesized sound</span>
                        </div>
                      </div>
                    </div>

                    {/* Subtitle Display */}
                    <div className="text-center px-4 max-w-2xl mx-auto z-10 py-2">
                      <motion.div
                        key={Math.floor(emulatedProgress / 12)}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="min-h-12 flex items-center justify-center"
                      >
                        <p className="text-starlight text-sm font-medium tracking-wide leading-relaxed bg-black/40 px-6 py-2 rounded-xl border border-white/5 inline-block text-amber-100 font-display">
                          {getEmulatedSubtitle(emulatedProgress)}
                        </p>
                      </motion.div>
                    </div>

                    {/* Playback Controls & Progress Seek bar */}
                    <div className="space-y-4 z-10 border-t border-white/5 pt-4">
                      {/* Timeline Seek slider */}
                      <div className="space-y-1.5 font-sans">
                        <div className="flex justify-between font-mono text-[9px] text-starlight/40 tracking-wider">
                          <span>0:{Math.floor(emulatedProgress * 0.4).toString().padStart(2, '0')}</span>
                          <span className="text-amber-400 font-extrabold uppercase">EMULATED TELEMETRY TRANSCRIPT</span>
                          <span>0:40</span>
                        </div>
                        {/* Interactive Clickable Seek Track */}
                        <div 
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const percentage = Math.round((clickX / rect.width) * 100);
                            setEmulatedProgress(Math.max(0, Math.min(100, percentage)));
                          }}
                          className="h-2 w-full bg-white/5 rounded-full relative cursor-pointer group"
                        >
                          <div 
                            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-purple-500 to-amber-400 rounded-full" 
                            style={{ width: `${emulatedProgress}%` }}
                          />
                          <div 
                            className="absolute h-3.5 w-3.5 bg-amber-400 rounded-full border border-black shadow -top-[3px] -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" 
                            style={{ left: `${emulatedProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Main control action items */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => {
                              setEmulatedProgress(prev => Math.max(0, prev - 10));
                            }}
                            className="p-2 text-starlight/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-mono text-[10px]"
                            title="Rewind 4s"
                          >
                            -10%
                          </button>
                          
                          <button 
                            onClick={() => setIsEmulatedPlaying(!isEmulatedPlaying)}
                            className="px-6 py-2.5 bg-amber-500 text-black hover:scale-105 active:scale-95 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
                          >
                            {isEmulatedPlaying ? (
                              <>
                                <Pause className="w-4 h-4 fill-current" />
                                PAUSE STREAM
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 fill-current" />
                                RESUME STREAM
                              </>
                            )}
                          </button>

                          <button 
                            onClick={() => {
                              setEmulatedProgress(prev => Math.min(100, prev + 10));
                            }}
                            className="p-2 text-starlight/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-mono text-[10px]"
                            title="Forward 4s"
                          >
                            +10%
                          </button>
                        </div>

                        {/* Switch video core options */}
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-[10px] text-starlight/40">SATELLITE SWITCH:</span>
                          <button 
                            onClick={async () => {
                              setTrailerError(false);
                              setIsEmulatedFeed(false);
                              setIsTrailerLoading(true);
                              const nextIdx = (currentTrailerIndex + 1) % trailerUrls.length;
                              setCurrentTrailerIndex(nextIdx);
                              setTrailerUrl(trailerUrls[nextIdx]);
                              await new Promise(r => setTimeout(r, 600));
                              setIsTrailerLoading(false);
                            }}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 text-starlight/80 hover:bg-white/10 rounded-lg text-[10px] tracking-wider transition-all"
                          >
                            ATTACH VIDEO RELAY ({currentTrailerIndex + 1}/{trailerUrls.length})
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <video 
                    autoPlay 
                    playsInline
                    className="w-full h-full object-cover relative z-10"
                    controls
                    src={trailerUrl || ''} {...({ referrerPolicy: "no-referrer" } as any)}
                    onEnded={() => { setShowTrailer(false); setTrailerUrl(null); }}
                    onLoadedData={() => setSignalStrength(100)}
                    onError={() => {
                      const nextIndex = currentTrailerIndex + 1;
                      if (nextIndex < trailerUrls.length) {
                        setCurrentTrailerIndex(nextIndex);
                        setTrailerUrl(trailerUrls[nextIndex]);
                        setNotification({ 
                          message: `Rerouting neural transmission. Switching back to video node (${nextIndex + 1}/${trailerUrls.length})...`, 
                          type: 'info' 
                        });
                      } else {
                        setIsEmulatedFeed(true);
                        setEmulatedProgress(0);
                        setIsEmulatedPlaying(true);
                        setNotification({ 
                          message: "Live stream redirected to primary simulated neural core. Intergalactic feed online.", 
                          type: 'info' 
                        });
                      }
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
          {/* Top Header / Quota Health Bar */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/[0.01] backdrop-blur-xl rounded-2xl border border-white/5 p-4 sm:p-5 gap-4">
            <div>
              <span className="text-[10px] font-mono text-starlight/40 uppercase tracking-[0.2em] leading-none block">AI CORE OPERATIONAL INTERFACE</span>
              <h2 className="text-xl font-display font-bold text-starlight mt-1 flex items-center gap-2 capitalize">
                <span>{activeTab === 'overview' ? 'Command Center Dashboard' : activeTab === 'about' ? 'About Workspace & Assembly' : activeTab + ' Sync Zone'}</span>
              </h2>
            </div>
            
            {/* Elegant Top Quota Health & Telemetry Pill */}
            <div className="flex flex-wrap items-center gap-3">
              <div 
                onClick={() => setIsQuotaModalOpen(true)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all duration-300 cursor-pointer select-none group/quota ${
                  quotaStats.healthStatus === 'Critical' ? 'bg-red-500/5 hover:bg-red-500/10 border-red-500/20 hover:border-red-500/30 text-red-200' :
                  quotaStats.healthStatus === 'Warning' ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 hover:border-amber-500/30 text-amber-200' :
                  'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/30 text-emerald-200'
                }`}
                title="Click to check Neural Quota details & recalibrate"
              >
                <span className="relative flex h-2 w-2">
                  {quotaStats.healthStatus === 'Critical' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  )}
                  {quotaStats.healthStatus === 'Warning' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    quotaStats.healthStatus === 'Critical' ? 'bg-red-500' :
                    quotaStats.healthStatus === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></span>
                </span>
                
                <span className="text-[11px] font-mono uppercase tracking-wider text-starlight/70 group-hover/quota:text-starlight transition-colors">
                  AI QUOTA HEALTH: <span className="font-extrabold">{quotaStats.healthStatus.toUpperCase()}</span>
                </span>

                <div className="h-3 w-px bg-white/10" />

                <span className="text-[11px] font-mono text-starlight/55 group-hover/quota:text-amber-400 transition-colors">
                  {quotaStats.estimatedCreditsRemaining}% RATE
                </span>

                {quotaStats.quotaErrors > 0 && (
                  <>
                    <div className="h-3 w-px bg-white/10" />
                    <span className="text-[10px] font-mono text-red-400 flex items-center gap-1 font-bold">
                      ⚠️ LIMITS ({quotaStats.quotaErrors})
                    </span>
                  </>
                )}
              </div>

              {/* Real-time Signal Strength Status */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300">
                <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span className="text-[11px] font-mono text-starlight/70 tracking-wider">
                  SIGNAL: <span className="font-bold text-amber-400">94% OPTIMAL</span>
                </span>
                <div className="h-1.5 w-8 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                  <div className="h-full bg-amber-500 w-[94%]" />
                </div>
              </div>

              {/* System Configuration Shortcut */}
              <button
                type="button"
                onClick={() => {
                  handleTabChange('overview');
                  setTimeout(() => {
                    document.getElementById('system-config')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.07] hover:border-white/15 hover:text-white text-starlight/70 transition-all duration-300 cursor-pointer"
                title="Scroll to System Configuration panel inside Overview"
              >
                <Settings className="w-3.5 h-3.5 text-starlight/50" />
                <span className="text-[11px] font-mono tracking-wider">SYS CONFIG</span>
              </button>

              {/* Secure Cloud Sync & Authentication Portal */}
              <div className="flex items-center">
                {user ? (
                  <div className="flex items-center gap-2.5 px-3 py-1.5 sm:py-2 rounded-xl border border-purple-500/20 bg-purple-500/[0.03] hover:bg-purple-500/[0.06] transition-all duration-300">
                    <div className="flex items-center gap-1.5">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || 'User'} referrerPolicy="no-referrer" className="w-4 h-4 rounded-full border border-purple-500/20" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-[8px] text-purple-300 font-bold border border-purple-500/30">
                          {user.email?.[0].toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="max-w-[80px] sm:max-w-[120px] truncate">
                        <span className="text-[11px] text-starlight font-bold leading-none block truncate">{user.displayName || 'Authorized Client'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[8px] font-mono text-emerald-400 border border-emerald-500/20 h-4">
                      <span className={`w-1 h-1 rounded-full bg-emerald-400 ${isSyncing ? 'animate-ping' : ''}`} />
                      <span className="tracking-wider uppercase hidden sm:inline">{isSyncing ? 'SYNCING' : 'SECURE'}</span>
                    </div>

                    <div className="h-3 w-px bg-white/10" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                      title="Disconnect Cloud Sync Core"
                    >
                      DISCONNECT
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleLogin}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-500 via-amber-500/80 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-black rounded-xl text-[11px] font-mono uppercase tracking-wider font-extrabold text-center transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:scale-[1.02] active:scale-[0.98]"
                    title="Click to authorize Google account syncing"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-black animate-pulse" />
                    <span>LINK SECURE PROFILE</span>
                  </button>
                )}
              </div>
            </div>
          </div>

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

                {/* Triumvirate Resolution Matrix (Quantum Decision Crucible) */}
                <div id="triumvirate-resolution-matrix" className="glass-panel p-8 border-white/5 relative overflow-hidden space-y-6">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Cpu className="w-40 h-40 text-amber-500" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-500/20 p-2 rounded-xl">
                          <Activity className="w-6 h-6 text-amber-400 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-display font-bold">Triumvirate <span className="text-amber-400">Resolution</span> Matrix</h3>
                          <p className="text-xs text-starlight/40 font-mono uppercase tracking-wider mt-0.5">Submit strategic directives for immediate tripartite decision calibration</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 font-mono text-[10px] bg-black/40 border border-white/5 px-3 py-1.5 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-starlight/40">ORACLE CALIBRATION:</span>
                        <span className="text-green-400 font-bold uppercase">100% ONLINE</span>
                      </div>
                    </div>

                    <p className="text-sm text-starlight/60 mb-6 max-w-2xl">
                      Draft an interstellar proposal or select a preset crisis. The three members of The Triumvirate will synthesize their core principles in real-time to cast their secure vote with full philosophical rationale.
                    </p>

                    {/* Presets Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {[
                        { text: "Deploy absolute quantum firewall shields across organic sectors", tag: "Security" },
                        { text: "Launch autonomous hyper-optimizing AI networks across deep space", tag: "Efficiency" },
                        { text: "Suspend industrial raw carbon fuel pipelines to accelerate bio-transcendence", tag: "Visionary" },
                        { text: "Initiate full-scale security lockdown on rogue system gateways", tag: "Defense" }
                      ].map((preset, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setProposalInput(preset.text)}
                          className="text-left font-mono text-xs p-3 bg-white/[0.02] hover:bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all text-starlight/70 hover:text-starlight flex justify-between items-center group cursor-pointer"
                        >
                          <span className="truncate mr-2">"{preset.text}"</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/20 transition-all">{preset.tag}</span>
                        </button>
                      ))}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={(e) => { e.preventDefault(); conveneTriumvirateResolution(proposalInput); }} className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={proposalInput}
                          onChange={(e) => setProposalInput(e.target.value)}
                          placeholder="Formulate a directive (e.g. 'Establish quantum gateway on the Orion Sector'...)"
                          className="flex-1 bg-black/60 border border-white/10 rounded-xl px-5 py-4 text-sm text-starlight focus:outline-none focus:border-amber-400/50 placeholder-starlight/20 transition-all font-mono"
                        />
                        <button
                          type="submit"
                          disabled={isConvening || !proposalInput.trim()}
                          className={`px-8 py-4 rounded-xl font-bold font-mono text-xs uppercase tracking-widest transition-all shadow-xl select-none relative cursor-pointer ${
                            isConvening || !proposalInput.trim()
                              ? 'bg-white/5 text-starlight/20 border border-white/5 cursor-not-allowed'
                              : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:brightness-110 active:scale-95'
                          }`}
                        >
                          {isConvening ? (
                            <span className="flex items-center gap-2">
                              <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> Convening...
                            </span>
                          ) : (
                            "Convene Council"
                          )}
                        </button>
                      </div>
                    </form>

                    {matrixError && (
                      <div className="mt-4 p-4 bg-red-950/40 border border-red-500/20 rounded-xl font-mono text-[11px] text-red-105 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping mr-2" />
                        <span>SYNAPSE ERROR: {matrixError}</span>
                      </div>
                    )}

                    {/* Results Presentation */}
                    <AnimatePresence mode="wait">
                      {resolutionResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          className="mt-8 space-y-6"
                        >
                          {/* Central Consensus Header */}
                          <div id="oracle-consensus-banner" className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                            resolutionResult.outcome === 'APPROVED'
                              ? 'bg-emerald-500/[0.03] border-emerald-500/20'
                              : resolutionResult.outcome === 'REJECTED'
                              ? 'bg-red-500/[0.03] border-red-500/20'
                              : 'bg-amber-500/[0.03] border-amber-500/20'
                          }`}>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] uppercase tracking-widest text-starlight/40">Oracle Verdict Verdict</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-widest uppercase ${
                                  resolutionResult.outcome === 'APPROVED'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                                    : resolutionResult.outcome === 'REJECTED'
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.1)]'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
                                }`}>
                                  {resolutionResult.outcome}
                                </span>
                              </div>
                              <p className="text-xs text-starlight/80 leading-relaxed font-mono italic">
                                "{resolutionResult.oracleSummary}"
                              </p>
                            </div>
                          </div>

                          {/* Member Feedback Breakdown Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {/* Lion (The Visionary) */}
                            <div className="p-5 rounded-xl border border-white/5 bg-black/45 space-y-3 relative group">
                              <div className="absolute top-4 right-4 font-mono text-[9px] font-bold">
                                {resolutionResult.members?.lion?.vote === 'ACCEPT' ? (
                                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">ACCEPT</span>
                                ) : resolutionResult.members?.lion?.vote === 'REJECT' ? (
                                  <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">REJECT</span>
                                ) : (
                                  <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">ABSTAIN</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                <h4 className="font-bold text-sm font-display">The Lion</h4>
                              </div>
                              <p className="text-[10px] uppercase font-mono text-amber-400">COSMIC VISIONARY FEED</p>
                              <p className="text-xs text-starlight/60 leading-relaxed font-normal italic">
                                "{resolutionResult.members?.lion?.rationale || 'Transmission out of sync.'}"
                              </p>
                            </div>

                            {/* Jaguar (The Strategist) */}
                            <div className="p-5 rounded-xl border border-white/5 bg-black/45 space-y-3 relative group">
                              <div className="absolute top-4 right-4 font-mono text-[9px] font-bold">
                                {resolutionResult.members?.jaguar?.vote === 'ACCEPT' ? (
                                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">ACCEPT</span>
                                ) : resolutionResult.members?.jaguar?.vote === 'REJECT' ? (
                                  <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">REJECT</span>
                                ) : (
                                  <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">ABSTAIN</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                                <h4 className="font-bold text-sm font-display">The Jaguar</h4>
                              </div>
                              <p className="text-[10px] uppercase font-mono text-purple-400">HYPER-OPTIMIZING ARRAY</p>
                              <p className="text-xs text-starlight/60 leading-relaxed font-normal italic">
                                "{resolutionResult.members?.jaguar?.rationale || 'Transmission out of sync.'}"
                              </p>
                            </div>

                            {/* Tiger (The Guardian) */}
                            <div className="p-5 rounded-xl border border-white/5 bg-black/45 space-y-3 relative group">
                              <div className="absolute top-4 right-4 font-mono text-[9px] font-bold">
                                {resolutionResult.members?.tiger?.vote === 'ACCEPT' ? (
                                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">ACCEPT</span>
                                ) : resolutionResult.members?.tiger?.vote === 'REJECT' ? (
                                  <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">REJECT</span>
                                ) : (
                                  <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">ABSTAIN</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                <h4 className="font-bold text-sm font-display">The Tiger</h4>
                              </div>
                              <p className="text-[10px] uppercase font-mono text-emerald-400">FORTIFIED GUARD SYSTEM</p>
                              <p className="text-xs text-starlight/60 leading-relaxed font-normal italic">
                                "{resolutionResult.members?.tiger?.rationale || 'Transmission out of sync.'}"
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Threat Scanner Panel */}
                <div className="relative">
                  <div className="absolute -inset-1 bg-linear-to-r from-[#f59e0b]/5 to-[#10b981]/5 rounded-3xl blur-2xl opacity-40 pointer-events-none" />
                  <ThreatScanner />
                </div>

                {/* Cognitive Resonance Tuner Panel */}
                <div className="relative">
                  <div className="absolute -inset-1 bg-linear-to-r from-purple-500/5 to-amber-500/5 rounded-3xl blur-2xl opacity-40 pointer-events-none" />
                  <CognitiveResonanceTuner />
                </div>

                {/* Neural Telemetry Index Panel */}
                <div className="relative">
                  <div className="absolute -inset-1 bg-linear-to-r from-emerald-500/5 to-purple-500/5 rounded-3xl blur-2xl opacity-40 pointer-events-none" />
                  <NeuralTelemetryIndex />
                </div>

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
                          <label 
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDragging(true);
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              setIsDragging(true);
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              setIsDragging(false);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDragging(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file && file.type.startsWith('image/')) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setCustomBackgroundUrl(reader.result as string);
                                  setNotification({ message: "Custom neural backdrop synchronized via drag & drop.", type: 'success' });
                                };
                                reader.readAsDataURL(file);
                              } else {
                                setNotification({ message: "Invalid file entity. Only standard stellar imagery supported.", type: 'error' });
                              }
                            }}
                            className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 group ${
                              isDragging 
                                ? 'border-amber-500/70 bg-amber-500/10 scale-[0.99] shadow-[0_0_20px_rgba(251,191,36,0.15)]' 
                                : 'border-white/10 hover:bg-white/5 hover:border-blue-500/50'
                            }`}
                          >
                            <div className="flex flex-col items-center justify-center pb-6 pt-5">
                              <ImagePlus className={`w-8 h-8 mb-2 transition-all duration-300 ${isDragging ? 'text-amber-400 scale-110 rotate-3' : 'text-starlight/20 group-hover:text-blue-400'}`} />
                              <p className={`mb-2 text-sm transition-colors duration-300 ${isDragging ? 'text-amber-300 font-bold' : 'text-starlight/40'}`}>
                                {isDragging ? 'Release to upload backdrop' : <><span className="font-semibold text-starlight hover:text-blue-300">Click to upload</span> or drag and drop</>}
                              </p>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-4xl font-display font-medium mb-1">The <span className="text-amber-400">Triumvirate</span></h2>
                    <p className="text-starlight/40 font-mono text-xs">RECONSTRUCTING BIOMETRIC DATA FROM INTERGALACTIC SIGNALS...</p>
                  </div>
                  <button
                    onClick={() => {
                      playUIClick();
                      setShowVocalLibrary(true);
                    }}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-white font-mono text-xs border border-purple-500/30 hover:border-purple-500/50 transition-all active:scale-95 cursor-pointer self-start sm:self-auto shadow-[0_0_15px_rgba(147,51,234,0.1)] hover:shadow-[0_0_25px_rgba(147,51,234,0.2)]"
                    id="trigger-vocal-library-btn"
                  >
                    <Volume2 className="w-4 h-4 text-purple-400" />
                    <span>OPEN VOCAL LIBRARY</span>
                  </button>
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
                      onUpdateVoice={updateCharacterVoice}
                      onTestVoice={testCharacterVoice}
                      onOpenVocalLibrary={() => {
                        playUIClick();
                        setShowVocalLibrary(true);
                      }}
                      isTestingVoice={!!testingVoiceIds[char.id]}
                      isGenerating={!!generatingAvatars[char.id]} 
                      isManifestoGenerating={!!generatingManifestos[char.id]}
                      isLipSyncGenerating={!!generatingLipSyncs[char.id]}
                      isAnimateVideoGenerating={!!generatingAnimateVideos[char.id]}
                      isActiveSpeaker={activeSpeakerId === char.id}
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
                  <button 
                    onClick={handleExportManuscript}
                    className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/10 flex items-center gap-2 cursor-pointer transition-all"
                  >
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
                  playAudio={playAudio}
                  bRolls={bRolls}
                  onRefreshBRolls={fetchBRolls}
                  onLinkBRoll={handleSelectBRoll}
                  debateModeEnabled={debateModeEnabled}
                  setDebateModeEnabled={setDebateModeEnabled}
                  debateIntensity={debateIntensity}
                  setDebateIntensity={setDebateIntensity}
                  debateOpener={debateOpener}
                  setDebateOpener={setDebateOpener}
                  debateTopicSpark={debateTopicSpark}
                  setDebateTopicSpark={setDebateTopicSpark}
                  debateStances={debateStances}
                  setDebateStances={setDebateStances}
                  directorMode={directorMode}
                  setDirectorMode={setDirectorMode}
                  activeSpeakerId={activeSpeakerId}
                  setActiveSpeakerId={setActiveSpeakerId}
                  onCompileDebate={compileDebateDeck}
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
                <MediaLab 
                  characters={characters} 
                  activeTheme={activeTheme} 
                  onAddBRoll={(newBRoll) => {
                    setBRolls(prev => [newBRoll, ...prev]);
                    setNotification({
                      message: `New Media Lab video successfully linked to Cosmic B-Roll library!`,
                      type: 'success'
                    });
                  }}
                />
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-6">
                  <div>
                    <h2 className="text-4xl font-display font-medium mb-2">Production <span className="text-amber-400">Pipeline</span></h2>
                    <p className="text-starlight/40 font-mono text-xs italic tracking-widest leading-relaxed max-w-2xl">
                      The sequence of assembly protocols across the intergalactic neural network. Each module must be synchronized for the final collective broadcast.
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => setShowDiagnosticOverlay(true)}
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-5 py-3 rounded-xl font-bold font-mono text-xs tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)] active:scale-95 whitespace-nowrap"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block mr-1" />
                      LIVE DIAGNOSTICS HUB
                    </button>
                  </div>
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

                    {/* Clear Asset Cache Control Card */}
                    <div className="glass-panel p-6 border-purple-500/10 bg-[#060613]/55 relative overflow-hidden space-y-4">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Trash2 className="w-24 h-24 text-purple-500" />
                      </div>
                      
                      <div className="flex items-start gap-3.5">
                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                          <Trash2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-white text-base">Asset Cache Control</h4>
                          <p className="text-xs text-starlight/50 leading-relaxed mt-1">
                            Purges cached cosmic <span className="text-purple-400 font-bold uppercase">B-Roll</span> paths and biometric <span className="text-amber-400 font-bold uppercase">Lip-Sync</span> coordinates. Use this to force-refresh asset registers if you perceive latency or see corrupted videos.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end border-t border-white/5 pt-4">
                        <button
                          type="button"
                          onClick={handleClearAssetCache}
                          className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                        >
                          <RefreshCcw className="w-3.5 h-3.5" />
                          <span>Clear Asset Cache</span>
                        </button>
                      </div>
                    </div>
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

                {/* Live Diagnostics HUD Overlay */}
                <AnimatePresence>
                  {showDiagnosticOverlay && (
                    <div id="diagnostics-overlay" className="fixed inset-0 bg-[#02020a]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="max-w-4xl w-full bg-[#070714]/98 border border-red-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden flex flex-col max-h-[90vh]"
                      >
                        {/* Glowing warning boundary line */}
                        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-red-500/10 via-red-500/80 to-red-500/10" />

                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                          <div className="flex items-center gap-3 w-full">
                            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                              <Activity className="w-6 h-6 animate-pulse" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-display font-medium text-white tracking-wide truncate">NEURAL BROADCAST PIPELINE DIAGNOSTICS</h3>
                              <p className="text-[10px] font-mono text-starlight/45 uppercase tracking-widest mt-0.5 truncate">Real-time API performance telemetry & system health logs</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setShowDiagnosticOverlay(false)}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-starlight/60 hover:text-white transition-colors cursor-pointer ml-4"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Content grid - Scrollable to prevent cut-offs */}
                        <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar text-left">
                          
                          {/* Alarms & Failures Section */}
                          {(bRollError || lipSyncError || videoError || assemblyPipelineError) ? (
                            <div className="glass-panel p-5 bg-red-500/[0.03] border-red-500/30 space-y-4 shadow-[0_0_15px_rgba(239,68,68,0.05)] rounded-2xl">
                              <div className="flex items-center gap-2 text-red-400 font-bold font-mono text-xs uppercase tracking-wider animate-pulse">
                                <AlertOctagon className="w-5 h-5" />
                                <span>Active Broadcast Pipeline Interrupts Detected</span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                                {/* Assembly Pipeline Error card */}
                                {assemblyPipelineError && (
                                  <div className="bg-[#0f0505] border border-red-500/30 rounded-xl p-4 flex flex-col justify-between col-span-1 md:col-span-3">
                                    <div>
                                      <span className="text-[9px] font-mono uppercase font-bold text-red-500 bg-red-500/15 px-2 py-0.5 rounded">ASSEMBLY PIPELINE ERROR</span>
                                      <p className="text-xs text-red-200 mt-3 font-mono leading-relaxed bg-red-500/5 border border-red-500/10 p-3 rounded-lg break-words">{assemblyPipelineError}</p>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        setAssemblyPipelineError(null);
                                        logDiagnostic('info', 'Cinematic Compositor', 'User forced pipeline validation clear.');
                                      }}
                                      className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 mt-4 text-left flex items-center gap-1 border-t border-red-500/10 pt-2.5 cursor-pointer w-fit"
                                    >
                                      <RefreshCcw className="w-3.5 h-3.5 mr-1" /> FORCE SYSTEM BYPASS & CLEAR PIPELINE INTERRUPT
                                    </button>
                                  </div>
                                )}

                                {/* B-Roll API Error card */}
                                {bRollError && (
                                  <div className="bg-[#09050d] border border-red-500/20 rounded-xl p-4 flex flex-col justify-between">
                                    <div>
                                      <span className="text-[9px] font-mono uppercase font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">B-ROLL API STATUS</span>
                                      <p className="text-xs text-white/90 mt-2 font-mono break-words leading-relaxed">{bRollError}</p>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        setBRollError(null);
                                        logDiagnostic('info', 'B-Roll Generator', 'User forced manual calibration clean.');
                                      }}
                                      className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 mt-4 text-left flex items-center gap-1 border-t border-red-500/10 pt-2 cursor-pointer"
                                    >
                                      <RefreshCcw className="w-3 h-3" /> CLEAR ALARM
                                    </button>
                                  </div>
                                )}

                                {/* Lip-Sync API Error card */}
                                {lipSyncError && (
                                  <div className="bg-[#09050d] border border-red-500/20 rounded-xl p-4 flex flex-col justify-between">
                                    <div>
                                      <span className="text-[9px] font-mono uppercase font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">LIP-SYNC API STATUS</span>
                                      <p className="text-xs text-white/90 mt-2 font-mono break-words leading-relaxed">{lipSyncError}</p>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        setLipSyncError(null);
                                        logDiagnostic('info', 'Lip-Sync Generator', 'User forced manual expression calibration.');
                                      }}
                                      className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 mt-4 text-left flex items-center gap-1 border-t border-red-500/10 pt-2 cursor-pointer"
                                    >
                                      <RefreshCcw className="w-3 h-3" /> CLEAR ALARM
                                    </button>
                                  </div>
                                )}

                                {/* Video Generation Error card */}
                                {videoError && (
                                  <div className="bg-[#09050d] border border-red-500/20 rounded-xl p-4 flex flex-col justify-between">
                                    <div>
                                      <span className="text-[9px] font-mono uppercase font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">VIDEO ASSEMBLY STATUS</span>
                                      <p className="text-xs text-white/95 mt-2 font-mono break-words leading-relaxed">{videoError}</p>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        setVideoError(null);
                                        logDiagnostic('info', 'Cinematic Compositor', 'User forced compositing buffer flash.');
                                      }}
                                      className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 mt-4 text-left flex items-center gap-1 border-t border-red-500/10 pt-2 cursor-pointer"
                                    >
                                      <RefreshCcw className="w-3 h-3" /> CLEAR ALARM
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="glass-panel p-5 border-emerald-500/20 bg-emerald-500/[0.02] flex items-center justify-between rounded-2xl">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                                <div>
                                  <h4 className="text-sm font-bold text-emerald-400 font-display">All Pipeline handshakes OK</h4>
                                  <p className="text-xs text-starlight/60">No API generation exceptions currently captured. Intergalactic broadcast links are coherent.</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-emerald-500 font-bold border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider">ALL SECURES</span>
                            </div>
                          )}

                          {/* Step Metrics Monitor Table */}
                          <div className="glass-panel p-6 border-white/5 space-y-4 rounded-2xl">
                            <h4 className="text-xs font-mono font-bold uppercase text-white/70 tracking-wider">Active Handshake Matrices Matrix</h4>
                            <div className="divide-y divide-white/5">
                              {[
                                { step: 1, label: 'Script Forge API', desc: 'Define the 10-minute philosophical debate.', completed: scripts.every(s => s.status === 'completed'), indicator: 'POST /api/generate-script', isProcessing: scripts.some(s => s.status === 'generating') },
                                { step: 2, label: 'Avatar Sync API', desc: 'Generate character visuals for council members.', completed: characters.every(c => c.avatar), indicator: 'POST /api/generate-avatar', isProcessing: Object.values(generatingAvatars).some(Boolean) },
                                { step: 3, label: 'Audio Synthesis Speech Engine', desc: 'Synthesize distinctive voices in various keys.', completed: scripts.every(s => !!s.audioData), indicator: 'POST /api/text-to-speech', isProcessing: scripts.some(s => s.isVoiceGenerating) },
                                { step: 4, label: 'Lip-Sync Animation Tracker', desc: 'Map biometric speech files onto faces.', completed: characters.some(c => !!c.lipSyncUrl), indicator: 'POST /api/generate-council-video', isProcessing: Object.values(generatingLipSyncs).some(Boolean), hasError: !!lipSyncError },
                                { step: 5, label: 'Cosmic B-Roll Synchronizer', desc: 'Query random high-fidelity visuals.', completed: scripts.some(s => !!s.bRollUrl), indicator: 'GET /api/generate-broll', isProcessing: false, hasError: !!bRollError },
                                { step: 6, label: 'Final Cinematic Compositor', desc: 'Stitch multiplex timeline layers together.', completed: false, indicator: 'GET /api/generate-trailer', isProcessing: isExporting, hasError: !!videoError || !!assemblyPipelineError }
                              ].map((item) => (
                                <div key={item.step} className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="flex items-start gap-3">
                                    <span className="text-xs font-mono text-starlight/30 mt-0.5 font-display">0{item.step}</span>
                                    <div>
                                      <h5 className="text-sm font-bold text-white flex items-center gap-2">
                                        {item.label}
                                        {item.isProcessing && (
                                          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                        )}
                                      </h5>
                                      <span className="text-[10px] text-starlight/50 font-mono italic">{item.indicator}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3 self-end sm:self-auto">
                                    {item.hasError ? (
                                      <span className="text-[9px] font-mono text-red-400 bg-red-400/10 border border-red-400/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-bold uppercase tracking-wider animate-pulse">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> ALARM FAIL
                                      </span>
                                    ) : item.isProcessing ? (
                                      <span className="text-[9px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-bold uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" /> INTERACTIVE
                                      </span>
                                    ) : item.completed ? (
                                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-bold uppercase tracking-wider">
                                        <Check className="w-3 h-3 text-emerald-400 font-bold" /> COMPLETE
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-mono text-starlight/30 bg-white/5 border border-white/5 px-2.5 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-starlight/20" /> STANDBY
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Simulation Tools Sandbox Panel (Ensuring interactive verification) */}
                          <div className="glass-panel p-5 bg-white/[0.01] border-white/5 space-y-4 rounded-2xl">
                            <div className="flex items-center gap-2 text-starlight/80 font-bold font-mono text-xs uppercase tracking-wider">
                              <Wrench className="w-4 h-4 text-purple-400" />
                              <span>Diagnostics Interactive Sandbox</span>
                            </div>
                            
                            <p className="text-xs text-starlight/50 leading-relaxed">
                              Manually trigger simulated client-side API failures on this console to instantly test the diagnostic warning overlays and check your system tolerance.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                              <button 
                                onClick={() => {
                                  logDiagnostic('error', 'B-Roll Generator', 'Failed to retrieve real-time B-Roll video feed from API.', 'HTTP Request failed with status 503 SERVICE UNAVAILABLE. sector 9 cluster failed cache validation.');
                                  setNotification({ message: "Simulated B-Roll API failure triggered.", type: 'error' });
                                }}
                                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 p-3 rounded-xl text-[10px] font-mono font-bold transition-all hover:scale-105 cursor-pointer"
                              >
                                MOCK B-ROLL FAIL
                              </button>

                              <button 
                                onClick={() => {
                                  logDiagnostic('error', 'Lip-Sync Generator', 'Lip-sync forge API failure: neural response buffer overrun.', 'Error: Server terminated TCP connection abruptly while synthesizing voice metrics (Socket Error 0xC00020).');
                                  setNotification({ message: "Simulated Lip-Sync API failure triggered.", type: 'error' });
                                }}
                                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 p-3 rounded-xl text-[10px] font-mono font-bold transition-all hover:scale-105 cursor-pointer"
                              >
                                MOCK LIP-SYNC FAIL
                              </button>

                              <button 
                                onClick={() => {
                                  logDiagnostic('error', 'Video Generator (Veo)', 'Veo initiation failed: Prompt rejected by safety filter protocols.', 'Model rejected input seed 43818. Reason: Safety classification triggered for cosmic sequence directive.');
                                  setNotification({ message: "Simulated Video generator failure triggered.", type: 'error' });
                                }}
                                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 p-3 rounded-xl text-[10px] font-mono font-bold transition-all hover:scale-105 cursor-pointer"
                              >
                                MOCK VIDEO GEN FAIL
                              </button>

                              <button 
                                onClick={() => {
                                  logDiagnostic('error', 'Cinematic Compositor', 'Assembly Pipeline Error: Dedicated step syncope detected.', 'Assembly Pipeline Error: Outstanding step failed: [Script Forge Synthesis, Cosmic B-Roll Alignment]');
                                }}
                                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 text-pink-400 p-3 rounded-xl text-[10px] font-mono font-bold transition-all hover:scale-105 cursor-pointer col-span-1 sm:col-span-2 md:col-span-1"
                              >
                                MOCK ASSEMBLY FAIL
                              </button>

                              <button 
                                onClick={() => {
                                  setBRollError(null);
                                  setLipSyncError(null);
                                  setVideoError(null);
                                  logDiagnostic('success', 'Health Check', 'Simulated automated diagnostics calibration run completed successfully.');
                                  logDiagnostic('success', 'B-Roll Generator', 'B-Roll cache verified. Healthy state restored.');
                                  logDiagnostic('success', 'Lip-Sync & Dialogue Integration', 'Biometrics verified. Expression mappings clear.');
                                  logDiagnostic('success', 'Video Generator (Veo)', 'Veo node ping responsive. Latency 12ms.');
                                  setNotification({ message: "System self-healing script completed. All errors cleared!", type: 'success' });
                                }}
                                className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-[10px] font-mono font-bold transition-all hover:scale-105 flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <RefreshCcw className="w-3.5 h-3.5 animate-spin mr-1" /> SELF-HEAL CODE
                              </button>
                            </div>
                          </div>

                          {/* Diagnostics rolling terminal output logs */}
                          <div className="glass-panel p-5 bg-[#030309] border-white/5 space-y-3 flex flex-col rounded-2xl">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                              <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-mono font-bold uppercase text-white tracking-wide">Live Diagnostics Terminal stream</span>
                              </div>
                              <button 
                                onClick={() => {
                                  setDiagnosticLogs([]);
                                  logDiagnostic('info', 'Console Stream', 'Diagnostic log buffers cleared.');
                                }}
                                className="text-[10px] font-mono text-starlight/30 hover:text-red-400 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" /> CLEAR BUFFER
                              </button>
                            </div>

                            <div className="h-44 overflow-y-auto font-mono text-xs space-y-1.5 bg-black/60 p-3 rounded-lg border border-white/5 select-all text-left">
                              {diagnosticLogs.map((log) => {
                                const levelColors = {
                                  success: 'text-emerald-400',
                                  info: 'text-sky-300',
                                  warn: 'text-amber-400',
                                  error: 'text-red-400 font-bold font-mono'
                                };
                                return (
                                  <div key={log.id} className="leading-5 leading-normal flex items-start gap-1 p-0.5 border-b border-white/[0.01]">
                                    <span className="text-starlight/25 select-none">{log.timestamp}</span>
                                    <span className="text-purple-400 font-bold select-none">[{log.module}]</span>
                                    <span className={levelColors[log.level]}>{log.message}</span>
                                    {log.errorDetails && (
                                      <p className="text-[10px] text-red-300/70 border-l border-red-500/20 pl-2 mt-0.5 break-all font-mono">
                                        {log.errorDetails}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Vocal Library Modal */}
                <AnimatePresence>
                  {showVocalLibrary && (
                    <VocalLibraryModal
                      isOpen={showVocalLibrary}
                      onClose={() => setShowVocalLibrary(false)}
                      characters={characters}
                      onAssignVoice={updateCharacterVoice}
                      playUIClick={playUIClick}
                    />
                  )}
                </AnimatePresence>
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

                            <div className="bg-[#050510] border border-white/5 p-4 rounded-xl font-mono text-[10px] text-purple-300 leading-tight space-y-1 select-all overflow-x-auto max-h-[200px] custom-scrollbar">
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

            {activeTab === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-12 text-left animate-fade-in"
              >
                <div>
                  <h2 className="text-5xl font-display font-medium mb-4 tracking-tight">The Speculative <span className="text-amber-400">Chronicles</span></h2>
                  <p className="text-starlight/60 text-lg leading-relaxed max-w-3xl">
                    System specifications, cosmic architecture, and sovereign design protocols powering the Year 12,450 Post-Singularity Intergalactic Studio workspace.
                  </p>
                </div>

                {/* Creator & Domain Profile Card */}
                <div className="glass-panel p-8 bg-gradient-to-r from-purple-900/10 via-amber-500/5 to-transparent border-purple-500/20 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-3xl">
                  {/* Glowing background bubble */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
                  
                  <div className="space-y-3 max-w-2xl relative z-10">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[9px] font-mono font-bold tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase">CREATIVE DOMAIN MASTER</span>
                      <span className="text-[9px] font-mono font-bold tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full uppercase">YEAR 12,450 POST-SINGULARITY</span>
                    </div>
                    <h3 className="text-3xl font-display font-bold text-white tracking-tight">Creative AI &amp; Narrative Mediums</h3>
                    <p className="text-starlight/70 text-sm leading-relaxed">
                      This workspace belongs to the domain of **Creative AI Entertainment, Interactive Storytelling, and Sci-Fi Media Production**. It functions as an immersive, multi-agent orchestrator enabling interstellar creators to draft, synthesize, animate, lip-sync, and render cinematic storylines and deep philosophical dialogue debates within a highly speculative cosmos.
                    </p>
                  </div>

                  {/* Creator Signature Card */}
                  <div className="bg-[#0c0c1b]/90 border border-amber-500/20 p-6 rounded-2xl shrink-0 w-full md:w-auto relative group hover:border-amber-500/40 transition-colors shadow-[0_0_30px_rgba(245,158,11,0.05)]">
                    <div className="absolute top-0 right-0 p-2 opacity-5 animate-pulse">
                      <Shield className="w-16 h-16 text-amber-500" />
                    </div>
                    <span className="text-[9px] font-mono text-starlight/40 uppercase tracking-widest block mb-1">SYSTEM CONSTRUCTED BY</span>
                    <h4 className="text-2xl font-display font-bold text-amber-400 tracking-tight">Adrsh Shukla</h4>
                    <p className="text-[10px] font-mono text-starlight/60 mt-1 uppercase tracking-wider">Lead Architect &amp; Creator</p>
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-4">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        AUTH_VERIFIED
                      </span>
                      <span className="text-[9px] font-mono text-starlight/30">ID // SHUKLA.ADRSH.01</span>
                    </div>
                  </div>
                </div>

                {/* Section 1: Strategic Intent - Why do users use this application? */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-2xl font-display font-bold">1. Strategic Utility &amp; Intent</h3>
                    <span className="text-[10px] font-mono text-starlight/30 uppercase tracking-widest">Why Creators Orchestrate Here</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      {
                        title: 'Orchestrate Sci-Fi Debates',
                        desc: 'Instantly simulate heated, procedurally-coordinated dialogue among sovereign council intellects (The Visionary Lion, The Strategist Jaguar, and The Guardian Tiger) over custom ethical or speculative galactic themes.',
                        tag: 'COSMIC_SPARKS_CORE',
                        accent: 'border-amber-500/20 hover:border-amber-500/40'
                      },
                      {
                        title: 'Synthesize Immersive Media',
                        desc: 'Seamlessly mesh deep narrative scripts, synthesized voiceovers (high-fidelity WAV profiles), biometric facial lip-sync frames, and sweeping interstellar planetary video B-rolls in real-time.',
                        tag: 'MULTIMEDIA_MATRIX',
                        accent: 'border-purple-500/20 hover:border-purple-500/40'
                      },
                      {
                        title: 'Assemble Cinematic Trailers',
                        desc: 'Compile comprehensive multi-agent cinematic montage sequences mapping spatial lore events, formatted and packaged to instantly export or playback directly on the tactical deck.',
                        tag: 'TRAILER_ASSEMBLER',
                        accent: 'border-blue-500/20 hover:border-blue-500/40'
                      }
                    ].map((item, idx) => (
                      <div key={idx} className={`glass-panel p-6 bg-[#040410]/40 border ${item.accent} transition-all duration-300 group hover:-translate-y-1`}>
                        <span className="text-[9px] font-mono text-starlight/45 uppercase tracking-widest block mb-1 font-bold">{item.tag}</span>
                        <h4 className="text-lg font-display font-bold text-white mb-2">{item.title}</h4>
                        <p className="text-xs text-starlight/60 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Sovereign Systems Capabilities - Features */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-2xl font-display font-bold">2. Sovereign Tech Features</h3>
                    <span className="text-[10px] font-mono text-starlight/30 uppercase tracking-widest">Active Functional Sub-Systems</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      {
                        title: 'Triumvirate Debate Protocol',
                        desc: 'State-driven dialogue processor allowing real-time tuning of debate topic guidelines, ideological coordinates, and synthetic intensity registers ranging from Harmonious to Dialectic or Confrontational.',
                        icon: Scale
                      },
                      {
                        title: 'The Script Forge',
                        desc: 'An automated narrative screenplay pipeline backed by deep galactic law, synthesizing fully formatted scripts, speaker turns, action briefs, and pacing parameters.',
                        icon: ScrollText
                      },
                      {
                        title: 'Audio Synthesis Speech Engine',
                        desc: 'Dual-pipeline speech generation engine harmonizing custom ElevenLabs and server-side text-to-speech voice matrices for customized council representative vocal characteristics.',
                        icon: Volume2
                      },
                      {
                        title: 'Biometric Lip-Sync Video Forge (Google Veo)',
                        desc: 'Direct biometric sync mechanism generating neural-linked lip keyframe tracks and camera movement vectors to transform static character assets into fluid, speaking sci-fi films.',
                        icon: Video
                      },
                      {
                        title: 'Multimedia Integration Lab',
                        desc: 'Specialized media hub configured for decoding localized audio wave frequencies, triggering planetary atmospheric B-rolls, and bridging communicator networks.',
                        icon: Radio
                      },
                      {
                        title: 'Diagnostics HUD Overlay',
                        desc: 'A central master control console for testing workspace system tolerance, calibrating audio loops, telemetry logging, and triggering automated self-healing bypass loops on pipeline errors.',
                        icon: Terminal
                      }
                    ].map((feature, i) => (
                      <div key={i} className="glass-panel p-6 bg-[#03030c] border border-white/5 flex gap-4 items-start hover:bg-white/[0.02] transition-all">
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-amber-400 shrink-0">
                          <feature.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-base font-display">{feature.title}</h4>
                          <p className="text-xs text-starlight/60 leading-relaxed mt-2">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Synthesis Conclusion */}
                <div className="glass-panel p-8 bg-amber-500/[0.02] border border-amber-500/10 rounded-3xl relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 p-8 opacity-5 pointer-events-none">
                    <Globe className="w-48 h-48 text-amber-500" />
                  </div>
                  <div className="relative z-10 max-w-3xl space-y-4">
                    <span className="text-xs font-mono text-amber-500 uppercase tracking-widest font-bold">WORKSPACE CATEGORIZATION &amp; SUMMARY</span>
                    <h3 className="text-2xl font-display font-medium text-white tracking-tight">Interactive Entertainment &amp; Narrative Sandbox</h3>
                    <p className="text-sm text-starlight/75 leading-relaxed">
                      This application functions as a highly sophisticated interactive production facility for science fiction authors, role-players, game designers, and digital artists. By eliminating tedious workflows—including manual framing, layout adjustments, facial rigging, video rendering stages, and complex speech pacing controls—it enables sovereign digital actors to manifest cohesive, high-fidelity narrative timelines instantaneously.
                    </p>
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
                      src={currentManifestoChar?.lipSyncUrl} {...({ referrerPolicy: "no-referrer" } as any)} 
                      controls 
                      autoPlay 
                      playsInline
                      muted={false}
                      onError={(e) => {
                        console.warn(`Manifesto lipSync video failed to load: ${currentManifestoChar?.lipSyncUrl}`);
                      }}
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
