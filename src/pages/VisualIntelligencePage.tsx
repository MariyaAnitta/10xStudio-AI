import React from 'react';
import { BarChart3, ShieldCheck, TrendingUp, Eye } from 'lucide-react';
import VisualIntelligence from '../components/VisualIntelligence';

const stats = [
  { icon: <TrendingUp size={16} />, label: 'Visual Score', value: '9.2 / 10' },
  { icon: <Eye size={16} />, label: 'Avg Views', value: '5,000+' },
  { icon: <BarChart3 size={16} />, label: 'Revenue Impact', value: '+28%' },
  { icon: <ShieldCheck size={16} />, label: 'Insights Generated', value: '6 / dish' },
];

export default function VisualIntelligencePage() {
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
            <ShieldCheck size={10} /> MODULE 02 · VISUAL INTELLIGENCE LAYER
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 40 }}>
            <div>
              <h1 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.2, color: '#1a1a2e' }}>
                Connecting Design to{' '}
                <span style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Decisions.
                </span>
              </h1>
              <p style={{ fontSize: 15, color: '#6B7280', margin: 0, maxWidth: 540, lineHeight: 1.6 }}>
                Upload a menu item photo and adjust its business performance metrics to surface
                actionable AI-driven insights that directly impact revenue.
              </p>
            </div>

            {/* Stat chips */}
            <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
              {stats.map((s, i) => (
                <div key={i} style={{
                  padding: '14px 18px', borderRadius: 12,
                  background: 'white', border: '1px solid #E5E7EB',
                  textAlign: 'center', minWidth: 90,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}>
                  <div style={{ color: '#7C3AED', display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Existing module ───────────── */}
      <VisualIntelligence />
    </div>
  );
}
