import React from 'react';
import { 
  Navigation, 
  Hero, 
  ProblemSection, 
  SolutionSection, 
  UseCasesSection, 
  Why10xDSSection, 
  Footer 
} from './components/Sections';
import StudioEngine from './components/EngineDemo';
import VisualAutomation from './components/VisualAutomation';
import VisualIntelligence from './components/VisualIntelligence';

export default function App() {
  return (
    <div className="min-h-screen bg-brand-dark text-white selection:bg-brand-blue/30 overflow-x-hidden">
      <Navigation />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <VisualAutomation />
        <VisualIntelligence />
        <StudioEngine />
        <UseCasesSection />
        <Why10xDSSection />
      </main>
      <Footer />
    </div>
  );
}
