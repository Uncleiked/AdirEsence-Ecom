
"use client";

import { useRef } from "react";
import { useTheme } from "next-themes";
import { useGSAP } from "@gsap/react";

interface Particle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  baseX: number;
  baseY: number;
  velocity: number;
}

export function InteractiveBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useGSAP(
    () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let particles: Particle[] = [];
      let width = 0;
      let height = 0;
      let mouseX = 0;
      let mouseY = 0;

      const init = () => {
        width = container.offsetWidth;
        height = container.offsetHeight;
        canvas.width = width;
        canvas.height = height;

        particles = [];
        const particleCount = Math.floor((width * height) / 10000); // Density

        for (let i = 0; i < particleCount; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          particles.push({
            x,
            y,
            baseX: x,
            baseY: y,
            size: Math.random() * 2 + 0.5,
            alpha: Math.random() * 0.5 + 0.2, // Initial alpha
            velocity: Math.random() * 0.05 + 0.02,
          });
        }
      };

      const animate = () => {
        ctx.clearRect(0, 0, width, height);

        // Gradient for dark mode background (dark sky)
        // Check for dark mode via class on html/body if needed, but here we can force or adapt
        // Assuming this component is used in a specific context (the featured carousel right panel)

        particles.forEach((p) => {
          // Subtle movement
          p.x += (mouseX - width / 2) * p.velocity * 0.05;
          p.y += (mouseY - height / 2) * p.velocity * 0.05;

          // Wrap around with soft transition logic (simplified for effect)
          if (p.x < 0) p.x += width;
          if (p.x > width) p.x -= width;
          if (p.y < 0) p.y += height;
          if (p.y > height) p.y -= height;

          // Draw star
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          // Dark mode = white stars, Light mode = black stars
          const color = resolvedTheme === "dark" ? "255, 255, 255" : "0, 0, 0";
          ctx.fillStyle = `rgba(${color}, ${p.alpha})`;
          ctx.fill();
        });

        requestAnimationFrame(animate);
      };

      const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      };

      const handleResize = () => {
        init();
      };

      window.addEventListener("resize", handleResize);
      container.addEventListener("mousemove", handleMouseMove);

      init();
      animate();

      return () => {
        window.removeEventListener("resize", handleResize);
        container.removeEventListener("mousemove", handleMouseMove);
      };
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      {/* Overlay to ensure text readability if placed over */}
    </div>
  );
}
