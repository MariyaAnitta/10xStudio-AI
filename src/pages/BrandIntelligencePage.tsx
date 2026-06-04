import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload, Plus, Check, RefreshCw, ChevronRight,
  Brain, Palette, Type, Image as ImageIcon,
  Instagram, Smartphone, ShoppingBag, Layout,
  FileText, Tv2, QrCode, Heart, Utensils, Video,
  CheckCircle2, AlertCircle, X, Sparkles, Eye, Loader2
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

// ── Types ──────────────────────────────────────────────
interface BrandColor {
  hex: string;
  label: string;
}

type TypographyOption = { id: string; heading: string; body: string; tag: string };
type StyleOption = { id: string; label: string; icon: React.ReactNode };

// ── Static Data ────────────────────────────────────────
const TYPOGRAPHY_OPTIONS: TypographyOption[] = [
  { id: 'playfair', heading: 'Playfair Display', body: 'Lato · Sans-serif · Clean', tag: 'Luxury' },
  { id: 'outfit',   heading: 'Outfit',           body: 'Inter · Sans-serif · Modern', tag: 'Modern' },
  { id: 'custom',   heading: 'Custom Font',      body: 'TTF / OTF / WOFF',            tag: 'Upload' },
];

const STYLE_OPTIONS: StyleOption[] = [
  { id: 'luxury',    label: 'Luxury',       icon: <Sparkles size={15} /> },
  { id: 'fresh',     label: 'Fresh & casual', icon: <Heart size={15} /> },
  { id: 'bold',      label: 'Bold & spicy',  icon: <Utensils size={15} /> },
  { id: 'organic',   label: 'Organic',       icon: <ImageIcon size={15} /> },
  { id: 'qsr',       label: 'Modern QSR',    icon: <ShoppingBag size={15} /> },
  { id: 'homestyle', label: 'Homestyle',     icon: <Heart size={15} /> },
];

const GENERATES: { icon: React.ReactNode; label: string }[] = [
  { icon: <FileText size={16} />, label: 'Menu cards' },
  { icon: <ImageIcon size={16} />, label: 'Food photos' },
  { icon: <Instagram size={16} />, label: 'IG posts' },
  { icon: <Smartphone size={16} />, label: 'WA banners' },
  { icon: <Layout size={16} />, label: 'Stories' },
  { icon: <Sparkles size={16} />, label: 'Campaigns' },
  { icon: <QrCode size={16} />, label: 'QR menu' },
  { icon: <Heart size={16} />, label: 'Health tags' },
  { icon: <Video size={16} />, label: 'Chef videos' },
];

// Brand rules are now generated dynamically from state (see component body)

// ── Preview Cards Component ────────────────────────────
function PreviewCard({
  bg, label, type, dish, price, accent
}: {
  bg: string; label: string; type: string;
  dish: string; price?: string; accent: string;
}) {
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #EDE9FE' }}>
      {/* Mini card */}
      <div style={{ background: bg, padding: '10px 12px', minHeight: 80 }}>
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: accent, marginBottom: 4 }}>
          {(typeof window !== 'undefined' && loadBrandKit()?.restaurantName?.toUpperCase()) || 'YOUR BRAND'}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>{dish}</div>
        {price && (
          <div style={{ fontSize: 11, fontWeight: 700, color: accent, marginTop: 4 }}>₹{price}</div>
        )}
      </div>
      <div style={{ background: 'white', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: '#9E8FC8', fontWeight: 600 }}>{label}</span>
        <span style={{
          fontSize: 8, padding: '2px 6px', borderRadius: 999,
          background: '#EDE9FE', color: '#5B21B6', fontWeight: 700
        }}>{type}</span>
      </div>
    </div>
  );
}

// ── Brand Kit helper ────────────────────────────────────
export interface BrandKit {
  logoUrl: string | null;
  restaurantName: string;
  colors: BrandColor[];
  font: string;
  style: string;
  savedAt: string;
}

