import React from 'react';

interface ChessPieceSvgProps {
  color: 'w' | 'b';
  type: string; // 'p', 'n', 'b', 'r', 'q', 'k'
  className?: string;
}

export const ChessPieceSvg: React.FC<ChessPieceSvgProps> = ({ color, type, className }) => {
  const pType = type.toLowerCase();
  const key = `${color}${pType}`;

  return (
    <svg
      viewBox="0 0 45 45"
      className={className || 'w-full h-full object-contain'}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* White Pawn */}
      {key === 'wp' && (
        <g fill="#FAF9F6" fillRule="evenodd" stroke="#121411" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 22.5,9 C 20.01,9 18,11.01 18,13.5 C 18,14.15 18.14,14.78 18.39,15.34 C 16.27,16.52 14.84,18.79 14.84,21.38 C 14.84,23.13 15.42,24.74 16.41,26 C 14.48,27.14 13.06,29.13 12.81,31.5 L 32.19,31.5 C 31.94,29.13 30.52,27.14 28.59,26 C 29.58,24.74 30.16,23.13 30.16,21.38 C 30.16,18.79 28.73,16.52 26.61,15.34 C 26.86,14.78 27,14.15 27,13.5 C 27,11.01 24.99,9 22.5,9 z" />
          <path d="M 12,33.5 L 33,33.5" />
          <path d="M 11.5,36 C 11.5,36 22.5,36.5 33.5,36" />
          <path d="M 11.5,38.5 L 33.5,38.5" />
        </g>
      )}

      {/* Black Pawn */}
      {key === 'bp' && (
        <g fill="#1a1a1a" fillRule="evenodd" stroke="#FAF9F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 22.5,9 C 20.01,9 18,11.01 18,13.5 C 18,14.15 18.14,14.78 18.39,15.34 C 16.27,16.52 14.84,18.79 14.84,21.38 C 14.84,23.13 15.42,24.74 16.41,26 C 14.48,27.14 13.06,29.13 12.81,31.5 L 32.19,31.5 C 31.94,29.13 30.52,27.14 28.59,26 C 29.58,24.74 30.16,23.13 30.16,21.38 C 30.16,18.79 28.73,16.52 26.61,15.34 C 26.86,14.78 27,14.15 27,13.5 C 27,11.01 24.99,9 22.5,9 z" />
          <path d="M 12,33.5 L 33,33.5" stroke="#FAF9F6" />
          <path d="M 11.5,36 C 11.5,36 22.5,36.5 33.5,36" stroke="#FAF9F6" />
          <path d="M 11.5,38.5 L 33.5,38.5" stroke="#FAF9F6" />
        </g>
      )}

      {/* White Knight */}
      {key === 'wn' && (
        <g fill="none" fillRule="evenodd" stroke="#121411" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" fill="#FAF9F6" stroke="#121411" />
          <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.84 6.84,29.81 6,28 C 6,26 7.23,24.5 10,24 C 12.77,23.5 17.5,23.5 20,21 C 21.17,19.83 22,10 22,10 C 22,10 18,11 14,15 C 9.922,19.08 8,24.5 8,30 C 8,33 9.5,38.5 12,39 L 15,39" fill="#FAF9F6" stroke="#121411" />
          <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 Z" fill="#121411" stroke="#121411" />
          <path d="M 15 15.5 C 15 15.5 17.5 17.5 19 17.5 C 20.5 17.5 23 15.5 23 15.5" fill="none" stroke="#121411" />
        </g>
      )}

      {/* Black Knight */}
      {key === 'bn' && (
        <g fill="none" fillRule="evenodd" stroke="#FAF9F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" fill="#1a1a1a" stroke="#FAF9F6" />
          <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.84 6.84,29.81 6,28 C 6,26 7.23,24.5 10,24 C 12.77,23.5 17.5,23.5 20,21 C 21.17,19.83 22,10 22,10 C 22,10 18,11 14,15 C 9.922,19.08 8,24.5 8,30 C 8,33 9.5,38.5 12,39 L 15,39" fill="#1a1a1a" stroke="#FAF9F6" />
          <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 Z" fill="#D4AF37" stroke="#D4AF37" />
          <path d="M 15 15.5 C 15 15.5 17.5 17.5 19 17.5 C 20.5 17.5 23 15.5 23 15.5" fill="none" stroke="#FAF9F6" />
        </g>
      )}

      {/* White Bishop */}
      {key === 'wb' && (
        <g fill="none" fillRule="evenodd" stroke="#121411" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <g fill="#FAF9F6" stroke="#121411" strokeLinecap="butt">
            <path d="M 9,36 C 12.39,35.03 19.11,36.46 22.5,34 C 25.89,36.46 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 19.11,38.96 22.5,37.5 C 25.89,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z" />
            <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,28 29,26 C 27.5,23 23,20 22.5,15.5 C 22,20 17.5,23 16,26 C 15,28 14.5,30.5 15,32 z" />
            <path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 Z" />
          </g>
          <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" stroke="#121411" />
        </g>
      )}

      {/* Black Bishop */}
      {key === 'bb' && (
        <g fill="none" fillRule="evenodd" stroke="#FAF9F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <g fill="#1a1a1a" stroke="#FAF9F6" strokeLinecap="butt">
            <path d="M 9,36 C 12.39,35.03 19.11,36.46 22.5,34 C 25.89,36.46 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 19.11,38.96 22.5,37.5 C 25.89,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z" />
            <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,28 29,26 C 27.5,23 23,20 22.5,15.5 C 22,20 17.5,23 16,26 C 15,28 14.5,30.5 15,32 z" />
            <path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 Z" />
          </g>
          <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" stroke="#FAF9F6" />
        </g>
      )}

      {/* White Rook */}
      {key === 'wr' && (
        <g fill="#FAF9F6" fillRule="evenodd" stroke="#121411" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" strokeLinecap="butt" />
          <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" strokeLinecap="butt" />
          <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z" strokeLinecap="butt" />
          <path d="M 12,14 L 33,14 L 31,32 L 14,32 L 12,14 z" />
        </g>
      )}

      {/* Black Rook */}
      {key === 'br' && (
        <g fill="#1a1a1a" fillRule="evenodd" stroke="#FAF9F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" strokeLinecap="butt" />
          <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" strokeLinecap="butt" stroke="#FAF9F6" />
          <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z" strokeLinecap="butt" stroke="#FAF9F6" />
          <path d="M 12,14 L 33,14 L 31,32 L 14,32 L 12,14 z" stroke="#FAF9F6" />
        </g>
      )}

      {/* White Queen */}
      {key === 'wq' && (
        <g fill="#FAF9F6" fillRule="evenodd" stroke="#121411" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="12" r="2.75" />
          <circle cx="14" cy="9" r="2.75" />
          <circle cx="22.5" cy="8" r="2.75" />
          <circle cx="31" cy="9" r="2.75" />
          <circle cx="39" cy="12" r="2.75" />
          <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,21 L 22.5,10.5 L 14,21 L 6.5,13.5 L 9,26 z" strokeLinecap="butt" />
          <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31.5 14,32 L 31,32 C 32.5,31.5 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26" />
          <path d="M 11,38.5 A 35,35 1 0 0 34,38.5" />
          <path d="M 11,34.5 A 35,35 1 0 0 34,34.5" />
          <path d="M 11,30.5 A 35,35 1 0 0 34,30.5" />
        </g>
      )}

      {/* Black Queen */}
      {key === 'bq' && (
        <g fill="#1a1a1a" fillRule="evenodd" stroke="#FAF9F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="12" r="2.75" fill="#1a1a1a" stroke="#FAF9F6" />
          <circle cx="14" cy="9" r="2.75" fill="#1a1a1a" stroke="#FAF9F6" />
          <circle cx="22.5" cy="8" r="2.75" fill="#1a1a1a" stroke="#FAF9F6" />
          <circle cx="31" cy="9" r="2.75" fill="#1a1a1a" stroke="#FAF9F6" />
          <circle cx="39" cy="12" r="2.75" fill="#1a1a1a" stroke="#FAF9F6" />
          <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,21 L 22.5,10.5 L 14,21 L 6.5,13.5 L 9,26 z" strokeLinecap="butt" />
          <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31.5 14,32 L 31,32 C 32.5,31.5 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26" stroke="#FAF9F6" />
          <path d="M 11,38.5 A 35,35 1 0 0 34,38.5" stroke="#FAF9F6" />
          <path d="M 11,34.5 A 35,35 1 0 0 34,34.5" stroke="#FAF9F6" />
          <path d="M 11,30.5 A 35,35 1 0 0 34,30.5" stroke="#FAF9F6" />
        </g>
      )}

      {/* White King */}
      {key === 'wk' && (
        <g fill="none" fillRule="evenodd" stroke="#121411" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 22.5,11.63 L 22.5,6" strokeLinecap="butt" />
          <path d="M 20,8 L 25,8" />
          <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 22.5,11.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" fill="#FAF9F6" strokeLinecap="butt" />
          <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 L 33.5,30 C 33.5,30 31.5,27 22.5,27 C 13.5,27 11.5,30 11.5,30 L 11.5,37" fill="#FAF9F6" />
          <path d="M 11.5,30 C 17,27 28,27 33.5,30" />
          <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" />
          <path d="M 11.5,37 C 17,34 28,34 33.5,37" />
        </g>
      )}

      {/* Black King */}
      {key === 'bk' && (
        <g fill="none" fillRule="evenodd" stroke="#FAF9F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 22.5,11.63 L 22.5,6" stroke="#FAF9F6" strokeLinecap="butt" />
          <path d="M 20,8 L 25,8" stroke="#FAF9F6" />
          <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 22.5,11.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" fill="#1a1a1a" stroke="#FAF9F6" strokeLinecap="butt" />
          <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 L 33.5,30 C 33.5,30 31.5,27 22.5,27 C 13.5,27 11.5,30 11.5,30 L 11.5,37" fill="#1a1a1a" stroke="#FAF9F6" />
          <path d="M 11.5,30 C 17,27 28,27 33.5,30" stroke="#FAF9F6" />
          <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" stroke="#FAF9F6" />
          <path d="M 11.5,37 C 17,34 28,34 33.5,37" stroke="#FAF9F6" />
        </g>
      )}
    </svg>
  );
};

