import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import BrandIntelligencePage from './pages/BrandIntelligencePage';
import VisualCreationPage from './pages/VisualCreationPage';
import VisualIntelligencePage from './pages/VisualIntelligencePage';
import VideoGenerationPage from './pages/VideoGenerationPage';
import MenuStudioPage from './pages/MenuStudioPage';
import CampaignStudioPage from './pages/CampaignStudioPage';
import LoginPage from './pages/LoginPage';
import DBInspectorPage from './pages/DBInspectorPage';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';

function AppContent() {
  const { user, isSessionLoading } = useWorkspace();

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 font-sans">
        <div className="w-12 h-12 rounded-2xl border-4 border-t-purple-500 border-r-purple-500/30 border-b-purple-500/30 border-l-purple-500/30 animate-spin" />
        <div className="text-purple-400 font-mono text-xs uppercase tracking-widest animate-pulse">
          Fetching cloud credentials...
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Routes>
        {/* Default redirect to Brand Intelligence */}
        <Route path="/" element={<Navigate to="/brand" replace />} />
        <Route path="/brand" element={<BrandIntelligencePage />} />
        <Route path="/visual-creation" element={<VisualCreationPage />} />
        <Route path="/visual-intelligence" element={<VisualIntelligencePage />} />
        <Route path="/video-generation" element={<VideoGenerationPage />} />
        <Route path="/menu-studio" element={<MenuStudioPage />} />
        <Route path="/campaign-studio" element={<CampaignStudioPage />} />
        <Route path="/db-inspector" element={<DBInspectorPage />} />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/brand" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <WorkspaceProvider>
        <AppContent />
      </WorkspaceProvider>
    </BrowserRouter>
  );
}

