import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeChessBackgroundProps {
  lowPerformanceMode?: boolean;
}

export const ThreeChessBackground: React.FC<ThreeChessBackgroundProps> = ({ lowPerformanceMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lowPerformanceMode) return;
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer;

    const setupScene = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x10121a);

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);

      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);
      } catch (err) {
        console.warn('WebGL context unavailable for 3D background:', err);
        return;
      }

      // Bright Studio & Gold Rim Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambientLight);

      // Bright Key Directional Light
      const keyLight = new THREE.DirectionalLight(0xfff8ea, 3.2);
      keyLight.position.set(8, 16, 10);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0003;
      scene.add(keyLight);

      // Soft Blue Fill Light (Brightens shadow side of pieces)
      const fillLight = new THREE.DirectionalLight(0x8bc2ff, 1.4);
      fillLight.position.set(-8, 10, -6);
      scene.add(fillLight);

      // Vivid Gold Rim Light
      const goldRim = new THREE.PointLight(0xffd700, 4.0, 30);
      goldRim.position.set(6, 8, -6);
      scene.add(goldRim);

      // Materials:
      // Polished Pearl Ivory Light Squares
      const boardLightMaterial = new THREE.MeshStandardMaterial({
        color: 0xfff6ea,
        roughness: 0.1,
        metalness: 0.15,
      });

      // Rich Polished Royal Espresso Dark Squares
      const boardDarkMaterial = new THREE.MeshStandardMaterial({
        color: 0x362319,
        roughness: 0.15,
        metalness: 0.3,
      });

      // Brilliant Gold Grid & Accent Metallic
      const goldInlayMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.1,
        metalness: 0.95,
      });

      // Beveled Dark Mahogany Border
      const woodBorderMaterial = new THREE.MeshStandardMaterial({
        color: 0x22130c,
        roughness: 0.25,
        metalness: 0.2,
      });

      // Luminous Pure White Pearl Pieces
      const whitePieceMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.08,
        metalness: 0.25,
      });

      // Royal Obsidian/Sapphire Black Pieces (Bright highlights so fully visible)
      const blackPieceMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2f40,
        roughness: 0.12,
        metalness: 0.65,
      });

      // Gold Crown & Finial Ring Accent
      const goldAccentMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.08,
        metalness: 0.98,
      });

      // Board Group
      const boardGroup = new THREE.Group();
      const boardSize = 8;
      const squareSize = 1.0;

      // Create Board Squares & Inlay Grid
      for (let x = 0; x < boardSize; x++) {
        for (let z = 0; z < boardSize; z++) {
          const isDark = (x + z) % 2 === 1;
          const squareGeo = new THREE.BoxGeometry(squareSize - 0.02, 0.25, squareSize - 0.02);
          const mat = isDark ? boardDarkMaterial : boardLightMaterial;
          const square = new THREE.Mesh(squareGeo, mat);
          square.position.set(x - boardSize / 2 + 0.5, 0, z - boardSize / 2 + 0.5);
          square.receiveShadow = true;
          boardGroup.add(square);
        }
      }

      // Under-Board Gold Inlay Slab
      const gridBaseGeo = new THREE.BoxGeometry(boardSize + 0.04, 0.23, boardSize + 0.04);
      const gridBase = new THREE.Mesh(gridBaseGeo, goldInlayMaterial);
      gridBase.position.y = -0.01;
      gridBase.receiveShadow = true;
      boardGroup.add(gridBase);

      // Outer Beveled Wooden Frame
      const frameOuterGeo = new THREE.BoxGeometry(boardSize + 0.8, 0.35, boardSize + 0.8);
      const frameOuter = new THREE.Mesh(frameOuterGeo, woodBorderMaterial);
      frameOuter.position.y = -0.08;
      frameOuter.receiveShadow = true;
      boardGroup.add(frameOuter);

      // Frame Corner Gold Brackets
      const bracketGeo = new THREE.BoxGeometry(0.35, 0.38, 0.35);
      [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ].forEach(([xMult, zMult]) => {
        const bracket = new THREE.Mesh(bracketGeo, goldAccentMaterial);
        bracket.position.set((boardSize / 2 + 0.25) * xMult, -0.07, (boardSize / 2 + 0.25) * zMult);
        bracket.castShadow = true;
        boardGroup.add(bracket);
      });

      // -------------------------------------------------------------
      // 3D REALISTIC LATHE CHESS PIECES GENERATOR
      // -------------------------------------------------------------
      const piecesGroup = new THREE.Group();

      // Lathe Geometry Points for Staunton Pieces
      const createLatheGeo = (pts: [number, number][], segments = 24) => {
        const vectors = pts.map(([r, y]) => new THREE.Vector2(r, y));
        const lathe = new THREE.LatheGeometry(vectors, segments);
        lathe.computeVertexNormals();
        return lathe;
      };

      // Pawn Profile
      const pawnGeo = createLatheGeo([
        [0, 0],
        [0.34, 0],
        [0.34, 0.06],
        [0.28, 0.12],
        [0.18, 0.22],
        [0.12, 0.42],
        [0.2, 0.5],
        [0.15, 0.54],
        [0.22, 0.72],
        [0, 0.84],
      ]);

      // Rook Profile
      const rookGeo = createLatheGeo([
        [0, 0],
        [0.38, 0],
        [0.38, 0.08],
        [0.32, 0.16],
        [0.24, 0.28],
        [0.22, 0.65],
        [0.3, 0.72],
        [0.36, 0.76],
        [0.36, 0.95],
        [0.26, 0.95],
        [0.26, 0.85],
        [0, 0.85],
      ]);

      // Knight Lathe Base + Head
      const knightBaseGeo = createLatheGeo([
        [0, 0],
        [0.38, 0],
        [0.38, 0.08],
        [0.32, 0.16],
        [0.22, 0.32],
        [0.2, 0.55],
        [0.24, 0.62],
        [0, 0.62],
      ]);

      // Bishop Profile
      const bishopGeo = createLatheGeo([
        [0, 0],
        [0.38, 0],
        [0.38, 0.08],
        [0.3, 0.16],
        [0.2, 0.35],
        [0.16, 0.65],
        [0.24, 0.72],
        [0.26, 0.96],
        [0.18, 1.06],
        [0.06, 1.12],
        [0, 1.18],
      ]);

      // Queen Profile
      const queenGeo = createLatheGeo([
        [0, 0],
        [0.4, 0],
        [0.4, 0.08],
        [0.32, 0.18],
        [0.22, 0.38],
        [0.18, 0.78],
        [0.28, 0.88],
        [0.36, 1.08],
        [0.24, 1.14],
        [0, 1.25],
      ]);

      // King Profile
      const kingGeo = createLatheGeo([
        [0, 0],
        [0.42, 0],
        [0.42, 0.08],
        [0.34, 0.18],
        [0.24, 0.42],
        [0.2, 0.85],
        [0.3, 0.96],
        [0.38, 1.18],
        [0.24, 1.24],
        [0, 1.34],
      ]);

      // King Cross Finial & Collar Ring Accent
      const crossVertical = new THREE.BoxGeometry(0.08, 0.28, 0.08);
      const crossHorizontal = new THREE.BoxGeometry(0.2, 0.08, 0.08);
      const ringGeo = new THREE.TorusGeometry(0.26, 0.03, 8, 20);

      const createPieceMesh = (type: 'p' | 'r' | 'n' | 'b' | 'q' | 'k', isWhite: boolean, x: number, z: number) => {
        const pieceGroup = new THREE.Group();
        const mat = isWhite ? whitePieceMaterial : blackPieceMaterial;

        let mainMesh: THREE.Mesh;
        if (type === 'p') {
          mainMesh = new THREE.Mesh(pawnGeo, mat);
        } else if (type === 'r') {
          mainMesh = new THREE.Mesh(rookGeo, mat);
        } else if (type === 'b') {
          mainMesh = new THREE.Mesh(bishopGeo, mat);
          // Bishop finial ball
          const ball = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), goldAccentMaterial);
          ball.position.y = 1.22;
          pieceGroup.add(ball);
        } else if (type === 'n') {
          mainMesh = new THREE.Mesh(knightBaseGeo, mat);
          // Stylized Knight Horse Head
          const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.42, 0.4), mat);
          headBox.position.set(0, 0.75, 0.05);
          headBox.rotation.x = -0.25;
          headBox.castShadow = true;
          pieceGroup.add(headBox);
        } else if (type === 'q') {
          mainMesh = new THREE.Mesh(queenGeo, mat);
          // Queen Crown Orb
          const orb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 14), goldAccentMaterial);
          orb.position.y = 1.3;
          pieceGroup.add(orb);
        } else {
          // King
          mainMesh = new THREE.Mesh(kingGeo, mat);
          const cVert = new THREE.Mesh(crossVertical, goldAccentMaterial);
          cVert.position.y = 1.48;
          const cHoriz = new THREE.Mesh(crossHorizontal, goldAccentMaterial);
          cHoriz.position.y = 1.5;
          cVert.castShadow = true;
          cHoriz.castShadow = true;
          pieceGroup.add(cVert, cHoriz);
        }

        mainMesh.castShadow = true;
        mainMesh.receiveShadow = true;
        pieceGroup.add(mainMesh);

        // Gold Ring Collar Accent
        const ring = new THREE.Mesh(ringGeo, goldAccentMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.2;
        pieceGroup.add(ring);

        pieceGroup.position.set(x - boardSize / 2 + 0.5, 0.12, z - boardSize / 2 + 0.5);
        pieceGroup.scale.set(1.25, 1.25, 1.25);
        return pieceGroup;
      };

      // Place Pieces on Board
      const setupRow = (isWhite: boolean, rIndex: number, pRowIndex: number) => {
        const order: ('r' | 'n' | 'b' | 'q' | 'k' | 'b' | 'n' | 'r')[] = [
          'r', 'n', 'b', 'q', 'k', 'b', 'n', 'r',
        ];
        // Main Back Rank
        order.forEach((type, col) => {
          piecesGroup.add(createPieceMesh(type, isWhite, col, rIndex));
        });
        // Pawn Rank
        for (let col = 0; col < 8; col++) {
          piecesGroup.add(createPieceMesh('p', isWhite, col, pRowIndex));
        }
      };

      // Black pieces at top (rows 0, 1) & White at bottom (rows 7, 6)
      setupRow(false, 0, 1);
      setupRow(true, 7, 6);

      boardGroup.add(piecesGroup);
      scene.add(boardGroup);

      // Floating Gold Dust Particles
      const particlesCount = 90;
      const posArray = new Float32Array(particlesCount * 3);
      for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 18;
      }
      const particlesGeometry = new THREE.BufferGeometry();
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.09,
        color: 0xd4af37,
        transparent: true,
        opacity: 0.65,
      });
      const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particlesMesh);

      // Camera Angle - Closer & dynamic angle to highlight 3D pieces
      camera.position.set(5.2, 4.8, 6.8);
      camera.lookAt(0, 0.4, 0);

      let lastFrameTime = 0;
      const animate = (time: number) => {
        animationFrameId = requestAnimationFrame(animate);
        if (document.hidden) return;
        // Smooth 30fps throttle to maintain zero lag on mobile
        if (time - lastFrameTime < 32) return;
        lastFrameTime = time;

        boardGroup.rotation.y += 0.0006;
        particlesMesh.rotation.y += 0.0003;
        particlesMesh.position.y = Math.sin(time * 0.0007) * 0.18;
        renderer.render(scene, camera);
      };

      requestAnimationFrame(animate);

      const handleResize = () => {
        if (!container) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);

        // Dispose geometries & materials to prevent GPU memory leaks
        pawnGeo.dispose();
        rookGeo.dispose();
        knightBaseGeo.dispose();
        bishopGeo.dispose();
        queenGeo.dispose();
        kingGeo.dispose();
        crossVertical.dispose();
        crossHorizontal.dispose();
        ringGeo.dispose();
        gridBaseGeo.dispose();
        frameOuterGeo.dispose();
        bracketGeo.dispose();
        particlesGeometry.dispose();

        boardLightMaterial.dispose();
        boardDarkMaterial.dispose();
        goldInlayMaterial.dispose();
        woodBorderMaterial.dispose();
        whitePieceMaterial.dispose();
        blackPieceMaterial.dispose();
        goldAccentMaterial.dispose();
        particlesMaterial.dispose();

        if (renderer) {
          renderer.dispose();
          if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
          }
        }
      };
    };

    const cleanup = setupScene();

    return () => {
      if (cleanup) cleanup();
    };
  }, [lowPerformanceMode]);

  if (lowPerformanceMode) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-95 overflow-hidden bg-gradient-to-b from-[#121520] via-[#0e1017] to-[#0a0b0f]">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

