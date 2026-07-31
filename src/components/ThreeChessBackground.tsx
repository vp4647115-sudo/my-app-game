import React from 'react';

interface ThreeChessBackgroundProps {
  lowPerformanceMode?: boolean;
}

export const ThreeChessBackground: React.FC<ThreeChessBackgroundProps> = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* High-resolution majestic chess board photography */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter brightness-90 contrast-110 saturate-105 transform scale-110 transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=2000')`,
        }}
      />
      
      {/* Luxurious Deep Mahogany & Royal Amber Gradient Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#140D09]/95 via-[#1D130E]/80 to-[#120B08]/85 backdrop-blur-[2px]" />
      
      {/* Radiant Golden & Warm Amber Ambient Glow Highlights */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-[#D4AF37]/35 via-[#D4AF37]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[400px] bg-gradient-to-t from-[#C59B27]/25 via-[#996515]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[30%] left-[-10%] w-[400px] h-[300px] bg-gradient-to-r from-[#D4AF37]/20 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Subtle Cinematic Light Rays / Dust Specks Overlay for Premium Grandmaster Feel */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
    </div>
  );
};
