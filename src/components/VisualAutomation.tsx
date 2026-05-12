import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Layers, 
  Maximize, 
  Layout, 
  Camera, 
  Image as ImageIcon,
  ArrowRight,
  Loader2,
  X,
  ZoomIn
} from 'lucide-react';

export default function VisualAutomation() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [enhancedVersions, setEnhancedVersions] = useState<{style: string, url: string}[]>([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setOriginalImage(localUrl);
    setEnhancedVersions([]);
    setSelectedVersionIndex(0);
    setIsProcessing(true);

    // Send to backend pipeline
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:3005/api/visual-automation', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success && data.versions) {
        setEnhancedVersions(data.versions);
        setSelectedVersionIndex(0);
      } else if (data.success && data.url) {
        // Fallback for older API versions
        setEnhancedVersions([{ style: 'standard', url: data.url }]);
      } else {
        alert('Pipeline failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to connect to the automation pipeline.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Column - Content & Controls */}
        <div className="space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="px-3 py-1 bg-brand-blue/10 border border-brand-blue/20 rounded-md">
                <span className="text-brand-blue font-mono text-xs font-semibold tracking-wider">
                  1 &nbsp; MODULE_01: VISUAL AUTOMATION
                </span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-display font-medium tracking-tight text-white leading-tight">
              Not just design.<br />
              <span className="text-brand-blue">Pure Production.</span>
            </h1>
            
            <p className="text-white/60 text-lg leading-relaxed max-w-xl">
              Transform a single cell-phone photo into a multi-angle pro-grade content library. 
              Our engine handles isolation, lighting, and variations automatically.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FeatureCard 
              icon={<Sparkles size={20} className="text-white/60" />}
              title="Background Removal"
              subtitle="Using rembg (U2-Net)"
            />
            <FeatureCard 
              icon={<Layers size={20} className="text-white/60" />}
              title="Spectral Enhancement"
              subtitle="Pillow Contrast/Sharpness"
            />
            <FeatureCard 
              icon={<Maximize size={20} className="text-white/60" />}
              title="Angle Synthesis"
              subtitle="Replicate API (SD)"
            />
            <FeatureCard 
              icon={<Layout size={20} className="text-white/60" />}
              title="Branding Overlay"
              subtitle="Dynamic Watermarking"
            />
          </div>

          {/* Action Button */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={handleUploadClick}
            disabled={isProcessing}
            className="w-full sm:w-auto mt-8 px-8 py-4 bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
            <span>{isProcessing ? "Processing via Pipeline..." : "Upload Subject to Automate"}</span>
          </button>
        </div>

        {/* Right Column - Preview Area */}
        <div className="h-[600px] w-full glass-card border border-white/5 bg-[#0A0A0A] p-8 relative flex flex-col items-center justify-center overflow-hidden">
          
          {!originalImage ? (
            // Empty State
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center bg-white/5">
                <ImageIcon size={32} className="text-white/40" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-medium text-white">Awaiting Asset</h3>
                <p className="text-white/40 max-w-xs text-sm leading-relaxed">
                  Upload any raw product or dish image to initialize the visual layer pipeline.
                </p>
              </div>
            </div>
          ) : (
            // Uploaded State (Before/After)
            <div className="w-full h-full flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/60">RAW INPUT</div>
                <div className="px-4 py-1.5 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-xs font-mono text-brand-blue">ENHANCED OUTPUT</div>
              </div>
              
              <div className="flex-1 flex items-center justify-center gap-6 relative">
                {/* Before Image */}
                <div 
                  className="flex-1 aspect-square rounded-2xl border border-white/10 bg-black/50 overflow-hidden relative group cursor-pointer"
                  onClick={() => setFullscreenImage(originalImage)}
                >
                  <img src={originalImage} alt="Raw Input" className="w-full h-full object-contain transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn size={32} className="text-white/80" />
                  </div>
                </div>

                {/* Arrow Divider */}
                <div className="w-12 h-12 rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center z-10 shrink-0 shadow-lg">
                  {isProcessing ? <Loader2 size={20} className="text-brand-blue animate-spin" /> : <ArrowRight size={20} className="text-brand-blue" />}
                </div>

                {/* After Image */}
                <div className="flex-1 flex flex-col gap-4">
                  <div 
                    className={`aspect-square rounded-2xl border border-brand-blue/30 bg-[#0a0a0a] overflow-hidden relative group shadow-[0_0_30px_rgba(0,112,255,0.15)] flex items-center justify-center pattern-bg ${enhancedVersions.length > 0 && !isProcessing ? 'cursor-pointer' : ''}`}
                    onClick={() => enhancedVersions.length > 0 && !isProcessing && setFullscreenImage(enhancedVersions[selectedVersionIndex].url)}
                  >
                    {isProcessing ? (
                      <div className="text-center space-y-3">
                        <div className="text-brand-blue/60 font-mono text-xs animate-pulse uppercase tracking-widest">[Synthesizing Environments...]</div>
                        <div className="text-white/40 font-mono text-[10px]">Model: Gemini 2.5 Flash</div>
                      </div>
                    ) : enhancedVersions.length > 0 ? (
                      <>
                        <img src={enhancedVersions[selectedVersionIndex].url} alt="Enhanced Output" className="w-full h-full object-contain drop-shadow-2xl transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn size={32} className="text-white/80" />
                        </div>
                      </>
                    ) : (
                      <div className="text-white/20 font-mono text-xs">[AWAITING RENDER]</div>
                    )}
                  </div>

                  {/* Version Selector */}
                  {enhancedVersions.length > 1 && !isProcessing && (
                    <div className="flex gap-2 justify-center">
                      {enhancedVersions.map((v, i) => (
                        <button
                          key={v.style}
                          onClick={() => setSelectedVersionIndex(i)}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono transition-all ${
                            selectedVersionIndex === i 
                            ? 'bg-brand-blue/20 border-brand-blue text-brand-blue shadow-[0_0_10px_rgba(0,112,255,0.2)]' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                          }`}
                        >
                          {v.style.replace('_', ' ').toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setFullscreenImage(null)}>
          <button 
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenImage(null);
            }}
          >
            <X size={24} />
          </button>
          <img 
            src={fullscreenImage} 
            alt="Fullscreen preview" 
            className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
}

function FeatureCard({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors flex flex-col gap-4">
      <div>{icon}</div>
      <div>
        <h4 className="text-white font-medium text-sm mb-1">{title}</h4>
        <p className="text-white/40 text-xs font-mono">{subtitle}</p>
      </div>
    </div>
  );
}

