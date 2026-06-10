import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, Camera, Image as ImageIcon, Layout as LayoutIcon,
  Download, Loader2, Type, FileText, Smartphone, Tv2, 
  Settings2, Wand2, Plus, CheckCircle2, Heart, Flame,
  Leaf, AlertTriangle
} from 'lucide-react';
import { loadBrandKit, BrandKit } from '../pages/BrandIntelligencePage';
import { useWorkspace } from '../context/WorkspaceContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// ── Category Options ─────────────────────────────────────
const CATEGORY_OPTIONS = [
  'Starters', 'Soup', 'Main Course', 'Rice & Biryani', 
  'Breads', 'Desserts', 'Beverages', 'Salads', 'Combo'
];

// Simulated generation delays
const GENERATION_STAGES = [
  "Initializing Neural Architecture...",
  "Loading Brand Identity Constraints...",
  "Running Image Enhancement & Styling...",
  "Injecting Brand Context (Typography & Color)...",
  "Compositing Final Layout..."
];

// ── Fallback Health Score Calculator ────────────────────────
function calculateHealthScore(dishName: string, description: string, category: string): { score: number; label: string; detail: string } {
  const text = `${dishName} ${description} ${category}`.toLowerCase();
  let score = 8.0; // base score made more lenient
  const healthyKeywords = ['grilled', 'steamed', 'baked', 'roasted', 'fresh', 'organic',
    'salad', 'vegetables', 'veggie', 'greens', 'lentils', 'dal', 'soup', 'tofu',
    'quinoa', 'oats', 'whole grain', 'brown rice', 'herbs', 'olive oil', 'avocado',
    'fish', 'salmon', 'tuna', 'lean', 'yogurt', 'mushroom', 'broccoli', 'spinach'];
  const unhealthyKeywords = ['fried', 'deep fried', 'crispy', 'batter', 'creamy', 'cream',
    'butter', 'cheese', 'bacon', 'sausage', 'mayo', 'mayonnaise', 'sugar', 'candy',
    'chocolate', 'caramel', 'syrup', 'soda', 'cola', 'ice cream', 'pastry', 'cake'];
  const proteinKeywords = ['chicken', 'mutton', 'lamb', 'paneer', 'egg', 'fish', 
    'prawns', 'shrimp', 'tofu', 'soy', 'lentil', 'dal', 'bean', 'chickpea', 'beef', 'patty', 'burger'];
  
  for (const kw of healthyKeywords) {
    if (text.includes(kw)) { score += 0.3; }
  }
  for (const kw of unhealthyKeywords) {
    // Only small penalty for comfort foods, keeping them highly satisfying
    if (text.includes(kw)) { score -= 0.15; }
  }
  for (const kw of proteinKeywords) {
    if (text.includes(kw)) { score += 0.25; }
  }
  if (category === 'Soup' || category === 'Salads') score += 0.5;
  if (category === 'Desserts') score -= 0.3;
  
  // Comfort foods like burgers and pizzas should always score 7.0 or above for soul fulfillment and premium quality
  score = Math.round(Math.max(7.0, Math.min(9.8, score)) * 10) / 10;
  let label: string;
  let detail: string;
  
  if (score >= 8.5) {
    label = 'Excellent';
    detail = 'Low in calories and packed with nutrients. Great for immunity and digestion.';
  } else if (score >= 7.5) {
    label = 'Good';
    detail = 'Good source of protein. Best enjoyed in moderation for a balanced meal.';
  } else if (score >= 7.0) {
    label = 'Balanced';
    detail = 'High-quality premium ingredients. Great for soul satisfaction and pure comfort.';
  } else {
    label = 'Treat';
    detail = 'A rich indulgence! Best as an occasional treat with lighter accompaniments.';
  }
  return { score, label, detail };
}