/** Read the current brand kit from localStorage (null if none saved) */
export function loadBrandKit(): BrandKit | null {
  try {
    const raw = sessionStorage.getItem('brandKit');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Main Component ──────────────────────────────────────
export default function BrandIntelligencePage() {
  const { brandKit, updateBrandKit, setRestaurantNameLive } = useWorkspace();
  const [logoUploaded, setLogoUploaded] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState('');

  const [colors, setColors] = useState<BrandColor[]>([
    { hex: '#D4121A', label: 'Primary' },
    { hex: '#F5E9C8', label: 'Background' },
    { hex: '#1C1008', label: 'Text' },
    { hex: '#FAA000', label: 'Accent' },
  ]);
  const [selectedFont, setSelectedFont] = useState('playfair');
  const [selectedStyle, setSelectedStyle] = useState('luxury');
  const [saved, setSaved] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [newColorInput, setNewColorInput] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ── Build the kit object from current state ────────────
  const buildKit = useCallback((): BrandKit => ({
    logoUrl,
    restaurantName,
    colors,
    font: selectedFont,
    style: selectedStyle,
    savedAt: new Date().toISOString(),
  }), [logoUrl, restaurantName, colors, selectedFont, selectedStyle]);

  // Load saved kit from WorkspaceContext on mount/update
  useEffect(() => {
    if (brandKit) {
      setLogoUrl(brandKit.logoUrl);
      setLogoUploaded(!!brandKit.logoUrl);
      setRestaurantName(brandKit.restaurantName);
      setColors(brandKit.colors);
      setSelectedFont(brandKit.font);
      setSelectedStyle(brandKit.style);
    }
  }, [brandKit]);

  // Save handler
  const handleSave = async () => {
    const kit = buildKit();
    await updateBrandKit(kit);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  // ── Logo upload handler ─────────────────────────────────
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogoUrl(url);
    setLogoUploaded(true);
    
    // ── HSL-based color extraction ────────────────────────
    setIsExtracting(true);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return setIsExtracting(false);
        
        canvas.width = 150;
        canvas.height = 150;
        ctx.drawImage(img, 0, 0, 150, 150);
        const data = ctx.getImageData(0, 0, 150, 150).data;
        
        // Helper: RGB → HSL
        const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
          r /= 255; g /= 255; b /= 255;
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          let h = 0, s = 0;
          const l = (max + min) / 2;
          if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            else if (max === g) h = ((b - r) / d + 2) / 6;
            else h = ((r - g) / d + 4) / 6;
          }
          return [h * 360, s * 100, l * 100];
        };

        // Helper: RGB → Hex
        const rgbToHex = (r: number, g: number, b: number): string =>
          "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();

        // Collect pixels as HSL + RGB, skipping transparent/near-white/near-black
        interface PixelData { r: number; g: number; b: number; h: number; s: number; l: number; }
        const pixels: PixelData[] = [];
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 128) continue;
          // Skip very light (near white) and very dark (near black) pixels
          if (r > 235 && g > 235 && b > 235) continue;
          if (r < 20 && g < 20 && b < 20) continue;
          const [h, s, l] = rgbToHsl(r, g, b);
          // Skip very desaturated grays
          if (s < 10 && l > 20 && l < 80) continue;
          pixels.push({ r, g, b, h, s, l });
        }

        // Cluster by hue (30° buckets)
        interface HueCluster {
          hue: number;
          count: number;
          totalR: number; totalG: number; totalB: number;
          totalS: number; totalL: number;
        }
        const clusters: Record<number, HueCluster> = {};
        
        for (const px of pixels) {
          const bucket = Math.floor(px.h / 30) * 30;
          if (!clusters[bucket]) {
            clusters[bucket] = { hue: bucket, count: 0, totalR: 0, totalG: 0, totalB: 0, totalS: 0, totalL: 0 };
          }
          clusters[bucket].count++;
          clusters[bucket].totalR += px.r;
          clusters[bucket].totalG += px.g;
          clusters[bucket].totalB += px.b;
          clusters[bucket].totalS += px.s;
          clusters[bucket].totalL += px.l;
        }

        // Sort clusters by pixel count (most dominant first)
        const sortedClusters = Object.values(clusters)
          .filter(c => c.count > 10) // ignore noise
          .sort((a, b) => b.count - a.count);

        if (sortedClusters.length === 0) {
          setIsExtracting(false);
          return;
        }

        // Get top 4 distinct clusters (ensure hue separation of at least 25°)
        const distinctClusters: HueCluster[] = [];
        for (const cluster of sortedClusters) {
          const avgHue = cluster.hue + 15; // center of bucket
          const isDuplicate = distinctClusters.some(dc => {
            const dcHue = dc.hue + 15;
            const diff = Math.abs(avgHue - dcHue);
            return Math.min(diff, 360 - diff) < 25;
          });
          if (!isDuplicate) {
            distinctClusters.push(cluster);
          }
          if (distinctClusters.length >= 4) break;
        }

        // Convert clusters to average colors
        const extractedColors = distinctClusters.map(c => {
          const avgR = Math.round(c.totalR / c.count);
          const avgG = Math.round(c.totalG / c.count);
          const avgB = Math.round(c.totalB / c.count);
          const avgS = c.totalS / c.count;
          const avgL = c.totalL / c.count;
          return { hex: rgbToHex(avgR, avgG, avgB), s: avgS, l: avgL, count: c.count };
        });

        // Smart label assignment:
        // Sort by saturation descending → most vibrant = Primary, second = Accent
        const bySaturation = [...extractedColors].sort((a, b) => b.s - a.s);
        // Sort by lightness → lightest = Background, darkest = Text
        const byLightness = [...extractedColors].sort((a, b) => b.l - a.l);

        const primary = bySaturation[0]?.hex || '#D4121A';
        const accent = bySaturation[1]?.hex || bySaturation[0]?.hex || '#FAA000';
        
        // For background: pick lightest, but if it's the same as primary/accent, use white
        let background = byLightness[0]?.hex || '#FFFFFF';
        if (background === primary || background === accent) background = '#FFFFFF';
        
        // For text: pick darkest, but if it's same as primary/accent, use default dark
        let text = byLightness[byLightness.length - 1]?.hex || '#1C1008';
        if (text === primary || text === accent) text = '#1C1008';

        setColors([
          { hex: primary, label: 'Primary' },
          { hex: background, label: 'Background' },
          { hex: text, label: 'Text' },
          { hex: accent, label: 'Accent' },
        ]);
        setIsExtracting(false);
      }, 800);
    };
    img.src = url;
  };

  const removeColor = (idx: number) => {
    setColors(c => c.filter((_, i) => i !== idx));
  };

  // Derived helpers
  const primary = colors.find(c => c.label === 'Primary')?.hex || '#7C3AED';
  const bgColor = colors.find(c => c.label === 'Background')?.hex || '#F5E9C8';
  const accent = colors.find(c => c.label === 'Accent')?.hex || '#FAA000';
  const textColor = colors.find(c => c.label === 'Text')?.hex || '#1C1008';
  const fontFamily = selectedFont === 'playfair' ? 'Playfair Display' : selectedFont === 'outfit' ? 'Outfit' : 'Custom';

  return (
    <div style={{ background: '#F8F7FF', minHeight: '100%', padding: '32px 36px' }}>

      {/* ── Header ───────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9E8FC8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Brain size={11} /> ENGINE CATEGORY F
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1E1040', margin: 0, lineHeight: 1.2 }}>
            Brand Intelligence Engine
          </h1>
          <p style={{ fontSize: 14, color: '#7C3AED', margin: '6px 0 0', fontWeight: 500 }}>
            Upload once — AI automatically forces consistent typography hierarchy, logo positions and raw hex values.
          </p>
        </div>
        <button className="btn-primary" style={{ flexShrink: 0 }}>
          Menu &amp; Post Studio <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Two Column Layout ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── LEFT COLUMN ─────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 1 · Logo */}
          <div className="card">
            <div className="section-label">1 · Logo Configuration</div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

            {isExtracting ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '24px', border: '1px solid #EDE9FE', borderRadius: 12, background: '#F8F7FF' }}>
                <Loader2 size={24} className="animate-spin text-purple-600" />
                <div style={{ fontWeight: 600, fontSize: 13, color: '#7C3AED' }}>AI Extracting Brand Colors...</div>
              </div>
            ) : logoUploaded ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', border: '1px solid #EDE9FE', borderRadius: 12, background: '#F8F7FF' }}>
                {/* Logo preview */}
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'contain', flexShrink: 0, background: 'white', border: '1px solid #EDE9FE' }} />
                ) : (
                  <div style={{
                    width: 48, height: 48, borderRadius: 10,
                    background: `linear-gradient(135deg, ${primary}, ${primary}99)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 900, fontSize: 22, flexShrink: 0
                  }}>{restaurantName.charAt(0)}</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1E1040' }}>{restaurantName} · Restaurant</div>
                  <div style={{ fontSize: 11, color: '#9E8FC8', marginTop: 2 }}>Auto-extracted colors applied</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 12px', borderRadius: 999,
                    background: '#DCFCE7', color: '#166534',
                    fontSize: 11, fontWeight: 700
                  }}>
                    <Check size={12} /> Uploaded
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLogoUrl(null);
                      setLogoUploaded(false);
                      if (logoInputRef.current) logoInputRef.current.value = '';
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 8,
                      background: '#FEE2E2', color: '#991B1B',
                      fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer'
                    }}
                  >
                    <X size={12} /> Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="upload-zone" onClick={() => logoInputRef.current?.click()}>
                <Upload size={28} color="#7C3AED" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1E1040', marginBottom: 4 }}>Upload your logo</div>
                <div style={{ fontSize: 12, color: '#9E8FC8' }}>PNG with transparent background · AI extracts colors instantly</div>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9E8FC8', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Restaurant / Brand Name
              </label>
              <input
                type="text"
                value={restaurantName}
                onChange={e => {
                  setRestaurantName(e.target.value);
                  setRestaurantNameLive(e.target.value);
                  setSaved(false);
                }}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid #EDE9FE', fontSize: 13,
                  color: '#1E1040', outline: 'none'
                }}
              />
            </div>

            <p style={{ fontSize: 12, color: '#9E8FC8', marginTop: 12, lineHeight: 1.6 }}>
              AI extracts: dominant color palettes, structural typography styles, visual diner mood, and layout alignments automatically.
            </p>
          </div>

          {/* 2 · Brand Colors */}
          <div className="card">
            <div className="section-label">2 · Integrated Brand Colors</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {colors.map((c, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ position: 'relative' }}>
                    <div
                      className="color-swatch"
                      style={{ background: c.hex }}
                      title={c.hex}
                    />
                    <button
                      onClick={() => removeColor(i)}
                      style={{
                        position: 'absolute', top: -6, right: -6,
                        width: 16, height: 16, borderRadius: '50%',
                        background: '#EF4444', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 9
                      }}
                    ><X size={9} /></button>
                  </div>
                  <span style={{ fontSize: 9, color: '#9E8FC8', fontWeight: 600 }}>{c.label}</span>
                </div>
              ))}

              {/* Add color */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  style={{
                    width: 48, height: 48, borderRadius: 10,
                    border: '2px dashed #C4B5FD', background: '#F5F3FF',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <Plus size={18} color="#7C3AED" />
                </button>
                <span style={{ fontSize: 9, color: '#9E8FC8', fontWeight: 600 }}>Add</span>
              </div>
            </div>

            {showColorPicker && (
              <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={newColorInput || '#000000'}
                  onChange={e => setNewColorInput(e.target.value)}
                  style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid #EDE9FE', cursor: 'pointer', padding: 2 }}
                />
                <input
                  type="text"
                  placeholder="#HEX"
                  value={newColorInput}
                  onChange={e => setNewColorInput(e.target.value)}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 8,
                    border: '1px solid #EDE9FE', fontSize: 13,
                    color: '#1E1040', outline: 'none', fontFamily: 'monospace'
                  }}
                />
                <button
                  className="btn-secondary"
                  style={{ padding: '10px 16px' }}
                  onClick={() => {
                    if (newColorInput) {
                      setColors(c => [...c, { hex: newColorInput, label: 'Custom' }]);
                      setNewColorInput('');
                      setShowColorPicker(false);
                    }
                  }}
                >Add</button>
              </div>
            )}

            <p style={{ fontSize: 12, color: '#9E8FC8', marginTop: 14, lineHeight: 1.6 }}>
              Every generated image, menu card, and social post uses exactly these colors — no deviation.
            </p>
          </div>

          {/* 3 · Typography */}
          <div className="card">
            <div className="section-label">3 · Typography</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TYPOGRAPHY_OPTIONS.map(opt => (
                <label
                  key={opt.id}
                  onClick={() => setSelectedFont(opt.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                    border: `2px solid ${selectedFont === opt.id ? '#7C3AED' : '#EDE9FE'}`,
                    background: selectedFont === opt.id ? '#F5F3FF' : 'white',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: opt.id === 'playfair' ? "'Playfair Display', serif" : opt.id === 'outfit' ? "'Outfit', sans-serif" : 'inherit',
                      fontSize: 18, fontWeight: 600, color: '#1E1040', lineHeight: 1.2
                    }}>
                      Aa {opt.heading}
                    </div>
                    <div style={{ fontSize: 11, color: '#9E8FC8', marginTop: 2 }}>
                      {opt.body}
                    </div>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: `2px solid ${selectedFont === opt.id ? '#7C3AED' : '#C4B5FD'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: selectedFont === opt.id ? '#7C3AED' : 'white',
                    flexShrink: 0,
                  }}>
                    {selectedFont === opt.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 4 · Visual Style */}
          <div className="card">
            <div className="section-label">4 · Visual Style</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {STYLE_OPTIONS.map(s => (
                <button
                  key={s.id}
                  className={`style-card ${selectedStyle === s.id ? 'selected' : ''}`}
                  onClick={() => setSelectedStyle(s.id)}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>



          {/* What AI generates */}
          <div className="card">
            <div className="section-label">What AI generates from your brand kit</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {GENERATES.map((g, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 14px', borderRadius: 10,
                    border: '1px solid #EDE9FE', background: '#F8F7FF',
                    fontSize: 12, fontWeight: 500, color: '#5B21B6',
                  }}
                >
                  <div style={{ color: '#7C3AED' }}>{g.icon}</div>
                  {g.label}
                </div>
              ))}
            </div>
          </div>

          {/* Brand Rules — dynamically generated from current state */}
          <div className="card">
            <div className="section-label">Brand rules AI enforces automatically</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                {
                  title: 'Only your approved colors used in every output',
                  desc: colors.map(c => `${c.label} ${c.hex}`).join(' · ') + ' — never substituted',
                },
                {
                  title: 'Typography hierarchy locked',
                  desc: `${fontFamily} for dish names · body font for descriptions and prices`,
                },
                {
                  title: 'Layout language consistent',
                  desc: `${selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)} aesthetic — same spacing, alignment, and corner style across all formats`,
                },
                {
                  title: 'Logo placement and sizing standardized',
                  desc: 'Auto-placed per format: top-left on cards, centered on posters',
                },
              ].map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '14px 16px', borderRadius: 10,
                    border: '1px solid #EDE9FE', background: '#F8F7FF',
                  }}
                >
                  <div style={{ marginTop: 2, flexShrink: 0 }}><CheckCircle2 size={15} className="text-purple-500" /></div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1E1040', marginBottom: 3 }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: '#9E8FC8', lineHeight: 1.5 }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save CTA */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="btn-primary"
              style={{ flex: 2, justifyContent: 'center', padding: '14px 24px', fontSize: 15 }}
              onClick={handleSave}
            >
              {saved ? (
                <><Check size={18} /> Brand kit saved!</>
              ) : (
                <><Eye size={18} /> Save brand kit · Start generating</>
              )}
            </button>
            <button
              className="btn-secondary"
              style={{ 
                flex: 1, justifyContent: 'center', padding: '14px 24px', fontSize: 15,
                background: '#EF4444', color: 'white', border: 'none', cursor: 'pointer'
              }}
              onClick={() => {
                sessionStorage.removeItem('brandKit');
                setLogoUrl(null);
                setLogoUploaded(false);
                setRestaurantName('');

                setColors([
                  { hex: '#D4121A', label: 'Primary' },
                  { hex: '#F5E9C8', label: 'Background' },
                  { hex: '#1C1008', label: 'Text' },
                  { hex: '#FAA000', label: 'Accent' },
                ]);
                setSelectedFont('playfair');
                setSelectedStyle('luxury');
                if (logoInputRef.current) logoInputRef.current.value = '';
                window.dispatchEvent(new CustomEvent('BRAND_KIT_UPDATED', { detail: null }));
              }}
            >
              Reset Kit
            </button>
          </div>

          {saved && (
            <div style={{
              padding: '14px 16px', borderRadius: 12,
              background: '#DCFCE7', border: '1px solid #BBF7D0',
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 13, fontWeight: 500, color: '#166534',
              animation: 'fadeUp 0.3s ease both',
            }}>
              <CheckCircle2 size={18} color="#16A34A" />
              Your brand kit is saved. AI will now apply these rules to every output automatically.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
