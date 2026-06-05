import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, CheckCircle2, ChevronRight, Download, Edit3, RotateCcw, 
  Calendar, Check, Wand2, Megaphone, Share2, Copy, ArrowLeft, ArrowRight, X, Phone, Globe
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { useWorkspace } from '../context/WorkspaceContext';

export interface BrandKit {
  brandStyle: string;
  primaryColor: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  logoUrl: string | null;
  restaurantName: string;
}

const loadBrandKit = (): BrandKit => {
  const kit = sessionStorage.getItem('brandKit');
  if (kit) return JSON.parse(kit);
  return {
    brandStyle: 'bold',
    primaryColor: '#D4121A',
    bgColor: '#1E1040',
    textColor: '#FFFFFF',
    accentColor: '#EAB308',
    logoUrl: null,
    restaurantName: 'SPICE GARDEN',
  };
};

const CAMPAIGN_TYPES = [
  'Dish promo', 'Festival', 'Combo offer', 
  'Flash sale', 'Seasonal', 'New launch'
];

const INITIAL_PLATFORMS = [
  { id: 'ig', name: 'Instagram', desc: 'Post + Story · auto-sized', time: '', scheduleTime: '', type: 'Post', checked: true },
  { id: 'wa', name: 'WhatsApp Business', desc: 'Banner · broadcast list', time: '', scheduleTime: '', checked: true },
  { id: 'fb', name: 'Facebook', desc: 'Post · page feed', time: '', scheduleTime: '', checked: false },
  { id: 'zomato', name: 'Swiggy / Zomato', desc: 'Listing image · updated live', time: '', scheduleTime: '', checked: true },
];

// High-fidelity fallback Unsplash stock backgrounds
const FALLBACK_POSTERS = [
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=1000", // Burger
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1000", // Salad / Bowl
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1000", // Pizza
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1000"  // Grill / Naan
];

