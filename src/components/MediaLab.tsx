import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatAudioDataUri } from '../App';
import { 
  Sparkles, 
  Video, 
  Mic, 
  Volume2, 
  RefreshCcw, 
  Download, 
  Play, 
  Pause, 
  Trash2, 
  Check, 
  Copy, 
  Radio, 
  Loader2, 
  Upload, 
  Languages, 
  Activity, 
  Smile, 
  VolumeX,
  Compass,
  ArrowRight
} from 'lucide-react';

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
}

interface MediaLabProps {
  characters: Character[];
  activeTheme: string;
  onAddBRoll?: (bRoll: { id: string; url: string; label: string }) => void;
}

export const MediaLab: React.FC<MediaLabProps> = ({ characters, activeTheme, onAddBRoll }) => {
  const [subTab, setSubTab] = useState<'video' | 'transcribe' | 'voice'>('video');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' | null }>({ message: '', type: null });

  // --- 1. Video States ---
  const [videoPrompt, setVideoPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoJob, setVideoJob] = useState<{ videoId?: string; operationName?: string; provider?: string } | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoProgressText, setVideoProgressText] = useState('');
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [loadingVideoBlob, setLoadingVideoBlob] = useState(false);
  const [videoLoadState, setVideoLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [videoErrorDetails, setVideoErrorDetails] = useState<string | null>(null);
  const [canPlayReady, setCanPlayReady] = useState(false);
  const [downloadingVideo, setDownloadingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getVideoMimeType = (url: string | null): string => {
    if (!url) return 'video/mp4';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.webm')) return 'video/webm';
    if (lowerUrl.includes('.ogg') || lowerUrl.includes('.ogv')) return 'video/ogg';
    if (lowerUrl.includes('.avi')) return 'video/x-msvideo';
    if (lowerUrl.includes('.mov')) return 'video/quicktime';
    if (lowerUrl.includes('.mkv')) return 'video/x-matroska';
    return 'video/mp4';
  };

  useEffect(() => {
    let active = true;
    if (generatedVideoUrl) {
      setVideoLoadState('loading');
      setVideoErrorDetails(null);
      setCanPlayReady(false);
      
      if (generatedVideoUrl.startsWith('data:')) {
        setLocalVideoUrl(generatedVideoUrl);
        setVideoLoadState('loaded');
        setCanPlayReady(true);
        return;
      }
      if (generatedVideoUrl.startsWith('http') && !generatedVideoUrl.includes('/api/')) {
        const proxiedUrl = `/api/proxy-video?url=${encodeURIComponent(generatedVideoUrl)}`;
        setLocalVideoUrl(proxiedUrl);
        return;
      }
      
      setLoadingVideoBlob(true);

      const fetchWithRetry = async (url: string, maxRetries = 3, initialDelay = 1000): Promise<Blob> => {
        let lastError: any = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Video fetch status code ${res.status}`);
            return await res.blob();
          } catch (err: any) {
            lastError = err;
            console.warn(`[Video Fetch Platform] Trial ${attempt}/${maxRetries} failed for ${url}:`, err);
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, initialDelay * attempt));
            }
          }
        }
        throw lastError || new Error("Failed after maximum retries");
      };

      fetchWithRetry(generatedVideoUrl)
        .then(blob => {
          if (!active) return;
          const url = URL.createObjectURL(blob);
          setLocalVideoUrl(url);
          setLoadingVideoBlob(false);
        })
        .catch(err => {
          if (!active) return;
          console.error("Local video blob generation failed, attempting backup-proxy fallback stream:", err);
          const proxiedUrl = `/api/proxy-video?url=${encodeURIComponent(generatedVideoUrl)}`;
          setLocalVideoUrl(proxiedUrl);
          setLoadingVideoBlob(false);
        });

      return () => {
        active = false;
      };
    } else {
      setLocalVideoUrl(null);
      setVideoLoadState('idle');
      setVideoErrorDetails(null);
      setCanPlayReady(false);
    }
  }, [generatedVideoUrl]);

  // --- 2. Transcribe States ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState('');
  const [copiedTranscription, setCopiedTranscription] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- 3. Voice States ---
  const [selectedCharId, setSelectedCharId] = useState<string>('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceResponse, setVoiceResponse] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [voiceChatHistory, setVoiceChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; audioUrl?: string }>>([]);
  
  const recognitionRef = useRef<any>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const [voiceMuted, setVoiceMuted] = useState(false);

  // Select first character as default when loaded
  useEffect(() => {
    if (characters.length > 0 && !selectedCharId) {
      setSelectedCharId(characters[0].id);
    }
  }, [characters]);

  // Handle notification automatic dismissal
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ message: '', type: null });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Audio recording stopwatch timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  // Clean playbacks on unmount
  useEffect(() => {
    return () => {
      if (audioPlaybackRef.current) {
        audioPlaybackRef.current.pause();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // --- Notification helper ---
  const triggerNotification = (message: string, type: 'success' | 'info' | 'error') => {
    setNotification({ message, type });
  };

  const downloadVideo = async () => {
    if (!generatedVideoUrl) {
      triggerNotification("No generated video found to download.", "error");
      return;
    }
    setDownloadingVideo(true);
    triggerNotification("Initializing secure cross-origin file download...", "info");
    
    try {
      let downloadUrl = generatedVideoUrl;
      if (localVideoUrl && (localVideoUrl.startsWith('blob:') || localVideoUrl.startsWith('data:'))) {
        downloadUrl = localVideoUrl;
      } else {
        downloadUrl = `/api/proxy-video?url=${encodeURIComponent(generatedVideoUrl)}`;
      }

      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Server returned proxy/direct download status code ${response.status}`);
      }
      
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `veo-cinematic-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      
      triggerNotification("Cinematic video transmission downloaded successfully to local drive.", "success");
    } catch (err: any) {
      console.error("Secure video download failure:", err);
      triggerNotification("Direct download failed. Routing request via backup tab channel...", "error");
      try {
        const link = document.createElement('a');
        link.href = localVideoUrl || generatedVideoUrl;
        link.download = "veo-cinematic.mp4";
        link.target = "_blank";
        link.click();
      } catch (fallbackErr) {
        console.error("Direct fallback channel collapsed:", fallbackErr);
      }
    } finally {
      setDownloadingVideo(false);
    }
  };

  // --- Video Generation Functions ---
  const handleEnhancePrompt = () => {
    if (!videoPrompt) {
      setVideoPrompt("A starship orbiting a neon-lit cyber planet, solar flares reflecting off the metallic hull.");
      return;
    }
    const enhancements = [
      ", extremely detailed digital art, science fiction elements, space cinematic sweeping camera motion, volumetric lighting, epic scale, 8k resolution.",
      ", cyberpunk aesthetic, intricate retro-futuristic detailing, dynamic sci-fi pan shot, neon flares, glowing plasma conduits.",
      ", hyper-detailed, galactic backdrop, rotating camera gaze, stellar nebulae illumination, dramatic atmospheric shadows, cinematic masterpieces.",
    ];
    const picked = enhancements[Math.floor(Math.random() * enhancements.length)];
    setVideoPrompt(prev => prev.trim() + picked);
    triggerNotification("Quantum prompt matrix enhanced!", "success");
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) {
      triggerNotification("Please enter a narrative prompt first.", "error");
      return;
    }

    try {
      setGeneratingVideo(true);
      setGeneratedVideoUrl(null);
      setVideoProgressText("Re-routing solar vectors and aligning quantum grid...");
      triggerNotification("Synthesizing cosmic video stream on the server...", "info");

      const response = await fetch('/api/generate-video-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          aspectRatio,
          resolution
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Cinema core failed (${response.status})`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setVideoJob(data);
      pollVideoStatus(data);

    } catch (err: any) {
      console.error(err);
      triggerNotification(err.message || "Failed initializing Veo video link.", "error");
      setGeneratingVideo(false);
    }
  };

  const pollVideoStatus = (jobData: { videoId?: string; operationName?: string; provider?: string }) => {
    let attempts = 0;
    const intervalTime = 2000;
    setVideoProgressText("Fusing temporal layers and rasterizing voxels... (0s)");

    const interval = setInterval(async () => {
      attempts++;
      const durationSeconds = Math.round((attempts * intervalTime) / 1000);
      setVideoProgressText(`Fusing temporal layers and rasterizing voxels... (${durationSeconds}s)`);

      try {
        const queryParams = jobData.operationName
          ? `operationName=${encodeURIComponent(jobData.operationName)}&provider=veo`
          : `videoId=${jobData.videoId}&provider=simulated_veo`;

        const res = await fetch(`/api/check-animate-status?${queryParams}`);
        if (!res.ok) throw new Error("Verification link severed by remote host.");

        const statusData = await res.json();
        if (statusData.status === 'completed' && statusData.videoUrl) {
          clearInterval(interval);
          setGeneratedVideoUrl(statusData.videoUrl);
          setGeneratingVideo(false);
          setVideoJob(null);
          triggerNotification("Cinematic video stream generated successfully!", "success");
          if (onAddBRoll) {
            const labelText = videoPrompt ? (videoPrompt.length > 40 ? videoPrompt.substring(0, 37) + '...' : videoPrompt) : 'Custom Forge Loop';
            onAddBRoll({
              id: `lab-${Date.now()}`,
              url: statusData.videoUrl,
              label: `Media Lab: ${labelText}`
            });
          }
        } else if (statusData.status === 'failed') {
          clearInterval(interval);
          throw new Error(statusData.error || "The Veo computation core suffered structural collapse.");
        }
      } catch (err: any) {
        clearInterval(interval);
        console.error(err);
        triggerNotification(err.message || "Error during status polling.", "error");
        setGeneratingVideo(false);
        setVideoJob(null);
      }
    }, intervalTime);
  };

  // --- Audio Transcription Functions ---
  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setUploadedBase64(base64data);
          setAudioFileName("Microphone Transmission (Live Capture)");
          triggerNotification("Voice captured and encoded. Ready to decode.", "success");
        };

        // Stop all mic tracks
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      triggerNotification("Recording initialized. Dictate coordinates...", "info");
    } catch (err) {
      console.error(err);
      triggerNotification("Microphone link blocked. Please verify authorizations in settings.", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFileName(file.name);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setUploadedBase64(reader.result as string);
      triggerNotification("Acoustic node uploaded and loaded successfully.", "success");
    };
    reader.onerror = (err) => {
      console.error(err);
      triggerNotification("Failure reading local file data.", "error");
    };
  };

  const handleTranscribe = async () => {
    if (!uploadedBase64) {
      triggerNotification("Please record voice or upload audio telemetry first.", "error");
      return;
    }

    try {
      setTranscribing(true);
      setTranscriptionResult('');
      triggerNotification("Decoding vocal frequencies with Gemini 3.5 Core...", "info");

      // Extract raw base64 data and mimeType
      const match = uploadedBase64.match(/^data:(.*?);base64,(.*)$/);
      let mimeType = "audio/webm";
      let base64 = uploadedBase64;
      
      if (match) {
        mimeType = match[1];
        base64 = match[2];
      }

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: base64,
          mimeType: mimeType
        })
      });

      if (!response.ok) {
        throw new Error(`Decoder returned bad status (${response.status})`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setTranscriptionResult(data.transcription);
      triggerNotification("Acoustic decoding successfully achieved!", "success");
    } catch (err: any) {
      console.error(err);
      triggerNotification(err.message || "Failed transcribing audio data.", "error");
    } finally {
      setTranscribing(false);
    }
  };

  const handleCopyTranscription = () => {
    if (!transcriptionResult) return;
    navigator.clipboard.writeText(transcriptionResult);
    setCopiedTranscription(true);
    setTimeout(() => setCopiedTranscription(false), 2000);
    triggerNotification("Transcript copied to local systems holster.", "success");
  };

  // --- Intergalactic Voice Conversations (Comms) ---
  const activeChar = characters.find(c => c.id === selectedCharId);

  const startVoiceComms = () => {
    if (!activeChar) return;
    setIsVoiceActive(true);
    setVoiceStatus('listening');
    setVoiceTranscript('Listening for communications...');
    triggerNotification(`Establishing neural linkage with ${activeChar.name}...`, "info");

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      triggerNotification("Visual audio link unavailable on this deck (WebSpeech unsupported). Simulating input.", "error");
      simulateVoiceConversation();
      return;
    }

    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setVoiceStatus('listening');
      setVoiceTranscript('Subspace transceiver active. Speak now...');
    };

    rec.onresult = async (event: any) => {
      const phrase = event.results[0][0].transcript;
      setVoiceTranscript(`Captured: "${phrase}"`);
      await processVoiceInput(phrase);
    };

    rec.onerror = (e: any) => {
      console.error("Speech Recognition Error: ", e);
      if (e.error === 'no-speech') {
        rec.stop();
        // restart listening
        setTimeout(() => {
          if (isVoiceActive) rec.start();
        }, 1000);
      } else {
        triggerNotification(`Comms link anomaly: ${e.error}`, "error");
        setIsVoiceActive(false);
        setVoiceStatus('idle');
      }
    };

    rec.onend = () => {
      if (isVoiceActive && voiceStatus === 'listening') {
        try {
          rec.start();
        } catch (_) {}
      }
    };

    rec.start();
  };

  const stopVoiceComms = () => {
    setIsVoiceActive(false);
    setVoiceStatus('idle');
    setVoiceTranscript('');
    setVoiceResponse('');
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
    }
    triggerNotification("Comms channel closed securely.", "info");
  };

  const processVoiceInput = async (spokenText: string) => {
    if (!activeChar) return;

    try {
      setVoiceStatus('thinking');
      setVoiceTranscript(`Received transmission: "${spokenText}"`);

      // Add to chat list
      const updatedHistory = [...voiceChatHistory, { role: 'user' as const, text: spokenText }];
      setVoiceChatHistory(updatedHistory);

      // Create conversation context for Oracle route / Chat route
      // We'll call /api/gemini-intelligence to act like the character!
      const messages = [
        { role: 'user', content: `[MESSAGE FROM COMMANDER]: ${spokenText}` }
      ];

      const conversationContext = {
        theme: activeTheme,
        focusedCharacter: activeChar.name,
        systemInstruction: `You are ${activeChar.name}, who holds the role: "${activeChar.role}". Description: ${activeChar.description || ""}.
        Speak back to the Intergalactic Commander as this exact character. Frame your answer in 1-2 powerful, conversational sentences, written perfectly for audio playback. Keep. It. Short. Max 35 words. Always stay in character. Do not use markdown bullet lists, just speech.`
      };

      const response = await fetch('/api/gemini-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages,
          context: conversationContext
        })
      });

      if (!response.ok) throw new Error("Cognitive core response timed out.");
      const data = await response.json();
      
      const reply = data.text;
      setVoiceResponse(reply);

      // Synthesis step: TTS
      setVoiceStatus('speaking');
      const voiceId = activeChar.voice || 'random'; // E.g., 'lion', 'jaguar', etc. Or preset values
      
      const ttsResponse = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${activeChar.name}: ${reply}`,
          voice: voiceId
        })
      });

      if (ttsResponse.ok) {
        const ttsData = await ttsResponse.json();
        if (ttsData.audioData) {
          const audioUrl = formatAudioDataUri(ttsData.audioData, ttsData.mimeType || 'audio/wav');
          setVoiceChatHistory(prev => [...prev, { role: 'assistant', text: reply, audioUrl }]);
          
          if (!voiceMuted) {
            const audioObj = new Audio(audioUrl);
            audioPlaybackRef.current = audioObj;
            
            const handleEnded = () => {
              if (isVoiceActive) {
                setVoiceStatus('listening');
                setVoiceTranscript('Listening for communications...');
                // Trigger next loop of speech recognition if possible
                try {
                  if (recognitionRef.current) recognitionRef.current.start();
                } catch (_) {}
              }
            };
            
            audioObj.onended = handleEnded;
            audioObj.onerror = handleEnded;
            audioObj.play().catch(e => {
              console.warn("MediaLab audio play notice:", e);
              handleEnded();
            });
          } else {
            setTimeout(() => {
              if (isVoiceActive) {
                setVoiceStatus('listening');
              }
            }, 3000);
          }
        } else {
          throw new Error("Missing audio payload.");
        }
      } else {
        throw new Error("Text-to-speech engine calibration failed.");
      }

    } catch (err: any) {
      console.error(err);
      triggerNotification(err.message || "Synthesis relay failed.", "error");
      setVoiceStatus('listening');
    }
  };

  const simulateVoiceConversation = () => {
    // Elegant local script simulation for demo fallback without native mic or if browser doesn't support mic
    let userSpokenText = "Requesting warp speed structural report.";
    const prompts = [
      "Requesting visual warp shield status report.",
      "Are the dark matter fuel reserves calibrated?",
      "Commander inquiring on current navigation threats.",
      "Is the Council ready for structural sync?"
    ];
    userSpokenText = prompts[Math.floor(Math.random() * prompts.length)];
    
    setVoiceTranscript(`Commander (Simulated): "${userSpokenText}"`);
    setTimeout(() => {
      processVoiceInput(userSpokenText);
    }, 2000);
  };

  return (
    <div className="space-y-8 text-left">
      <div>
        <h2 className="text-4xl font-display font-medium mb-2">Galactic <span className="text-amber-400">Media Lab</span></h2>
        <p className="text-starlight/40 font-mono text-xs italic tracking-widest leading-relaxed max-w-2xl">
          Advanced A/V propagation deck. Generate planetary video sequences, decode vocal frequencies, and establish secure telepathic voice comms directly.
        </p>
      </div>

      {/* Lab Tabs */}
      <div className="flex border-b border-white/5 gap-2 select-none overflow-x-auto pb-1 scroll-hide">
        {[
          { id: 'video', label: '🎬 Neural Cinema', desc: 'Text-To-Video' },
          { id: 'transcribe', label: '📜 Sonic Decipher', desc: 'Audio Transcriber' },
          { id: 'voice', label: '🗣️ Telepathic Comms', desc: 'Voice Conversation' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              stopVoiceComms();
              stopRecording();
              setSubTab(tab.id as any);
            }}
            className={`px-6 py-3 border-t-2 rounded-t-xl transition-all duration-300 ${
              subTab === tab.id
                ? 'bg-amber-500/5 text-amber-400 border-t-amber-400 border-x border-x-white/5 font-bold'
                : 'text-starlight/40 border-t-transparent border-x border-x-transparent hover:text-starlight hover:bg-white/[0.02]'
            }`}
          >
            <div className="text-sm font-sans tracking-tight">{tab.label}</div>
            <div className="text-[9px] font-mono opacity-50 tracking-wider uppercase mt-0.5">{tab.desc}</div>
          </button>
        ))}
      </div>

      {/* Notifications banner */}
      <AnimatePresence>
        {notification.message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-xl border flex items-center gap-3 text-xs font-mono font-bold tracking-tight ${
              notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              notification.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              'bg-blue-500/10 text-blue-400 border-blue-500/20 bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
            <p className="flex-1">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-panel p-8 relative overflow-hidden min-h-[500px]">
        {/* Decorative Grid Line */}
        <div className="absolute top-0 right-0 w-24 h-24 border-t border-r border-white/5 pointer-events-none rounded-tr-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 border-b border-l border-white/5 pointer-events-none rounded-bl-3xl" />

        {/* --- TAB 1: GENERATE VIDEO FROM TEXT --- */}
        {subTab === 'video' && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold font-sans flex items-center gap-2">
                  <Video className="w-5 h-5 text-amber-500" />
                  <span>Interactive Text-To-Video Forge</span>
                </h3>
                <p className="text-xs text-starlight/45 mt-1 font-mono">POWERED BY GOOGLE VEO 3.1 CINEMATIC MODEL</p>
              </div>
              <button 
                onClick={handleEnhancePrompt} 
                className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-lg text-[10px] font-mono uppercase tracking-wider border border-purple-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                <span>Enhance Prompts</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-starlight/40 uppercase tracking-widest block">Cinematic Scenario Prompt</label>
              <textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="Describe your intergalactic cinematic vision... (e.g. A supernova exploding near a crystalline observation array. Kinetic orbital photography.)"
                className="w-full h-32 bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-starlight focus:outline-none focus:border-amber-500/40 font-sans tracking-wide leading-relaxed resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-starlight/40 uppercase tracking-widest block">Cinema Aspect Ratio</span>
                <div className="flex gap-3">
                  {[
                    { id: '16:9', label: '16:9 Landscape', icon: '📺' },
                    { id: '9:16', label: '9:16 Portrait', icon: '📱' },
                  ].map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => setAspectRatio(ratio.id as any)}
                      className={`flex-1 py-3 px-4 border rounded-xl font-mono text-xs text-center transition-all cursor-pointer ${
                        aspectRatio === ratio.id
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 font-bold'
                          : 'border-white/5 bg-white/[0.01] text-starlight/50 hover:bg-white/5'
                      }`}
                    >
                      <span className="mr-2">{ratio.icon}</span>
                      <span>{ratio.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono text-starlight/40 uppercase tracking-widest block">Core Resolution</span>
                <div className="flex gap-3">
                  {[
                    { id: '720p', label: 'HD Cinematic (720p)' },
                    { id: '1080p', label: 'Full Ultra (1080p)' },
                  ].map((resOpt) => (
                    <button
                      key={resOpt.id}
                      onClick={() => setResolution(resOpt.id as any)}
                      className={`flex-1 py-3 px-4 border rounded-xl font-mono text-xs text-center transition-all cursor-pointer ${
                        resolution === resOpt.id
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 font-bold'
                          : 'border-white/5 bg-white/[0.01] text-starlight/50 hover:bg-white/5'
                      }`}
                    >
                      {resOpt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col items-center">
              {generatingVideo ? (
                <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                  <p className="text-sm font-sans font-medium text-starlight text-center">Weaving Spatial Frames from Text...</p>
                  <p className="text-[10px] font-mono text-amber-400/80 uppercase tracking-wider text-center">{videoProgressText}</p>
                </div>
              ) : generatedVideoUrl ? (
                <div className="w-full space-y-4">
                  <div className="border border-white/10 rounded-2xl overflow-hidden bg-black aspect-video relative group flex items-center justify-center">
                    {(loadingVideoBlob || videoLoadState === 'loading') && videoLoadState !== 'error' ? (
                      <div className="text-center p-6 space-y-3 z-10 absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                        <Loader2 className="w-6 h-6 text-amber-400 animate-spin mx-auto animate-pulse" />
                        <p className="text-xs font-mono text-amber-400/90 uppercase tracking-wide">Syncing neural video buffer...</p>
                        <p className="text-[10px] font-mono text-starlight/40 uppercase">Mapping frame array dimensions & spectrum MIME type</p>
                      </div>
                    ) : null}

                    {videoLoadState === 'error' && (
                      <div className="absolute inset-0 z-20 bg-neutral-950 p-6 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl shrink-0">
                          <Activity className="w-8 h-8 animate-pulse text-red-500" />
                        </div>
                        <div className="space-y-1.5 max-w-sm">
                          <p className="text-[10px] font-mono text-red-400 uppercase font-black tracking-widest leading-relaxed">COGNITIVE VIDEO CONVERGENCE FAIL</p>
                          <p className="text-xs text-starlight/60 leading-relaxed font-sans">
                            {videoErrorDetails || "Underlying video asset failed decoding or generated CORS mismatch."}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            console.log("Engaging direct bypass on play error...");
                            setVideoLoadState('loading');
                            setVideoErrorDetails("Attempting absolute direct media render stream...");
                            if (generatedVideoUrl) {
                              setLocalVideoUrl(generatedVideoUrl);
                            }
                          }}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold font-mono text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                        >
                          Bypass Proxy & Re-route Direct
                        </button>
                      </div>
                    )}

                    <video
                      key={localVideoUrl || generatedVideoUrl || 'no-video'}
                      ref={videoRef}
                      controls
                      loop
                      crossOrigin="anonymous"
                      {...({ referrerPolicy: 'no-referrer' } as any)}
                      className={`w-full h-full object-contain ${videoLoadState === 'error' ? 'hidden' : 'block'}`}
                      onLoadStart={() => {
                        console.log("HTML5 Video tag started load.");
                        setVideoLoadState('loading');
                        setCanPlayReady(false);
                      }}
                      onLoadedData={() => {
                        console.log("HTML5 Video first frame decoded successfully.");
                      }}
                      onCanPlay={(e) => {
                        console.log("HTML5 Video ready signal received: play sequences unblocked.");
                        setVideoLoadState('loaded');
                        setCanPlayReady(true);
                        
                        const video = e.currentTarget;
                        video.play().catch(playErr => {
                          console.warn("Cybernetic auto-play on canplay throttled by user policy/browser permissions overlay:", playErr);
                        });
                      }}
                      onError={(e) => {
                        const err = e.currentTarget.error;
                        let errStr = "An unknown error halted playback.";
                        if (err) {
                          switch (err.code) {
                            case 1: errStr = "PROCESS_ABORTED: The media fetch was cancelled."; break;
                            case 2: errStr = "NETWORK_ERROR: Cybernetic stream severed mid-download."; break;
                            case 3: errStr = "DECODE_ERROR: Temporal frames corrupted or MIME conflict."; break;
                            case 4: errStr = "SOURCE_NOT_SUPPORTED: The format cannot be computed by your matrix."; break;
                          }
                        }
                        console.warn("Video render collapsed:", errStr);
                        setVideoLoadState('error');
                        setVideoErrorDetails(errStr);
                        setCanPlayReady(false);
                      }}
                    >
                      <source 
                        src={localVideoUrl || generatedVideoUrl || undefined} 
                        type={getVideoMimeType(localVideoUrl || generatedVideoUrl)}
                        onError={(e) => {
                          console.warn("Inner source element caught error during compilation.");
                          setVideoLoadState('error');
                          setVideoErrorDetails("Underlying network connection failed or stream mime-type is unrecognized.");
                        }}
                      />
                      Your browser does not support the playback of these deep space video archives.
                    </video>
                  </div>
                  <div className="flex justify-between items-center bg-white/[0.02] p-4 border border-white/5 rounded-xl">
                    <div className="overflow-hidden">
                      <p className="text-xs font-mono text-emerald-400 uppercase font-black tracking-widest">VEOSYNTHESIS COMPLETE</p>
                      <p className="text-[10px] font-sans text-starlight/60 truncate mt-0.5 mt-1 leading-relaxed">Prompt: "{videoPrompt}"</p>
                    </div>
                    <a
                      href={localVideoUrl || generatedVideoUrl}
                      download="veo-cinematic.mp4"
                      className="p-3 bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)] shrink-0 flex items-center gap-2 text-xs font-sans font-bold"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Video</span>
                    </a>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerateVideo}
                  className="w-full py-4 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold rounded-xl text-sm uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_20px_rgba(251,191,36,0.15)] hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] flex items-center justify-center gap-3 font-bold"
                >
                  <Sparkles className="w-5 h-5 text-black" />
                  <span>Generate Video from text</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 2: TRANSCRIBE AUDIO --- */}
        {subTab === 'transcribe' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold font-sans flex items-center gap-2">
                <Languages className="w-5 h-5 text-amber-500" />
                <span>Sonic Frequency Decoder (Transcription)</span>
              </h3>
              <p className="text-xs text-starlight/45 mt-1 font-mono">DECODE COMPLEX SYSTEM OR COMMUNICATOR DIALOGUES FROM AUDIO</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sound Input selection */}
              <div className="space-y-6">
                {/* Method A: Microphone */}
                <div className="p-5 border border-white/5 bg-white/[0.01] rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-starlight/40 uppercase tracking-widest font-bold">METHOD 1: MIC BROADCAST LINK</span>
                    {isRecording && (
                      <span className="flex items-center gap-1.5 bg-red-500/10 px-2 py-0.5 rounded text-[8px] font-mono text-red-400 border border-red-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        <span>RECONSTRUCTING CORES ({recordingSeconds}s)</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 justify-between">
                    <div>
                      <p className="text-sm font-sans font-bold">Quantum Audio Capturer</p>
                      <p className="text-xs text-starlight/50 leading-relaxed max-w-xs mt-1">Record clear neural or voice notes directly from this console bridge terminal.</p>
                    </div>

                    <div className="shrink-0">
                      {isRecording ? (
                        <button
                          onClick={stopRecording}
                          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-400 transition-all cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.25)]"
                        >
                          <Pause className="w-6 h-6 animate-pulse" />
                        </button>
                      ) : (
                        <button
                          onClick={startRecording}
                          className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center text-black hover:bg-amber-400 transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                        >
                          <Mic className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Method B: Upload file */}
                <div className="p-5 border border-white/5 bg-white/[0.01] rounded-2xl space-y-4">
                  <span className="text-[10px] font-mono text-starlight/40 uppercase tracking-widest font-bold block">METHOD 2: FILE UPLOAD TRANSCEIVER</span>
                  <div className={`border border-dashed rounded-xl p-6 text-center transition-all duration-300 relative flex flex-col items-center justify-center bg-black/45 ${
                    isDragging 
                      ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.1)] scale-[0.99]' 
                      : 'border-white/10 hover:border-amber-500/30'
                  }`}>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        setIsDragging(false);
                        handleAudioUpload(e);
                      }}
                      onDragOver={() => setIsDragging(true)}
                      onDragEnter={() => setIsDragging(true)}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={() => setIsDragging(false)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className={`w-8 h-8 mb-3 transition-colors duration-300 ${isDragging ? 'text-amber-400 animate-bounce' : 'text-starlight/40'}`} />
                    <p className={`text-xs font-sans font-semibold transition-colors duration-300 ${isDragging ? 'text-amber-300 font-bold' : ''}`}>
                      {isDragging ? 'Drop acoustic node file here' : 'Deploy Audio Node File'}
                    </p>
                    <p className="text-[9px] font-mono text-starlight/30 uppercase mt-1">Accepts WAV, MP3, M4A, WEBM (Max 25MB)</p>
                  </div>
                </div>

                {/* Active telemetry info */}
                {audioFileName && (
                  <div className="p-4 bg-amber-500/[0.03] border border-amber-500/20 rounded-xl flex items-center justify-between">
                    <div className="overflow-hidden pr-3">
                      <p className="text-[10px] font-mono text-starlight/30 uppercase tracking-widest leading-none">TARGET ACOUSTIC WAVE</p>
                      <p className="text-xs font-sans font-bold text-amber-400 truncate mt-1.5">{audioFileName}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUploadedBase64(null);
                        setAudioFileName(null);
                        setTranscriptionResult('');
                        triggerNotification("Acoustic nodes recycled.", "info");
                      }}
                      className="p-2 border border-white/10 rounded-lg hover:border-red-500/30 hover:bg-red-500/10 text-starlight/40 hover:text-red-400 transition-all cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button
                  onClick={handleTranscribe}
                  disabled={!uploadedBase64 || transcribing}
                  className={`w-full py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 cursor-pointer transition-all border ${
                    !uploadedBase64 ? 'opacity-40 border-white/5 bg-white/[0.01] text-starlight/35 cursor-not-allowed' :
                    'bg-white text-black border-white hover:bg-amber-450 hover:border-amber-450 shadow-[0_0_20px_rgba(255,255,255,0.08)]'
                  }`}
                >
                  {transcribing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>DECIPHERING DECK IN PROGRESS...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4" />
                      <span>Transcribe Audio File</span>
                    </>
                  )}
                </button>
              </div>

              {/* Translation Output results */}
              <div className="flex flex-col border border-white/10 rounded-2xl bg-black/60 overflow-hidden relative">
                <div className="border-b border-white/10 p-4 flex justify-between items-center bg-white/[0.01]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-[10px] font-mono tracking-widest uppercase">Decoded Stream Console</span>
                  </div>
                  {transcriptionResult && (
                    <button
                      onClick={handleCopyTranscription}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all flex items-center gap-1 text-starlight cursor-pointer"
                    >
                      {copiedTranscription ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedTranscription ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  {transcribing ? (
                    <div className="flex-1 flex flex-col justify-center items-center py-16 space-y-3">
                      <Activity className="w-8 h-8 text-amber-500 animate-pulse" />
                      <p className="text-xs font-mono text-amber-400/80 animate-pulse uppercase tracking-wider">Demodulating neural waves...</p>
                    </div>
                  ) : transcriptionResult ? (
                    <div className="text-sm font-sans text-starlight leading-relaxed select-text whitespace-pre-wrap max-h-96 overflow-y-auto pr-2">
                      {transcriptionResult}
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col justify-center items-center py-16 text-center text-starlight/30 space-y-2">
                      <Languages className="w-10 h-10 stroke-1" />
                      <p className="text-xs font-mono uppercase tracking-widest leading-none mt-2">Awaiting Transceiver Broadcast</p>
                      <p className="text-[10px] font-sans max-w-xs mt-1">Record voice message or upload an audio telemetry capsule, then run decipher protocol.</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/5 text-[9px] font-mono text-starlight/25 flex justify-between items-center">
                    <span>COGNITIVE MATRIX TRANSCRIBER: STABLE</span>
                    <span>COORDINATES: DECK 3-DEC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: VOICE CONVERSATIONS (COMMS) --- */}
        {subTab === 'voice' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold font-sans flex items-center gap-2">
                  <Radio className="w-5 h-5 text-amber-500" />
                  <span>Subspace Telepathic Audio Comms</span>
                </h3>
                <p className="text-xs text-starlight/45 mt-1 font-mono">ESTABLISH LIVE ENCRYPTED VOICE DIALOGUE WITH COUNCIL ADVISORS</p>
              </div>

              {/* Selector for Council Character */}
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                {characters.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => {
                      if (isVoiceActive) stopVoiceComms();
                      setSelectedCharId(char.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                      selectedCharId === char.id
                        ? 'bg-amber-500 text-black font-black'
                        : 'text-starlight/75 hover:bg-white/5'
                    }`}
                  >
                    {char.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Interactive Circle and Status View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4">
              {/* Pulsator and Audio Level visualizer */}
              <div className="lg:col-span-4 p-6 border border-white/10 bg-black/40 rounded-2xl flex flex-col justify-between items-center text-center relative min-h-[300px]">
                <div>
                  <span className="text-[9px] font-mono text-starlight/30 uppercase tracking-[0.2em]">Live Biometrics</span>
                  <h4 className="text-base font-bold font-sans text-amber-400 mt-1">{activeChar?.name}</h4>
                  <p className="text-[10px] font-mono text-starlight/50 uppercase italic leading-none mt-1">{activeChar?.role}</p>
                </div>

                {/* Animated Concentric Visualizer circles */}
                <div className="relative w-40 h-40 flex items-center justify-center my-6">
                  {isVoiceActive ? (
                    <>
                      {/* Listening pulsing circles */}
                      {voiceStatus === 'listening' && (
                        <>
                          <motion.div
                            animate={{ scale: [1, 2], opacity: [0.35, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                            className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                            transition={{ duration: 2, delay: 0.6, repeat: Infinity, ease: 'easeOut' }}
                            className="absolute inset-0 rounded-full border border-emerald-500/20"
                          />
                        </>
                      )}

                      {/* Thinking spinner / ring */}
                      {voiceStatus === 'thinking' && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-0 rounded-full border-t-2 border-r-2 border-b border-l border-amber-500/40"
                        />
                      )}

                      {/* Speaking wave circles */}
                      {voiceStatus === 'speaking' && (
                        <>
                          <motion.div
                            animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                            className="absolute inset-0 rounded-full border-2 border-purple-500/20"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
                            transition={{ duration: 1.6, delay: 0.5, repeat: Infinity, ease: 'easeOut' }}
                            className="absolute inset-0 rounded-full border border-purple-500/15"
                          />
                        </>
                      )}

                      {/* Actual core speaker bulb */}
                      <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center border transition-all duration-500 shadow-xl ${
                        voiceStatus === 'listening' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                        voiceStatus === 'thinking' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                        'bg-purple-500/10 border-purple-500/30 text-purple-300'
                      }`}>
                        {activeChar?.avatar ? (
                          <img 
                            src={activeChar.avatar} 
                            alt={activeChar.name} 
                            referrerPolicy="no-referrer"
                            className={`w-24 h-24 rounded-full border ${
                              voiceStatus === 'listening' ? 'border-emerald-500/40 animate-pulse' :
                              voiceStatus === 'thinking' ? 'border-amber-500/40 animate-pulse' :
                              'border-purple-500/40 border-2'
                            }`}
                          />
                        ) : (
                          <Mic className="w-8 h-8" />
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-white/[0.01] border border-white/5 flex items-center justify-center text-starlight/20">
                      <Volume2 className="w-10 h-10" />
                    </div>
                  )}
                </div>

                <div className="space-y-4 w-full">
                  {/* Controls */}
                  {isVoiceActive ? (
                    <button
                      onClick={stopVoiceComms}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono uppercase tracking-widest font-black transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                    >
                      TERMINATE SIGNAL
                    </button>
                  ) : (
                    <button
                      onClick={startVoiceComms}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-mono uppercase tracking-widest font-black transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                      ESTABLISH COMM LINK
                    </button>
                  )}

                  {/* Simulated mic override */}
                  {isVoiceActive && (
                    <div className="flex justify-between items-center gap-2">
                      <button
                        onClick={simulateVoiceConversation}
                        className="flex-1 py-1 px-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-mono text-starlight/60 uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Simulate spoken text
                      </button>
                      <button
                        onClick={() => setVoiceMuted(!voiceMuted)}
                        className={`p-1 px-2 rounded-lg border text-[9px] font-mono transition-all cursor-pointer ${
                          voiceMuted 
                            ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                            : 'bg-white/5 text-starlight/60 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {voiceMuted ? <VolumeX className="w-3.5 h-3.5 inline" /> : <Volume2 className="w-3.5 h-3.5 inline" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Real-time Telemetry Dialog Terminal */}
              <div className="lg:col-span-8 flex flex-col border border-white/10 rounded-2xl bg-black/60 overflow-hidden min-h-[350px]">
                <div className="border-b border-white/10 p-4 bg-white/[0.01] flex justify-between items-center">
                  <span className="text-[10px] font-mono tracking-widest uppercase flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isVoiceActive ? 'bg-emerald-500 animate-ping' : 'bg-starlight/20'}`} />
                    <span>Telepathic Live Transcription Logs</span>
                  </span>
                  <span className="text-[9px] font-mono text-starlight/30 uppercase">CHANNEL NOISE: 0.02db</span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  {/* Conversation stream */}
                  <div className="flex-1 overflow-y-auto max-h-[260px] space-y-4 pr-2 text-xs font-mono scroll-hide">
                    {voiceChatHistory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-starlight/30 py-8 leading-relaxed">
                        <Activity className="w-8 h-8 mb-2 stroke-1" />
                        <p className="uppercase tracking-widest text-[10px] font-bold">SIGNAL ENVELOPE SECURE</p>
                        <p className="text-[9px] max-w-sm font-sans mt-1">Dialogue history with {activeChar?.name} is initialized. Say anything to establish live thought connection.</p>
                      </div>
                    ) : (
                      voiceChatHistory.map((chat, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-lg flex flex-col gap-1.5 ${
                            chat.role === 'user' 
                              ? 'bg-emerald-500/[0.03] border border-emerald-500/10 text-emerald-300 ml-8 text-right' 
                              : 'bg-purple-500/[0.03] border border-purple-500/10 text-purple-300 mr-8 text-left'
                          }`}
                        >
                          <span className="text-[8px] font-mono opacity-50 uppercase tracking-widest block">
                            {chat.role === 'user' ? 'COMMANDER TRANSMISSION' : `${activeChar?.name.toUpperCase()} SYSTEM RESPONSE`}
                          </span>
                          <p className="font-sans text-xs text-starlight">{chat.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Real-time speaking / listening indicator */}
                  {isVoiceActive && (
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-center gap-3">
                      <div className="flex gap-1 shrink-0">
                        {[1, 2, 3, 4, 5].map((bar) => (
                          <span 
                            key={bar} 
                            className={`w-1 bg-amber-400 rounded-full transition-all ${
                              voiceStatus === 'listening' ? 'h-4 animate-pulse bg-emerald-400' :
                              voiceStatus === 'thinking' ? 'h-3 animate-bounce' :
                              voiceStatus === 'speaking' ? 'h-5 animate-pulse bg-purple-400' : 'h-1'
                            }`}
                            style={{ animationDelay: `${bar * 0.15}s` }}
                          />
                        ))}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[9px] font-mono text-starlight/45 uppercase tracking-widest">
                          {voiceStatus === 'listening' ? 'MIC CAPTURING COMMANDS...' :
                           voiceStatus === 'thinking' ? 'COGNITIVE REFRACTIONS COMMENCING...' :
                           'AUDIO TRANSCEIVER BROADCASTING...'}
                        </p>
                        <p className={`text-xs font-semibold truncate ${
                          voiceStatus === 'listening' ? 'text-emerald-400' :
                          voiceStatus === 'thinking' ? 'text-amber-400' : 'text-purple-300'
                        }`}>
                          {voiceTranscript || voiceResponse || 'Channel quiet.'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/5 text-[9px] font-mono text-starlight/20 flex justify-between">
                    <span>COUNCIL BIOMETRICS NODE: CONNECTED</span>
                    <span>COGNITIVE RELAY: ESTABLISHED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
