"use client";

import React, { useEffect, useState } from "react";

const ICONS = [
  // Cloud
  '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a1 1 0 0 0 .9-.5A4.5 4.5 0 0 0 16 10h-.6a8 8 0 0 0-14.8 3.5 1 1 0 0 0 0 .5 4 4 0 0 0 3.4 5z"/></svg>',
  // Server/Database
  '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>',
  // Terminal
  '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>',
  // Code Brackets
  '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  // Box/Container
  '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
  // Network/Nodes
  '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>'
];

export function BackgroundParticles() {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // Generate floating DevOps icons
    const generated = Array.from({ length: 25 }).map((_, i) => {
      const size = Math.random() * 24 + 16; // 16px to 40px
      const x = Math.random() * 100; // 0 to 100vw
      const y = Math.random() * 100; // 0 to 100vh
      
      const duration = Math.random() * 40 + 40; // 40s to 80s (very slow and calming)
      const delay = Math.random() * -60; 
      
      const isPrimary = Math.random() > 0.4; 
      const icon = ICONS[Math.floor(Math.random() * ICONS.length)];

      const driftX = (Math.random() * 40 - 20) + "vw";
      const driftY = (Math.random() * 40 - 20) + "vh";

      return { id: i, size, x, y, duration, delay, isPrimary, driftX, driftY, icon };
    });
    
    setParticles(generated);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[0]">
      {particles.map((p) => (
        <React.Fragment key={p.id}>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes float-icon-${p.id} {
              0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0; }
              10% { opacity: 0.15; }
              25% { transform: translate(${p.driftX}, ${p.driftY}) rotate(45deg) scale(1.1); opacity: 0.15; }
              50% { transform: translate(calc(${p.driftX} * -0.5), calc(${p.driftY} * 0.8)) rotate(-20deg) scale(0.9); opacity: 0.15; }
              75% { transform: translate(calc(${p.driftX} * 0.8), calc(${p.driftY} * -0.5)) rotate(10deg) scale(1.05); opacity: 0.15; }
              90% { opacity: 0.15; }
            }
          `}} />
          <div
            className="absolute transition-opacity duration-1000"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `calc(${p.x}vw - ${p.size/2}px)`,
              top: `calc(${p.y}vh - ${p.size/2}px)`,
              animation: `float-icon-${p.id} ${p.duration}s infinite ease-in-out ${p.delay}s`,
              opacity: 0, // Starts at 0, animation takes over
              color: p.isPrimary ? "var(--color-particle-1)" : "var(--color-particle-2)",
            }}
            dangerouslySetInnerHTML={{ __html: p.icon }}
          />
        </React.Fragment>
      ))}
    </div>
  );
}
