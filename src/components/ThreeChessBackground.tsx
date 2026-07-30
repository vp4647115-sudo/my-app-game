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
      scene.background = new THREE.Color(0x0a0a0a);

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);

      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
        container.appendChild(renderer.domElement);
      } catch (err) {
        console.warn('WebGL context unavailable for 3D background:', err);
        return;
      }

      // Lighting - Luxury Gold Spotlight & Warm Ambient
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const mainSpot = new THREE.SpotLight(0xffdf80, 2.5);
      mainSpot.position.set(12, 22, 12);
      mainSpot.angle = Math.PI / 4;
      mainSpot.penumbra = 0.8;
      scene.add(mainSpot);

      const goldRim = new THREE.PointLight(0xd4af37, 1.8);
      goldRim.position.set(-10, 8, -10);
      scene.add(goldRim);

      // Materials matching the requested spec:
      // Board Light: #D4AF37 (Gold)
      // Board Dark: #3B2F2F (Deep Obsidian Espresso)
      const boardLightGold = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.25,
        metalness: 0.65,
      });

      const boardDarkMaterial = new THREE.MeshStandardMaterial({
        color: 0x3b2f2f,
        roughness: 0.35,
        metalness: 0.2,
      });

      const goldFrameMaterial = new THREE.MeshStandardMaterial({
        color: 0x121411,
        roughness: 0.1,
        metalness: 0.8,
      });

      const whiteMarbleMaterial = new THREE.MeshStandardMaterial({
        color: 0xfaf9f6,
        roughness: 0.15,
        metalness: 0.1,
      });

      const blackObsidianMaterial = new THREE.MeshStandardMaterial({
        color: 0x121411,
        roughness: 0.1,
        metalness: 0.85,
      });

      const goldAccentMaterial = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.2,
        metalness: 0.9,
      });

      // Board Group
      const boardGroup = new THREE.Group();
      const boardSize = 8;
      const squareSize = 1;

      for (let x = 0; x < boardSize; x++) {
        for (let z = 0; z < boardSize; z++) {
          const isDark = (x + z) % 2 === 1;
          const geometry = new THREE.BoxGeometry(squareSize, 0.2, squareSize);
          const material = isDark ? boardDarkMaterial : boardLightGold;
          const square = new THREE.Mesh(geometry, material);
          square.position.set(x - boardSize / 2 + 0.5, 0, z - boardSize / 2 + 0.5);
          boardGroup.add(square);
        }
      }

      // Luxury Outer Gold Trim Frame
      const frameGeo = new THREE.BoxGeometry(boardSize + 0.6, 0.25, boardSize + 0.6);
      const frameMesh = new THREE.Mesh(frameGeo, goldFrameMaterial);
      frameMesh.position.y = -0.05;
      boardGroup.add(frameMesh);

      // Add 3D Piece Models (Stylized Cylindrical/Conical Kings, Queens & Pawns)
      const piecesGroup = new THREE.Group();

      const create3DPiece = (isWhite: boolean, x: number, z: number, height = 0.8) => {
        const pGroup = new THREE.Group();
        const baseGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.15, 16);
        const bodyGeo = new THREE.CylinderGeometry(0.2, 0.3, height, 16);
        const headGeo = new THREE.SphereGeometry(0.25, 16, 16);

        const pieceMat = isWhite ? whiteMarbleMaterial : blackObsidianMaterial;
        const baseMesh = new THREE.Mesh(baseGeo, pieceMat);
        const bodyMesh = new THREE.Mesh(bodyGeo, pieceMat);
        bodyMesh.position.y = height / 2 + 0.07;
        const headMesh = new THREE.Mesh(headGeo, pieceMat);
        headMesh.position.y = height + 0.2;

        // Gold Accent Crown Ring
        const crownRingGeo = new THREE.TorusGeometry(0.22, 0.04, 8, 16);
        const crownRing = new THREE.Mesh(crownRingGeo, goldAccentMaterial);
        crownRing.rotation.x = Math.PI / 2;
        crownRing.position.y = height + 0.1;

        pGroup.add(baseMesh, bodyMesh, headMesh, crownRing);
        pGroup.position.set(x - boardSize / 2 + 0.5, 0.2, z - boardSize / 2 + 0.5);
        return pGroup;
      };

      // Place key pieces in 3D scene
      for (let i = 0; i < 8; i++) {
        piecesGroup.add(create3DPiece(true, i, 6, 0.6)); // White Pawns
        piecesGroup.add(create3DPiece(false, i, 1, 0.6)); // Black Pawns
      }
      piecesGroup.add(create3DPiece(true, 4, 7, 1.1)); // White King
      piecesGroup.add(create3DPiece(true, 3, 7, 1.0)); // White Queen
      piecesGroup.add(create3DPiece(false, 4, 0, 1.1)); // Black King
      piecesGroup.add(create3DPiece(false, 3, 0, 1.0)); // Black Queen

      boardGroup.add(piecesGroup);
      scene.add(boardGroup);

      // Floating Gold Dust Particle Field
      const particlesCount = 80;
      const posArray = new Float32Array(particlesCount * 3);
      for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 16;
      }
      const particlesGeometry = new THREE.BufferGeometry();
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.08,
        color: 0xd4af37,
        transparent: true,
        opacity: 0.7,
      });
      const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particlesMesh);

      camera.position.set(6.5, 6, 8.5);
      camera.lookAt(0, 0, 0);

      let lastFrameTime = 0;
      const animate = (time: number) => {
        animationFrameId = requestAnimationFrame(animate);
        if (document.hidden) return;
        // Throttle to ~30fps for background elements to keep main thread completely clear
        if (time - lastFrameTime < 30) return;
        lastFrameTime = time;

        boardGroup.rotation.y += 0.0008;
        particlesMesh.rotation.y += 0.0004;
        particlesMesh.position.y = Math.sin(time * 0.0008) * 0.2;
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
    };

    setupScene();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (renderer && renderer.domElement) {
        renderer.domElement.remove();
      }
    };
  }, [lowPerformanceMode]);

  if (lowPerformanceMode) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-60 overflow-hidden bg-[#0A0A0A]">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

