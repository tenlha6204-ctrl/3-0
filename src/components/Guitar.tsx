import React, { useMemo, useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { motion, useAnimation } from 'motion/react';
import { GUITAR_STRINGS, FRETS_COUNT } from '../constants';
import { cn } from '../lib/utils';
import { Music, Volume2, Info } from 'lucide-react';

import { ChordAssistant } from './ChordAssistant';

const Guitar = () => {
  const [activeFrets, setActiveFrets] = useState<Record<number, number>>({
    0: -1, 1: -1, 2: -1, 3: -1, 4: -1, 5: -1
  }); // stringIndex -> fretIndex (-1 means open, -2 means muted)
  
  const [isAudioStarted, setIsAudioStarted] = useState(false);
  const synths = useRef<Tone.PluckSynth[]>([]);
  const masterVolume = useRef<Tone.Link | null>(null);

  useEffect(() => {
    // Initialize master chain for safety and volume boost
    const limiter = new Tone.Limiter(-2).toDestination();
    const mainGain = new Tone.Gain(1.5).connect(limiter);

    // Initialize synths
    const stringSynths = GUITAR_STRINGS.map(() => {
      return new Tone.PluckSynth({
        attackNoise: 1,
        dampening: 4000,
        resonance: 0.9,
        volume: 0 // slightly louder starting volume
      }).connect(mainGain);
    });
    
    synths.current = stringSynths;

    return () => {
      stringSynths.forEach(s => s.dispose());
      mainGain.dispose();
      limiter.dispose();
    };
  }, []);

  const startAudio = async () => {
    console.log("Starting Audio Context...");
    await Tone.start();
    setIsAudioStarted(true);
    console.log("Audio Context Started.");
  };

  const getNote = (stringIndex: number, fretIndex: number) => {
    const string = GUITAR_STRINGS[stringIndex];
    if (!string) return '';
    return Tone.Frequency(string.openNote).transpose(fretIndex + 1).toNote();
  };

  const [pulseIndices, setPulseIndices] = useState<Record<number, number>>({});

  const playString = (stringIndex: number, forcedFret?: number) => {
    if (!isAudioStarted) return;
    
    const fret = forcedFret !== undefined ? forcedFret : activeFrets[stringIndex];
    if (fret === -2) return; // Muted

    const note = fret === -1 
      ? GUITAR_STRINGS[stringIndex].openNote 
      : getNote(stringIndex, fret);
    
    console.log(`Playing String ${stringIndex}: ${note}`);
    synths.current[stringIndex].triggerAttack(note);

    // Visual pulse
    setPulseIndices(prev => ({ ...prev, [stringIndex]: Date.now() }));
  };

  const setChord = (frets: number[]) => {
    const newFrets: Record<number, number> = {};
    frets.forEach((f, i) => {
      newFrets[i] = f;
    });
    setActiveFrets(newFrets);
  };

  const handleFretClick = (stringIndex: number, fretIndex: number) => {
    const isDeactivating = activeFrets[stringIndex] === fretIndex;
    const nextFret = isDeactivating ? -1 : fretIndex;
    
    setActiveFrets(prev => ({
      ...prev,
      [stringIndex]: nextFret
    }));

    if (!isDeactivating) {
      playString(stringIndex, fretIndex);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-blue-500/30 relative flex flex-col overflow-hidden">
      {/* Stage Lighting Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[160px]"></div>
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-amber-600 rounded-full blur-[160px]"></div>
      </div>

      {!isAudioStarted ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex-1 flex flex-col items-center justify-center p-10 text-center space-y-8"
        >
          <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)] relative group cursor-pointer" onClick={startAudio}>
             <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
             <Music className="w-12 h-12 text-white relative z-10" />
          </div>
          <div className="space-y-4">
            <h1 className="text-6xl font-black tracking-[0.3em] text-white uppercase italic">AEROSTRAT</h1>
            <p className="text-[12px] text-blue-400 font-bold tracking-[0.4em] uppercase">Virtual Performance Engine MK-II</p>
          </div>
          <p className="text-slate-500 font-light max-w-sm mx-auto leading-relaxed">Experience high-fidelity string synthesis with real-time AI chord assistance.</p>
          <button 
            onClick={startAudio}
            className="px-12 py-4 bg-white text-black text-[12px] font-black uppercase tracking-[0.3em] rounded-sm hover:bg-blue-400 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
          >
            Engage System
          </button>
        </motion.div>
      ) : (
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Top Navigation / Performance Bar */}
          <header className="performance-header flex items-center justify-between px-10 py-8">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold tracking-widest text-white uppercase">AEROSTRAT <span className="text-blue-400 font-light">MK-II</span></h1>
                <p className="text-[10px] text-slate-500 tracking-[0.2em] font-medium uppercase">Performance Monitoring Active</p>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
               <ChordAssistant onChordFound={setChord} />
               <div className="hidden lg:flex gap-8 border-l border-white/10 pl-8 ml-4">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Master Tuner</p>
                    <p className="text-lg font-mono text-emerald-400 uppercase tracking-tighter">440.0 Hz</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Sample Rate</p>
                    <p className="text-lg font-mono text-white uppercase tracking-tighter">48 kHz</p>
                  </div>
               </div>
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center px-10 py-4 max-w-[1400px] mx-auto w-full">
            {/* Fretboard Container */}
            <div className="w-full relative overflow-x-auto pb-12 mask-fade-right">
              <div className="min-w-[1200px] h-[360px] bg-[#1a1310] rounded-xl border border-white/5 shadow-2xl shadow-black/50 relative flex items-center overflow-hidden">
                {/* Wood Grain Layer */}
                <div className="absolute inset-0 opacity-40 pointer-events-none" 
                  style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.1) 41px)', backgroundSize: '41px 100%' }} 
                />
                
                {/* Frets */}
                {Array.from({ length: FRETS_COUNT }).map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute h-full border-r border-white/10"
                    style={{ left: `${(i + 1) * (100 / (FRETS_COUNT + 1))}%` }}
                  >
                    <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-mono text-white/20">{i + 1}</span>
                    <div className="absolute top-0 bottom-0 right-0 w-[2px] bg-slate-400/50 shadow-[1px_0_2px_rgba(0,0,0,0.8)]" />
                    
                    {/* Fret Markers */}
                    {[3, 5, 7, 9, 12, 15].includes(i + 1) && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        {i + 1 === 12 ? (
                          <div className="space-y-16">
                             <div className="w-4 h-4 bg-white/5 rounded-full ring-1 ring-white/10 shadow-inner" />
                             <div className="w-4 h-4 bg-white/5 rounded-full ring-1 ring-white/10 shadow-inner" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 bg-white/5 rounded-full ring-1 ring-white/10 shadow-inner" />
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Strings */}
                <div className="absolute inset-0 flex flex-col justify-around py-8 pointer-events-none">
                  {GUITAR_STRINGS.map((string, sIdx) => {
                    const isActive = activeFrets[sIdx] !== -1 && activeFrets[sIdx] !== -2;
                    return (
                      <div key={sIdx} className="relative w-full">
                        <motion.div 
                          className={cn(
                            "w-full transition-all duration-100",
                            sIdx === 0 ? "bg-slate-300/30 shadow-[0_0_8px_rgba(255,255,255,0.2)]" :
                            sIdx === 1 ? "bg-slate-200/40 shadow-[0_0_10px_rgba(255,255,255,0.3)]" :
                            sIdx === 2 ? "bg-slate-200/50 shadow-[0_0_12px_rgba(255,255,255,0.4)]" :
                            sIdx === 3 ? "bg-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.3)]" :
                            sIdx === 4 ? "bg-slate-100/60 shadow-[0_0_15px_rgba(255,255,255,0.5)]" :
                            "bg-slate-100/70 shadow-[0_0_20px_rgba(255,255,255,0.6)]"
                          )}
                          style={{ height: `${string.gauge}px` }}
                          animate={{ 
                            opacity: activeFrets[sIdx] !== -1 ? 0.4 : 1,
                            scaleY: pulseIndices[sIdx] ? [1, 3, 1] : 1
                          }}
                          transition={{ duration: 0.2 }}
                          key={`${sIdx}-${pulseIndices[sIdx]}`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Fret/String Interaction Grid */}
                <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-around py-8">
                  {GUITAR_STRINGS.map((string, sIdx) => (
                    <div key={sIdx} className="w-full flex h-12">
                      {/* Nut/Open State */}
                      <div 
                        className="w-20 flex items-center justify-center cursor-pointer group px-4"
                        onClick={() => setActiveFrets(prev => ({ 
                          ...prev, 
                          [sIdx]: prev[sIdx] === -1 ? -2 : -1 
                        }))}
                      >
                         <div className={cn(
                           "w-8 h-8 rounded-full border border-white/10 transition-all flex items-center justify-center text-[10px] uppercase tracking-tighter",
                           activeFrets[sIdx] === -1 
                            ? "bg-blue-500 text-white border-blue-400 font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                            : activeFrets[sIdx] === -2
                            ? "bg-red-500/20 border-red-500/50 text-red-500 font-bold"
                            : "bg-black/40 text-slate-500 group-hover:border-white/30 backdrop-blur-sm"
                         )}>
                           {activeFrets[sIdx] === -2 ? 'MUTED' : string.name}
                         </div>
                      </div>

                      {/* Frets */}
                      {Array.from({ length: FRETS_COUNT }).map((_, fIdx) => (
                        <div 
                          key={fIdx}
                          className="flex-1 relative cursor-pointer group"
                          onClick={() => handleFretClick(sIdx, fIdx)}
                        >
                           {activeFrets[sIdx] === fIdx && (
                             <motion.div 
                               layoutId={`fret-${sIdx}`}
                               className="absolute inset-[4px] bg-blue-500/5 border border-blue-400/30 rounded shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col items-center justify-center"
                             >
                               <span className="text-white text-[11px] font-mono font-black italic tracking-tighter drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                                  {getNote(sIdx, fIdx)}
                               </span>
                               <div className="w-full h-[1px] bg-blue-400/40 mt-1" />
                             </motion.div>
                           )}
                           <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white/5 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Controls / Effect Rack */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
              <div className="bg-red-900/40 border border-red-500/30 rounded-lg p-5 flex flex-col items-center gap-4">
                <span className="text-[10px] font-black text-red-200 uppercase tracking-widest">DynaSustain</span>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full border-4 border-black/40 bg-slate-800 relative">
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-red-400 rounded-full"></div>
                  </div>
                  <div className="w-10 h-10 rounded-full border-4 border-black/40 bg-slate-800 relative">
                    <div className="absolute top-4 right-1 w-3 h-1 bg-red-400 rounded-full"></div>
                  </div>
                </div>
                <div className="w-4 h-4 bg-red-500 rounded-full shadow-[0_0_15px_red] animate-pulse"></div>
              </div>

              <div className="bg-amber-900/40 border border-amber-500/30 rounded-lg p-5 flex flex-col items-center gap-4">
                <span className="text-[10px] font-black text-amber-200 uppercase tracking-widest">WarmDrive MK-I</span>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full border-4 border-black/40 bg-slate-800 relative">
                    <div className="absolute top-1/2 right-1 -translate-y-1/2 w-3 h-1 bg-amber-400 rounded-full"></div>
                  </div>
                  <div className="w-10 h-10 rounded-full border-4 border-black/40 bg-slate-800 relative">
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-amber-400 rounded-full"></div>
                  </div>
                </div>
                <div className="w-4 h-4 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.8)]"></div>
              </div>

              <div className="bg-blue-900/40 border border-blue-500/30 rounded-lg p-5 flex flex-col items-center gap-4 opacity-70 grayscale-[0.5]">
                <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Azure Mist</span>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full border-4 border-black/40 bg-slate-800"></div>
                  <div className="w-10 h-10 rounded-full border-4 border-black/40 bg-slate-800"></div>
                </div>
                <div className="w-4 h-4 bg-slate-800 rounded-full"></div>
              </div>

              <div className="bg-emerald-900/40 border border-emerald-500/30 rounded-lg p-5 flex flex-col items-center gap-4">
                <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">Void Hall</span>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full border-4 border-black/40 bg-slate-800 relative">
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-emerald-400 rounded-full"></div>
                  </div>
                  <div className="w-10 h-10 rounded-full border-4 border-black/40 bg-slate-800 relative">
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-emerald-400 rounded-full rotate-45"></div>
                  </div>
                </div>
                <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_15px_#10b981] animate-pulse"></div>
              </div>
            </div>
          </main>

          {/* Strum Area */}
          <div className="w-full flex-1 flex flex-col items-center pb-24 px-10">
             <div className="w-full max-w-4xl h-48 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 p-8 flex flex-col justify-around relative overflow-hidden group shadow-2xl">
                {/* Visual Strum Line */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {GUITAR_STRINGS.map((string, sIdx) => (
                  <motion.div 
                    key={sIdx}
                    className="relative w-full cursor-pointer py-2"
                    onMouseEnter={() => playString(sIdx)}
                  >
                    <div className="relative">
                      <motion.div 
                        className={cn(
                          "w-full rounded-full transition-all duration-100",
                          activeFrets[sIdx] === -2 
                            ? "bg-slate-800 opacity-20" 
                            : "bg-gradient-to-r from-slate-600 via-slate-300 to-slate-600 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                        )}
                        style={{ height: `${string.gauge}px` }}
                        animate={{
                          scaleY: pulseIndices[sIdx] ? [1, 2, 1] : 1
                        }}
                        transition={{ duration: 0.2 }}
                        key={`strum-${sIdx}-${pulseIndices[sIdx]}`}
                        whileHover={activeFrets[sIdx] !== -2 ? { 
                          scaleY: 2,
                          backgroundColor: "#60a5fa",
                          boxShadow: "0 0 20px rgba(96, 165, 250, 0.6)"
                        } : {}}
                      />
                      <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 uppercase tracking-tighter w-10 text-right">
                         {activeFrets[sIdx] === -2 ? 'MUTE' : activeFrets[sIdx] !== -1 ? getNote(sIdx, activeFrets[sIdx]) : string.name}
                      </div>
                    </div>
                  </motion.div>
                ))}
             </div>
          </div>

          {/* Bottom HUD */}
          <footer class="performance-footer relative z-20 px-10 py-6 bg-black/60 backdrop-blur-xl border-t border-white/5 flex items-center justify-between">
            <div class="flex items-center gap-10">
              <div>
                <p class="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-1">Engine Latency</p>
                <p class="text-lg text-white font-mono italic">1.2ms <span className="opacity-30 text-xs not-italic font-sans">VULKAN-M</span></p>
              </div>
              <div class="h-10 w-[1px] bg-white/10"></div>
              <div>
                <p class="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-1">Tone Profile</p>
                <p class="text-lg text-white font-serif italic text-blue-400">Atmospheric Clean</p>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <div class="hidden sm:flex items-center gap-2 px-6 py-2 bg-blue-500/10 border border-blue-500/30 rounded text-blue-400 text-xs font-bold uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Performance Mode
              </div>
              <button 
                onClick={() => window.location.reload()}
                class="px-8 py-3 bg-white text-black text-xs font-black uppercase tracking-[0.2em] rounded-sm hover:bg-blue-400 transition-colors"
              >
                Reset Engine
              </button>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};

export default Guitar;
