import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Layers, Sparkles, User, Mail, ArrowRight } from 'lucide-react';


export default function LoginPage() {
  const { login } = useWorkspace();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setIsLoading(true);
    // Mimic standard auth check but automatically load/create user session in Firebase
    await login(name, email);
    setIsLoading(false);
  };


  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Visual background lights */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">

        {/* Logo and Tagline */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl mb-4 backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Layers size={20} className="text-white" />
            </div>
            <span className="text-white font-bold tracking-widest text-lg font-mono">10xSTUDIO.AI</span>
          </div>
          <h2 className="text-white font-extrabold text-3xl tracking-tight leading-tight">
            Creative Intelligence Engine
          </h2>

        </div>

        {/* Login Card */}
        <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl shadow-purple-500/5">

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 flex items-center gap-2">
                <User size={12} className="text-purple-400" />
                Restaurant Manager Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 flex items-center gap-2">
                <Mail size={12} className="text-purple-400" />
                Business Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. manager@restaurant.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all placeholder:text-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !name || !email}
              className="w-full mt-3 py-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-purple-500/20"
            >
              <span>{isLoading ? 'Connecting cloud nodes...' : 'Initialize Creative Engine'}</span>
              <ArrowRight size={18} />
            </button>
          </form>



        </div>

      </div>
    </div>
  );
}
