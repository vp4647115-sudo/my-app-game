import React from 'react';

interface ThreeChessBackgroundProps {
  lowPerformanceMode?: boolean;
}

export const ThreeChessBackground: React.FC<ThreeChessBackgroundProps> = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {/* High-resolution majestic luxury chess photography */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter brightness-[0.65] contrast-[1.25] saturate-[1.15] transform scale-105 transition-all duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=2000')`,
        }}
      />
      
      {/* Luxurious Deep Obsidian & Royal Gold Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D12]/92 via-[#140F0A]/82 to-[#0B0D12]/96 backdrop-blur-[2px]" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 30%, transparent 25%, #080A0E 90%)' }} />

      {/* Radiant Golden Champagne & Deep Amber Ambient Lighting */}
      <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-[#F5D061]/20 via-[#D4AF37]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-[700px] h-[500px] bg-gradient-to-t from-[#D4AF37]/15 via-[#996515]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[35%] -left-28 w-[600px] h-[400px] bg-gradient-to-r from-[#D4AF37]/12 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Elegant Fine Gold Grid & Subtle Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#F5D061_1px,transparent_1px),linear-gradient(to_bottom,#F5D061_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />
    </div>
  );
};

