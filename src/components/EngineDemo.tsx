import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Sparkles, Terminal as TerminalIcon, Video, Loader2, Code2, Cpu, Square, Maximize2, Download, CheckCircle } from 'lucide-react';
import { generateVideoComposition, VideoComposition } from '../services/geminiService';

export default function StudioEngine() {
  const [prompt, setPrompt] = useState('Spice Garden restaurant, Friday special — Seafood Symphony. Cinematic close-ups of grilled lobster and ambient outdoor seating.');
  const [composition, setComposition] = useState<VideoComposition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Playback timer
  useEffect(() => {
    let interval: any;
    if (isPlaying && composition) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= composition.totalDuration * 1000) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 100;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, composition]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setComposition(null);
    setCurrentTime(0);
    try {
      const result = await generateVideoComposition(prompt);
      setComposition(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFullscreen = () => {
    const element = document.getElementById('video-stage-container');
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleExportMP4 = async () => {
    if (!composition?.html) return;
    setIsExporting(true);

    try {
      const response = await fetch('/api/export-mp4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ html_content: composition.html })
      });
      const data = await response.json();
      
      if (data.success && data.mp4_url) {
        const a = document.createElement('a');
        a.href = data.mp4_url;
        a.download = data.mp4_url.split('/').pop() || 'video.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert('Export failed: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to connect to export service');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 flex flex-col shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Sparkles size={20} />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">VIDEO DIRECTIVE</h2>
          </div>
          
          <textarea
            className="w-full flex-grow min-h-[200px] bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 transition-all font-sans text-base leading-relaxed resize-none"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your cinematic vision..."
          />
          
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full mt-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-3 text-lg shadow-lg shadow-purple-600/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span>Initializing 10xFrame Neural Engine...</span>
              </>
            ) : (
              <>
                <Sparkles size={24} />
                <span>Compose via 10xFrame Engine</span>
              </>
            )}
          </button>

          {/* Output Stream */}
          <div className="space-y-3 mt-6">
             <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
                <TerminalIcon size={12} />
                <span>OUTPUT_STREAM</span>
             </div>
             <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm border border-slate-200 text-purple-300 min-h-[100px] space-y-1">
                {isLoading && (
                  <>
                    <div className="animate-pulse flex items-center gap-2">
                      <span className="text-purple-400">{'>'}</span>
                      <span>Initializing 10xFrame Neural Engine...</span>
                    </div>
                  </>
                )}
                {composition && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400">{'>'}</span>
                      <span>10xFrame Architect building manifest...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400">{'>'}</span>
                      <span>Logic synthesis complete.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400">{'>'}</span>
                      <span className="text-emerald-400">Digital Location Scout active: Fetching high-res assets...</span>
                    </div>
                  </>
                )}
             </div>
          </div>
        </div>

        {/* Player Panel */}
        <div className="space-y-6">
          <div 
            id="video-stage-container"
            className="aspect-video bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-200 group shadow-lg [&:fullscreen]:w-screen [&:fullscreen]:h-screen [&:fullscreen]:rounded-none [&:fullscreen]:border-none [&:fullscreen]:aspect-auto"
          >
            {composition ? (
              <>
                <TimelineStage composition={composition} currentTime={currentTime} />
                
                {/* Visual Overlays */}
                <div className="absolute inset-0 pointer-events-none vignette opacity-40" />
                <div className="absolute inset-0 pointer-events-none film-grain mix-blend-soft-light opacity-10" />

                {/* Info Overlay */}
                <div className="absolute top-6 left-6 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-mono tracking-widest text-white/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                      10xSTUDIO PRO | {composition.totalDuration.toFixed(1)}S
                   </div>
                </div>

                <div className="absolute top-6 right-6 flex gap-2 z-30">
                   <button className="p-2.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-white/80 hover:bg-purple-600 transition-colors">
                      <Code2 size={18} />
                   </button>
                   <button 
                    onClick={handleExportMP4}
                    disabled={isExporting}
                    className="p-2.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-white/80 hover:bg-purple-600 transition-colors disabled:opacity-50"
                    title="Download MP4"
                   >
                      {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                   </button>
                   <button 
                    onClick={toggleFullscreen}
                    className="p-2.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-white/80 hover:bg-purple-600 transition-colors"
                   >
                      <Maximize2 size={18} />
                   </button>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                   <motion.div 
                     className="h-full bg-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.8)]"
                     initial={{ width: 0 }}
                     animate={{ width: `${(currentTime / (composition.totalDuration * 1000)) * 1000 / 10}%` }}
                     transition={{ duration: 0.1 }}
                   />
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl">
                <Video size={64} className="opacity-20" />
                <span className="font-mono text-xs tracking-widest">AWAITING DIRECTIVE</span>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-6 rounded-2xl p-6 border border-slate-200 bg-white shadow-sm">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!composition}
              className="w-14 h-14 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 hover:scale-105 transition-all disabled:opacity-20 disabled:bg-slate-200 shadow-lg shadow-purple-600/20"
            >
              {isPlaying ? <Square size={20} fill="white" /> : <Play size={20} fill="white" className="ml-0.5" />}
            </button>
            
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-end">
                <span className="font-mono text-sm text-purple-600">{(currentTime / 1000).toFixed(1)}s</span>
                <span className="font-mono text-sm text-slate-400">{composition?.totalDuration.toFixed(1) || '0.0'}s</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${(currentTime / ((composition?.totalDuration || 1) * 1000)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineStage({ composition, currentTime }: { composition: VideoComposition, currentTime: number }) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const timeInSeconds = currentTime / 1000;

  useEffect(() => {
    if (iframeRef.current && composition.html) {
      const doc = iframeRef.current.contentDocument;
      if (!doc) return;

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html style="height: 100%; margin: 0; padding: 0;">
          <head>
            <style>
              html, body { 
                height: 100%; 
                margin: 0; 
                padding: 0; 
                background: black; 
                color: white; 
                font-family: "Playfair Display", serif; 
                overflow: hidden; 
              }
              #stage { 
                position: relative; 
                width: 100%; 
                height: 100%; 
                overflow: hidden; 
                background: black;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
              }
              .clip { 
                position: absolute; 
                inset: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                transform-origin: center;
              }
              .video-headline { 
                position: absolute;
                top: 35%;
                left: 0;
                width: 100%;
                font-style: italic; 
                font-size: 90px; 
                text-align: center; 
                margin: 0;
                transform: translateY(-50%);
                z-index: 10;
                text-shadow: 0 10px 30px rgba(0,0,0,0.8);
              }
              .video-subtext { 
                position: absolute;
                top: 50%;
                left: 0;
                width: 100%;
                font-family: "Outfit", sans-serif;
                font-size: 32px; 
                text-align: center; 
                margin: 0;
                transform: translateY(-50%);
                z-index: 10;
                text-shadow: 0 5px 15px rgba(0,0,0,0.5);
              }
              .glass-card { 
                position: absolute;
                z-index: 20;
                background: rgba(0,0,0,0.5); 
                backdrop-filter: blur(25px); 
                border-left: 4px solid #7C3AED;
                border-radius: 0 24px 24px 0; 
                padding: 48px; 
                text-align: left;
              }
              .glass-card h1, .glass-card h2 { margin: 0 0 10px 0; font-size: 40px; }
              .glass-card p { margin: 5px 0; font-size: 20px; color: rgba(255,255,255,0.8); }
            </style>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
          </head>
          <body>
            ${composition.html}
          </body>
        </html>
      `);
      doc.close();
    }
  }, [composition]);

  // Sync GSAP timeline with current playback time
  useEffect(() => {
    if (iframeRef.current) {
      const win = iframeRef.current.contentWindow as any;
      if (win && win.__timelines && win.__timelines["10x-video"]) {
        win.__timelines["10x-video"].progress(timeInSeconds / composition.totalDuration);
      }
    }
  }, [timeInSeconds, composition.totalDuration]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-none pointer-events-none"
      title="Video Stage"
    />
  );
}
