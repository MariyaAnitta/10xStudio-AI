import React from 'react';
import { Video, Cpu, Download, Maximize2 } from 'lucide-react';
import StudioEngine from '../components/EngineDemo';

const capabilities = [
  { icon: <Cpu size={16} />, label: '10xFrame Engine', sub: 'Neural composition' },
  { icon: <Video size={16} />, label: 'Prompt-to-MP4', sub: 'Cinematic rendering' },
  { icon: <Download size={16} />, label: 'Export Ready', sub: 'MP4 · Web · Social' },
  { icon: <Maximize2 size={16} />, label: 'Full HD Output', sub: '1080p · Aspect ratio' },
];

export default function VideoGenerationPage() {
  return (
    <div style={{ background: '#FAFAFA', minHeight: '100%', color: '#1a1a2e' }}>

      {/* ── Page intro banner ─────────────────────── */}
      <div style={{
        padding: '40px 36px 32px',
        borderBottom: '1px solid #E5E7EB',
        background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
      }}>
        <div style={{ maxWidth: 1200 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '4px 14px', borderRadius: 999,
            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
            fontSize: 10, fontWeight: 700, color: '#7C3AED',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16
          }}>
            <Video size={10} /> MODULE 03 · VIDEO GENERATION ENGINE
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 40 }}>
            <div>
              <h1 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.2, color: '#1a1a2e' }}>
                Content. Video. Campaigns.{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                  Generated, not created.
                </span>
              </h1>
              <p style={{ fontSize: 15, color: '#6B7280', margin: 0, maxWidth: 520, lineHeight: 1.6 }}>
                Describe your cinematic vision. The 10xFrame Neural Engine composes,
                renders, and exports production-ready video content automatically.
              </p>
            </div>

            {/* Capability chips */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flexShrink: 0 }}>
              {capabilities.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10,
                  background: 'white', border: '1px solid #E5E7EB',
                  fontSize: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}>
                  <div style={{ color: '#7C3AED', flexShrink: 0 }}>{c.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12, color: '#374151' }}>{c.label}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Existing module ───────────── */}
      <div style={{ padding: '32px 24px' }}>
        <StudioEngine />
      </div>
    </div>
  );
}
