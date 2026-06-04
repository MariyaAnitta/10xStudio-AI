import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Play, CheckCircle2, Workflow, MessageSquare, Zap, BarChart3, Globe2, Sparkles } from 'lucide-react';

export function Navigation() {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-brand-dark/40 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-2xl tracking-tighter">10xStudio.AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#problem" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Problem</a>
          <a href="#solution" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Solution</a>
          <a href="#demo" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Demo</a>
          <a href="#use-cases" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Use Cases</a>
        </div>
        <button className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors">
          Book a Demo
        </button>
      </div>
    </nav>
  );
}

export function Hero() {
  return (
    <section className="relative pt-48 pb-32 px-6 overflow-hidden min-h-screen flex items-center">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/hero_background_1777550471556.png" 
          className="w-full h-full object-cover opacity-40 mix-blend-screen"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark via-transparent to-brand-dark" />
      </div>
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-brand-blue/10 blur-[120px] rounded-full opacity-30 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue text-xs font-semibold tracking-widest uppercase mb-8"
        >
          <Zap className="w-3 h-3" />
          The future of content is here
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-8xl font-display font-medium tracking-tight mb-8 leading-[0.95]"
        >
          Content. Video. Campaigns. <br />
          <span className="text-gradient">Generated, not created.</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-gray-400 text-xl md:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          10xStudio.AI — The Digital Workforce for Content & Video Generation. Automatically generated via the 10xFrame Engine.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a href="#demo" className="w-full sm:w-auto px-10 py-5 bg-brand-blue text-white rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-brand-blue/90 transition-all hover:scale-105 active:scale-95 group shadow-[0_0_30px_rgba(0,112,255,0.3)]">
            Create Your First Video
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <button className="w-full sm:w-auto px-10 py-5 bg-white/5 text-white rounded-full font-bold text-lg border border-white/10 hover:bg-white/10 transition-all">
            Book a Demo
          </button>
        </motion.div>
      </div>
    </section>
  );
}

export function ProblemSection() {
  const problems = [
    { title: "Campaigns take days", desc: "Coordinating scripts, visuals, and approvals is a bottleneck." },
    { title: "Videos require teams", desc: "High production costs for every single asset you need." },
    { title: "Updates don't scale", desc: "Changing one offer means remaking a dozen videos manually." },
  ];

  return (
    <section id="problem" className="py-24 px-6 border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-4xl font-display font-medium mb-6">Every business needs content.</h2>
            <p className="text-gray-400 text-xl mb-8 leading-relaxed">
              But content creation is slow, manual, and expensive. Keeping up with the digital demand is a losing battle without automation.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {problems.map((p, i) => (
              <div key={i} className="p-8 bg-brand-card rounded-2xl border border-white/5 flex items-start gap-6 hover:border-brand-blue/30 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-brand-blue/10 transition-colors">
                  <span className="text-2xl font-display font-bold text-gray-500 group-hover:text-brand-blue">{i+1}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{p.title}</h3>
                  <p className="text-gray-500">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SolutionSection() {
  return (
    <section id="solution" className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-medium mb-6">
            Meet your <span className="text-gradient">Digital Workforce</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            10xStudio.AI turns content creation into a seamless business function.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <Globe2 />, label: "Input", text: "Website, product, or a simple idea" },
            { icon: <Sparkles />, label: "Process", text: "AI generates script, visuals, & voice" },
            { icon: <Workflow />, label: "Engine", text: "10xFrame Engine renders code to MP4" },
            { icon: <CheckCircle2 />, label: "Output", text: "Ready-to-use content in minutes" },
          ].map((step, i) => (
            <div key={i} className="p-8 bg-brand-card rounded-3xl border border-white/5 relative group hover:bg-brand-card/80 transition-all">
              <div className="w-14 h-14 bg-brand-blue/10 rounded-2xl flex items-center justify-center text-brand-blue mb-6 group-hover:scale-110 transition-transform">
                {step.icon}
              </div>
              <div className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-2">Step {i+1}: {step.label}</div>
              <p className="text-gray-300 font-medium">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function UseCasesSection() {
  const cases = [
    { title: "Banking", text: "Product explainer videos generated instantly" },
    { title: "Healthcare", text: "Patient education videos at scale" },
    { title: "Restaurants", text: "Daily menu & offer videos auto-created" },
    { title: "Retail / Auto", text: "Personalized customer videos per lead" },
    { title: "Enterprise", text: "Training & SOP videos generated from docs" },
  ];

  return (
    <section id="use-cases" className="py-24 px-6 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-display font-medium mb-12">Built for every industry.</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c, i) => (
            <div key={i} className="p-8 bg-brand-card rounded-2xl border border-white/5 hover:border-white/20 transition-all cursor-default">
              <h3 className="text-brand-blue font-mono text-sm uppercase tracking-widest mb-4">{c.title}</h3>
              <p className="text-xl text-white font-medium">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Why10xDSSection() {
  return (
    <section className="py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto bg-gradient-to-br from-brand-blue/20 to-brand-violet/20 rounded-[40px] p-8 md:p-20 border border-brand-blue/20 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-violet/30 blur-[100px] pointer-events-none" />
        
        <div className="max-w-2xl relative">
          <h2 className="text-4xl font-display font-medium mb-8">Integrated. Automated. <span className="text-brand-blue">Always-on.</span></h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-brand-blue flex items-center justify-center text-white"><CheckCircle2 className="w-4 h-4" /></div>
              <p className="text-gray-300">Integrated with your existing CRM stack</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-brand-blue flex items-center justify-center text-white"><CheckCircle2 className="w-4 h-4" /></div>
              <p className="text-gray-300">Native WhatsApp automation support</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-brand-blue flex items-center justify-center text-white"><CheckCircle2 className="w-4 h-4" /></div>
              <p className="text-gray-300">Connected to your digital workforce workflows</p>
            </div>
          </div>
          
          <button className="mt-12 px-8 py-4 bg-white text-black font-bold rounded-xl flex items-center gap-3 hover:bg-gray-200 transition-all">
            Launch Your AI Content Engine
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="py-24 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-lg tracking-tighter">10xStudio.AI</span>
        </div>
        <div className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} 10xStudio.AI — Powered by the 10xFrame Engine
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-gray-500 hover:text-white transition-colors">Twitter</a>
          <a href="#" className="text-gray-500 hover:text-white transition-colors">LinkedIn</a>
          <a href="#" className="text-gray-500 hover:text-white transition-colors">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
