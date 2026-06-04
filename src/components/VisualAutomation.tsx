import React, { useState, useRef, useEffect } from 'react';
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
import { useWorkspace } from '../context/WorkspaceContext';
import { useNavigate } from 'react-router-dom';

export default function VisualAutomation() {
  const { activeDish, updateActiveDish } = useWorkspace();
  const navigate = useNavigate();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [enhancedVersions, setEnhancedVersions] = useState<{style: string, url: string}[]>([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with workspace context — use GCS processedImageUrl (real https:// URL) to restore
  useEffect(() => {
    if (activeDish) {
      // If processedImageUrl exists (real GCS URL), use it to restore the preview panel
      if (activeDish.processedImageUrl) {
        setOriginalImage(activeDish.processedImageUrl);
        if (enhancedVersions.length === 0) {
          setEnhancedVersions([{ style: 'Rendered Output', url: activeDish.processedImageUrl }]);
        }
      } else if (activeDish.rawImageUrl && activeDish.rawImageUrl.startsWith('blob:')) {
        // blob URLs are only valid in the same page session — skip restoring them
        // (user must re-upload if they refreshed)
        setOriginalImage(null);
      }
    }
  }, [activeDish]);


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setOriginalImage(localUrl);
    setEnhancedVersions([]);
    setSelectedVersionIndex(0);
    setIsProcessing(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/visual-automation', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success && data.versions) {
        setEnhancedVersions(data.versions);
        setSelectedVersionIndex(0);
        
        // Update global workspace context
        await updateActiveDish({
          name: activeDish?.name || file.name.split('.')[0] || 'New Dish',
          description: activeDish?.description || '',
          price: activeDish?.price || '',
          rawImageUrl: localUrl,
          processedImageUrl: data.versions[0].url
        });
      } else if (data.success && data.url) {
        setEnhancedVersions([{ style: 'standard', url: data.url }]);
        await updateActiveDish({
          name: activeDish?.name || file.name.split('.')[0] || 'New Dish',
          description: activeDish?.description || '',
          price: activeDish?.price || '',
          rawImageUrl: localUrl,
          processedImageUrl: data.url
        });
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

  const handleVersionChange = async (index: number) => {
    setSelectedVersionIndex(index);
    if (activeDish && enhancedVersions[index]) {
      await updateActiveDish({
        ...activeDish,
        processedImageUrl: enhancedVersions[index].url
      });
    }
  };

  const handleSendToAudit = () => {
    if (enhancedVersions.length === 0 || isProcessing) return;
    const url = enhancedVersions[selectedVersionIndex].url;
    // We already updated activeDish when selecting the version, so context has the url.
    // Just navigate to the intelligence page.
    navigate('/visual-intelligence');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Column - Content & Controls */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">
              Upload a dish photo to begin
            </h2>
            <p className="text-slate-500 text-base leading-relaxed max-w-xl">
              Our pipeline removes the background, enhances lighting and color, generates 
              multi-angle variations, and applies your brand overlay — all automatically.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FeatureCard 
              icon={<Sparkles size={20} className="text-purple-600" />}
              title="Background Removal"
              subtitle="Using rembg (U2-Net)"
            />
            <FeatureCard 
              icon={<Layers size={20} className="text-purple-600" />}
              title="Spectral Enhancement"
              subtitle="Pillow Contrast/Sharpness"
            />
            <FeatureCard 
              icon={<Maximize size={20} className="text-purple-600" />}
              title="Angle Synthesis"
              subtitle="Replicate API (SD)"
            />
            <FeatureCard 
              icon={<Layout size={20} className="text-purple-600" />}
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
            className="w-full sm:w-auto mt-4 px-8 py-4 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-600/20"
          >
            {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
            <span>{isProcessing ? "Processing via Pipeline..." : "Upload Subject to Automate"}</span>
          </button>
        </div>

        {/* Right Column - Preview Area */}
        <div className="h-[600px] w-full rounded-2xl border border-slate-200 bg-white p-8 relative flex flex-col items-center justify-center overflow-hidden shadow-sm">
          
          {!originalImage ? (
            // Empty State
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50">
                <ImageIcon size={32} className="text-slate-300" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-medium text-slate-700">Awaiting Asset</h3>
                <p className="text-slate-400 max-w-xs text-sm leading-relaxed">
                  Upload any raw product or dish image to initialize the visual layer pipeline.
                </p>
              </div>
            </div>
          ) : (
            // Uploaded State (Gallery View)
            <div className="w-full h-full flex flex-col items-center py-4">
              {/* Main Image Stage */}
              <div className="flex-1 w-full max-w-[450px] flex flex-col gap-6 mx-auto min-h-0">
                <div 
                  className={`flex-1 min-h-0 rounded-2xl border border-purple-200 bg-slate-50 overflow-hidden relative group shadow-md flex items-center justify-center ${enhancedVersions.length > 0 && !isProcessing ? 'cursor-pointer' : ''}`}
                  onClick={() => enhancedVersions.length > 0 && !isProcessing && setFullscreenImage(enhancedVersions[selectedVersionIndex].url)}
                >
                  {isProcessing ? (
                    <div className="text-center space-y-3">
                      <Loader2 size={36} className="text-purple-500 animate-spin mx-auto" />
                      <div className="text-purple-600 font-mono text-xs animate-pulse uppercase tracking-widest">[Synthesizing Environments...]</div>
                      <div className="text-slate-400 font-mono text-[10px]">Model: Neural Vision Engine</div>
                    </div>
                  ) : enhancedVersions.length > 0 ? (
                    <>
                      <img src={enhancedVersions[selectedVersionIndex].url} alt="Enhanced Output" className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn size={32} className="text-white/80" />
                      </div>
                      <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full border border-slate-200 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                        {enhancedVersions[selectedVersionIndex].style.replace('_', ' ')}
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-300 font-mono text-xs">[AWAITING RENDER]</div>
                  )}
                </div>

                {/* Thumbnails & Controls */}
                {enhancedVersions.length > 0 && !isProcessing && (
                  <div className="space-y-6 w-full shrink-0">
                    {/* Thumbnails */}
                    {enhancedVersions.length > 1 && (
                      <div className="flex gap-4 justify-center">
                        {enhancedVersions.map((v, i) => (
                          <button
                            key={v.style}
                            onClick={() => handleVersionChange(i)}
                            className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                              selectedVersionIndex === i 
                              ? 'border-purple-600 shadow-lg shadow-purple-600/20 scale-110 z-10' 
                              : 'border-slate-200 opacity-50 hover:opacity-100 hover:border-slate-300'
                            }`}
                          >
                            <img src={v.url} className="w-full h-full object-cover" alt={v.style} />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Send to Audit Action */}
                    <div className="flex justify-center w-full">
                      <button 
                        onClick={handleSendToAudit}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-600/20"
                      >
                        Run Intelligence Audit
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setFullscreenImage(null)}>
          <button 
            className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
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
    <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-purple-200 hover:shadow-sm transition-all flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <h4 className="text-slate-800 font-medium text-sm mb-0.5">{title}</h4>
        <p className="text-slate-400 text-xs font-mono">{subtitle}</p>
      </div>
    </div>
  );
}
