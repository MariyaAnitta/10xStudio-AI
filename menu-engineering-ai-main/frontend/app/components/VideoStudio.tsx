"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Play, 
  Sparkles, 
  Video, 
  Download, 
  RefreshCcw, 
  Zap,
  ArrowRight,
  Loader2,
  Clapperboard,
  Music,
  Share2,
  Maximize
} from "lucide-react"

type Props = {
  initialPrompt?: string
}

export default function VideoStudio({ initialPrompt = "" }: Props) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [loading, setLoading] = useState(false)
  const [videoData, setVideoData] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const generateVideo = async () => {
    if (!prompt) return
    setLoading(true)
    setVideoData(null)

    const formData = new FormData()
    formData.append("prompt", prompt)

    try {
      const res = await fetch("http://127.0.0.1:8000/generate-video", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (data.html) {
        setVideoData(data)
      } else {
        alert("Video generation failed: " + (data.message || "Unknown error"))
      }
    } catch (err) {
      console.error(err)
      alert("Error connecting to Video Engine")
    } finally {
      setLoading(false)
    }
  }

  const [exporting, setExporting] = useState(false)

  const exportMP4 = async () => {
    if (!videoData?.html) return
    setExporting(true)

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Outfit:wght@400;700&display=swap" rel="stylesheet">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
          <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; }
            #stage { width: 100vw; height: 100vh; position: relative; }
            .video-headline { font-family: 'Playfair Display', serif; color: #fff; text-shadow: 0 4px 15px rgba(0,0,0,0.5); }
            .video-subtext { font-family: 'Outfit', sans-serif; color: #e2e8f0; text-transform: uppercase; letter-spacing: 2px; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
          </style>
        </head>
        <body>
          ${videoData.html}
          <script>
            window.onload = () => {
              const tl = window.__timelines["10x-video"];
              if (tl) tl.play();
            }
          </script>
        </body>
      </html>
    `

    const formData = new FormData()
    formData.append("html", fullHtml)
    formData.append("duration", "32") // 30s + buffer

    try {
      const res = await fetch("http://127.0.0.1:8000/export-mp4", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        // Trigger download
        const downloadUrl = `http://127.0.0.1:8000/videos/${data.filename}`
        const a = document.createElement("a")
        a.href = downloadUrl
        a.download = data.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        alert("Export failed: " + (data.error || "Unknown error"))
      }
    } catch (err) {
      console.error(err)
      alert("Error exporting video")
    } finally {
      setExporting(false)
    }
  }

  const renderVideo = () => {
    if (!videoData?.html) return ""
    
    // Wrap the generated HTML with necessary scripts and styles
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Outfit:wght@400;700&display=swap" rel="stylesheet">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
          <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; }
            #stage { width: 100vw; height: 100vh; position: relative; }
            .video-headline { font-family: 'Playfair Display', serif; color: #fff; text-shadow: 0 4px 15px rgba(0,0,0,0.5); }
            .video-subtext { font-family: 'Outfit', sans-serif; color: #e2e8f0; text-transform: uppercase; letter-spacing: 2px; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
          </style>
        </head>
        <body>
          ${videoData.html}
          <script>
            window.onload = () => {
              const tl = window.__timelines["10x-video"];
              if (tl) {
                tl.play();
              }
            }
          </script>
        </body>
      </html>
    `
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-bold w-fit">
          <Clapperboard size={16} /> 10x Cinematic Ad Studio
        </div>
        <h1 className="text-4xl font-black tracking-tight">AI Promotional Video Engine</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Transform your high-performing dishes into cinematic social media advertisements using Generative AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Control Panel */}
        <div className="lg:col-span-5 space-y-8">
           <div className="bg-card border border-border p-8 rounded-[32px] shadow-sm space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Video Ad Brief</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your promotion (e.g., Luxury 30s ad for our best-selling Star dish, highlighting traditional flavors...)"
                  className="w-full h-40 bg-muted/30 border border-border rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                />
              </div>

              <button 
                onClick={generateVideo}
                disabled={loading || !prompt}
                className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={24} />}
                Generate Masterpiece
              </button>
           </div>

           {videoData && (
             <div className="bg-primary/5 border border-primary/10 p-6 rounded-3xl space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Zap size={18} className="text-primary" /> 
                  AI Scene Strategy
                </h3>
                <div className="space-y-3">
                  {videoData.scenes?.map((scene: any, i: number) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-muted-foreground">
                        <span className="text-foreground font-bold">{scene.headline}</span>: {scene.subtext}
                      </p>
                    </div>
                  ))}
                </div>
             </div>
           )}
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-7 space-y-6">
          <div className="aspect-video bg-black rounded-[40px] border border-border shadow-2xl overflow-hidden relative group">
             {videoData ? (
               <>
                 <iframe 
                  ref={iframeRef}
                  srcDoc={renderVideo()}
                  className="w-full h-full border-none"
                  title="AI Video Preview"
                 />
                 <button 
                  onClick={() => {
                    if (iframeRef.current) {
                      iframeRef.current.requestFullscreen().catch(e => console.error(e));
                    }
                  }}
                  className="absolute top-6 right-6 p-4 bg-black/50 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 z-20"
                 >
                   <Maximize size={24} />
                 </button>
               </>
             ) : (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 space-y-6">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                    <Video size={48} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold">Studio Preview Ready</h4>
                    <p className="text-muted-foreground max-w-xs">Enter a brief and click generate to render your cinematic advertisement.</p>
                  </div>
               </div>
             )}
          </div>

          <div className="flex gap-4">
             <button 
              onClick={exportMP4}
              disabled={exporting || !videoData}
              className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
             >
               {exporting ? <Loader2 className="animate-spin" /> : <Download size={20} />}
               {exporting ? "Rendering 4K MP4..." : "Download 4K MP4"}
             </button>
             <button className="flex-1 py-4 bg-muted text-foreground rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-border transition-colors">
               <Share2 size={20} /> Share Ad
             </button>
          </div>
        </div>

      </div>
    </div>
  )
}