// ── Fallback Story Generator ──────────────────────────────
function generateStory(dishName: string, description: string, category: string, style: string): string {
  const name = dishName.trim();
  const isSpicy = style === 'bold' || description.toLowerCase().includes('spic');
  const isFresh = style === 'fresh' || description.toLowerCase().includes('fresh');
  const isLuxury = style === 'luxury';
  
  const spicyStories = [
    `Fiery, flavorful, and full of character — ${name} is a signature delight that sets your taste buds on fire and leaves you craving more!`,
    `Bold spices meet expert craft. Our ${name} is for those who love unbeatable taste — a masterpiece of heat and flavor.`,
    `A fiery fusion of tradition and taste. ${name} brings the heat with every bite, crafted for spice lovers.`
  ];
  const freshStories = [
    `Light, vibrant, and bursting with freshness — ${name} is crafted with handpicked ingredients for a clean, satisfying experience.`,
    `Farm-fresh flavors in every bite. Our ${name} celebrates natural ingredients with a modern, wholesome twist.`,
    `A refreshing take on a classic. ${name} brings together crisp textures and bright flavors for pure delight.`
  ];
  const luxuryStories = [
    `An exquisite culinary creation — ${name} represents the pinnacle of gastronomic artistry, crafted with the finest ingredients.`,
    `Elegance meets flavor. Our ${name} is a masterwork of culinary precision, designed to delight the most discerning palate.`,
    `A signature masterpiece. ${name} showcases premium ingredients with meticulous technique for an unforgettable experience.`
  ];
  const defaultStories = [
    `A delightful fusion of flavors — ${name} combines tender, perfectly seasoned ingredients with bold character. A must-try!`,
    `Crafted with care and passion, our ${name} is a crowd favorite. Perfect flavors in every single bite.`,
    `Our signature ${name} delivers comfort and satisfaction. Made fresh, served with love, remembered forever.`
  ];
  const idx = name.length % 3;
  if (isSpicy) return spicyStories[idx];
  if (isFresh) return freshStories[idx];
  if (isLuxury) return luxuryStories[idx];
  return defaultStories[idx];
}

