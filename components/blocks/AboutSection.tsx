"use client";

import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { urlFor } from '@/sanity/lib/image';

export function AboutSection({ data }: { data: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  const title = data?.title || "About AdirEssence";
  const description = data?.description || "AdirEssence is more than a brand; it's a movement bridging heritage and modern luxury. We craft every piece to preserve the rich culture of artistry while offering you premium comfort and undeniable style.";
  
  // Choose the asset
  const isVideo = data?.assetType === 'video';
  const videoAsset = data?.video || data?.videoUrl;
  
  // Debug log for troubleshooting image issues
  if (data && !data.image && !isVideo) {
    console.warn("AboutSection: assetType is image but no image was found in Sanity data.", data);
  }

  const imageAsset = typeof data?.image === 'string' ? data.image : (data?.image ? urlFor(data.image).url() : "https://images.unsplash.com/photo-1550614000-4b95d4ebfaad?q=80&w=2070&auto=format&fit=crop");

  return (
    <section 
      id="about" 
      ref={containerRef}
      className="relative w-full py-32 bg-zinc-50 dark:bg-black overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Media Side */}
          <motion.div 
            style={{ y: y1 }}
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative h-[450px] md:h-[600px] w-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(255,255,255,0.02)] group bg-zinc-100 dark:bg-zinc-900"
          >
            {isVideo && videoAsset ? (
              <video 
                src={videoAsset}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <Image 
                src={imageAsset}
                alt={title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
            )}
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500"></div>
          </motion.div>
          
          {/* Text Side */}
          <motion.div 
            style={{ y: y2 }}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="flex flex-col justify-center space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-bold text-orange-500 dark:text-orange-500 tracking-tight leading-tight">
                {title}
              </h2>
              <div className="w-16 h-1.5 bg-zinc-900 dark:bg-zinc-100 rounded-full"></div>
            </div>
            
            <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 leading-relaxed font-light max-w-xl">
              {description}
            </p>
            
            <div className="pt-6 flex items-center space-x-6">
              <div className="flex -space-x-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-200 dark:bg-zinc-800" />
                ))}
              </div>
              <p className="text-base text-zinc-500 dark:text-zinc-500 font-medium">
                Join 5k+ collectors worldwide
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
