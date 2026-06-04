import React from 'react';
import { Sparkles, Camera, Layers, Maximize, Layout as LayoutIcon } from 'lucide-react';
import VisualAutomation from '../components/VisualAutomation';

const features = [
  { icon: <Sparkles size={18} />, label: 'Background Removal', sub: 'rembg · U2-Net' },
  { icon: <Layers size={18} />, label: 'Spectral Enhancement', sub: 'Pillow Contrast/Sharpness' },
  { icon: <Maximize size={18} />, label: 'Angle Synthesis', sub: 'Replicate API (SD)' },
  { icon: <LayoutIcon size={18} />, label: 'Branding Overlay', sub: 'Dynamic Watermarking' },
];

export default function VisualCreationPage() {
  return (
    <div style={{ background: '#FAFAFA', minHeight: '100%', color: '#1a1a2e' }}>

      {/* ── Page intro banner ─────────────────────── */}
      <div style={{
        padding: '40px 36px 32px',
        borderBottom: '1px solid #E5E7EB',
        background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', maxWidth: 1200 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '4px 14px', borderRadius: 999,
              background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
              fontSize: 10, fontWeight: 700, color: '#7C3AED',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16
            }}>
              <Camera size={10} /> MODULE 01 · VISUAL CREATION LAYER
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.2, color: '#1a1a2e' }}>
              Not just design.{' '}
              <span style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Pure Production.
              </span>
            </h1>
            <p style={{ fontSize: 15, color: '#6B7280', margin: 0, maxWidth: 540, lineHeight: 1.6 }}>
              Transform a single cell-phone photo into a multi-angle pro-grade content library.
              Our engine handles isolation, lighting, and variations automatically.
            </p>
          </div>

          {/* Feature chips */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flexShrink: 0, marginLeft: 40 }}>
            {features.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10,
                background: 'white', border: '1px solid #E5E7EB',
                color: '#374151', fontSize: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}>
                <div style={{ color: '#7C3AED', flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{f.label}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Existing module ───────────── */}
      <VisualAutomation />
    </div>
  );
}
