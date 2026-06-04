import React from 'react';
import MenuStudio from '../components/MenuStudio';

export default function MenuStudioPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-50/50 to-transparent pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-100/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/30 blur-[100px] pointer-events-none" />
      
      {/* Main Content Area */}
      <div className="relative z-10 w-full h-full max-w-[1600px] mx-auto">
        <MenuStudio />
      </div>
    </div>
  );
}
