"use client";

import React, { useEffect, useRef, useState } from "react";
import { useScroll, useSpring, useTransform, motion } from "framer-motion";
import Link from "next/link";

interface SequenceAnimationProps {
  imageUrls: string[];
  beatA?: { title: string; subtitle: string };
  beatB?: { title: string; description: string };
  beatC?: { title: string; description: string };
  beatD?: { title: string; subtitle: string; buttonText: string };
}

export const SequenceAnimation: React.FC<SequenceAnimationProps> = ({ 
  imageUrls,
  beatA,
  beatB,
  beatC,
  beatD
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Preload Images
  useEffect(() => {
    if (!imageUrls || imageUrls.length === 0) {
      setIsLoaded(true);
      return;
    }

    const loadedImages: HTMLImageElement[] = [];
    let loaded = 0;

    imageUrls.forEach((url, i) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loaded++;
        loadedImages[i] = img;
        setLoadedCount(loaded);
        if (loaded === imageUrls.length) {
          setImages(loadedImages);
          setIsLoaded(true);
        }
      };
      img.onerror = () => {
        // Fallback for errors so we don't block forever
        loaded++;
        setLoadedCount(loaded);
        if (loaded === imageUrls.length) {
          setImages(loadedImages);
          setIsLoaded(true);
        }
      }
    });

    return () => {
       loadedImages.forEach((img) => {
         img.onload = null;
         img.onerror = null;
         img.src = "";
       });
    }
  }, [imageUrls]);

  // Framer Motion Scroll Tracking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Keep track of the current frame index
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    return smoothProgress.on("change", (latest) => {
      if (!isLoaded || images.length === 0) return;
      // Map 0 - 0.8 (80% of scroll) to the image sequence
      // This leaves 20% of the scroll for the "stay as it is" effect
      const animationProgress = Math.min(1, latest / 0.8);
      const index = Math.min(
        images.length - 1,
        Math.floor(animationProgress * images.length)
      );
      setFrameIndex(index);
    });
  }, [smoothProgress, images, isLoaded]);

  // Draw on Canvas when frame changes
  useEffect(() => {
    if (!isLoaded || images.length === 0 || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const img = images[frameIndex];
    if (!img) return;

    // Responsive Canvas Resizing & Drawing
    const render = () => {
      const parent = canvasRef.current!.parentElement;
      if (!parent) return;
      
      const { clientWidth, clientHeight } = parent;
      canvasRef.current!.width = clientWidth;
      canvasRef.current!.height = clientHeight;

      const cw = canvasRef.current!.width;
      const ch = canvasRef.current!.height;
      const iw = img.width;
      const ih = img.height;

      // Contain logic
      const scale = Math.min(cw / iw, ch / ih);
      const x = cw / 2 - (iw * scale) / 2;
      const y = ch / 2 - (ih * scale) / 2;

      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, x, y, iw * scale, ih * scale);
    };

    render();
    
    // Add resize listener just for canvas rendering update
    window.addEventListener("resize", render);
    return () => window.removeEventListener("resize", render);
  }, [frameIndex, images, isLoaded]);

  // Text Animations
  // Beat A: 0 - 15%
  const beatAOpacity = useTransform(smoothProgress, [0, 0.05, 0.15, 0.2], [1, 1, 0, 0]);
  const beatAY = useTransform(smoothProgress, [0, 0.2], [0, -30]);

  // Scroll indicator
  const scrollIndicatorOpacity = useTransform(smoothProgress, [0, 0.05, 0.1], [1, 1, 0]);

  // Beat B: 20% - 40%
  const beatBOpacity = useTransform(smoothProgress, [0.15, 0.2, 0.35, 0.4], [0, 1, 1, 0]);
  const beatBY = useTransform(smoothProgress, [0.15, 0.2, 0.35, 0.4], [30, 0, 0, -30]);

  // Beat C: 45% - 65%
  const beatCOpacity = useTransform(smoothProgress, [0.4, 0.45, 0.6, 0.65], [0, 1, 1, 0]);
  const beatCY = useTransform(smoothProgress, [0.4, 0.45, 0.6, 0.65], [30, 0, 0, -30]);

  // Beat D: 70% - 85%
  const beatDOpacity = useTransform(smoothProgress, [0.65, 0.7, 0.8, 0.85], [0, 1, 1, 0]);
  const beatDY = useTransform(smoothProgress, [0.65, 0.7], [30, 0]);

  if (!imageUrls || imageUrls.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#050505] min-h-screen">
      {!isLoaded && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]">
          <div className="text-white/90 font-sans tracking-widest text-sm mb-4 uppercase">
            Loading Experience
          </div>
          <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
             <div 
               className="h-full bg-white/90 transition-all duration-300 ease-out" 
               style={{ width: `${(loadedCount / imageUrls.length) * 100}%` }}
             />
          </div>
        </div>
      )}

      <div ref={containerRef} className="relative h-[500vh] bg-[#050505]">
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center pointer-events-none">
          
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full object-contain mix-blend-screen"
            style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.5s ease' }}
          />

          {/* High Contrast Overlay for Text Legibility */}
          <div className="absolute inset-0 z-5 bg-black/50 pointer-events-none" />

          {/* Text Overlays Layer */}
          <div className="absolute inset-0 z-10 w-full h-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pointer-events-none flex flex-col justify-center font-sans">
            
            {/* Beat A — 0–20% Scroll */}
            <motion.div 
              style={{ opacity: beatAOpacity, y: beatAY }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
            >
              <h1 
                className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-semibold tracking-tighter text-white/90 uppercase max-w-[90vw] mx-auto leading-[1.1]"
                style={{ textShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
              >
                {beatA?.title || "THE SILHOUETTE"}
              </h1>
              <p className="mt-4 md:mt-6 text-base sm:text-lg md:text-2xl font-light text-white/60 tracking-wider px-4 max-w-2xl mx-auto">
                {beatA?.subtitle || "Engineered for the elements."}
              </p>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
              style={{ opacity: scrollIndicatorOpacity }}
              className="absolute bottom-10 left-0 right-0 flex flex-col items-center justify-center pb-8"
            >
              <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-3">Scroll to Explore</p>
              <div className="w-px h-12 bg-linear-to-b from-white/40 to-transparent" />
            </motion.div>

            {/* Beat B — 25–45% Scroll */}
            <motion.div 
              style={{ opacity: beatBOpacity, y: beatBY }}
              className="absolute inset-0 flex flex-col items-start justify-center text-left"
            >
              <div className="max-w-xl">
                <h2 
                  className="text-4xl md:text-7xl font-medium tracking-tight text-white/90 uppercase leading-none"
                  style={{ textShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                >
                  {beatB?.title || "FABRIC / MATERIAL TECH"}
                </h2>
                <p className="mt-4 md:mt-6 text-base md:text-xl font-light text-white/60">
                  {beatB?.description || "Micro-woven breathable mesh designed to adapt to your environment, maintaining optimal thermal equilibrium in any climate."}
                </p>
              </div>
            </motion.div>

            {/* Beat C — 50–70% Scroll */}
            <motion.div 
              style={{ opacity: beatCOpacity, y: beatCY }}
              className="absolute inset-0 flex flex-col items-end justify-center text-right"
            >
              <div className="max-w-xl">
                <h2 
                  className="text-4xl md:text-7xl font-medium tracking-tight text-white/90 uppercase leading-none"
                  style={{ textShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                >
                  {beatC?.title || "CRAFTSMANSHIP / UTILITY"}
                </h2>
                <p className="mt-4 md:mt-6 text-base md:text-xl font-light text-white/60">
                  {beatC?.description || "Laser-cut seams and weather-sealed zips. Every stitch calculated for maximum performance without compromising the minimalist aesthetic."}
                </p>
              </div>
            </motion.div>

            {/* Beat D — 75–95% Scroll */}
            <motion.div 
              style={{ opacity: beatDOpacity, y: beatDY }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
            >
              <h2 
                className="text-4xl md:text-7xl font-bold tracking-tighter text-white/90 uppercase"
                style={{ textShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
              >
                {beatD?.title || "DISCOVER MORE"}
              </h2>
              <p className="mt-4 md:mt-6 mb-8 md:mb-10 text-lg md:text-xl font-light text-white/60 px-4">
                {beatD?.subtitle || "Step into the future of wear."}
              </p>
              <Link 
                href="/shop"
                className="pointer-events-auto px-8 py-4 bg-white text-black text-sm tracking-widest uppercase font-medium hover:bg-white/90 transition-all transform hover:scale-105 duration-300 rounded-full"
              >
                {beatD?.buttonText || "Pre-order Now"}
              </Link>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};
