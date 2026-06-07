import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  Brain,
  Video,
  ChevronRight,
  Zap,
  BarChart3,
  Database,
  RotateCcw,
  LogOut,
  Film,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

const navItems = [
  {
    path: '/brand',
    label: 'Brand Intelligence',
    icon: Brain,
    badge: '',
    description: 'Upload once · AI remembers forever',
  },
  {
    path: '/visual-creation',
    label: 'Visual Creation',
    icon: Sparkles,
    badge: 'M1',
    description: 'AI food photography engine',
  },
  {
    path: '/visual-intelligence',
    label: 'Visual Intelligence',
    icon: BarChart3,
    badge: 'M2',
    description: 'Visual score + business metrics',
  },
  {
    path: '/video-generation',
    label: 'Video Generation',
    icon: Video,
    badge: 'M3',
    description: 'Prompt-to-video engine',
  },
  {
    path: '/menu-studio',
    label: 'Media & Menu Studio',
    icon: Layers,
    badge: 'M4',
    description: 'AI Menu Card Generator',
  },
  {
    path: '/campaign-studio',
    label: 'AI Campaign Studio',
    icon: Zap,
    badge: 'M5',
    description: 'Social Media Creative Engine',
  },
  {
    path: '/db-inspector',
    label: 'Database Inspector',
    icon: Database,
    badge: 'Live',
    description: 'Verify GCS & Firestore saves',
  },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, restaurantName, activeDish, resetSession, logout } = useWorkspace();

  const currentNav = navItems.find(n => n.path === location.pathname) || navItems[0];

  return (
    <div className="app-shell">
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '28px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 34, height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Layers size={18} color="white" />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
                10xStudio.AI
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Creative Intelligence
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 20px 16px' }} />

        {/* Section label */}
        <div style={{ padding: '0 20px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
          Modules
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <div style={{
                  width: 32, height: 32,
                  borderRadius: 8,
                  background: isActive ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}>
                  <Icon size={16} color={isActive ? '#C4B5FD' : 'rgba(255,255,255,0.5)'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? 'white' : 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.description}
                  </div>
                </div>
                <span className="nav-badge">{item.badge}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '16px 20px' }} />
      </aside>

      {/* ── Main ─────────────────────────────────── */}
      <div className="main-content">
        {/* Top bar */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #EDE9FE',
          padding: '0 36px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9E8FC8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              MODULE
            </div>
            <ChevronRight size={12} color="#C4B5FD" />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1E1040' }}>
              {currentNav.label}
            </div>
          </div>

          {/* Active Context Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {restaurantName && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 9, color: '#9E8FC8', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Active Brand</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{restaurantName}</span>
              </div>
            )}
            {activeDish && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', borderLeft: '1px solid #E5E7EB', paddingLeft: 24 }}>
                <span style={{ fontSize: 9, color: '#9E8FC8', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Active Dish</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{activeDish.name}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {location.pathname !== '/brand' && (
            <button 
              onClick={resetSession}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                background: '#FFF5F5',
                border: '1px solid #FEB2B2',
                fontSize: 12,
                fontWeight: 600,
                color: '#C53030',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Reset current session progress"
            >
              <RotateCcw size={12} />
              Reset Session
            </button>
            )}

            {/* Avatar & Sign Out */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div 
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #5B21B6, #A855F7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: 13,
                }}
                title={user?.email}
              >
                {user?.avatar || 'U'}
              </div>
              <button
                onClick={logout}
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#6B7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                }}
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
