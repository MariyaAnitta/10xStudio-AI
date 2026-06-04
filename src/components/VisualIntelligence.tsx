import React, { useState, useRef, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  DollarSign, 
  Target, 
  Star,
  Eye,
  Camera,
  Loader2,
  ArrowUpCircle,
  BarChart3,
  ShieldCheck,
  Save,
  CheckCircle
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

interface Insight {
  type: string;
  label: string;
  title: string;
  description: string;
  color: 'green' | 'orange';
}

interface IntelligenceData {
  success: boolean;
  dish_stats: {
    orders: number;
    revenue: string;
    margin: number;
    rating: number;
    views: number;
  };
  ai_visual_score: {
    overall_score: number;
    criteria: {
      lighting: number;
      background: number;
      sharpness: number;
      plating: number;
    };
    weaknesses: string[];
  };
  insights: Insight[];
}

export default function VisualIntelligence() {
  const { activeDish, updateActiveDish, auditResults, updateAuditResults } = useWorkspace();
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulation State
  const [metrics, setMetrics] = useState({
    dishName: "Classic Burger",
    orders: 0,
    revenue: "₹0",
    margin: 0,
    rating: 0,
    views: 0,
    avgOrders: 1000,
    avgViews: 5000
  });

  const metricsRef = useRef(metrics);
  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  // Sync activeDish and auditResults from WorkspaceContext
  useEffect(() => {
    if (activeDish) {
      setMetrics(prev => ({
        ...prev,
        dishName: activeDish.name || prev.dishName,
        revenue: activeDish.price ? `₹${activeDish.price}` : prev.revenue,
      }));
      if (activeDish.processedImageUrl) {
        setImage(activeDish.processedImageUrl);
        // Attempt to pre-fetch the processed image to create imageFile for the analyzer
        // If it fails (e.g. CORS on signed URL), the backend will fetch the imageUrl directly.
        fetch(activeDish.processedImageUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "active_dish.jpeg", { type: blob.type || "image/jpeg" });
            setImageFile(file);
          })
          .catch(err => {
            console.log("Using image URL directly (CORS prevents local blob creation).");
            setImageFile(null);
          });
      }

    }
  }, [activeDish]);

  useEffect(() => {
    if (auditResults) {
      setData(auditResults);
    }
  }, [auditResults]);

  useEffect(() => {
    const handleSendToAudit = async (e: any) => {
      const url = e.detail?.url;
      if (!url) return;
      
      document.getElementById('intelligence-section')?.scrollIntoView({ behavior: 'smooth' });

      setImage(url);
      setIsProcessing(true);
      setData(null);
      setSaveSuccess(false);

      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], "generated_image.jpeg", { type: blob.type || "image/jpeg" });
        setImageFile(file);
      } catch (err) {
        console.error("Failed to fetch image from URL", err);
      } finally {
        setIsProcessing(false);
      }
    };

    window.addEventListener('SEND_TO_AUDIT', handleSendToAudit);
    return () => window.removeEventListener('SEND_TO_AUDIT', handleSendToAudit);
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setImage(localUrl);
    setImageFile(file);
    setIsProcessing(true);
    setData(null);
    setSaveSuccess(false);

    const formData = new FormData();
    formData.append('dishName', metrics.dishName);
    formData.append('orders', metrics.orders.toString());
    formData.append('margin', metrics.margin.toString());
    formData.append('views', metrics.views.toString());
    formData.append('revenue', metrics.revenue);
    formData.append('rating', metrics.rating.toString());
    formData.append('avgOrders', metrics.avgOrders.toString());
    formData.append('avgViews', metrics.avgViews.toString());
    formData.append('image', file);

    try {
      const response = await fetch('/api/visual-intelligence', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        setData(result);
        await updateAuditResults(result);
        await updateActiveDish({
          name: metrics.dishName,
          description: activeDish?.description || '',
          price: metrics.revenue.replace('₹', '').trim(),
          rawImageUrl: localUrl,
          processedImageUrl: result.publicUrl || localUrl
        });
      } else {
        alert('Intelligence Engine Error: ' + result.error);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to connect to Intelligence Engine');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!data || !imageFile) return;
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('audit_results', JSON.stringify(data));

    try {
      const response = await fetch('/api/save-intelligence', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        setSaveSuccess(true);
      } else {
        alert('Save Error: ' + result.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to connect to Database');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="intelligence-section" className="max-w-6xl mx-auto p-6 py-12">
      <div className="text-center mb-12 space-y-3">
        <h2 className="text-2xl font-bold text-slate-900">
          Upload a dish photo and adjust metrics to run the audit
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto text-sm">
          Fill in the business performance metrics, then upload a dish image to surface actionable AI-driven insights.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Simulation Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border border-slate-200 bg-white p-6 rounded-2xl space-y-6 shadow-sm">
            <h3 className="text-slate-900 font-semibold flex items-center gap-2">
              <Activity size={18} className="text-purple-600" />
              Performance Simulation
            </h3>
            
            <div className="space-y-4">
              <MetricInput 
                label="Dish Name" 
                value={metrics.dishName} 
                type="text"
                onChange={(v) => setMetrics({...metrics, dishName: v})} 
                icon={<Activity size={14} />}
              />
              <MetricInput 
                label="Orders Count" 
                value={metrics.orders} 
                onChange={(v) => setMetrics({...metrics, orders: parseInt(v)})} 
                icon={<TrendingUp size={14} />}
              />
              <MetricInput 
                label="Estimated Revenue" 
                value={metrics.revenue} 
                type="text"
                onChange={(v) => setMetrics({...metrics, revenue: v})} 
                icon={<BarChart3 size={14} />}
              />
              <MetricInput 
                label="Profit Margin (0-1)" 
                value={metrics.margin} 
                onChange={(v) => setMetrics({...metrics, margin: parseFloat(v)})} 
                icon={<DollarSign size={14} />}
              />
              <MetricInput 
                label="Guest Rating (0-5)" 
                value={metrics.rating} 
                onChange={(v) => setMetrics({...metrics, rating: parseFloat(v)})} 
                icon={<Star size={14} />}
              />
              <MetricInput 
                label="Views / Clicks" 
                value={metrics.views} 
                onChange={(v) => setMetrics({...metrics, views: parseInt(v)})} 
                icon={<Eye size={14} />}
              />
            </div>

            {image && (
              <button 
                onClick={async () => {
                  setIsProcessing(true);
                  setData(null);
                  setSaveSuccess(false);
                  
                  const formData = new FormData();
                  formData.append('dishName', metrics.dishName);
                  formData.append('orders', metrics.orders.toString());
                  formData.append('margin', metrics.margin.toString());
                  formData.append('views', metrics.views.toString());
                  formData.append('revenue', metrics.revenue);
                  formData.append('rating', metrics.rating.toString());
                  formData.append('avgOrders', metrics.avgOrders.toString());
                  formData.append('avgViews', metrics.avgViews.toString());
                  if (imageFile) {
                    formData.append('image', imageFile);
                  } else {
                    formData.append('imageUrl', image);
                  }

                  try {
                    const res = await fetch('/api/visual-intelligence', { method: 'POST', body: formData });
                    const result = await res.json();
                    if (result.success) setData(result);
                    else alert('Error: ' + result.error);
                  } catch(e) {
                    alert('Failed to run audit');
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
                className="w-full py-3.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl font-medium hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Activity size={20} />}
                {isProcessing ? "Analyzing..." : data ? "Re-Analyze Metrics" : "Run Intelligence Audit"}
              </button>
            )}

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
            >
              {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
              {isProcessing ? "Analyzing Patterns..." : image ? "Upload Different Dish" : "Upload & Analyze Dish"}
            </button>
          </div>

          {/* AI Score Breakdown (Visible after analysis) */}
          {data && (
            <div className="border border-slate-200 bg-white p-6 rounded-2xl space-y-4 shadow-sm">
              <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider">AI Visual Score: {data.ai_visual_score.overall_score}/10</h4>
              <div className="space-y-3">
                {Object.entries(data.ai_visual_score.criteria).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 uppercase">
                      <span>{key}</span>
                      <span>{val}/10</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(val as number) * 10}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: The Dashboard Card */}
        <div className="lg:col-span-8 flex justify-center">
          {isProcessing ? (
            <div className="h-[500px] w-full max-w-2xl rounded-2xl border border-slate-200 bg-white flex flex-col items-center justify-center space-y-4 shadow-sm">
              <Loader2 size={48} className="text-purple-600 animate-spin" />
              <div className="text-slate-600 font-mono text-sm animate-pulse">RECONSTRUCTING BUSINESS LOGIC...</div>
            </div>
          ) : data ? (
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <BarChart3 size={40} className="text-slate-100" />
              </div>

              <div className="space-y-8">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold text-slate-900">Visual Intelligence Snapshot</h2>
                  <p className="text-slate-400 text-sm">Real-time performance vs Visual quality audit</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Left: Snapshot */}
                  <div className="space-y-6">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img src={image || ''} alt="Dish" className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      <DataPoint label="Orders" value={data.dish_stats.orders.toLocaleString()} icon={<Activity size={14} />} />
                      <DataPoint label="Revenue" value={data.dish_stats.revenue} icon={<DollarSign size={14} />} />
                      <DataPoint label="Margin" value={`${(data.dish_stats.margin * 100).toFixed(0)}%`} icon={<Target size={14} />} />
                      <DataPoint 
                        label="Rating" 
                        value={
                          <div className="flex items-center gap-1.5">
                            {data.dish_stats.rating}
                            <Star size={14} className="text-[#FFD700] fill-[#FFD700]" />
                          </div>
                        } 
                        icon={<ShieldCheck size={14} />} 
                      />
                    </div>
                  </div>

                  {/* Right: AI Insights */}
                  <div className="space-y-6">
                    <h4 className="text-purple-600 text-xs font-bold uppercase tracking-[0.2em]">AI Insights</h4>
                    <div className="space-y-4">
                      {data.insights.length > 0 ? data.insights.map((insight, idx) => (
                        <div key={idx} className={`p-5 rounded-xl border ${insight.color === 'green' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} flex gap-4 transition-all hover:scale-[1.02]`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${insight.color === 'green' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            {insight.color === 'green' ? <ArrowUpCircle size={20} /> : <AlertTriangle size={20} />}
                          </div>
                          <div className="space-y-1">
                            <h5 className="text-slate-800 font-medium text-sm leading-tight">{insight.title}</h5>
                            <p className="text-slate-500 text-[11px] leading-relaxed">{insight.description}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="p-8 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-3">
                          <ShieldCheck size={24} className="text-slate-300 mx-auto" />
                          <p className="text-slate-400 text-xs font-mono">No critical mismatches detected. Visual performance is optimal.</p>
                        </div>
                      )}
                    </div>

                    {data.ai_visual_score.weaknesses.length > 0 && (
                      <div className="pt-4 border-t border-slate-200 space-y-2">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Weaknesses detected:</span>
                        <div className="flex flex-wrap gap-2">
                          {data.ai_visual_score.weaknesses.map(w => (
                            <span key={w} className="px-2 py-1 bg-red-50 text-red-600 rounded-md text-[9px] border border-red-200">{w}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
              </div>
          ) : image ? (
            <div className="h-[500px] w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-10 shadow-sm flex flex-col items-center justify-center space-y-6">
              <div className="aspect-[4/3] w-full max-w-sm rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                <img src={image} alt="Dish" className="w-full h-full object-cover" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-slate-800 font-medium text-lg">Image Loaded Successfully</h3>
                <p className="text-slate-400 text-sm max-w-xs">
                  Fill in the Performance Simulation metrics on the left, then click <strong className="text-purple-600">Run Intelligence Audit</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-[500px] w-full max-w-2xl rounded-2xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center space-y-6 text-center p-12 shadow-sm">
              <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center">
                <Target size={32} className="text-purple-300" />
              </div>
              <div className="space-y-2">
                <h3 className="text-slate-600 text-xl font-medium">Ready for Intelligence Audit</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">Upload a photo to see how visual quality impacts your bottom line.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricInput({ label, value, onChange, icon, type = "number" }: { label: string, value: any, onChange: (v: string) => void, icon: React.ReactNode, type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest flex items-center gap-2">
        <span className="text-purple-500">{icon}</span>
        {label}
      </label>
      <input 
        type={type} 
        step={type === "number" ? "0.01" : undefined}
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 transition-colors"
      />
    </div>
  );
}

function DataPoint({ label, value, icon }: { label: string, value: any, icon: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
        <span className="text-purple-500">{icon}</span>
        {label}
      </div>
      <div className="text-lg font-medium text-slate-900">{value}</div>
    </div>
  );
}
