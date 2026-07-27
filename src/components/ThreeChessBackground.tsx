import React, { useEffect, useRef } from 'react';

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
    let renderer: any;

    const initThree = () => {
      if (typeof window.THREE !== 'undefined') {
        setupScene();
        return;
      }

      const existingScript = document.getElementById('three-js-cdn-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => setupScene());
      } else {
        const script = document.createElement('script');
        script.id = 'three-js-cdn-script';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = () => setupScene();
        document.body.appendChild(script);
      }
    };

    const setupScene = () => {
      if (!container) return;
      const THREE = window.THREE;
      if (!THREE) return;

      container.innerHTML = '';
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);
      } catch (err) {
        // Fallback gracefully if WebGL context is unavailable or restricted
        return;
      }

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);

      const spotLight = new THREE.SpotLight(0xffffff, 1.2);
      spotLight.position.set(10, 20, 10);
      scene.add(spotLight);

      const pointLight = new THREE.PointLight(0xc5a059, 0.5);
      pointLight.position.set(-5, 5, -5);
      scene.add(pointLight);

      // Materials
      const darkWoodMaterial = new THREE.MeshStandardMaterial({
        color: 0x2b1d10,
        roughness: 0.2,
        metalness: 0.1,
      });
      const lightWoodMaterial = new THREE.MeshStandardMaterial({
        color: 0xd7ba89,
        roughness: 0.3,
        metalness: 0.05,
      });
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.1,
        metalness: 0.3,
      });

      // Board Construction
      const boardSize = 8;
      const squareSize = 1;
      const boardGroup = new THREE.Group();

      for (let x = 0; x < boardSize; x++) {
        for (let z = 0; z < boardSize; z++) {
          const isDark = (x + z) % 2 === 1;
          const geometry = new THREE.BoxGeometry(squareSize, 0.2, squareSize);
          const material = isDark ? darkWoodMaterial : lightWoodMaterial;
          const square = new THREE.Mesh(geometry, material);
          square.position.set(x - boardSize / 2 + 0.5, 0, z - boardSize / 2 + 0.5);
          boardGroup.add(square);
        }
      }

      // Board Frame
      const frameGeo = new THREE.BoxGeometry(boardSize + 0.5, 0.25, boardSize + 0.5);
      const frameMesh = new THREE.Mesh(frameGeo, frameMaterial);
      frameMesh.position.y = -0.05;
      boardGroup.add(frameMesh);

      scene.add(boardGroup);

      // Floating gold dust particles
      const particlesCount = 40;
      const posArray = new Float32Array(particlesCount * 3);
      for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 15;
      }
      const particlesGeometry = new THREE.BufferGeometry();
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.06,
        color: 0xc5a059,
        transparent: true,
        opacity: 0.6,
      });
      const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particlesMesh);

      camera.position.set(6, 6, 8);
      camera.lookAt(0, 0, 0);

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        boardGroup.rotation.y += 0.0015;
        particlesMesh.rotation.y += 0.0008;
        particlesMesh.position.y = Math.sin(Date.now() * 0.001) * 0.2;
        renderer.render(scene, camera);
      };

      animate();

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

    initThree();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (renderer && renderer.domElement) {
        renderer.domElement.remove();
      }
    };
  }, [lowPerformanceMode]);

  if (lowPerformanceMode) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-50 overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

declare global {
  interface Window {
    THREE?: any;
  }
}
