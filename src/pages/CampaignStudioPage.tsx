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
  { id: 'ig_post', name: 'Instagram Post', desc: 'Square 1:1 feed post', time: '', scheduleTime: '', checked: true },
  { id: 'ig_story', name: 'Instagram Story', desc: 'Vertical 9:16 story', time: '', scheduleTime: '', checked: true },
  { id: 'fb', name: 'Facebook', desc: 'Post · page feed', time: '', scheduleTime: '', checked: false },
  { id: 'zomato', name: 'Swiggy / Zomato', desc: 'Listing image · updated live', time: '', scheduleTime: '', checked: false },
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
  
  const igPostRef = useRef<HTMLDivElement>(null);
  const igStoryRef = useRef<HTMLDivElement>(null);
  const waStatusRef = useRef<HTMLDivElement>(null);
  const fbEventRef = useRef<HTMLDivElement>(null);
  const reelThumbRef = useRef<HTMLDivElement>(null);

  const [capturedPosters, setCapturedPosters] = useState<Record<string, Blob>>({});
  const [isPreparingToPublish, setIsPreparingToPublish] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

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
      
      const fetchViaProxy = (externalUrl: string) => {
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(externalUrl)}`;
        setImagePreview(proxyUrl);
        fetch(proxyUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "campaign_dish.jpeg", { type: blob.type || "image/jpeg" });
            setImageFile(file);
          })
          .catch(err => console.error("Failed to load image via proxy in CampaignStudio:", err));
      };

      if (activeDish.processedImageUrl) {
        fetchViaProxy(activeDish.processedImageUrl);
      } else if (activeDish.rawImageUrl) {
        fetchViaProxy(activeDish.rawImageUrl);
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
    // Only used as fallback now if specific platform images aren't available
    const activeRef = igPostRef.current || igStoryRef.current || fbEventRef.current || reelThumbRef.current;
    if (activeRef) {
      try {
        const dataUrl = await htmlToImage.toPng(activeRef, { quality: 1, pixelRatio: 2.0 });
        const res = await fetch(dataUrl);
        return await res.blob();
      } catch (e) {
        console.error('Failed to capture active poster from DOM:', e);
      }
    }
    // Fall back to the first available captured poster
    const keys = Object.keys(capturedPosters);
    if (keys.length > 0) return capturedPosters[keys[0]];
    return null;
  };

  const handleContinueToStep4 = async () => {
    setIsPreparingToPublish(true);
    const posters: Record<string, Blob> = {};

    // Target output pixel dimensions per platform (actual social media sizes)
    const formatSpecs: Record<string, { targetW: number; targetH: number }> = {
      ig_post:  { targetW: 1080, targetH: 1080 },   // Instagram Post: 1:1
      ig_story: { targetW: 1080, targetH: 1920 },   // Instagram Story: 9:16
      fb:       { targetW: 1200, targetH: 628  },   // Facebook Event Banner: 1.91:1
    };

    const refs = [
      { id: 'ig_post',  ref: igPostRef  },
      { id: 'ig_story', ref: igStoryRef },
      { id: 'fb',       ref: fbEventRef }
    ];

    for (const { id, ref } of refs) {
      if (ref.current) {
        try {
          const spec = formatSpecs[id];
          // Calculate pixelRatio so the output is exactly the target resolution
          const renderedWidth = ref.current.getBoundingClientRect().width || ref.current.offsetWidth || 300;
          const pixelRatio = spec.targetW / renderedWidth;

          const dataUrl = await htmlToImage.toPng(ref.current, {
            quality: 1,
            pixelRatio,
            width: renderedWidth,
          });
          const res = await fetch(dataUrl);
          posters[id] = await res.blob();
          console.log(`[Capture] ${id}: ${spec.targetW}x${spec.targetH} (pixelRatio ${pixelRatio.toFixed(2)})`);
        } catch (e) {
          console.error(`Failed to pre-capture poster for ${id}:`, e);
        }
      }
    }
    setCapturedPosters(posters);
    setIsPreparingToPublish(false);
    setActiveStep(4);
  };

  const handleScheduleCampaign = async () => {
    setIsScheduling(true);
    try {
      const formData = new FormData();
      
      // Append specific platform images if available
      if (capturedPosters.ig_post) formData.append('image_ig_post', capturedPosters.ig_post, 'ig_post.png');
      if (capturedPosters.ig_story) formData.append('image_ig_story', capturedPosters.ig_story, 'ig_story.png');
      if (capturedPosters.fb) formData.append('image_fb', capturedPosters.fb, 'fb.png');
      
      // Fallback single image
      const fallbackBlob = await captureActivePoster();
      if (fallbackBlob) formData.append('image', fallbackBlob, 'schedule_creative.png');

      if (!capturedPosters.ig_post && !capturedPosters.ig_story && !capturedPosters.fb && !fallbackBlob) {
        throw new Error('Could not capture image for schedule');
      }
      
      const fullCaption = hashtags && hashtags.length > 0
        ? `${caption || ''}\n\n${hashtags.join(' ')}`
        : (caption || '');

      formData.append('caption', fullCaption);
      formData.append('dishName', dishName);
      
      // Convert scheduleTime to UTC ISO string so server reads it correctly regardless of timezone
      const selected = platformsState.filter(p => p.checked).map(p => ({
        ...p,
        scheduleTime: p.scheduleTime ? new Date(p.scheduleTime).toISOString() : ''
      }));
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
      const formData = new FormData();
      
      // Append specific platform images if available
      if (capturedPosters.ig_post) formData.append('image_ig_post', capturedPosters.ig_post, 'ig_post.png');
      if (capturedPosters.ig_story) formData.append('image_ig_story', capturedPosters.ig_story, 'ig_story.png');
      if (capturedPosters.fb) formData.append('image_fb', capturedPosters.fb, 'fb.png');
      
      // Fallback single image
      const fallbackBlob = await captureActivePoster();
      if (fallbackBlob) formData.append('image', fallbackBlob, 'publish_creative.png');

      if (!capturedPosters.ig_post && !capturedPosters.ig_story && !capturedPosters.fb && !fallbackBlob) {
        throw new Error('Could not capture image for publishing');
      }

      const fullCaption = hashtags && hashtags.length > 0
        ? `${caption || ''}\n\n${hashtags.join(' ')}`
        : (caption || '');

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

    if (aspectRatio === '1.91:1') {
      return (
        <div className="w-full h-full relative overflow-hidden group select-none flex bg-black" style={{ containerType: 'inline-size' }}>
          {/* Background Image */}
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${bgUrl})` }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/50 to-black/95" />
          </div>

          {/* Right-side content panel — strictly contained, no overflow */}
          <div className="absolute top-0 bottom-0 right-0 w-[50%] flex flex-col justify-center z-10 overflow-hidden min-w-0" style={{ padding: '2cqw 3cqw' }}>
            {/* Brand pill */}
            <div className="bg-white/15 backdrop-blur-md font-black uppercase tracking-[0.2em] text-white rounded-full self-start border border-white/20 shadow-lg max-w-full truncate"
              style={{ fontSize: '1.5cqw', padding: '0.8cqw 1.5cqw', marginBottom: '1.5cqw' }}>
              {brandKit.restaurantName}
            </div>

            {/* Tagline */}
            <div className="uppercase tracking-widest font-bold truncate" style={{ color: accentThemeColor, fontSize: '1.8cqw', marginBottom: '1cqw' }}>
              {taglineText || (isCombo ? 'Combo Deal' : 'Special Offer')}
            </div>

            {/* Dish name — capped to 2 lines, word-break to prevent right overflow */}
            <h2 className="font-black uppercase leading-tight text-white drop-shadow-2xl overflow-hidden"
              style={{ fontSize: '5cqw', marginBottom: '1.5cqw', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
              {dishName}
            </h2>
            {isCombo && <h3 className="font-bold text-white/90 truncate" style={{ fontSize: '2.5cqw', marginBottom: '1.5cqw' }}>+ {dishName2}</h3>}

            {/* Description */}
            <p className="text-white/75 leading-snug line-clamp-2 overflow-hidden" style={{ fontSize: '1.8cqw', marginBottom: '2cqw' }}>
              {description}
            </p>

            {/* Price + CTA */}
            <div className="flex items-center gap-3 mt-auto flex-wrap">
              <div className="font-black text-white drop-shadow-lg flex-shrink-0" style={{ fontSize: '5cqw' }}>
                ₹{displayPrice}
              </div>
              <div className="bg-white font-black uppercase rounded-full flex items-center shadow-xl flex-shrink-0"
                style={{ fontSize: '1.6cqw', gap: '0.5cqw', padding: '1cqw 2cqw', color: primaryThemeBg }}>
                {badgeText || 'ORDER NOW'} <ChevronRight size="1em" strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Layout 1: Festival / Seasonal (Elegant, centered, dark/gold, text at bottom)
    if (selectedCampaign === 'Festival' || selectedCampaign === 'Seasonal') {
      return (
        <div className="w-full h-full relative overflow-hidden group select-none flex flex-col justify-between items-center" style={{ backgroundColor: '#0f0f11', containerType: 'inline-size' }}>
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 group-hover:scale-110 opacity-90" style={{ backgroundImage: `url(${bgUrl})` }} />
          {/* Rich Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/95" />
          
          {/* Elegant top border accent */}
          <div className="absolute top-[3cqw] left-[3cqw] right-[3cqw] h-[95%] border border-white/10 rounded-lg pointer-events-none" />
          <div className="absolute top-[4.5cqw] left-1/2 -translate-x-1/2 w-[20cqw] h-[0.2cqw]" style={{ backgroundColor: accentThemeColor }} />
          
          <div className="z-10 w-full pt-[8cqw] flex flex-col items-center">
             <div className="uppercase tracking-[0.3em] font-semibold mb-[2cqw]" style={{ color: accentThemeColor, fontSize: '2.5cqw' }}>You're Invited</div>
             <h2 className="font-serif font-black text-white drop-shadow-2xl leading-tight text-center px-[4cqw]" style={{ textShadow: `0 4px 20px ${accentThemeColor}40`, fontSize: '8cqw' }}>
               {taglineText || 'Taste of the Season'}
             </h2>
          </div>
          
          <div className="z-10 w-full px-[5cqw] flex flex-col items-center text-center pb-[5cqw] mt-auto">
            <div className="w-full relative py-[4cqw] flex flex-col items-center justify-center">
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-[3cqw] h-[3cqw] border-t border-l" style={{ borderColor: accentThemeColor }} />
              <div className="absolute top-0 right-0 w-[3cqw] h-[3cqw] border-t border-r" style={{ borderColor: accentThemeColor }} />
              <div className="absolute bottom-0 left-0 w-[3cqw] h-[3cqw] border-b border-l" style={{ borderColor: accentThemeColor }} />
              <div className="absolute bottom-0 right-0 w-[3cqw] h-[3cqw] border-b border-r" style={{ borderColor: accentThemeColor }} />
              
              <div className="font-bold text-white uppercase tracking-widest leading-none mb-[2cqw]" style={{ fontSize: '6cqw' }}>{dishName}</div>
              <div className="text-white/60 max-w-[85%] leading-relaxed font-light" style={{ fontSize: '2.5cqw' }}>{description}</div>
              <div className="mt-[3cqw] px-[4cqw] py-[1.5cqw] rounded-full border border-white/20 bg-black/40 font-serif italic" style={{ color: accentThemeColor, fontSize: '5cqw' }}>
                ₹{displayPrice}
              </div>
            </div>
            
            <div className="mt-[4cqw] flex flex-col items-center text-white/50 tracking-widest uppercase font-medium" style={{ fontSize: '2cqw' }}>
              <span className="mb-[1cqw]" style={{ color: accentThemeColor }}>Bring out your festive spirit</span>
              <div className="flex gap-[2cqw] items-center">
                <span>{footerPhone}</span> 
                <span className="w-[0.5cqw] h-[0.5cqw] rounded-full bg-white/20" /> 
                <span>{footerWeb}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Layout 2: Flash Sale / New Launch — overflow-safe, all text contained
    if (selectedCampaign === 'Flash sale' || selectedCampaign === 'New launch') {
      return (
        <div className="w-full h-full relative overflow-hidden group select-none flex flex-col" style={{ backgroundColor: primaryThemeBg, containerType: 'inline-size' }}>
          {/* Background food photo */}
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${bgUrl})` }} />
          {/* Strong gradient from bottom so text is always legible */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/15" />

          {/* Top bar: brand name LEFT + promo badge RIGHT — in one flex row, no overlap */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-start justify-between gap-2" style={{ padding: '3cqw' }}>
            <div className="bg-white/20 backdrop-blur-md font-black uppercase tracking-[0.2em] text-white rounded-full border border-white/30 shadow-lg min-w-0 truncate"
              style={{ fontSize: '3cqw', padding: '1.5cqw 3cqw', maxWidth: '65%' }}>
              {brandKit.restaurantName}
            </div>
            <div className="rounded-full flex items-center justify-center font-black uppercase text-center leading-tight shadow-2xl flex-shrink-0 rotate-12"
              style={{ backgroundColor: accentThemeColor, color: '#111', width: '16cqw', height: '16cqw', fontSize: '2.5cqw', padding: '1.5cqw' }}>
              <span className="text-center break-words leading-none" style={{ wordBreak: 'break-word' }}>
                {(taglineText || 'LIMITED TIME OFFER').split(' ').map((w, i) => <span key={i} className="block">{w}</span>)}
              </span>
            </div>
          </div>

          {/* Bottom content panel — strictly contained */}
          <div className="absolute bottom-0 left-0 right-0 z-10 overflow-hidden" style={{ padding: '0 4cqw 4cqw 4cqw' }}>
            {/* Dish name — max 2 lines, word-break to prevent right-edge clipping */}
            <h2 className="font-black uppercase leading-tight text-white drop-shadow-2xl overflow-hidden"
              style={{ fontSize: '9cqw', marginBottom: '1cqw', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
              {dishName.split(' ').map((word, i) => (
                <span key={i} style={{ color: i % 2 === 1 ? accentThemeColor : 'white' }}>{word} </span>
              ))}
            </h2>

            {/* Description */}
            <p className="text-white/75 leading-snug line-clamp-2 overflow-hidden" style={{ fontSize: '3cqw', marginBottom: '3cqw' }}>
              {description}
            </p>

            {/* Price + CTA in one row */}
            <div className="flex items-center justify-between overflow-hidden">
              <div className="font-black text-white drop-shadow-lg flex-shrink-0" style={{ fontSize: '11cqw' }}>
                ₹{displayPrice}
              </div>
              <div className="bg-white text-black font-black uppercase rounded-full flex items-center shadow-2xl flex-shrink-0"
                style={{ fontSize: '3cqw', padding: '2cqw 4cqw', gap: '1cqw' }}>
                {badgeText || 'ORDER NOW'} <ChevronRight size="1em" strokeWidth={4} />
              </div>
            </div>

            {/* Footer divider + contact info — single line each, truncated */}
            <div className="w-full bg-white/20" style={{ height: '1px', margin: '2cqw 0' }} />
            <div className="flex items-center justify-between gap-2 overflow-hidden">
              <span className="min-w-0 truncate text-white/60 font-bold uppercase tracking-widest" style={{ fontSize: '2.5cqw' }}>{footerPhone}</span>
              <span className="text-white/30 flex-shrink-0" style={{ fontSize: '2.5cqw' }}>·</span>
              <span className="min-w-0 truncate text-right text-white/60 font-bold uppercase tracking-widest" style={{ fontSize: '2.5cqw' }}>{footerWeb}</span>
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

    // Layout 4: Dish Promo / New Launch / Default (Magazine-style inner box layout)

    if (aspectRatio === '9:16' || aspectRatio === '9:16_reel') {
      return (
        <div className="w-full h-full relative overflow-hidden group select-none flex flex-col items-center bg-black" style={{ containerType: 'inline-size' }}>
          <div className="absolute inset-0 bg-cover bg-center opacity-40 blur-xl scale-110" style={{ backgroundImage: `url(${bgUrl})` }} />
          <div className="absolute inset-0 bg-black/40" />

          {/* Top Brand Name - Y=250 approx (15% down) */}
          <div className="z-20 w-full text-center mt-[15cqw] mb-[5cqw] px-[5cqw]">
            <span className="font-black uppercase tracking-[0.3em] text-white/80 drop-shadow-md truncate block" style={{ fontSize: '4cqw' }}>
              {brandKit.restaurantName}
            </span>
          </div>

          <div className="z-20 w-[85%] bg-[#FDFBF7] rounded-xl flex flex-col items-center pt-[8cqw] pb-[8cqw] px-[6cqw] shadow-2xl relative flex-1 mb-[25cqw]">
            <h2 className="font-black uppercase leading-[0.9] w-full text-center tracking-tighter mb-[6cqw] overflow-hidden" style={{ color: primaryThemeBg, fontSize: '12cqw', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
              {taglineText || dishName}
            </h2>
            
            <div className="w-[60cqw] h-[60cqw] rounded-full overflow-hidden shadow-2xl mb-[8cqw] relative border-[1cqw] border-white flex-shrink-0">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgUrl})` }} />
            </div>
            
            <p className="font-bold text-slate-800 leading-snug text-center uppercase tracking-widest px-[2cqw] line-clamp-3 overflow-hidden" style={{ fontSize: '3.5cqw' }}>
              {description}
            </p>

            {/* Order Button at the bottom of the card */}
            <div className="mt-auto w-full border-[0.5cqw] border-black text-black font-black rounded-full uppercase tracking-widest text-center shadow-sm" style={{ fontSize: '3.5cqw', padding: '3cqw 0' }}>
              ORDER NOW • ₹{displayPrice}
            </div>
          </div>
          
          <div className="z-20 absolute bottom-[10cqw] w-full flex justify-between px-[10cqw] text-center gap-[2cqw]">
            <span className="font-bold uppercase tracking-[0.2em] text-white/70 drop-shadow-sm truncate" style={{ fontSize: '3cqw' }}>{footerWeb}</span>
            <span className="font-bold uppercase tracking-[0.2em] text-white/70 drop-shadow-sm truncate" style={{ fontSize: '3cqw' }}>{footerPhone}</span>
          </div>
        </div>
      );
    }

    // Default to 1:1 Square
    return (
      <div className="w-full h-full relative overflow-hidden group select-none flex flex-col items-center justify-center bg-[#FDFBF7]" style={{ containerType: 'inline-size' }}>
        <div className="absolute top-[4cqw] w-full text-center flex justify-between px-[6cqw] gap-[2cqw]">
          <span className="font-black uppercase tracking-[0.3em] text-black/40 truncate" style={{ fontSize: '2.5cqw' }}>
            {brandKit.restaurantName}
          </span>
          <span className="font-black uppercase tracking-[0.3em] text-black/40 truncate" style={{ fontSize: '2.5cqw' }}>
            {taglineText || 'PROMO'}
          </span>
        </div>

        <div className="z-20 w-[85%] flex flex-col items-center text-center mt-[8cqw]">
          <h2 className="font-black uppercase leading-[0.9] tracking-tighter mb-[4cqw] overflow-hidden" style={{ color: primaryThemeBg, fontSize: '11cqw', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
            {dishName}
          </h2>
          
          <div className="w-[50cqw] h-[50cqw] rounded-full overflow-hidden shadow-xl mb-[4cqw] relative border-[1cqw] border-white flex-shrink-0">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgUrl})` }} />
          </div>
          
          <p className="font-bold text-slate-700 leading-snug uppercase tracking-widest mb-[5cqw] px-[4cqw] line-clamp-2 overflow-hidden" style={{ fontSize: '3cqw' }}>
            {description}
          </p>
          
          <div className="bg-black text-white font-black rounded-full uppercase tracking-widest shadow-lg" style={{ fontSize: '3.5cqw', padding: '2.5cqw 6cqw' }}>
            ORDER NOW • ₹{displayPrice}
          </div>
        </div>
        
        <div className="absolute bottom-[4cqw] w-full flex justify-between px-[6cqw] text-center gap-[2cqw]">
          <span className="font-bold uppercase tracking-[0.2em] text-black/50 truncate" style={{ fontSize: '2.5cqw' }}>{footerWeb}</span>
          <span className="font-bold uppercase tracking-[0.2em] text-black/50 truncate" style={{ fontSize: '2.5cqw' }}>{footerPhone}</span>
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
                <div className={`flex flex-col items-center ${(activeTab === 'All formats' || activeTab === 'IG Post') ? '' : 'absolute opacity-0 pointer-events-none -z-50'}`}>
                  <div 
                    ref={igPostRef}
                    className="w-full aspect-square rounded-2xl shadow-lg border border-slate-200 relative overflow-hidden"
                  >
                    {renderPosterTemplate('1:1', 0)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-2 tracking-wider">IG POST · 1080×1080</span>
                </div>

                {/* Format 2: IG Story 9:16 */}
                <div className={`flex flex-col items-center ${(activeTab === 'All formats' || activeTab === 'IG Story') ? '' : 'absolute opacity-0 pointer-events-none -z-50'}`}>
                  <div 
                    ref={igStoryRef}
                    className="w-full aspect-[9/16] rounded-2xl shadow-lg border border-slate-200 relative overflow-hidden"
                  >
                    {renderPosterTemplate('9:16', 1)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-2 tracking-wider">IG STORY · 1080×1920</span>
                </div>

                {/* Format 3: WA Status 9:16 — identical spec to IG Story */}

                {/* Format 4: FB Event Banner 1.91:1 */}
                <div className={`flex flex-col items-center ${(activeTab === 'All formats' || activeTab === 'FB Event') ? '' : 'absolute opacity-0 pointer-events-none -z-50'}`}>
                  <div 
                    ref={fbEventRef}
                    style={{ aspectRatio: '1.91 / 1' }}
                    className="w-full rounded-2xl shadow-lg border border-slate-200 relative overflow-hidden"
                  >
                    {renderPosterTemplate('1.91:1', 3)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-2 tracking-wider">FB EVENT · 1200×628</span>
                </div>

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
