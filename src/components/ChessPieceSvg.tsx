import React from 'react';

export type PieceStyle = 'neo-grandmaster' | 'classic-staunton' | '3d-metallic' | 'minimalist';

interface ChessPieceSvgProps {
  color?: 'w' | 'b';
  type?: string; // 'p', 'n', 'b', 'r', 'q', 'k'
  piece?: { color: 'w' | 'b'; type: string };
  style?: PieceStyle;
  className?: string;
}

export const ChessPieceSvg: React.FC<ChessPieceSvgProps> = ({
  color: rawColor,
  type: rawType,
  piece,
  style = 'neo-grandmaster',
  className,
}) => {
  const color = rawColor || piece?.color || 'w';
  const type = rawType || piece?.type || 'p';
  const pType = (type || 'p').toLowerCase();
  const isWhite = color === 'w';

  return (
    <svg
      viewBox="0 0 45 45"
      className={className || 'w-full h-full object-contain filter drop-shadow-md'}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradients for Neo-Grandmaster Gold & Onyx */}
        <linearGradient id="whiteIvoryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#F5EFE0" />
          <stop offset="100%" stopColor="#E2D4B7" />
        </linearGradient>

        <linearGradient id="blackOnyxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#323531" />
          <stop offset="70%" stopColor="#181A18" />
          <stop offset="100%" stopColor="#0B0C0A" />
        </linearGradient>

        <linearGradient id="goldAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDF0A6" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#997A15" />
        </linearGradient>

        {/* 3D Metallic Brass & Silver Gradients */}
        <linearGradient id="brassGrad" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FFF2B2" />
          <stop offset="40%" stopColor="#E0B644" />
          <stop offset="80%" stopColor="#9C771C" />
          <stop offset="100%" stopColor="#5E4306" />
        </linearGradient>

        <linearGradient id="silverGrad" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#C8D0D8" />
          <stop offset="80%" stopColor="#788490" />
          <stop offset="100%" stopColor="#3A4450" />
        </linearGradient>

        {/* Filters */}
        <filter id="pieceShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* RENDER BASED ON PIECE STYLE */}

      {/* 1. NEO-GRANDMASTER STYLE (Default High-Definition Lux) */}
      {(style === 'neo-grandmaster' || style === '3d-metallic') && (
        <g filter="url(#pieceShadow)">
          {/* Pawn */}
          {pType === 'p' && (
            <g
              fill={isWhite ? 'url(#whiteIvoryGrad)' : 'url(#blackOnyxGrad)'}
              stroke={isWhite ? '#997A15' : '#D4AF37'}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M 22.5,9 C 20.01,9 18,11.01 18,13.5 C 18,14.15 18.14,14.78 18.39,15.34 C 16.27,16.52 14.84,18.79 14.84,21.38 C 14.84,23.13 15.42,24.74 16.41,26 C 14.48,27.14 13.06,29.13 12.81,31.5 L 32.19,31.5 C 31.94,29.13 30.52,27.14 28.59,26 C 29.58,24.74 30.16,23.13 30.16,21.38 C 30.16,18.79 28.73,16.52 26.61,15.34 C 26.86,14.78 27,14.15 27,13.5 C 27,11.01 24.99,9 22.5,9 z" />
              <path d="M 12,33.5 L 33,33.5" stroke={isWhite ? '#D4AF37' : '#FDF0A6'} strokeWidth="1" />
              <path d="M 11.5,36 C 11.5,36 22.5,36.5 33.5,36" stroke={isWhite ? '#997A15' : '#D4AF37'} />
              <path d="M 11.5,38.5 L 33.5,38.5" stroke={isWhite ? '#997A15' : '#D4AF37'} />
              {/* Gold Crown Accent Ring */}
              <circle cx="22.5" cy="13.5" r="2" fill="url(#goldAccentGrad)" stroke="none" />
            </g>
          )}

          {/* Knight */}
          {pType === 'n' && (
            <g
              fill={isWhite ? 'url(#whiteIvoryGrad)' : 'url(#blackOnyxGrad)'}
              stroke={isWhite ? '#997A15' : '#D4AF37'}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
              <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.84 6.84,29.81 6,28 C 6,26 7.23,24.5 10,24 C 12.77,23.5 17.5,23.5 20,21 C 21.17,19.83 22,10 22,10 C 22,10 18,11 14,15 C 9.922,19.08 8,24.5 8,30 C 8,33 9.5,38.5 12,39 L 15,39" />
              <circle cx="9.5" cy="25.5" r="1.2" fill="url(#goldAccentGrad)" stroke="none" />
              <path d="M 15,15.5 C 15,15.5 17.5,17.5 19,17.5 C 20.5,17.5 23,15.5 23,15.5" stroke="url(#goldAccentGrad)" strokeWidth="1.5" />
            </g>
          )}

          {/* Bishop */}
          {pType === 'b' && (
            <g
              fill={isWhite ? 'url(#whiteIvoryGrad)' : 'url(#blackOnyxGrad)'}
              stroke={isWhite ? '#997A15' : '#D4AF37'}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M 9,36 C 12.39,35.03 19.11,36.46 22.5,34 C 25.89,36.46 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 19.11,38.96 22.5,37.5 C 25.89,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z" />
              <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,28 29,26 C 27.5,23 23,20 22.5,15.5 C 22,20 17.5,23 16,26 C 15,28 14.5,30.5 15,32 z" />
              <circle cx="22.5" cy="8" r="2.5" fill="url(#goldAccentGrad)" stroke="none" />
              <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30" stroke={isWhite ? '#997A15' : '#FDF0A6'} />
              <path d="M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" stroke="url(#goldAccentGrad)" strokeWidth="1.5" />
            </g>
          )}

          {/* Rook */}
          {pType === 'r' && (
            <g
              fill={isWhite ? 'url(#whiteIvoryGrad)' : 'url(#blackOnyxGrad)'}
              stroke={isWhite ? '#997A15' : '#D4AF37'}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
              <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
              <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z" fill={isWhite ? '#FAF9F6' : '#222'} />
              <path d="M 12,14 L 33,14 L 31,32 L 14,32 L 12,14 z" />
              <line x1="14" y1="20" x2="31" y2="20" stroke="url(#goldAccentGrad)" strokeWidth="1.5" />
            </g>
          )}

          {/* Queen */}
          {pType === 'q' && (
            <g
              fill={isWhite ? 'url(#whiteIvoryGrad)' : 'url(#blackOnyxGrad)'}
              stroke={isWhite ? '#997A15' : '#D4AF37'}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="6" cy="12" r="2.5" fill="url(#goldAccentGrad)" stroke="none" />
              <circle cx="14" cy="9" r="2.5" fill="url(#goldAccentGrad)" stroke="none" />
              <circle cx="22.5" cy="7.5" r="3" fill="url(#goldAccentGrad)" stroke="none" />
              <circle cx="31" cy="9" r="2.5" fill="url(#goldAccentGrad)" stroke="none" />
              <circle cx="39" cy="12" r="2.5" fill="url(#goldAccentGrad)" stroke="none" />
              <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,21 L 22.5,10.5 L 14,21 L 6.5,13.5 L 9,26 z" />
              <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31.5 14,32 L 31,32 C 32.5,31.5 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26" />
              <path d="M 11,38.5 A 35,35 1 0 0 34,38.5" stroke="url(#goldAccentGrad)" strokeWidth="1.5" />
              <path d="M 11,34.5 A 35,35 1 0 0 34,34.5" />
            </g>
          )}

          {/* King */}
          {pType === 'k' && (
            <g
              fill={isWhite ? 'url(#whiteIvoryGrad)' : 'url(#blackOnyxGrad)'}
              stroke={isWhite ? '#997A15' : '#D4AF37'}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Grandmaster Cross on Crown */}
              <path d="M 22.5,11.5 L 22.5,5" stroke="url(#goldAccentGrad)" strokeWidth="2.2" />
              <path d="M 19.5,8 L 25.5,8" stroke="url(#goldAccentGrad)" strokeWidth="2.2" />
              <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 22.5,11.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
              <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 L 33.5,30 C 33.5,30 31.5,27 22.5,27 C 13.5,27 11.5,30 11.5,30 L 11.5,37" />
              <path d="M 11.5,30 C 17,27 28,27 33.5,30" stroke="url(#goldAccentGrad)" />
              <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" />
              <path d="M 11.5,37 C 17,34 28,34 33.5,37" stroke="url(#goldAccentGrad)" />
            </g>
          )}
        </g>
      )}

      {/* 2. CLASSIC STAUNTON & MINIMALIST STYLES */}
      {(style === 'classic-staunton' || style === 'minimalist') && (
        <g fill={isWhite ? '#FAF9F6' : '#121411'} stroke={isWhite ? '#121411' : '#FAF9F6'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {pType === 'p' && (
            <path d="M 22.5,9 C 20.01,9 18,11.01 18,13.5 C 18,14.15 18.14,14.78 18.39,15.34 C 16.27,16.52 14.84,18.79 14.84,21.38 C 14.84,23.13 15.42,24.74 16.41,26 C 14.48,27.14 13.06,29.13 12.81,31.5 L 32.19,31.5 C 31.94,29.13 30.52,27.14 28.59,26 C 29.58,24.74 30.16,23.13 30.16,21.38 C 30.16,18.79 28.73,16.52 26.61,15.34 C 26.86,14.78 27,14.15 27,13.5 C 27,11.01 24.99,9 22.5,9 z M 12,33.5 L 33,33.5 M 11.5,36 C 11.5,36 22.5,36.5 33.5,36 M 11.5,38.5 L 33.5,38.5" />
          )}
          {pType === 'n' && (
            <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18 M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.84 6.84,29.81 6,28 C 6,26 7.23,24.5 10,24 C 12.77,23.5 17.5,23.5 20,21 C 21.17,19.83 22,10 22,10 C 22,10 18,11 14,15 C 9.922,19.08 8,24.5 8,30 C 8,33 9.5,38.5 12,39 L 15,39" />
          )}
          {pType === 'b' && (
            <path d="M 9,36 C 12.39,35.03 19.11,36.46 22.5,34 C 25.89,36.46 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 19.11,38.96 22.5,37.5 C 25.89,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,28 29,26 C 27.5,23 23,20 22.5,15.5 C 22,20 17.5,23 16,26 C 15,28 14.5,30.5 15,32 z M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 Z M 17.5,26 L 27.5,26 M 15,30 L 30,30" />
          )}
          {pType === 'r' && (
            <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z M 12,14 L 33,14 L 31,32 L 14,32 L 12,14 z" />
          )}
          {pType === 'q' && (
            <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,21 L 22.5,10.5 L 14,21 L 6.5,13.5 L 9,26 z M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31.5 14,32 L 31,32 C 32.5,31.5 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 M 11,38.5 A 35,35 1 0 0 34,38.5 M 11,34.5 A 35,35 1 0 0 34,34.5" />
          )}
          {pType === 'k' && (
            <path d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8 M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 22.5,11.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 M 11.5,37 C 17,40.5 28,40.5 33.5,37 L 33.5,30 C 33.5,30 31.5,27 22.5,27 C 13.5,27 11.5,30 11.5,30 L 11.5,37 M 11.5,30 C 17,27 28,27 33.5,30 M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" />
          )}
        </g>
      )}
    </svg>
  );
};