export default function CampaignStudioPage() {
  const { brandKit: workspaceBrandKit, activeDish } = useWorkspace();
  const [brandKit, setBrandKit] = useState<BrandKit>(loadBrandKit());
  const [activeStep, setActiveStep] = useState(1);
  
  // Step 1 states
  const [dishName, setDishName] = useState('Chicken Burger');
  const [description, setDescription] = useState('Crispy chicken breast with molten cheddar and rich home sauce');
  const [price, setPrice] = useState('320');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Step 2 states
  const [selectedCampaign, setSelectedCampaign] = useState(CAMPAIGN_TYPES[3]); // Default to Flash sale
  const [tone, setTone] = useState('Casual');
  
  // Combo offer inputs
  const [dishName2, setDishName2] = useState('Golden French Fries');
  const [description2, setDescription2] = useState('Hand-cut crispy potatoes seasoned with sea salt and rosemary');
  const [price2, setPrice2] = useState('90');

  // Edit Creative states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [badgeText, setBadgeText] = useState('30% OFF');
  const [taglineText, setTaglineText] = useState('LIMITED TIME OFFER');
  const [footerPhone, setFooterPhone] = useState('+91 98765 43210');
  const [footerWeb, setFooterWeb] = useState('www.spicegarden.com');
  const [selectedTemplate, setSelectedTemplate] = useState('Modern Bold'); // 'Modern Bold', 'Classic Premium', 'Gourmet Gold', 'Minimal Accent'

  // Generation status states
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  
  // Output states
  const [caption, setCaption] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All formats');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Publishing states
  const [platformsState, setPlatformsState] = useState(INITIAL_PLATFORMS);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  
  const igPostRef = useRef<HTMLDivElement>(null);
  const igStoryRef = useRef<HTMLDivElement>(null);
  const waStatusRef = useRef<HTMLDivElement>(null);
  const fbEventRef = useRef<HTMLDivElement>(null);
  const reelThumbRef = useRef<HTMLDivElement>(null);

  const [capturedPosterBlob, setCapturedPosterBlob] = useState<Blob | null>(null);
  const [isPreparingToPublish, setIsPreparingToPublish] = useState(false);

  // Sync workspace brand kit
  useEffect(() => {
    if (workspaceBrandKit) {
      const primary = workspaceBrandKit.colors.find(c => c.label === 'Primary')?.hex || '#D4121A';
      const bg = workspaceBrandKit.colors.find(c => c.label === 'Background')?.hex || '#1E1040';
      const text = workspaceBrandKit.colors.find(c => c.label === 'Text')?.hex || '#FFFFFF';
      const accent = workspaceBrandKit.colors.find(c => c.label === 'Accent')?.hex || '#EAB308';
      
      const localBrandKit = {
        brandStyle: workspaceBrandKit.style || 'bold',
        primaryColor: primary,
        bgColor: bg,
        textColor: text,
        accentColor: accent,
        logoUrl: workspaceBrandKit.logoUrl,
        restaurantName: workspaceBrandKit.restaurantName,
      };
      setBrandKit(localBrandKit);
      if (workspaceBrandKit.restaurantName) {
        const sanitized = workspaceBrandKit.restaurantName.toLowerCase().replace(/\s+/g, '');
        setFooterWeb(`www.${sanitized}.com`);
      }
    }
  }, [workspaceBrandKit]);

  // Sync active dish details
  useEffect(() => {
    if (activeDish) {
      if (activeDish.name) setDishName(activeDish.name);
      if (activeDish.description) setDescription(activeDish.description);
      if (activeDish.price) setPrice(activeDish.price);
      
      if (activeDish.processedImageUrl) {
        setImagePreview(activeDish.processedImageUrl);
        // Pre-fetch processed image to convert it into a File object for multipart form uploading
        fetch(activeDish.processedImageUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "campaign_dish.jpeg", { type: blob.type || "image/jpeg" });
            setImageFile(file);
          })
          .catch(err => console.error("Failed to load processed image in CampaignStudio:", err));
      } else if (activeDish.rawImageUrl) {
        setImagePreview(activeDish.rawImageUrl);
        fetch(activeDish.rawImageUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "campaign_dish.jpeg", { type: blob.type || "image/jpeg" });
            setImageFile(file);
          })
          .catch(err => console.error("Failed to load raw image in CampaignStudio:", err));
      }
    }
  }, [activeDish]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ── CORE PIPELINE: FULL GENERATION ──
  const handleGenerateFull = async () => {
    setIsGeneratingText(true);
    setIsGeneratingImages(true);
    setCaption(null);
    setHashtags([]);
    
    try {
      const formData = new FormData();
      formData.append('mode', 'all');
      formData.append('campaignType', selectedCampaign);
      formData.append('brandStyle', brandKit.brandStyle);
      formData.append('tone', tone);

      if (selectedCampaign === 'Combo offer') {
        const combinedDishName = `${dishName} & ${dishName2}`;
        const combinedDesc = `${description} + ${description2}`;
        const totalVal = (parseFloat(price) || 0) + (parseFloat(price2) || 0);
        const comboVal = Math.round(totalVal * 0.85); // 15% discount
        formData.append('dishName', combinedDishName);
        formData.append('description', combinedDesc);
        formData.append('price', comboVal.toString());
      } else {
        formData.append('dishName', dishName);
        formData.append('description', description);
        formData.append('price', price);
      }

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch('/api/generate-campaign', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setCaption(data.caption);
        setHashtags(data.hashtags);
        if (data.images && data.images.length > 0) {
          setGeneratedImages(data.images);
        }
        // Success: jump to Step 3 review
        setActiveStep(3);
      } else {
        alert('Failed to generate: ' + (data.error || 'Server error'));
      }
    } catch (e) {
      console.error(e);
      alert('Generation error. Please ensure the backend at port 3005 is active!');
    } finally {
      setIsGeneratingText(false);
      setIsGeneratingImages(false);
    }
  };

  // ── MODE: REGENERATE IMAGES ONLY ──
  const handleRegenerateImagesOnly = async () => {
    setIsGeneratingImages(true);
    try {
      const formData = new FormData();
      formData.append('mode', 'images');
      formData.append('campaignType', selectedCampaign);
      formData.append('brandStyle', brandKit.brandStyle);
      formData.append('tone', tone);

      if (selectedCampaign === 'Combo offer') {
        const combinedDishName = `${dishName} & ${dishName2}`;
        const combinedDesc = `${description} + ${description2}`;
        const totalVal = (parseFloat(price) || 0) + (parseFloat(price2) || 0);
        const comboVal = Math.round(totalVal * 0.85);
        formData.append('dishName', combinedDishName);
        formData.append('description', combinedDesc);
        formData.append('price', comboVal.toString());
      } else {
        formData.append('dishName', dishName);
        formData.append('description', description);
        formData.append('price', price);
      }

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch('/api/generate-campaign', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success && data.images && data.images.length > 0) {
        setGeneratedImages(data.images);
      } else {
        alert('Failed to regenerate images.');
      }
    } catch (e) {
      console.error(e);
      alert('Error regenerating images.');
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // ── MODE: REGENERATE CAPTION ONLY ──
  const handleRegenerateCaptionOnly = async () => {
    setIsGeneratingText(true);
    setCaption(null);
    try {
      const formData = new FormData();
      formData.append('mode', 'text');
      formData.append('campaignType', selectedCampaign);
      formData.append('brandStyle', brandKit.brandStyle);
      formData.append('tone', tone);

      if (selectedCampaign === 'Combo offer') {
        const combinedDishName = `${dishName} & ${dishName2}`;
        const combinedDesc = `${description} + ${description2}`;
        const totalVal = (parseFloat(price) || 0) + (parseFloat(price2) || 0);
        const comboVal = Math.round(totalVal * 0.85);
        formData.append('dishName', combinedDishName);
        formData.append('description', combinedDesc);
        formData.append('price', comboVal.toString());
      } else {
        formData.append('dishName', dishName);
        formData.append('description', description);
        formData.append('price', price);
      }

      const response = await fetch('/api/generate-campaign', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setCaption(data.caption);
        setHashtags(data.hashtags);
      } else {
        alert('Failed to regenerate caption.');
      }
    } catch (e) {
      console.error(e);
      alert('Error regenerating caption.');
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleDownload = async (ref: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!ref.current) return;
    try {
      // Using html-to-image which properly supports modern CSS (oklch, mix-blend, mask-image)
      const dataUrl = await htmlToImage.toPng(ref.current, {
        quality: 1,
        pixelRatio: 2.5,
        cacheBust: true,
      });
      
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (e: any) {
      console.error('Failed to download image', e);
      alert(`Download failed: ${e.message || 'Rendering Error'}. Please check console logs.`);
    }
  };

  const handleDownloadAll = async () => {
    if (activeTab === 'All formats' || activeTab === 'IG Post') {
      await handleDownload(igPostRef, `${dishName}_IG_Post_1080x1080.png`);
      await new Promise(r => setTimeout(r, 200));
    }
    if (activeTab === 'All formats' || activeTab === 'IG Story') {
      await handleDownload(igStoryRef, `${dishName}_IG_Story_1080x1920.png`);
      await new Promise(r => setTimeout(r, 200));
    }
    if (activeTab === 'All formats' || activeTab === 'WA Status') {
      await handleDownload(waStatusRef, `${dishName}_WA_Status_1080x1920.png`);
      await new Promise(r => setTimeout(r, 200));
    }
    if (activeTab === 'All formats' || activeTab === 'FB Event') {
      await handleDownload(fbEventRef, `${dishName}_FB_Event_1200x628.png`);
      await new Promise(r => setTimeout(r, 200));
    }
    if (activeTab === 'All formats' || activeTab === 'Reel Thumb') {
      await handleDownload(reelThumbRef, `${dishName}_Reel_Thumb_1080x1920.png`);
    }
  };

  const togglePlatform = (id: string) => {
    setPlatformsState(prev => prev.map(p => p.id === id ? { ...p, checked: !p.checked } : p));
  };

  const updatePlatformSchedule = (id: string, scheduleTime: string) => {
    setPlatformsState(prev => prev.map(p => p.id === id ? { ...p, scheduleTime } : p));
  };

  const updatePlatformType = (id: string, type: string) => {
    setPlatformsState(prev => prev.map(p => p.id === id ? { ...p, type } : p));
  };

  const captureActivePoster = async (): Promise<Blob | null> => {
    if (capturedPosterBlob) return capturedPosterBlob;
    if (!igPostRef.current) return null;
    try {
      const dataUrl = await htmlToImage.toPng(igPostRef.current, { quality: 1, pixelRatio: 2.0 });
      const res = await fetch(dataUrl);
      return await res.blob();
    } catch (e) {
      console.error('Failed to capture poster:', e);
      return null;
    }
  };

  const handleContinueToStep4 = async () => {
    setIsPreparingToPublish(true);
    if (igPostRef.current) {
      try {
        const dataUrl = await htmlToImage.toPng(igPostRef.current, { quality: 1, pixelRatio: 2.0 });
        const res = await fetch(dataUrl);
        setCapturedPosterBlob(await res.blob());
      } catch (e) {
        console.error('Failed to pre-capture poster:', e);
      }
    }
    setIsPreparingToPublish(false);
    setActiveStep(4);
  };

  const handleScheduleCampaign = async () => {
    setIsScheduling(true);
    try {
      const blob = await captureActivePoster();
      if (!blob) throw new Error('Could not capture image for schedule');
      
      const fullCaption = hashtags && hashtags.length > 0
        ? `${caption || ''}\n\n${hashtags.join(' ')}`
        : (caption || '');

      const formData = new FormData();
      formData.append('image', blob, 'schedule_creative.png');
      formData.append('caption', fullCaption);
      formData.append('dishName', dishName);
      
      const selected = platformsState.filter(p => p.checked);
      formData.append('platforms', JSON.stringify(selected));

      const res = await fetch('/api/schedule-campaign', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert('Campaign successfully scheduled into Calendar Queues!');
      } else {
        alert('Scheduling failed: ' + (data.error || 'Server error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error scheduling campaign');
    } finally {
      setIsScheduling(false);
    }
  };

  const handlePublishNow = async () => {
    setIsPublishing(true);
    try {
      const blob = await captureActivePoster();
      if (!blob) throw new Error('Could not capture image for publishing');
      
      const fullCaption = hashtags && hashtags.length > 0
        ? `${caption || ''}\n\n${hashtags.join(' ')}`
        : (caption || '');

      const formData = new FormData();
      formData.append('image', blob, 'publish_creative.png');
      formData.append('caption', fullCaption);
      formData.append('dishName', dishName);
      
      const selected = platformsState.filter(p => p.checked);
      formData.append('platforms', JSON.stringify(selected));

      const res = await fetch('/api/publish-now', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert('Campaign successfully published to: ' + selected.map(s => s.name).join(', '));
      } else {
        alert('Publishing failed: ' + (data.error || 'Server error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error publishing campaign');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyCaption = () => {
    const fullText = `${caption}\n\n${hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // ── POSTER GRAPHICS OVERLAYS & LAYOUT BUILDER ──
  const renderPosterTemplate = (aspectRatio: '1:1' | '9:16' | '1.91:1' | '9:16_reel', bgIndex: number) => {
    const bgUrl = generatedImages[bgIndex]?.url || FALLBACK_POSTERS[bgIndex % FALLBACK_POSTERS.length];
    
    // Compute total/discount combo prices
    const itemPrice1 = parseFloat(price) || 0;
    const itemPrice2 = parseFloat(price2) || 0;
    const isCombo = selectedCampaign === 'Combo offer';
    const displayPrice = isCombo 
      ? Math.round((itemPrice1 + itemPrice2) * 0.85) 
      : itemPrice1;

    let primaryThemeBg = brandKit.primaryColor;
    let accentThemeColor = brandKit.accentColor;
    let textColor = brandKit.textColor || '#FFFFFF';
    
    if (selectedTemplate === 'Classic Premium') {
      primaryThemeBg = '#1E1B4B'; accentThemeColor = '#F59E0B';
    } else if (selectedTemplate === 'Gourmet Gold') {
      primaryThemeBg = '#111827'; accentThemeColor = '#D4AF37';
    } else if (selectedTemplate === 'Minimal Accent') {
      primaryThemeBg = '#FFFFFF'; accentThemeColor = '#D4121A'; textColor = '#0F172A';
    }

    // Specialized universal layout for Landscape (FB Event) to prevent aggressive cropping of square AI images
    if (aspectRatio === '1.91:1') {
      return (
        <div className="w-full h-full relative overflow-hidden group select-none flex bg-black shadow-inner">
          {/* Left side: Perfect square aspect for uncropped food photo */}
          <div className="w-1/2 h-full bg-cover bg-center relative" style={{ backgroundImage: `url(${bgUrl})` }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/80" />
          </div>
          
          {/* Right side: Information block */}
          <div className="w-1/2 h-full flex flex-col justify-center p-6 relative" style={{ backgroundColor: primaryThemeBg }}>
            <div className="z-10 bg-white/10 backdrop-blur-md px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-white rounded-full self-start mb-4 border border-white/20 shadow-lg">
              {brandKit.restaurantName}
            </div>
            
            <div className="z-10">
              <div className="text-[9px] uppercase tracking-widest text-white/70 font-bold mb-1">{taglineText || (isCombo ? 'Combo Deal' : 'Special Offer')}</div>
              <h2 className="text-3xl font-black uppercase leading-[1.1] text-white drop-shadow-lg mb-2">
                {dishName}
              </h2>
              {isCombo && <h3 className="text-lg font-bold text-white/90 mb-2">+ {dishName2}</h3>}
              
              <p className="text-[10px] font-medium text-white/70 leading-relaxed mb-4 line-clamp-2">
                {description}
              </p>
              
              <div className="flex items-center gap-4 border-t border-white/20 pt-3">
                <div className="text-3xl font-black text-white" style={{ color: accentThemeColor }}>
                  ₹{displayPrice}
                </div>
                <div className="bg-white text-black text-[9px] font-black uppercase px-4 py-2.5 rounded-full flex items-center gap-1 shadow-xl transform transition-transform hover:scale-105">
                  {badgeText || 'ORDER NOW'} <ChevronRight size={12} strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Layout 1: Festival / Seasonal (Elegant, centered, dark/gold, text at bottom)
    if (selectedCampaign === 'Festival' || selectedCampaign === 'Seasonal') {
      return (
        <div className="w-full h-full relative overflow-hidden group select-none flex flex-col justify-between items-center" style={{ backgroundColor: '#0f0f11' }}>
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 group-hover:scale-110 opacity-90" style={{ backgroundImage: `url(${bgUrl})` }} />
          {/* Rich Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/95" />
          
          {/* Elegant top border accent */}
          <div className="absolute top-4 left-4 right-4 h-full border border-white/10 rounded-lg pointer-events-none" />
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-px" style={{ backgroundColor: accentThemeColor }} />
          
          <div className="z-10 w-full pt-8 flex flex-col items-center">
             <div className="text-[10px] uppercase tracking-[0.3em] mb-3 font-semibold" style={{ color: accentThemeColor }}>You're Invited</div>
             <h2 className="text-4xl font-serif font-black text-white drop-shadow-2xl leading-tight text-center px-4" style={{ textShadow: `0 4px 20px ${accentThemeColor}40` }}>
               {taglineText || 'Taste of the Season'}
             </h2>
          </div>
          
          <div className="z-10 w-full px-6 flex flex-col items-center text-center pb-8 mt-auto">
            <div className="w-full relative py-5 flex flex-col items-center justify-center">
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l" style={{ borderColor: accentThemeColor }} />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r" style={{ borderColor: accentThemeColor }} />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l" style={{ borderColor: accentThemeColor }} />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r" style={{ borderColor: accentThemeColor }} />
              
              <div className="text-xl font-bold text-white uppercase tracking-widest leading-none mb-2">{dishName}</div>
              <div className="text-[9px] text-white/60 max-w-[80%] leading-relaxed font-light">{description}</div>
              <div className="mt-3 px-4 py-1.5 rounded-full border border-white/20 bg-black/40 text-lg font-serif italic" style={{ color: accentThemeColor }}>
                ₹{displayPrice}
              </div>
            </div>
            
            <div className="mt-5 flex flex-col items-center text-[7px] text-white/50 tracking-widest uppercase font-medium">
              <span className="mb-1.5" style={{ color: accentThemeColor }}>Bring out your festive spirit</span>
              <div className="flex gap-3 items-center">
                <span>{footerPhone}</span> 
                <span className="w-1 h-1 rounded-full bg-white/20" /> 
                <span>{footerWeb}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Layout 2: Flash Sale / Promo (Bold, newspaper/structural, massive typography)
    if (selectedCampaign === 'Flash sale') {
      return (
        <div className="w-full h-full relative overflow-hidden group select-none flex flex-col" style={{ backgroundColor: primaryThemeBg }}>
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-700 mix-blend-luminosity opacity-40 group-hover:scale-105 group-hover:mix-blend-normal group-hover:opacity-80" style={{ backgroundImage: `url(${bgUrl})` }} />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/40 to-transparent" />
          
          <div className="z-10 p-5 h-full flex flex-col justify-between">
            {/* Top heavy block */}
            <div className="bg-white p-4 shadow-2xl border-l-8 self-start max-w-[85%]" style={{ borderColor: accentThemeColor }}>
              <div className="text-[8px] font-black uppercase tracking-[0.2em] mb-1 text-slate-400">{brandKit.restaurantName}</div>
              <h2 className="text-4xl font-black uppercase leading-[0.85] tracking-tighter" style={{ color: primaryThemeBg }}>
                {taglineText || 'LIMITED'}
              </h2>
              <h2 className="text-4xl font-black uppercase leading-[0.85] tracking-tighter text-slate-900 mt-1 mb-2">
                PROMO
              </h2>
              <div className="h-0.5 w-1/3 bg-slate-200 mb-2" />
              <p className="text-[10px] font-bold text-slate-600 leading-snug uppercase tracking-wide">
                Special offer on our <br/><span style={{ color: primaryThemeBg }}>{dishName}</span>
              </p>
            </div>
            
            {/* Bottom price block */}
            <div className="flex items-end justify-between mt-auto w-full">
              <div className="bg-black/80 px-4 py-3 border border-white/20 shadow-2xl flex-1 mr-4 rounded-tr-3xl">
                <div className="text-[8px] text-white/70 font-bold uppercase tracking-widest mb-1">Only For</div>
                <div className="text-4xl font-black leading-none drop-shadow-md" style={{ color: accentThemeColor }}>₹{displayPrice}</div>
                <div className="text-[7px] text-white/50 uppercase mt-1 line-clamp-1">{description}</div>
              </div>
              
              <div className="w-14 h-14 rounded-full flex flex-col items-center justify-center font-black text-center shadow-[0_0_20px_rgba(0,0,0,0.5)] transform -rotate-12 border-4 border-black" style={{ backgroundColor: accentThemeColor, color: '#000' }}>
                <span className="text-[6px] uppercase tracking-widest opacity-80">Buy</span>
                <span className="text-[10px] leading-none my-0.5">NOW</span>
              </div>
            </div>
            
            <div className="text-[6px] text-white/60 mt-4 border-t border-white/10 pt-2 flex justify-between uppercase font-bold tracking-widest">
              <span>{footerPhone}</span>
              <span>{footerWeb}</span>
            </div>
          </div>
        </div>
      );
    }

    // Layout 3: Combo Offer (Premium floating glass card)
    if (selectedCampaign === 'Combo offer') {
      return (
        <div className="w-full h-full relative overflow-hidden group select-none flex flex-col justify-end" style={{ backgroundColor: '#000' }}>
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 group-hover:scale-110" style={{ backgroundImage: `url(${bgUrl})` }} />
          {/* Smooth gradient from bottom to make text legible without killing the photo */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90" />
          
          <div className="absolute top-4 left-0 w-full text-center z-10">
            <span className="bg-black/60 border border-white/10 text-white px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
              {brandKit.restaurantName}
            </span>
          </div>
          
          <div className="z-10 w-full p-4 pb-5 flex flex-col items-center">
            <div className="inline-block px-3 py-1 bg-gradient-to-r from-red-600 to-red-500 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-t-lg shadow-[0_-4px_15px_rgba(220,38,38,0.5)] z-20 relative translate-y-1">
              {taglineText || 'SUPER COMBO'}
            </div>
            
            {/* Main Info Card */}
            <div className="w-full bg-black/70 border border-white/10 rounded-2xl p-4 shadow-2xl relative z-10">
              <div className="flex gap-3 mb-4">
                {/* Item 1 */}
                <div className="flex-1 text-center">
                  <div className="text-[11px] font-black uppercase text-white leading-tight h-7 flex items-center justify-center drop-shadow">{dishName}</div>
                  <div className="text-[7px] text-white/50 italic h-4 line-clamp-1 mt-1">{description}</div>
                  <div className="text-[9px] font-bold text-white/40 line-through mt-1">₹{itemPrice1}</div>
                </div>
                
                {/* Divider */}
                <div className="w-px bg-white/10 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[6px] text-white/50 font-bold border border-white/5">
                    +
                  </div>
                </div>
                
                {/* Item 2 */}
                <div className="flex-1 text-center">
                  <div className="text-[11px] font-black uppercase text-white leading-tight h-7 flex items-center justify-center drop-shadow">{dishName2}</div>
                  <div className="text-[7px] text-white/50 italic h-4 line-clamp-1 mt-1">{description2}</div>
                  <div className="text-[9px] font-bold text-white/40 line-through mt-1">₹{itemPrice2}</div>
                </div>
              </div>
              
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-3" />
              
              <div className="flex justify-between items-center px-1">
                <div className="text-[8px] uppercase tracking-[0.1em] text-white/60 font-bold">Combo Price</div>
                <div className="text-3xl font-black drop-shadow-[0_2px_10px_rgba(250,204,21,0.3)]" style={{ color: accentThemeColor }}>₹{displayPrice}</div>
              </div>
            </div>
            
            <div className="flex w-full justify-between mt-4 text-[6px] text-white/50 font-medium uppercase tracking-widest px-2">
              <div className="flex items-center gap-1.5"><span>{footerPhone}</span></div>
              <div className="flex items-center gap-1.5"><span>{footerWeb}</span></div>
            </div>
          </div>
        </div>
      );
    }

    // Layout 4: Dish Promo / New Launch / Default (Vibrant, Sizzling, highly modern)
    return (
      <div className="w-full h-full relative overflow-hidden group select-none flex flex-col" style={{ backgroundColor: primaryThemeBg }}>
        
        {/* Deep backdrop image */}
        <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 group-hover:scale-105 opacity-80" style={{ backgroundImage: `url(${bgUrl})` }} />
        
        {/* Dynamic sweeping gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent" />
        
        <div className="z-20 relative h-full flex flex-col justify-between p-5">
          <div className="flex justify-between items-start w-full">
            <div className="bg-white/10 backdrop-blur-md px-3 py-1 text-[7px] font-black uppercase tracking-[0.2em] text-white rounded-full shadow-lg border border-white/20">
              {brandKit.restaurantName}
            </div>
            <div className="w-10 h-10 rounded-full flex flex-col items-center justify-center font-black shadow-2xl transform rotate-6 border-2 border-white/20" style={{ backgroundColor: accentThemeColor, color: '#000' }}>
              <span className="text-[10px] leading-none">{selectedCampaign === 'New launch' ? 'NEW' : 'PROMO'}</span>
            </div>
          </div>
          
          <div className="mt-auto w-full">
            <h2 className="text-4xl font-black uppercase leading-[0.9] text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] tracking-tight">
              {dishName.split(' ').map((word, i) => (
                <span key={i} className="block" style={{ color: i % 2 !== 0 ? accentThemeColor : 'white' }}>{word}</span>
              ))}
            </h2>
            
            <p className="text-[10px] font-medium text-white/80 mt-3 max-w-[90%] leading-relaxed drop-shadow-md">
              {description}
            </p>
            
            <div className="flex items-center justify-between mt-4">
              <div className="text-3xl font-black text-white drop-shadow-xl" style={{ textShadow: `0 2px 10px ${accentThemeColor}50` }}>
                ₹{displayPrice}
              </div>
              
              <div className="bg-white text-black text-[9px] font-black uppercase px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-[0_4px_20px_rgba(255,255,255,0.3)] transition-transform hover:scale-105">
                ORDER NOW <ChevronRight size={10} strokeWidth={3}/>
              </div>
            </div>
            
            <div className="w-full h-px bg-white/20 mt-4 mb-2" />
            
            <div className="flex justify-between text-[6px] text-white/60 uppercase tracking-widest font-bold">
              <span>{footerPhone}</span>
              <span>{footerWeb}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">10x</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">AI social creative engine</h1>
              <div className="text-xs text-slate-500 font-medium tracking-wide uppercase">Module E · Campaign Studio</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-medium">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
            {brandKit.restaurantName} · brand kit active
          </div>
        </div>
      </div>
      
      {/* Stepper with State Click Navigation */}
      <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <button 
          onClick={() => setActiveStep(1)} 
          className={`flex items-center gap-2 transition-all whitespace-nowrap ${activeStep === 1 ? 'text-red-600 font-bold scale-105' : 'text-slate-500'}`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center border font-bold ${activeStep === 1 ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'border-slate-300 text-slate-400 bg-white'}`}>1</div> 
          Select dish
        </button>
        <div className="h-px bg-slate-300 w-10 shrink-0"></div>

        <button 
          onClick={() => setActiveStep(2)} 
          className={`flex items-center gap-2 transition-all whitespace-nowrap ${activeStep === 2 ? 'text-red-600 font-bold scale-105' : 'text-slate-500'}`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center border font-bold ${activeStep === 2 ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'border-slate-300 text-slate-400 bg-white'}`}>2</div> 
          Campaign Setup
        </button>
        <div className="h-px bg-slate-300 w-10 shrink-0"></div>

        <button 
          onClick={() => setActiveStep(3)} 
          className={`flex items-center gap-2 transition-all whitespace-nowrap ${activeStep === 3 ? 'text-red-600 font-bold scale-105' : 'text-slate-500'}`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center border font-bold ${activeStep === 3 ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'border-slate-300 text-slate-400 bg-white'}`}>3</div> 
          Review Creatives
        </button>
        <div className="h-px bg-slate-300 w-10 shrink-0"></div>

        <button 
          onClick={() => setActiveStep(4)} 
          className={`flex items-center gap-2 transition-all whitespace-nowrap ${activeStep === 4 ? 'text-red-600 font-bold scale-105' : 'text-slate-500'}`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center border font-bold ${activeStep === 4 ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'border-slate-300 text-slate-400 bg-white'}`}>4</div> 
          Publish & Caption
        </button>
      </div>

      {/* ── STEP 1: DISH CONFIGURATION ── */}
      {activeStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="lg:col-span-8 lg:col-start-3 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8">
            <div>
              <div className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Step 1</div>
              <h2 className="text-2xl font-black text-slate-900">Enter Dish Details</h2>
              <p className="text-sm text-slate-500 mt-2">Specify what food you are planning to run a marketing campaign for. The AI will generate a highly optimized poster layout and professional food photography from scratch.</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Dish Name</label>
                <input type="text" value={dishName} onChange={e => setDishName(e.target.value)} className="w-full border border-slate-200 rounded-xl p-4 text-base focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all" placeholder="e.g. Special Chicken Biriyani" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Price (₹)</label>
                <input type="text" value={price} onChange={e => setPrice(e.target.value)} className="w-full border border-slate-200 rounded-xl p-4 text-base focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all" placeholder="e.g. 349" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description (Ingredients / Features)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-slate-200 rounded-xl p-4 text-base focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all resize-none" placeholder="Brief details about what makes this special..." rows={4}></textarea>
              </div>
            </div>
            
            <button 
              onClick={() => setActiveStep(2)}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-5 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all mt-4 text-lg"
            >
              <span>Continue to Campaign Setup</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: CAMPAIGN CONFIGURATION ── */}
      {activeStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <div className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Step 2</div>
              <h2 className="text-xl font-black text-slate-900">Campaign Specifications</h2>
              <p className="text-xs text-slate-500 mt-1">Select the theme, tone, and specific structure of your creative campaign.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-3">Choose Campaign Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CAMPAIGN_TYPES.map(type => (
                    <div 
                      key={type}
                      onClick={() => {
                        setSelectedCampaign(type);
                        if (type === 'Flash sale') { setBadgeText('30% OFF'); setTaglineText('FLASH SALE'); }
                        else if (type === 'Combo offer') { setBadgeText('BUY 1 GET 1'); setTaglineText('SUPER COMBO'); }
                        else if (type === 'Festival') { setBadgeText('FESTIVE VIBE'); setTaglineText('RAMADAN SPECIAL'); }
                        else { setBadgeText('SPECIAL'); setTaglineText('LIMITED TIME OFFER'); }
                      }}
                      className={`border rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col justify-center items-center h-20 ${
                        selectedCampaign === type 
                          ? 'border-red-600 bg-red-50/50 shadow-sm text-red-600 font-extrabold' 
                          : 'border-slate-200 text-slate-600 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs">{type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Combo offer items */}
              {selectedCampaign === 'Combo offer' && (
                <div className="pt-5 border-t border-dashed border-slate-200 space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-black text-red-600 uppercase tracking-wider">
                    <Sparkles size={14} className="animate-pulse" />
                    <span>Configure Combo Partner Item</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Second Dish Name</label>
                      <input type="text" value={dishName2} onChange={e => setDishName2(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-red-500" placeholder="e.g. French Fries" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Second Dish Price (₹)</label>
                      <input type="text" value={price2} onChange={e => setPrice2(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-red-500" placeholder="e.g. 90" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Second Dish Description</label>
                    <textarea value={description2} onChange={e => setDescription2(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-red-500" placeholder="Partner dish brief info..." rows={2}></textarea>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Tone of Voice (Copywriting)</label>
                <div className="flex gap-2">
                  {['Casual', 'Professional', 'Witty'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setTone(t)}
                      className={`flex-1 py-3.5 rounded-xl text-xs font-bold border transition-all ${
                        tone === t 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setActiveStep(1)}
                className="flex-1 py-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button 
                onClick={handleGenerateFull}
                disabled={isGeneratingText || isGeneratingImages}
                className="flex-[2] bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all"
              >
                {(isGeneratingText || isGeneratingImages) ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>AI Generating Campaign...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    <span>Generate Campaign Assets</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campaign Overview</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Selected Item:</span>
                <span className="text-slate-900 font-bold">{dishName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Base Price:</span>
                <span className="text-slate-900 font-bold">₹{price}</span>
              </div>
              {selectedCampaign === 'Combo offer' && (
                <>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Combo Item:</span>
                    <span className="text-slate-900 font-bold">{dishName2}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Combo Price:</span>
                    <span className="text-slate-900 font-bold">₹{price2}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Combo Val (15% Off):</span>
                    <span className="text-red-600 font-black">₹{Math.round(((parseFloat(price)||0)+(parseFloat(price2)||0))*0.85)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Brand Style:</span>
                <span className="text-slate-900 font-bold capitalize">{brandKit.brandStyle}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Tone Selected:</span>
                <span className="text-slate-900 font-bold">{tone}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: REVIEW CREATIVE POSTERS ── */}
      {activeStep === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <div className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Step 3</div>
                <h2 className="text-xl font-black text-slate-900">Review & Optimize Creatives</h2>
                <p className="text-xs text-slate-500 mt-1">Fine-tune the overlays, styles, badge discounts, and layout templates dynamically.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Edit3 size={14} className="text-red-500" />
                  <span>Edit Creative Template</span>
                </button>

                <button 
                  onClick={handleRegenerateImagesOnly}
                  disabled={isGeneratingImages}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  {isGeneratingImages ? (
                    <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin"></div>
                  ) : (
                    <RotateCcw size={14} className="text-slate-500" />
                  )}
                  <span>Regenerate AI Images</span>
                </button>
              </div>
            </div>

            {/* Platform Tab Selectors */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-slate-100">
              {[
                { tab: 'All formats', emoji: '' },
                { tab: 'IG Post', emoji: '📷' },
                { tab: 'IG Story', emoji: '🎞️' },
                { tab: 'WA Status', emoji: '💬' },
                { tab: 'FB Event', emoji: '🗓️' },
              ].map(({ tab, emoji }) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeTab === tab 
                      ? 'bg-red-600 text-white shadow-sm' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium'
                  }`}
                >
                  {emoji && <span>{emoji}</span>}{tab}
                </button>
              ))}
            </div>

            {/* Loading Cover for Images ONLY regeneration */}
            {isGeneratingImages && (
              <div className="w-full h-80 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center animate-pulse gap-3 text-center p-6">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-slate-600">Regenerating stunning AI images via Gemini 2.5 Flash Image...</span>
              </div>
            )}

            {/* Poster grid */}
            {!isGeneratingImages && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-end">
                
                {/* Format 1: IG Post 1:1 */}
                {(activeTab === 'All formats' || activeTab === 'IG Post') && (
                  <div className="flex flex-col items-center">
                    <div 
                      ref={igPostRef}
                      className="w-full aspect-square rounded-2xl shadow-lg border border-slate-200 relative overflow-hidden"
                    >
                      {renderPosterTemplate('1:1', 0)}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 mt-2 tracking-wider">IG POST · 1080×1080</span>
                  </div>
                )}

                {/* Format 2: IG Story 9:16 */}
                {(activeTab === 'All formats' || activeTab === 'IG Story') && (
                  <div className="flex flex-col items-center">
                    <div 
                      ref={igStoryRef}
                      className="w-full aspect-[9/16] rounded-2xl shadow-lg border border-slate-200 relative overflow-hidden"
                    >
                      {renderPosterTemplate('9:16', 1)}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 mt-2 tracking-wider">IG STORY · 1080×1920</span>
                  </div>
                )}

                {/* Format 3: WA Status 9:16 — identical spec to IG Story */}
                {(activeTab === 'All formats' || activeTab === 'WA Status') && (
                  <div className="flex flex-col items-center">
                    <div 
                      ref={waStatusRef}
                      className="w-full aspect-[9/16] rounded-2xl shadow-lg border border-slate-200 relative overflow-hidden"
                    >
                      {renderPosterTemplate('9:16', 2)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] font-bold text-slate-500 tracking-wider">WA STATUS · 1080×1920</span>
                      <span className="text-[9px] bg-green-100 text-green-700 font-black px-1.5 py-0.5 rounded-full">WhatsApp</span>
                    </div>
                  </div>
                )}

                {/* Format 4: FB Event Banner 1.91:1 */}
                {(activeTab === 'All formats' || activeTab === 'FB Event') && (
                  <div className="flex flex-col items-center">
                    <div 
                      ref={fbEventRef}
                      className="w-full aspect-[1.91/1] rounded-2xl shadow-lg border border-slate-200 relative overflow-hidden"
                    >
                      {renderPosterTemplate('1.91:1', 3)}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 mt-2 tracking-wider">FB EVENT · 1200×628</span>
                  </div>
                )}

                {/* Format 5: Reel Thumbnail 9:16 */}
                {(activeTab === 'All formats' || activeTab === 'IG Post') && (
                  <div className="flex flex-col items-center">
                    <div 
                      ref={reelThumbRef}
                      className="w-full aspect-[9/16] rounded-2xl shadow-lg border border-slate-200 relative overflow-hidden"
                    >
                      {renderPosterTemplate('9:16_reel', 0)}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 mt-2 tracking-wider">REEL THUMB · 1080×1920</span>
                  </div>
                )}

              </div>
            )}

            {/* Poster Control Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-slate-100">
              <button 
                onClick={handleDownloadAll}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <Download size={14} className="text-red-500" />
                <span>Download Active Formats</span>
              </button>

              <button 
                onClick={handleContinueToStep4}
                disabled={isPreparingToPublish}
                className="flex-1 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
              >
                {isPreparingToPublish ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Continue to Caption & Calendar</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>

          </div>

          <div className="flex gap-4 justify-between items-center text-xs">
            <button onClick={() => setActiveStep(2)} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-bold">
              <ArrowLeft size={14} />
              <span>Configure Setup</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: CAPTION & PUBLISH ── */}
      {activeStep === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-right-4 duration-500">
          
          {/* AI Copywriting panel */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <div className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Step 4</div>
              <h2 className="text-xl font-black text-slate-900">Copy & Hashtags</h2>
              <p className="text-xs text-slate-500 mt-1">Review the highly professional copy written based on your brand kit and tone.</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-1">
                <span>Gourmet Caption:</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-normal">Tone:</span>
                  <select 
                    value={tone} 
                    onChange={async (e) => {
                      setTone(e.target.value);
                      // Trigger dynamic regeneration on tone change automatically
                      setTimeout(() => handleRegenerateCaptionOnly(), 50);
                    }} 
                    className="text-[10px] border border-slate-200 rounded px-2 py-0.5 outline-none font-bold text-slate-800"
                  >
                    <option>Casual</option>
                    <option>Professional</option>
                    <option>Witty</option>
                  </select>
                </div>
              </div>

              {/* Text generation loading block */}
              {isGeneratingText ? (
                <div className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center animate-pulse gap-2">
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-red-600 rounded-full animate-spin"></div>
                  <span className="text-xs font-medium text-slate-500">Writing catchy copy variants...</span>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs text-slate-700 leading-relaxed font-medium min-h-[100px] shadow-inner relative">
                  {caption || "Select high-quality ingredients. Slow-cooked chicken topped with cheese, layered in golden premium buns. Grab the special Flash Sale details at Spice Garden today!"}
                </div>
              )}

              {/* Dynamic premium hashtags */}
              <div className="flex flex-wrap gap-2 pt-2">
                {(() => {
                  const displayHashtags = Array.isArray(hashtags) && hashtags.length > 0 
                    ? hashtags 
                    : typeof hashtags === 'string' 
                      ? (hashtags as string).split(/[ ,]+/).map(t => t.startsWith('#') ? t : '#'+t).filter(t => t.length > 1)
                      : ['#SpiceGarden', '#GourmetBurger', '#FlashSaleSpecial', '#LimitedTimePromo', '#IndulgenceReady', '#FoodieFeast'];
                  
                  return displayHashtags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="px-2.5 py-1 bg-red-50 text-red-600 rounded-md text-[10px] font-bold border border-red-100 transition-all hover:bg-red-100"
                    >
                      {tag}
                    </span>
                  ));
                })()}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={handleRegenerateCaptionOnly}
                  disabled={isGeneratingText}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Sparkles size={13} className="text-yellow-500" />
                  <span>More Variations (Text)</span>
                </button>
                <button 
                  onClick={handleCopyCaption}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {copySuccess ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                  <span>{copySuccess ? 'Copied Caption!' : 'Copy Caption'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Schedule Calendar widget */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Schedule & Launch</h3>
            
            <div className="space-y-4">
              {platformsState.map(platform => (
                <div key={platform.id} className="flex flex-col gap-2 py-3 border-b border-slate-100 last:border-0">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => togglePlatform(platform.id)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-inner transition-colors ${platform.checked ? 'bg-red-50' : 'bg-slate-50'}`}>
                        <Share2 size={15} className={platform.checked ? 'text-red-600' : 'text-slate-400'} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{platform.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{platform.desc}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={platform.checked} onChange={() => togglePlatform(platform.id)} className="w-3.5 h-3.5 rounded text-red-600 border-slate-300 focus:ring-red-500 pointer-events-none" />
                    </div>
                  </div>
                  {platform.checked && (
                    <div className="pl-11 pr-2 flex items-center gap-3 justify-between mt-1 animate-in fade-in slide-in-from-top-1">
                      <input 
                        type="datetime-local" 
                        value={platform.scheduleTime || ''} 
                        onChange={(e) => updatePlatformSchedule(platform.id, e.target.value)}
                        className="text-[10px] border border-slate-200 rounded px-2 py-1 outline-none text-slate-600 font-medium flex-1"
                      />
                      {platform.id === 'ig' && (
                        <select 
                          value={platform.type || 'Post'} 
                          onChange={(e) => updatePlatformType(platform.id, e.target.value)}
                          className="text-[10px] border border-slate-200 rounded px-2 py-1 outline-none text-slate-600 font-medium"
                        >
                          <option value="Post">Feed Post</option>
                          <option value="Story">Story</option>
                        </select>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button 
                onClick={handleScheduleCampaign}
                disabled={isScheduling || isPublishing}
                className="flex-1 py-3.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                {isScheduling ? <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div> : <Calendar size={14} />}
                <span>Schedule Selected</span>
              </button>
              <button 
                onClick={handlePublishNow}
                disabled={isPublishing || isScheduling}
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
              >
                {isPublishing ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-white rounded-full animate-spin"></div> : <Megaphone size={14} />}
                <span>Publish Now</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ── EDIT CREATIVE MODAL ── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative animate-in scale-in duration-300">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div>
              <h3 className="text-lg font-black text-slate-900">Custom poster overlay settings</h3>
              <p className="text-xs text-slate-500 mt-1">Adjust badges, promotional labels, and typography themes instantly.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Visual Layout Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Modern Bold', 'Classic Premium', 'Gourmet Gold', 'Minimal Accent'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setSelectedTemplate(t)}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border text-left transition-colors ${
                        selectedTemplate === t 
                          ? 'border-red-600 bg-red-50/20 text-red-600' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Discount Badge Text</label>
                <input 
                  type="text" 
                  value={badgeText} 
                  onChange={e => setBadgeText(e.target.value)} 
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-red-500" 
                  placeholder="e.g. 30% OFF" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Gourmet Tagline Label</label>
                <input 
                  type="text" 
                  value={taglineText} 
                  onChange={e => setTaglineText(e.target.value.toUpperCase())} 
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-red-500" 
                  placeholder="e.g. LIMITED TIME OFFER" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Footer Phone</label>
                  <input 
                    type="text" 
                    value={footerPhone} 
                    onChange={e => setFooterPhone(e.target.value)} 
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-red-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Footer Website</label>
                  <input 
                    type="text" 
                    value={footerWeb} 
                    onChange={e => setFooterWeb(e.target.value)} 
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-red-500" 
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-green-200 bg-green-50 p-2.5 text-[10px] text-green-700 font-medium text-center">
              ✅ Changes apply <strong>instantly</strong> to all poster previews in real-time — no regeneration needed.
            </div>
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              <span>Done — View Updated Posters</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
