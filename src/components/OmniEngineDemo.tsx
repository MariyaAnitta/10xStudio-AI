import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Terminal as TerminalIcon, Video, Loader2, Code2, Download, Maximize2 } from 'lucide-react';

export default function OmniEngineDemo() {
  const [prompt, setPrompt] = useState('Cinematic close-up of a perfectly grilled steak, steam rising, ambient lighting, high quality.');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setVideoUrl(null);
    setErrorMsg(null);
    
    try {
      const response = await fetch('/api/generate-omni-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      const data = await response.json();
      if (data.success && data.videoUrl) {
        setVideoUrl(data.videoUrl);
      } else {
        setErrorMsg(data.error || 'Failed to generate video');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Server connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFullscreen = () => {
    const videoElem = document.getElementById('omni-video-player');
    if (!videoElem) return;

    if (!document.fullscreenElement) {
      videoElem.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Sparkles size={20} />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">GEMINI OMNI (VEO)</h2>
            </div>
            <div className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded">veo-2.0-generate</div>
          </div>
          
          <textarea
            className="w-full flex-grow min-h-[200px] bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-300 transition-all font-sans text-base leading-relaxed resize-none"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your cinematic vision for the Veo model..."
          />
          
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-3 text-lg shadow-lg shadow-indigo-600/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span>Generating via Vertex AI (May take 1-3 mins)...</span>
              </>
            ) : (
              <>
                <Sparkles size={24} />
                <span>Generate Video with Veo</span>
              </>
            )}
          </button>

          {/* Output Stream */}
          <div className="space-y-3 mt-6">
             <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
                <TerminalIcon size={12} />
                <span>OPERATION_STREAM</span>
             </div>
             <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm border border-slate-200 text-indigo-300 min-h-[100px] space-y-1">
                {isLoading && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-400">{'>'}</span>
                      <span>Dispatching generation job to Vertex AI Veo-2.0...</span>
                    </div>
                    <div className="animate-pulse flex items-center gap-2 mt-2">
                      <span className="text-indigo-400">{'>'}</span>
                      <span className="text-amber-400">Polling LRO status... please wait.</span>
                    </div>
                  </>
                )}
                {!isLoading && videoUrl && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-400">{'>'}</span>
                      <span className="text-emerald-400">Video generation complete. MP4 downloaded.</span>
                    </div>
                  </>
                )}
                {errorMsg && (
                  <div className="flex items-center gap-2 text-red-400">
                    <span>{'>'} Error: {errorMsg}</span>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Player Panel */}
        <div className="space-y-6">
          <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-200 group shadow-lg">
            {videoUrl ? (
              <>
                <video 
                  id="omni-video-player"
                  src={videoUrl} 
                  className="w-full h-full object-cover" 
                  controls
                  autoPlay
                  loop
                />
                <div className="absolute top-6 right-6 flex gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                   <a 
                    href={videoUrl}
                    download
                    className="p-2.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white/80 hover:bg-indigo-600 transition-colors"
                    title="Download MP4"
                   >
                     <Download size={18} />
                   </a>
                   <button 
                    onClick={toggleFullscreen}
                    className="p-2.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white/80 hover:bg-indigo-600 transition-colors"
                   >
                     <Maximize2 size={18} />
                   </button>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl">
                <Video size={64} className="opacity-20 text-indigo-500" />
                <span className="font-mono text-xs tracking-widest text-slate-500">READY FOR VEO</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
