"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Upload, 
  Sparkles, 
  BarChart3, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Image as ImageIcon,
  ChevronRight,
  Loader2,
  Camera,
  Layers,
  ArrowRight,
  MousePointer2,
  Clapperboard
} from "lucide-react"

type Props = {
  dish: any
  isOpen: boolean
  onClose: () => void
  avgOrders: number
  avgViews: number
  setActiveTab?: (tab: string) => void
  setInitialVideoPrompt?: (prompt: string) => void
}

export default function VisualModal({ 
  dish, 
  isOpen, 
  onClose, 
  avgOrders, 
  avgViews,
  setActiveTab,
  setInitialVideoPrompt
}: Props) {
  const [activeModule, setActiveModule] = useState<"none" | "creation" | "intelligence">("none")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  // Creation State
  const [creationLoading, setCreationLoading] = useState(false)
  const [creationResults, setCreationResults] = useState<any[] | null>(null)
  const [selectedStyleIndex, setSelectedStyleIndex] = useState<number | null>(null)
  const [confirmedImage, setConfirmedImage] = useState<string | null>(null)

  // Intelligence State
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditResult, setAuditResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setConfirmedImage(null) // Clear previous selection when new file is chosen
      setAuditResult(null)
      setCreationResults(null)
      setSelectedStyleIndex(null)
    }
  }

  // CLOUD PERSISTENCE: Load existing audit on mount
  useEffect(() => {
    if (isOpen && dish?.dish_name) {
      const fetchExistingAudit = async () => {
        try {
          const res = await fetch(`http://127.0.0.1:8000/get-dish-audit/${encodeURIComponent(dish.dish_name)}`)
          const data = await res.json()
          if (data.status !== "not_found" && !data.error) {
            // Load previous results
            if (data.audit_results) {
              setAuditResult(data.audit_results)
              setActiveModule("intelligence")
            }
            if (data.selected_image_url) {
              setConfirmedImage(data.selected_image_url)
            }
          }
        } catch (err) {
          console.error("Failed to load existing audit:", err)
        }
      }
      fetchExistingAudit()
    }
  }, [isOpen, dish])

  if (!isOpen) return null

  const runVisualCreation = async () => {
    if (!selectedFile) return
    setCreationLoading(true)
    setCreationResults(null)
    
    const formData = new FormData()
    formData.append("file", selectedFile)
    formData.append("dish_name", dish.dish_name)

    try {
      const res = await fetch("http://127.0.0.1:8000/process-visual-creation", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setCreationResults(data.results)
      } else {
        alert("Creation failed: " + (data.error || data.message || "Unknown error"))
      }
    } catch (err) {
      console.error(err)
      alert("Error connecting to visual creation engine")
    } finally {
      setCreationLoading(false)
    }
  }

  const runVisualAudit = async (customUrl?: string) => {
    const fileToUse = selectedFile
    if (!fileToUse && !customUrl) return
    
    setAuditLoading(true)
    setAuditResult(null)
    
    const formData = new FormData()
    // ONLY append file if we have one. If we have customUrl, the backend will use that.
    if (fileToUse) {
      formData.append("file", fileToUse)
    }
    
    formData.append("dish_name", dish.dish_name)
    formData.append("orders", (dish.number_sold || 0).toString())
    formData.append("margin", ((dish.profit_margin || 0) / 100).toString())
    formData.append("views", ((dish.number_sold || 0) * 1.5).toFixed(0)) 
    formData.append("revenue", (dish.revenue || 0).toString())
    formData.append("rating", "4.5") 
    formData.append("avg_orders", avgOrders.toString())
    formData.append("avg_views", avgViews.toString())
    
    if (customUrl) {
      formData.append("image_url", customUrl)
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/analyze-visual-intelligence", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (data.success || data.ai_visual_score) {
        setAuditResult(data)
      } else {
        alert("Audit failed: " + (data.error || data.message || "Could not analyze image"))
      }
    } catch (err) {
      console.error(err)
      alert("Error connecting to intelligence hub")
    } finally {
      setAuditLoading(false)
    }
  }

  const selectAndSaveImage = async (index: number) => {
    setSelectedStyleIndex(index)
    const result = creationResults?.[index]
    if (result) {
      // Use the Cloud URL returned by the backend (if available) or the local one
      const imageUrl = result.cloud_url || `http://127.0.0.1:8000/images/${result.filename}`
      setConfirmedImage(imageUrl)
      
      // PERSISTENCE: Save to Cloud
      try {
        const formData = new FormData()
        formData.append("dish_name", dish.dish_name)
        formData.append("image_url", imageUrl)
        
        await fetch("http://127.0.0.1:8000/save-dish-visual", {
          method: "POST",
          body: formData
        })
      } catch (e) {
        console.error("Failed to save visual selection to cloud:", e)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-6xl h-full max-h-[850px] bg-card border border-border rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Top Header */}
        <div className="px-10 py-6 border-b border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-5">
             <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
               <Zap size={30} fill="currentColor" />
             </div>
             <div>
                <h2 className="text-2xl font-bold">{dish.dish_name}</h2>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <span>Executive Visual Intelligence</span>
                  <ChevronRight size={14} />
                  <span className="text-primary font-medium">{activeModule === "none" ? "Select Module" : activeModule === "creation" ? "Visual Studio" : "Intelligence Hub"}</span>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full hover:bg-muted flex items-center justify-center transition-all border border-transparent hover:border-border">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10">
          
          {/* STEP 0: Select Module */}
          {activeModule === "none" && (
            <div className="h-full flex flex-col items-center justify-center space-y-12 py-10">
              <div className="text-center space-y-4 max-w-2xl">
                 <h1 className="text-4xl font-black tracking-tight">How do you want to optimize <br />the <span className="text-primary">{dish.dish_name}</span>?</h1>
                 <p className="text-muted-foreground text-lg">Select a workflow to enhance your menu visuals or audit business impact.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                 {/* CREATION CARD */}
                 <motion.div 
                  whileHover={{ y: -8 }}
                  onClick={() => setActiveModule("creation")}
                  className="p-8 rounded-[32px] bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 cursor-pointer group relative overflow-hidden"
                 >
                   <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                     <Sparkles size={32} />
                   </div>
                   <h3 className="text-2xl font-bold mb-2 text-foreground">10x Visual Studio</h3>
                   <p className="text-muted-foreground mb-6">Transform amateur dish photos into professional studio-quality hero shots with 3 distinct luxury styles.</p>
                   <div className="flex items-center text-primary font-bold gap-2">
                     Enter Studio <ArrowRight size={18} />
                   </div>
                 </motion.div>

                 {/* INTELLIGENCE CARD */}
                 <motion.div 
                  whileHover={{ y: -8 }}
                  onClick={() => setActiveModule("intelligence")}
                  className="p-8 rounded-[32px] bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20 cursor-pointer group relative overflow-hidden"
                 >
                   <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
                     <BarChart3 size={32} />
                   </div>
                   <h3 className="text-2xl font-bold mb-2 text-foreground">Intelligence Hub</h3>
                   <p className="text-muted-foreground mb-6">Run a visual quality audit cross-referenced with profitability data to identify revenue leakages.</p>
                   <div className="flex items-center text-secondary font-bold gap-2">
                     Open Audit Hub <ArrowRight size={18} />
                   </div>
                 </motion.div>
              </div>
            </div>
          )}

          {/* CREATION WORKFLOW */}
          {activeModule === "creation" && (
            <div className="space-y-12">
               <button onClick={() => setActiveModule("none")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                 <ArrowRight className="rotate-180" size={16} /> Back to Modules
               </button>

               {!creationResults ? (
                 <div className="flex flex-col items-center justify-center space-y-10 py-10">
                    <div className="w-full max-w-2xl">
                      {!previewUrl ? (
                        <label className="relative flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-border rounded-[40px] cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-all group">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-all">
                              <Camera size={32} className="text-primary" />
                            </div>
                            <p className="text-xl font-bold">Upload Amateur Dish Photo</p>
                            <p className="text-muted-foreground mt-2">Drag and drop or click to browse</p>
                          </div>
                          <input type="file" className="hidden" onChange={handleFileChange} />
                        </label>
                      ) : (
                        <div className="relative rounded-[40px] overflow-hidden border border-border aspect-video group">
                           <img src={previewUrl} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => {setPreviewUrl(null); setSelectedFile(null);}} className="bg-white text-black px-6 py-2 rounded-full font-bold">Change Image</button>
                           </div>
                        </div>
                      )}
                    </div>
                    {previewUrl && (
                      <button 
                        onClick={runVisualCreation}
                        disabled={creationLoading}
                        className="px-12 py-5 bg-primary text-primary-foreground rounded-3xl font-black text-xl shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
                      >
                        {creationLoading ? <Loader2 className="animate-spin" /> : <Zap size={24} />}
                        Transform into 10x Hero Shots
                      </button>
                    )}
                 </div>
               ) : (
                 <div className="space-y-10">
                    <div className="flex items-center justify-between">
                       <h3 className="text-3xl font-bold">Generated AI Styles</h3>
                       <p className="text-muted-foreground">Select your preferred style to confirm as the new Menu Hero.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       {creationResults.map((res, i) => (
                         <div 
                          key={i} 
                          onClick={() => selectAndSaveImage(i)}
                          className={`relative group rounded-[40px] overflow-hidden border-4 transition-all cursor-pointer ${selectedStyleIndex === i ? "border-primary scale-[1.02] shadow-2xl" : "border-transparent hover:border-primary/30"}`}
                         >
                            <div className="aspect-[3/4]">
                               <img src={res.cloud_url || `http://127.0.0.1:8000/images/${res.filename}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black to-transparent text-white">
                               <p className="text-xs font-black uppercase opacity-60 mb-1">{res.style.replace("_", " ")}</p>
                               <h4 className="text-lg font-bold">Enhanced Quality</h4>
                            </div>
                            {selectedStyleIndex === i && (
                              <div className="absolute top-6 right-6 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg">
                                <CheckCircle2 size={20} />
                              </div>
                            )}
                         </div>
                       ))}
                    </div>

                    {selectedStyleIndex !== null && (
                      <div className="flex justify-center pt-6">
                         <button 
                          onClick={() => {
                            setActiveModule("intelligence");
                            setPreviewUrl(confirmedImage);
                            setSelectedFile(null); // We are using the confirmed image URL now
                          }}
                          className="px-12 py-5 bg-foreground text-background rounded-3xl font-bold text-lg hover:scale-105 transition-all flex items-center gap-3"
                         >
                           Confirm & Run Visual Audit <ArrowRight size={20} />
                         </button>
                      </div>
                    )}
                 </div>
               )}
            </div>
          )}

          {/* INTELLIGENCE WORKFLOW */}
          {activeModule === "intelligence" && (
             <div className="space-y-10">
               <button onClick={() => setActiveModule("none")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                 <ArrowRight className="rotate-180" size={16} /> Back to Modules
               </button>

               {!auditResult ? (
                  <div className="flex flex-col items-center justify-center space-y-10 py-10">
                    <div className="text-center space-y-3">
                      <h3 className="text-3xl font-black">Visual Intelligence Hub</h3>
                      <p className="text-muted-foreground text-lg">Perform a 5-point audit on your dish photo cross-referenced with performance data.</p>
                    </div>

                    <div className="w-full max-w-2xl">
                      {(previewUrl || confirmedImage) ? (
                        <div className="relative rounded-[40px] overflow-hidden border border-border aspect-square group shadow-2xl">
                           <img src={confirmedImage || previewUrl!} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => {setPreviewUrl(null); setConfirmedImage(null); setSelectedFile(null);}} className="bg-white text-black px-6 py-2 rounded-full font-bold">Upload Different Image</button>
                           </div>
                        </div>
                      ) : (
                        <label className="relative flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-border rounded-[40px] cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-all group">
                          <div className="flex flex-col items-center justify-center">
                            <Upload size={32} className="text-primary mb-4" />
                            <p className="text-xl font-bold">Select Image for Audit</p>
                          </div>
                          <input type="file" className="hidden" onChange={handleFileChange} />
                        </label>
                      )}
                    </div>

                    {(previewUrl || confirmedImage) && (
                      <button 
                        onClick={() => runVisualAudit(confirmedImage || undefined)}
                        disabled={auditLoading}
                        className="px-12 py-5 bg-secondary text-secondary-foreground rounded-3xl font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
                      >
                        {auditLoading ? <Loader2 className="animate-spin" /> : <BarChart3 size={24} />}
                        Analyze Visual Performance
                      </button>
                    )}
                  </div>
               ) : (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Audit Report */}
                    <div className="space-y-10">
                       <div className="p-8 bg-muted/20 border border-border rounded-[40px] space-y-8">
                          <div className="flex items-center justify-between">
                            <h4 className="text-2xl font-bold">Visual Health Score</h4>
                            <div className="px-6 py-3 bg-primary/10 text-primary rounded-2xl text-2xl font-black">
                              {auditResult.ai_visual_score?.overall_score || "N/A"}/10
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-6">
                            {auditResult.ai_visual_score?.criteria && Object.entries(auditResult.ai_visual_score.criteria).map(([key, val]: [any, any]) => (
                               <div key={key} className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="capitalize font-medium">{key}</span>
                                    <span className="font-bold">{val}/10</span>
                                  </div>
                                  <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                                     <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${val * 10}%` }}
                                      className={`h-full ${val > 7 ? "bg-green-500" : val > 5 ? "bg-yellow-500" : "bg-red-500"}`}
                                     />
                                  </div>
                               </div>
                            ))}
                          </div>
                       </div>

                       <div className="space-y-4">
                          <h4 className="text-xl font-bold px-2">Decision Intelligence</h4>
                          <div className="space-y-4">
                             {auditResult.insights?.map((insight: any, i: number) => (
                                <div key={i} className={`p-6 rounded-[32px] border flex gap-6 ${insight.color === "orange" ? "bg-orange-500/5 border-orange-500/20" : "bg-green-500/5 border-green-500/20"}`}>
                                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${insight.color === "orange" ? "bg-orange-500/20 text-orange-600" : "bg-green-500/20 text-green-600"}`}>
                                      {insight.color === "orange" ? <AlertTriangle size={28} /> : <CheckCircle2 size={28} />}
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">{insight.label}</p>
                                      <h5 className="text-lg font-bold mb-1">{insight.title}</h5>
                                      <p className="text-muted-foreground text-sm leading-relaxed">{insight.description}</p>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>

                    {/* Visual Analysis View */}
                    <div className="space-y-8">
                       <div className="relative rounded-[40px] overflow-hidden border border-border aspect-square shadow-2xl">
                          <img src={confirmedImage || previewUrl!} className="w-full h-full object-cover" />
                          <div className="absolute top-8 left-8 px-5 py-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-white text-xs font-black">
                             AUDIT SUBJECT
                          </div>
                       </div>

                       <div className="p-8 bg-card border border-border rounded-[40px] space-y-4">
                          <h5 className="font-bold flex items-center gap-2 text-yellow-600">
                             <Zap size={20} /> AI Quality Feedback
                          </h5>
                          <div className="grid grid-cols-1 gap-3">
                             {auditResult.ai_visual_score?.weaknesses?.map((w: string, i: number) => (
                               <div key={i} className="flex items-center gap-3 text-muted-foreground text-sm">
                                  <div className="w-2 h-2 rounded-full bg-border" />
                                  {w}
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
               )}
             </div>
          )}

        </div>

        {/* Footer Stats Bar */}
        <div className="px-10 py-6 border-t border-border bg-muted/10 flex items-center justify-between">
           <div className="flex gap-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Dish Category</span>
                <span className="font-bold text-lg">{dish.category}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Profit</span>
                <span className="font-bold text-lg">{dish.profit} OMR</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Unit Margin</span>
                <span className="font-bold text-lg text-primary">{dish.profit_margin}%</span>
              </div>
           </div>

           <div className="flex items-center gap-4">
              {activeModule !== "none" && (
                <button 
                  onClick={() => {
                    if (setActiveTab && setInitialVideoPrompt) {
                      const videoPrompt = `Create a high-end, luxury cinematic advertisement for our ${dish.category} dish: ${dish.dish_name}. Highlight its premium quality, professional plating, and the authentic culinary experience it offers.`
                      setInitialVideoPrompt(videoPrompt)
                      setActiveTab("video-studio")
                      onClose()
                    }
                  }}
                  className="px-8 py-3 bg-primary/10 text-primary border border-primary/20 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-primary/20 transition-all"
                >
                  <Clapperboard size={18} /> Generate Video Ad
                </button>
              )}
              {auditResult && (
                <button onClick={() => {setAuditResult(null); setActiveModule("none");}} className="px-6 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">Restart Audit</button>
              )}
              <button onClick={onClose} className="px-10 py-3 bg-foreground text-background rounded-full font-bold text-sm shadow-lg hover:bg-foreground/90 transition-all">Close Analytics</button>
           </div>
        </div>
      </motion.div>
    </div>
  )
}
