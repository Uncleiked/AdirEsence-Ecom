
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  animation?: "fade-up" | "slide-left" | "slide-right" | "zoom-in";
  delay?: number;
  duration?: number;
}

export function ScrollReveal({
  children,
  className,
  animation = "fade-up",
  delay = 0,
  duration = 0.8,
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const element = elementRef.current;
      if (!element) return;

      const animConfig = {
        "fade-up": { y: 50, opacity: 0 },
        "slide-left": { x: -50, opacity: 0 },
        "slide-right": { x: 50, opacity: 0 },
        "zoom-in": { scale: 0.9, opacity: 0 },
      };

      const fromVars = animConfig[animation];

      gsap.fromTo(
        element,
        fromVars,
        {
          y: 0,
          x: 0,
          scale: 1,
          opacity: 1,
          duration: duration,
          delay: delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 85%", // Trigger when top of element hits 85% of viewport height
            toggleActions: "play none none reverse", // Play on enter, reverse on leave back up
          },
        }
      );
    },
    { scope: elementRef }
  );

  return (
    <div ref={elementRef} className={cn("opacity-0", className)}>
      {children}
    </div>
  );
}
