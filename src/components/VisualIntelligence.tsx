import React, { useState, useRef } from 'react';
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
  ShieldCheck
} from 'lucide-react';

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
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [data, setData] = useState<IntelligenceData | null>(null);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setImage(localUrl);
    setIsProcessing(true);
    setData(null);

    const formData = new FormData();
    // Append fields BEFORE the file for better Multer compatibility
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
      const response = await fetch('http://localhost:3005/api/visual-intelligence', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        setData(result);
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

  return (
    <div className="max-w-6xl mx-auto p-6 py-20">
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/20">
          <ShieldCheck size={14} className="text-brand-blue" />
          <span className="text-brand-blue font-mono text-[10px] font-bold tracking-widest uppercase">Visual Intelligence Layer</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-medium text-white">
          Connecting Design to <span className="text-brand-blue">Decisions.</span>
        </h1>
        <p className="text-white/40 max-w-2xl mx-auto">
          Upload a menu item photo and adjust its business performance metrics to surface actionable AI-driven insights.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Simulation Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card border border-white/5 bg-white/5 p-6 rounded-3xl space-y-6">
            <h3 className="text-white font-medium flex items-center gap-2">
              <Activity size={18} className="text-brand-blue" />
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

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full py-4 bg-brand-blue text-white rounded-2xl font-medium hover:bg-brand-blue/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-blue/20"
            >
              {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
              {isProcessing ? "Analyzing Patterns..." : "Upload & Analyze Dish"}
            </button>
          </div>

          {/* AI Score Breakdown (Visible after analysis) */}
          {data && (
            <div className="glass-card border border-white/5 bg-white/5 p-6 rounded-3xl space-y-4">
              <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider">AI Visual Score: {data.ai_visual_score.overall_score}/10</h4>
              <div className="space-y-3">
                {Object.entries(data.ai_visual_score.criteria).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/40 uppercase">
                      <span>{key}</span>
                      <span>{val}/10</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-blue" style={{ width: `${(val as number) * 10}%` }} />
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
            <div className="h-[500px] w-full max-w-2xl glass-card border border-white/5 flex flex-col items-center justify-center space-y-4">
              <Loader2 size={48} className="text-brand-blue animate-spin" />
              <div className="text-white font-mono text-sm animate-pulse">RECONSTRUCTING BUSINESS LOGIC...</div>
            </div>
          ) : data ? (
            <div className="w-full max-w-2xl bg-[#0F0F0F] border border-white/10 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <BarChart3 size={40} className="text-white/5" />
              </div>

              <div className="space-y-8">
                <div className="space-y-1">
                  <h2 className="text-2xl font-medium text-white">Visual Intelligence Snapshot</h2>
                  <p className="text-white/40 text-sm">Real-time performance vs Visual quality audit</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Left: Snapshot */}
                  <div className="space-y-6">
                    <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-white/5">
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
                    <h4 className="text-brand-blue text-xs font-bold uppercase tracking-[0.2em]">AI Insights</h4>
                    <div className="space-y-4">
                      {data.insights.length > 0 ? data.insights.map((insight, idx) => (
                        <div key={idx} className={`p-5 rounded-2xl border ${insight.color === 'green' ? 'bg-green-500/5 border-green-500/20' : 'bg-orange-500/5 border-orange-500/20'} flex gap-4 transition-all hover:scale-[1.02]`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${insight.color === 'green' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
                            {insight.color === 'green' ? <ArrowUpCircle size={20} /> : <AlertTriangle size={20} />}
                          </div>
                          <div className="space-y-1">
                            <h5 className="text-white font-medium text-sm leading-tight">{insight.title}</h5>
                            <p className="text-white/40 text-[11px] leading-relaxed">{insight.description}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="p-8 rounded-2xl border border-white/5 bg-white/5 text-center space-y-3">
                          <ShieldCheck size={24} className="text-white/20 mx-auto" />
                          <p className="text-white/20 text-xs font-mono">No critical mismatches detected. Visual performance is optimal.</p>
                        </div>
                      )}
                    </div>

                    {data.ai_visual_score.weaknesses.length > 0 && (
                      <div className="pt-4 border-t border-white/5 space-y-2">
                        <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Weaknesses detected:</span>
                        <div className="flex flex-wrap gap-2">
                          {data.ai_visual_score.weaknesses.map(w => (
                            <span key={w} className="px-2 py-1 bg-white/5 text-white/40 rounded-md text-[9px] border border-white/5">{w}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[500px] w-full max-w-2xl glass-card border-2 border-dashed border-white/5 flex flex-col items-center justify-center space-y-6 text-center p-12">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                <Target size={32} className="text-white/20" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white/60 text-xl font-medium">Ready for Intelligence Audit</h3>
                <p className="text-white/20 text-sm max-w-xs mx-auto">Upload a photo to see how visual quality impacts your bottom line.</p>
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
      <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest flex items-center gap-2">
        {icon}
        {label}
      </label>
      <input 
        type={type} 
        step={type === "number" ? "0.01" : undefined}
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-blue/50 transition-colors"
      />
    </div>
  );
}

function DataPoint({ label, value, icon }: { label: string, value: any, icon: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] text-white/30 uppercase font-bold tracking-tighter">
        {icon}
        {label}
      </div>
      <div className="text-lg font-medium text-white">{value}</div>
    </div>
  );
}