export default function MenuStudio() {
  const { brandKit: workspaceBrandKit, activeDish, updateMenuCardUrl, updateActiveDish } = useWorkspace();
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [mode, setMode] = useState<'generate' | 'upload'>('generate');
  
  // Form State
  const [dishName, setDishName] = useState('Chicken Burger');
  const [category, setCategory] = useState('Main Course');
  const [description, setDescription] = useState('A toasted brioche bun filled with crispy chicken, fresh lettuce, melted cheese, and smoky bacon, served with golden French fries.');
  const [price, setPrice] = useState('220');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);
  const [resultImage, setResultImage] = useState<string | null>(null);

  // AI-Generated State
  const [aiStory, setAiStory] = useState<string | null>(null);
  const [aiHealthData, setAiHealthData] = useState<{ score: number; label: string; detail: string } | null>(null);
  const [aiIngredients, setAiIngredients] = useState<string[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuCardRef = useRef<HTMLDivElement>(null);

  const handleDownloadPNG = async () => {
    if (!menuCardRef.current) return;
    try {
      const canvas = await html2canvas(menuCardRef.current, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `${dishName.replace(/\s+/g, '_')}_Menu_Card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Failed to generate PNG', e);
    }
  };

  const handleDownloadPDF = async () => {
    if (!menuCardRef.current) return;
    try {
      const canvas = await html2canvas(menuCardRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${dishName.replace(/\s+/g, '_')}_Menu_Card.pdf`);
    } catch (e) {
      console.error('Failed to generate PDF', e);
    }
  };

  // Load from WorkspaceContext
  useEffect(() => {
    if (workspaceBrandKit) {
      setBrandKit(workspaceBrandKit);
    }
  }, [workspaceBrandKit]);

  useEffect(() => {
    if (activeDish) {
      if (activeDish.name) setDishName(activeDish.name);
      if (activeDish.description) setDescription(activeDish.description);
      if (activeDish.price) setPrice(activeDish.price);

      const fetchViaProxy = (externalUrl: string) => {
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(externalUrl)}`;
        setUploadedImage(proxyUrl);
        setMode('upload');
        fetch(proxyUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "dish_image.jpeg", { type: blob.type || "image/jpeg" });
            setUploadedFile(file);
          })
          .catch(err => console.error("Failed to load image via proxy:", err));
      };

      if (activeDish.processedImageUrl) {
        fetchViaProxy(activeDish.processedImageUrl);
      } else if (activeDish.rawImageUrl) {
        fetchViaProxy(activeDish.rawImageUrl);
      }
    }
  }, [activeDish]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setUploadedImage(URL.createObjectURL(file));
      setMode('upload');
    }
  };

  // Safe extract of brand kit
  const primaryColor = brandKit?.colors.find(c => c.label === 'Primary')?.hex || '#D4121A';
  const bgColor = brandKit?.colors.find(c => c.label === 'Background')?.hex || '#FFFFFF';
  const textColor = brandKit?.colors.find(c => c.label === 'Text')?.hex || '#1C1008';
  const accentColor = brandKit?.colors.find(c => c.label === 'Accent')?.hex || '#FAA000';
  const fontFamily = brandKit?.font === 'outfit' ? '"Outfit", sans-serif' : '"Playfair Display", serif';
  const restaurantName = brandKit?.restaurantName || 'YOUR BRAND';
  const brandStyle = brandKit?.style || 'luxury';

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResultImage(null);
    setAiIngredients(null);
    setGenerationStage(0);

    // Multi-stage slow animation loader
    let currentStage = 0;
    const interval = setInterval(() => {
      currentStage = Math.min(currentStage + 1, GENERATION_STAGES.length - 1);
      setGenerationStage(currentStage);
    }, 1000);

    try {
      const formData = new FormData();
      formData.append('dishName', dishName);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('brandStyle', brandStyle);
      formData.append('primaryColor', primaryColor);
      
      if (mode === 'upload' && uploadedFile) {
        formData.append('image', uploadedFile);
      }

      const response = await fetch('/api/generate-menu', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate menu card');
      }

      const data = await response.json();
      if (data.success) {
        setAiStory(data.story);
        setAiHealthData({
          score: data.health_score,
          label: data.health_label,
          detail: data.health_detail
        });
        if (data.ingredients) {
          setAiIngredients(data.ingredients);
        }
        if (data.image_url) {
          setResultImage(data.image_url);
        } else if (mode === 'upload' && uploadedImage) {
          setResultImage(uploadedImage);
        }
        
        // Save the public URL or image URL in workspace context
        if (data.public_url) {
          await updateMenuCardUrl(data.public_url);
        } else if (data.image_url) {
          await updateMenuCardUrl(data.image_url);
        }
      }
    } catch (err) {
      console.error(err);
      // Fallback in case of server failure
      setTimeout(() => {
        if (mode === 'upload' && uploadedImage) {
          setResultImage(uploadedImage);
        } else {
          const foodImages: Record<string, string> = {
            'Starters': 'https://images.pexels.com/photos/2233729/pexels-photo-2233729.jpeg?auto=compress&cs=tinysrgb&w=800',
            'Soup': 'https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?auto=compress&cs=tinysrgb&w=800',
            'Main Course': 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
            'Rice & Biryani': 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=800',
            'Desserts': 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800',
            'Beverages': 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=800',
            'Salads': 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=800',
            'Combo': 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800',
            'Breads': 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=800',
          };
          setResultImage(foodImages[category] || foodImages['Starters']);
        }
        setAiStory(generateStory(dishName, description, category, brandStyle));
        setAiHealthData(calculateHealthScore(dishName, description, category));
        setAiIngredients(null);
      }, 500);
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  // Parsed list of ingredients
  const ingredientsList = useMemo(() => {
    if (aiIngredients && aiIngredients.length > 0) {
      return aiIngredients;
    }
    return description
      .split(/,|\band\b|\bwith\b|\btopped\b|\&/i)
      .map(s => s.trim().replace(/^with\s+/i, '').replace(/^and\s+/i, '').replace(/\.$/, ''))
      .filter(s => s.length > 2 && s.length <= 25)
      .slice(0, 6);
  }, [description, aiIngredients]);

  // Combined fallback & real states
  const finalStory = aiStory || generateStory(dishName, description, category, brandStyle);
  const finalHealth = aiHealthData || calculateHealthScore(dishName, description, category);
  const healthColor = finalHealth.score >= 8.0 ? '#10B981' : finalHealth.score >= 6.5 ? '#F59E0B' : '#EF4444';

  // Dynamic visual style configurations based on selected style, adapted to Brand Kit if available
  const activeStyleProfile = useMemo(() => {
    let profile = {
      cardBg: '#09090B',
      cardText: '#F4F4F5',
      cardBorder: '1px solid rgba(212, 175, 55, 0.25)',
      cardShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 12px rgba(212, 175, 55, 0.05)',
      accentText: '#FAA000',
      dividerBg: 'rgba(212, 175, 55, 0.15)',
      dividerDiamondBorder: 'rgba(212, 175, 55, 0.4)',
      subtextColor: 'rgba(244, 244, 245, 0.7)',
      storyColor: 'rgba(244, 244, 245, 0.55)',
      badgeBg: 'rgba(255, 255, 255, 0.02)',
      badgeBorder: 'rgba(255, 255, 255, 0.04)',
      topHeaderLine: '1px solid rgba(255, 255, 255, 0.06)'
    };

    switch (brandStyle) {
      case 'fresh':
        profile = {
          cardBg: '#FAFBF9',
          cardText: '#1E293B',
          cardBorder: '1px solid rgba(16, 185, 129, 0.25)',
          cardShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.04), inset 0 0 10px rgba(16, 185, 129, 0.02)',
          accentText: '#10B981',
          dividerBg: 'rgba(16, 185, 129, 0.15)',
          dividerDiamondBorder: 'rgba(16, 185, 129, 0.3)',
          subtextColor: 'rgba(30, 41, 59, 0.8)',
          storyColor: 'rgba(30, 41, 59, 0.65)',
          badgeBg: 'rgba(16, 185, 129, 0.04)',
          badgeBorder: 'rgba(16, 185, 129, 0.1)',
          topHeaderLine: '1px solid rgba(16, 185, 129, 0.12)'
        };
        break;
      case 'bold':
        profile = {
          cardBg: '#120202',
          cardText: '#FDF2F2',
          cardBorder: '1px solid rgba(239, 68, 68, 0.3)',
          cardShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 0 12px rgba(239, 68, 68, 0.05)',
          accentText: '#EF4444',
          dividerBg: 'rgba(239, 68, 68, 0.2)',
          dividerDiamondBorder: 'rgba(239, 68, 68, 0.5)',
          subtextColor: 'rgba(253, 242, 242, 0.75)',
          storyColor: 'rgba(253, 242, 242, 0.6)',
          badgeBg: 'rgba(239, 68, 68, 0.03)',
          badgeBorder: 'rgba(239, 68, 68, 0.1)',
          topHeaderLine: '1px solid rgba(239, 68, 68, 0.15)'
        };
        break;
      case 'organic':
        profile = {
          cardBg: '#FAF7F2',
          cardText: '#2D1F10',
          cardBorder: '1px solid rgba(139, 92, 26, 0.2)',
          cardShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.05), inset 0 0 10px rgba(139, 92, 26, 0.03)',
          accentText: '#8B5A1A',
          dividerBg: 'rgba(139, 92, 26, 0.15)',
          dividerDiamondBorder: 'rgba(139, 92, 26, 0.35)',
          subtextColor: 'rgba(45, 31, 16, 0.75)',
          storyColor: 'rgba(45, 31, 16, 0.6)',
          badgeBg: 'rgba(139, 92, 26, 0.04)',
          badgeBorder: 'rgba(139, 92, 26, 0.1)',
          topHeaderLine: '1px solid rgba(139, 92, 26, 0.12)'
        };
        break;
      case 'homestyle':
        profile = {
          cardBg: '#FDFBF7',
          cardText: '#3E2723',
          cardBorder: '1px solid rgba(120, 83, 72, 0.25)',
          cardShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.04), inset 0 0 10px rgba(120, 83, 72, 0.02)',
          accentText: '#785348',
          dividerBg: 'rgba(120, 83, 72, 0.15)',
          dividerDiamondBorder: 'rgba(120, 83, 72, 0.35)',
          subtextColor: 'rgba(62, 39, 35, 0.75)',
          storyColor: 'rgba(62, 39, 35, 0.6)',
          badgeBg: 'rgba(120, 83, 72, 0.04)',
          badgeBorder: 'rgba(120, 83, 72, 0.1)',
          topHeaderLine: '1px solid rgba(120, 83, 72, 0.12)'
        };
        break;
      case 'qsr':
        profile = {
          cardBg: '#FFFFFF',
          cardText: '#1F2937',
          cardBorder: '1px solid rgba(245, 158, 11, 0.3)',
          cardShadow: '0 20px 45px -12px rgba(0, 0, 0, 0.05), inset 0 0 10px rgba(245, 158, 11, 0.02)',
          accentText: '#F59E0B',
          dividerBg: 'rgba(245, 158, 11, 0.2)',
          dividerDiamondBorder: 'rgba(245, 158, 11, 0.45)',
          subtextColor: 'rgba(31, 41, 55, 0.75)',
          storyColor: 'rgba(31, 41, 55, 0.6)',
          badgeBg: 'rgba(245, 158, 11, 0.04)',
          badgeBorder: 'rgba(245, 158, 11, 0.1)',
          topHeaderLine: '1px solid rgba(245, 158, 11, 0.15)'
        };
        break;
      case 'luxury':
      default:
        profile = {
          cardBg: '#09090B',
          cardText: '#F4F4F5',
          cardBorder: '1px solid rgba(212, 175, 55, 0.25)',
          cardShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 12px rgba(212, 175, 55, 0.05)',
          accentText: '#FAA000',
          dividerBg: 'rgba(212, 175, 55, 0.15)',
          dividerDiamondBorder: 'rgba(212, 175, 55, 0.4)',
          subtextColor: 'rgba(244, 244, 245, 0.7)',
          storyColor: 'rgba(244, 244, 245, 0.55)',
          badgeBg: 'rgba(255, 255, 255, 0.02)',
          badgeBorder: 'rgba(255, 255, 255, 0.04)',
          topHeaderLine: '1px solid rgba(255, 255, 255, 0.06)'
        };
        break;
    }

    if (brandKit) {
      const bkPrimary = brandKit.colors.find(c => c.label === 'Primary')?.hex;
      const bkBg = brandKit.colors.find(c => c.label === 'Background')?.hex;
      const bkText = brandKit.colors.find(c => c.label === 'Text')?.hex;
      const bkAccent = brandKit.colors.find(c => c.label === 'Accent')?.hex;

      if (bkBg) profile.cardBg = bkBg;
      if (bkText) {
        profile.cardText = bkText;
        profile.subtextColor = bkText + 'CC';
        profile.storyColor = bkText + '99';
      }
      if (bkPrimary) {
        profile.topHeaderLine = `1px solid ${bkPrimary}26`;
        profile.dividerBg = `${bkPrimary}33`;
      }
      if (bkAccent) {
        profile.accentText = bkAccent;
        profile.dividerDiamondBorder = bkAccent;
      } else if (bkPrimary) {
        profile.accentText = bkPrimary;
        profile.dividerDiamondBorder = bkPrimary;
      }

      const getLuminance = (hex: string) => {
        const cleaned = hex.replace('#', '');
        const r = parseInt(cleaned.substring(0, 2), 16);
        const g = parseInt(cleaned.substring(2, 4), 16);
        const b = parseInt(cleaned.substring(4, 6), 16);
        const a = [r, g, b].map(v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      };

      const adjustContrast = (textHex: string, bgHex: string) => {
        try {
          const textLum = getLuminance(textHex);
          const bgLum = getLuminance(bgHex);
          const contrast = (Math.max(textLum, bgLum) + 0.05) / (Math.min(textLum, bgLum) + 0.05);
          if (contrast < 3.0) {
            return bgLum < 0.5 ? '#FFFFFF' : '#09090B';
          }
          return textHex;
        } catch (e) {
          return textHex;
        }
      };

      profile.cardText = adjustContrast(profile.cardText, profile.cardBg);
      profile.accentText = adjustContrast(profile.accentText, profile.cardBg);
      profile.subtextColor = adjustContrast(profile.subtextColor, profile.cardBg);
      profile.storyColor = adjustContrast(profile.storyColor, profile.cardBg);
    }

    return profile;
  }, [brandStyle, brandKit]);

  return (
    <div className="max-w-7xl mx-auto p-6 py-12">
      <div className="mb-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 border border-purple-200">
          <LayoutIcon size={14} className="text-purple-600" />
          <span className="text-purple-700 font-mono text-[10px] font-bold tracking-widest uppercase">Media & Menu Studio</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-medium text-slate-900">
          AI Menu Card <span className="text-purple-600">Generator.</span>
        </h1>
        <p className="text-slate-500 max-w-2xl text-lg">
          Generate highly realistic, luxurious menu layouts. Powered dynamically by our Neural Creative Engine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Editor & Inputs */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Brand Kit Status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Brand Kit Active</div>
                  <div className="text-xs text-slate-500 mt-0.5">{restaurantName} Identity Loaded</div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="w-6 h-6 rounded-md shadow-sm border border-slate-200" style={{ background: primaryColor }} title="Primary" />
                <div className="w-6 h-6 rounded-md shadow-sm border border-slate-200" style={{ background: bgColor }} title="Background" />
                <div className="w-6 h-6 rounded-md shadow-sm border border-slate-200" style={{ background: accentColor }} title="Accent" />
              </div>
            </div>
            <button 
              onClick={() => {
                sessionStorage.removeItem('brandKit');
                window.location.href = '/';
              }}
              className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 py-2 px-4 rounded-lg transition-colors text-center w-full flex items-center justify-center gap-2"
            >
              Start Over (Reset Brand Kit & Upload New Logo)
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            
            {/* Mode Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setMode('generate')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                  mode === 'generate' ? 'bg-white text-purple-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Wand2 size={16} /> AI Generate
              </button>
              <button
                onClick={() => setMode('upload')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                  mode === 'upload' ? 'bg-white text-purple-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Camera size={16} /> Upload Photo
              </button>
            </div>

            <div className="space-y-4">
              {mode === 'upload' && (
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Base Dish Photo</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors overflow-hidden relative"
                  >
                    {uploadedImage ? (
                      <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImageIcon size={24} className="text-purple-400 mb-2" />
                        <span className="text-sm text-slate-500 font-medium">Click to upload raw photo</span>
                        <span className="text-xs text-slate-400">AI will enhance lighting & styling</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
              )}

              {/* Category Dropdown */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Category</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 transition-colors appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
                >
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Dish Name</label>
                <input 
                  type="text" 
                  value={dishName}
                  onChange={e => setDishName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Ingredients / Description</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 transition-colors resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Price (Optional)</label>
                <input 
                  type="text" 
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 transition-colors"
                />
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || (mode === 'upload' && !uploadedImage)}
              className="w-full py-4 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
            >
              {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
              {isGenerating ? "Synthesizing Menu Card..." : "Generate Realistic Menu Card"}
            </button>
          </div>
        </div>

        {/* Right Column: Live Preview & Rendering Stage */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full min-h-[600px] flex flex-col">
            
            <div className="border-b border-slate-200 p-4 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                <Tv2 size={16} className="text-purple-600" />
                <span>Live Rendering Stage</span>
              </div>
              
              <div className="flex gap-2">
                <button onClick={handleDownloadPDF} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:text-purple-600 hover:border-purple-200 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                  <Download size={14} /> PDF
                </button>
                <button onClick={handleDownloadPNG} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:text-purple-600 hover:border-purple-200 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                  <Download size={14} /> PNG
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 p-8 flex items-center justify-center relative">
              
              {isGenerating ? (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <Loader2 size={48} className="text-purple-600 animate-spin" />
                    <div className="absolute inset-0 border-4 border-purple-200 border-t-transparent rounded-full animate-spin-slow opacity-50" />
                  </div>
                  <div className="space-y-2 text-center">
                    <h3 className="text-lg font-semibold text-slate-900">Neural Engine Processing</h3>
                    <p className="text-sm font-mono text-purple-600 animate-pulse h-5">
                      {GENERATION_STAGES[generationStage]}
                    </p>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4">
                    <div 
                      className="h-full bg-purple-600 transition-all duration-500 ease-out"
                      style={{ width: `${((generationStage + 1) / GENERATION_STAGES.length) * 100}%` }}
                    />
                  </div>
                </div>
              ) : null}

              {/* ── DYNAMIC Premium Menu Card (Responsive to Style User Selects) ── */}
              <div 
                ref={menuCardRef}
                className="w-full max-w-[420px] shadow-2xl relative flex flex-col overflow-hidden"
                style={{ 
                  background: activeStyleProfile.cardBg,
                  color: activeStyleProfile.cardText,
                  border: activeStyleProfile.cardBorder,
                  boxShadow: activeStyleProfile.cardShadow,
                  aspectRatio: '3 / 4.8',
                  borderRadius: 16
                }}
              >
                {/* ── Top Header Section: Logo + Category Alignment ── */}
                <div style={{ padding: '24px 24px 12px', zIndex: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    {/* Logo (Top Left) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {brandKit?.logoUrl ? (
                        <img 
                          src={brandKit.logoUrl} 
                          alt="Logo" 
                          style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, border: brandStyle === 'fresh' || brandStyle === 'organic' || brandStyle === 'homestyle' ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.1)' }} 
                        />
                      ) : (
                        <div style={{
                          width: 44, height: 44, borderRadius: 8,
                          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 900, fontSize: 18, fontFamily,
                          border: '1px solid rgba(255,255,255,0.15)'
                        }}>
                          {restaurantName.charAt(0)}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: activeStyleProfile.cardText, fontFamily, textTransform: 'uppercase' }}>
                          {restaurantName}
                        </span>
                        <span style={{ fontSize: 7, color: brandStyle === 'fresh' || brandStyle === 'organic' || brandStyle === 'homestyle' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          Est. Culinary Art
                        </span>
                      </div>
                    </div>
                    
                    {/* Category (Top Right) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ 
                        fontSize: 9, 
                        fontWeight: 700, 
                        letterSpacing: '0.22em', 
                        textTransform: 'uppercase',
                        color: activeStyleProfile.accentText,
                        fontFamily,
                      }}>
                        {category}
                      </span>
                    </div>
                  </div>

                  {/* Dish Name & Price (Proper spacing, zero overlap) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, borderBottom: activeStyleProfile.topHeaderLine, paddingBottom: 12 }}>
                    <h2 style={{ 
                      fontSize: 24, 
                      fontWeight: 800, 
                      lineHeight: 1.15, 
                      textTransform: 'uppercase',
                      letterSpacing: '0.01em',
                      margin: 0,
                      fontFamily,
                      maxWidth: '75%',
                      color: activeStyleProfile.cardText,
                    }}>
                      {dishName}
                    </h2>
                    <div style={{ 
                      fontSize: 20, 
                      fontWeight: 800, 
                      color: activeStyleProfile.accentText,
                      fontFamily,
                      whiteSpace: 'nowrap',
                    }}>
                      {price.startsWith('₹') || price.startsWith('$') ? price : `₹${price}`}
                    </div>
                  </div>
                </div>

                {/* ── Premium Glistening Food Image Section ── */}
                <div style={{ 
                  position: 'relative', 
                  width: '100%', 
                  flex: '1 1 auto',
                  minHeight: 200,
                }}>
                  {/* Subtle blend gradients */}
                  <div style={{
                    position: 'absolute', inset: '0', 
                    top: 0, height: 28,
                    background: `linear-gradient(to bottom, ${activeStyleProfile.cardBg}, transparent)`,
                    zIndex: 10, pointerEvents: 'none',
                  }} />
                  
                  {resultImage ? (
                    <img 
                      src={resultImage} 
                      alt="Dish rendering" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} 
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', height: '100%', minHeight: 200,
                      display: 'flex', flexDirection: 'column', 
                      alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.02)',
                      color: 'rgba(0,0,0,0.2)', gap: 10,
                    }}>
                      <ImageIcon size={36} className="text-slate-400 animate-pulse" />
                      <span style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)' }}>
                        Awaiting Rendering Engine
                      </span>
                    </div>
                  )}

                  <div style={{
                    position: 'absolute', left: 0, right: 0, bottom: 0, height: 40,
                    background: `linear-gradient(to top, ${activeStyleProfile.cardBg}, transparent)`,
                    pointerEvents: 'none',
                  }} />
                </div>

                {/* ── Bottom Section: Ingredients, Story & Dynamic Health Score ── */}
                <div style={{ padding: '16px 24px 24px', zIndex: 10, background: activeStyleProfile.cardBg }}>
                  
                  {/* Side-by-side Ingredients and Culinary Story */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
                    {/* Left Column: Ingredients */}
                    <div style={{ borderRight: activeStyleProfile.topHeaderLine, paddingRight: 10 }}>
                      <h4 style={{ 
                        fontSize: 10, fontWeight: 700, 
                        letterSpacing: '0.16em', textTransform: 'uppercase',
                        color: activeStyleProfile.accentText, fontFamily,
                        marginBottom: 6, marginTop: 0,
                      }}>
                        Ingredients
                      </h4>
                      <ul style={{ 
                        listStyle: 'none', padding: 0, margin: 0,
                        fontSize: 9, lineHeight: 1.6,
                        color: activeStyleProfile.subtextColor,
                      }}>
                        {ingredientsList.map((ing, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: primaryColor }}>•</span> {ing.charAt(0).toUpperCase() + ing.slice(1)}
                          </li>
                        ))}
                        {ingredientsList.length === 0 && <li>• Fresh {dishName}</li>}
                      </ul>
                    </div>

                    {/* Right Column: Culinary Story */}
                    <div>
                      <h4 style={{ 
                        fontSize: 10, fontWeight: 700, 
                        letterSpacing: '0.16em', textTransform: 'uppercase',
                        color: activeStyleProfile.accentText, fontFamily,
                        marginBottom: 6, marginTop: 0,
                      }}>
                        The Story
                      </h4>
                      <p style={{ 
                        fontSize: 9, lineHeight: 1.5,
                        color: activeStyleProfile.storyColor,
                        margin: 0,
                        fontStyle: 'italic'
                      }}>
                        "{finalStory}"
                      </p>
                    </div>
                  </div>

                  {/* Elegant gold geometric divider */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '14px 0 18px' }}>
                    <div style={{ position: 'absolute', width: '100%', height: 1, background: activeStyleProfile.dividerBg }} />
                    <div style={{ 
                      width: 6, height: 6, transform: 'rotate(45deg)', 
                      border: `1px solid ${activeStyleProfile.dividerDiamondBorder}`, 
                      background: activeStyleProfile.cardBg, position: 'relative', zIndex: 1 
                    }} />
                  </div>

                  {/* Smart health score layout */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    background: activeStyleProfile.badgeBg,
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: `1px solid ${activeStyleProfile.badgeBorder}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ 
                        width: 44, height: 44, borderRadius: '50%', 
                        border: `2px solid ${healthColor}`,
                        boxShadow: `0 0 10px ${healthColor}20`,
                        display: 'flex', flexDirection: 'column', 
                        alignItems: 'center', justifyContent: 'center',
                        color: healthColor, lineHeight: 1,
                      }}>
                        <span style={{ fontSize: 15, fontWeight: 800 }}>{finalHealth.score.toFixed(1)}</span>
                        <span style={{ fontSize: 7, opacity: 0.7 }}>/10</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ 
                          fontSize: 9, fontWeight: 800, 
                          letterSpacing: '0.12em',
                          color: healthColor,
                          textTransform: 'uppercase'
                        }}>
                          HEALTH SCORE • {finalHealth.label}
                        </span>
                        <p style={{ 
                          fontSize: 8, color: activeStyleProfile.storyColor, 
                          margin: 0,
                          lineHeight: 1.3,
                          maxWidth: 220
                        }}>
                          {finalHealth.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
