import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertOctagon, Activity, Radio, Cpu, Terminal, CheckCircle2, RefreshCcw } from 'lucide-react';

interface Anomaly {
  id: string;
  name: string;
  sector: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'analyzing' | 'resolved';
  type: 'security' | 'efficiency' | 'visionary';
  description: string;
}

export default function ThreatScanner() {
  const [activeAnomalies, setActiveAnomalies] = useState<Anomaly[]>([
    {
      id: 'ANOM-449',
      name: 'Rogue Quantum Sync Shift',
      sector: 'Sector Orion-9',
      severity: 'high',
      status: 'active',
      type: 'security',
      description: 'Foreign telemetry packages detected attempting unauthorized alignment with our biometric receiver sub-matrix.'
    },
    {
      id: 'ANOM-512',
      name: 'Algorithmic Decay Burst',
      sector: 'Quadrant Jaguar-Beta',
      severity: 'medium',
      status: 'active',
      type: 'efficiency',
      description: 'Resource harvesting nodes reporting a 14.8% decrease in bandwidth delivery due to entropy buildup.'
    },
    {
      id: 'ANOM-108',
      name: 'Sub-Harmonic Spiritual Static',
      sector: 'Temple Node-Alpha',
      severity: 'low',
      status: 'active',
      type: 'visionary',
      description: 'Ethereal consciousness feedback loop creating mild cognitive dissonance within the collective neural mind.'
    },
    {
      id: 'ANOM-902',
      name: 'Core Firewall Intrusion Vector',
      sector: 'Bastion Core-6',
      severity: 'critical',
      status: 'active',
      type: 'security',
      description: 'High-frequency brute-force attempt on database shielding arrays. Intrusion level spiking.'
    }
  ]);

  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [resolutionStep, setResolutionStep] = useState<'idle' | 'analyzing' | 'resolved'>('idle');
  const [resolutionLog, setResolutionLog] = useState<string[]>([]);
  const [radarDegrees, setRadarDegrees] = useState(0);

  // Rotate simulated radar sweeps
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarDegrees((prev) => (prev + 3) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const selectAnomaly = (anon: Anomaly) => {
    setSelectedAnomaly(anon);
    setResolutionStep('idle');
    setResolutionLog([]);
  };

  const resolveAnomaly = () => {
    if (!selectedAnomaly) return;
    
    setResolutionStep('analyzing');
    setResolutionLog(['[Oracle] Commencing resolution vector diagnostics...', '[Oracle] Directing threat details to Triumvirate Council nodes...']);

    // Log feedback sequence (simulation of collective response)
    setTimeout(() => {
      let nodeSpeech = '';
      if (selectedAnomaly.type === 'security') {
        nodeSpeech = '[The Tiger] Firewall protocols activated. Locking down bastions. Perimeter shielding increased by 40%. Rogue packets purged.';
      } else if (selectedAnomaly.type === 'efficiency') {
        nodeSpeech = '[The Jaguar] Hyper-optimization algorithm deployed. Sync protocols reorganized. Bandwidth throughput balanced back to 100%.';
      } else {
        nodeSpeech = '[The Lion] Sub-harmonic resonant frequencies synchronized. Soul matrix cleared of static. Ethereal paths aligned.';
      }
      setResolutionLog(prev => [...prev, '[Synapse Core] Core components responding...', nodeSpeech]);
    }, 1200);

    setTimeout(() => {
      setResolutionLog(prev => [...prev, '[Oracle] Consensus verified. Anomaly cleared. Normalizing biometric feed...']);
      setResolutionStep('resolved');
      setActiveAnomalies(prev =>
        prev.map(item => item.id === selectedAnomaly.id ? { ...item, status: 'resolved' } : item)
      );
    }, 2500);
  };

  const resetAllAnomalies = () => {
    setActiveAnomalies([
      {
        id: 'ANOM-449',
        name: 'Rogue Quantum Sync Shift',
        sector: 'Sector Orion-9',
        severity: 'high',
        status: 'active',
        type: 'security',
        description: 'Foreign telemetry packages detected attempting unauthorized alignment with our biometric receiver sub-matrix.'
      },
      {
        id: 'ANOM-512',
        name: 'Algorithmic Decay Burst',
        sector: 'Quadrant Jaguar-Beta',
        severity: 'medium',
        status: 'active',
        type: 'efficiency',
        description: 'Resource harvesting nodes reporting a 14.8% decrease in bandwidth delivery due to entropy buildup.'
      },
      {
        id: 'ANOM-108',
        name: 'Sub-Harmonic Spiritual Static',
        sector: 'Temple Node-Alpha',
        severity: 'low',
        status: 'active',
        type: 'visionary',
        description: 'Ethereal consciousness feedback loop creating mild cognitive dissonance within the collective neural mind.'
      },
      {
        id: 'ANOM-902',
        name: 'Core Firewall Intrusion Vector',
        sector: 'Bastion Core-6',
        severity: 'critical',
        status: 'active',
        type: 'security',
        description: 'High-frequency brute-force attempt on database shielding arrays. Intrusion level spiking.'
      }
    ]);
    setSelectedAnomaly(null);
    setResolutionStep('idle');
    setResolutionLog([]);
  };

  return (
    <div id="cognitive-threat-scanner" className="glass-panel p-8 border-white/5 relative overflow-hidden space-y-6">
      <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
        <Radio className="w-56 h-56 text-amber-500 animate-pulse" />
      </div>

      <div className="flex flex-col xl:flex-row gap-8 relative z-10">
        
        {/* Radar Map Column */}
        <div className="flex-1 flex flex-col items-center justify-center bg-black/60 border border-white/10 rounded-2xl p-6 relative">
          <div className="absolute top-3 left-4 flex items-center gap-1.5 font-mono text-[9px] text-amber-500/80 uppercase font-bold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping mr-1" />
            Threat Vector Radar
          </div>
          <button 
            type="button"
            onClick={resetAllAnomalies}
            className="absolute top-3 right-4 font-mono text-[9px] text-white/40 hover:text-white transition-opacity uppercase flex items-center gap-1 cursor-pointer bg-white/5 px-2 py-1 rounded"
          >
            <RefreshCcw className="w-2.5 h-2.5" /> Re-seed
          </button>

          {/* Dynamic Radar Canvas/SVG Sweep */}
          <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-white/10 relative flex items-center justify-center my-6 shadow-[inset_0_0_24px_rgba(245,158,11,0.05)] bg-[#030308]">
            {/* Concentric rings */}
            <div className="absolute w-[80%] h-[80%] rounded-full border border-white/5" />
            <div className="absolute w-[60%] h-[60%] rounded-full border border-white/5" />
            <div className="absolute w-[40%] h-[40%] rounded-full border border-white/5" />
            <div className="absolute w-[20%] h-[20%] rounded-full border border-white/5" />
            
            {/* Intersecting sector lines */}
            <div className="absolute w-full h-px bg-white/5" />
            <div className="absolute h-full w-px bg-white/5" />
            <div className="absolute w-full h-px rotate-45 bg-white/5" />
            <div className="absolute w-full h-px -rotate-45 bg-white/5" />

            {/* Sweep radar beam representation */}
            <div 
              style={{ transform: `rotate(${radarDegrees}deg)` }}
              className="absolute w-1/2 h-1/2 origin-bottom-right top-0 left-0 border-r border-[#f59e0b]/40 bg-gradient-to-tr from-transparent to-[#f59e0b]/10 rounded-tl-full pointer-events-none"
            />

            {/* Simulated target dots corresponding to anomalies */}
            {activeAnomalies.map((an, i) => {
              if (an.status === 'resolved') return null;
              // Map different positions based on loop indices
              const angles = [65, 150, 240, 310];
              const radii = [40, 65, 80, 50];
              const angle = angles[i % angles.length];
              const radius = radii[i % radii.length];
              const xChange = Math.cos((angle * Math.PI) / 180) * radius;
              const yChange = Math.sin((angle * Math.PI) / 180) * radius;

              const severityColors = {
                low: 'bg-[#10b981]',
                medium: 'bg-[#3b82f6]',
                high: 'bg-[#f59e0b]',
                critical: 'bg-[#ef4444]'
              };

              return (
                <button
                  key={an.id}
                  onClick={() => selectAnomaly(an)}
                  style={{ transform: `translate(${xChange}px, ${yChange}px)` }}
                  className={`absolute w-3.5 h-3.5 rounded-full ${severityColors[an.severity]} animate-pulse flex items-center justify-center text-[7px] font-mono text-black font-bold border border-white cursor-pointer shadow-[0_0_12px_currentColor]`}
                  title={an.name}
                >
                  !
                </button>
              );
            })}
          </div>

          <p className="text-[10px] font-mono text-starlight/30 uppercase mt-2">Active Sweeper Range: 10,000 Parsecs</p>
        </div>

        {/* Diagnostic Details / Options Column */}
        <div className="w-full xl:w-[48%] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h4 className="font-display font-medium text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              Anomaly Detection Queue
            </h4>
            
            {/* List of anomalies */}
            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
              {activeAnomalies.map((anom) => {
                const isSelected = selectedAnomaly?.id === anom.id;
                const statusColors = {
                  active: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                  analyzing: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                  resolved: 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20'
                };
                
                const severityLabels = {
                  low: 'Low Threat',
                  medium: 'Medium Threat',
                  high: 'High Threat',
                  critical: 'Critical Alert'
                };

                return (
                  <button
                    key={anom.id}
                    onClick={() => selectAnomaly(anom)}
                    className={`w-full text-left font-mono text-xs p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                      isSelected 
                        ? 'bg-white/10 border-amber-500/40 shadow-lg' 
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className={`w-2 h-2 rounded-full ${
                        anom.severity === 'critical' ? 'bg-red-500' :
                        anom.severity === 'high' ? 'bg-amber-400' :
                        anom.severity === 'medium' ? 'bg-blue-500' : 'bg-[#10b981]'
                      } ${anom.status === 'active' ? 'animate-pulse' : ''}`} />
                      <div className="truncate">
                        <div className="font-semibold text-starlight flex items-center gap-1.5">
                          <span>{anom.name}</span>
                          <span className="text-[8px] opacity-40 font-normal">({anom.id})</span>
                        </div>
                        <div className="text-[9px] text-starlight/40 uppercase font-medium">{anom.sector} • {severityLabels[anom.severity]}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase tracking-widest ${statusColors[anom.status]}`}>
                      {anom.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Diagnosis View */}
          <div className="bg-[#050510] border border-white/5 rounded-xl p-5 min-h-40 flex flex-col justify-between">
            {selectedAnomaly ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-3">
                  <div>
                    <span className="text-[9px] font-mono text-amber-400 uppercase tracking-wider font-bold">Diag Code: {selectedAnomaly.id}</span>
                    <h5 className="font-display font-bold text-sm text-starlight">{selectedAnomaly.name}</h5>
                  </div>
                  <AlertOctagon className={`w-5 h-5 flex-shrink-0 ${
                    selectedAnomaly.severity === 'critical' ? 'text-red-500' : 'text-amber-400'
                  }`} />
                </div>

                <p className="text-xs text-starlight/60 leading-relaxed font-mono">
                  {selectedAnomaly.description}
                </p>

                {resolutionStep === 'idle' && selectedAnomaly.status === 'active' && (
                  <button
                    onClick={resolveAnomaly}
                    className="w-full bg-[#f59e0b] hover:bg-amber-400 text-black py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_12px_rgba(245,158,11,0.25)] cursor-pointer"
                  >
                    ⚡ Execute Consensus Resolution
                  </button>
                )}

                {resolutionStep === 'analyzing' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                      <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Resolving vector dissonance...</span>
                    </div>
                    <div className="bg-black/60 border border-white/5 rounded-lg p-3 font-mono text-[9px] leading-tight space-y-1.5 select-all overflow-y-auto max-h-24">
                      {resolutionLog.map((log, i) => (
                        <div key={i} className="text-starlight/70">{log}</div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAnomaly.status === 'resolved' && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2.5 text-green-400 font-mono text-xs">
                    <CheckCircle2 className="w-5 h-5" />
                    <div>
                      <div className="font-bold">STATUS RESOLVED</div>
                      <div className="text-[9px] opacity-70">Sanity index checks locked, system operations balanced.</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Cpu className="w-8 h-8 text-starlight/15 mb-3" />
                <p className="text-xs font-mono text-starlight/30 uppercase tracking-wider">Select anomaly target pinpoint in radar or detection queue to run diagnosis overrides</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
