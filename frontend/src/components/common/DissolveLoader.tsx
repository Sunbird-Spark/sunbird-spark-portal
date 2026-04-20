import React, { useEffect, useRef } from 'react';
import { GhostLogo, MainLogo } from './dissolveLogo';
import {
  DissolveLoaderProps,
  CYCLE,
  Particle,
  applyLogoState,
  spawnParticles,
  drawParticles,
} from './dissolveParticles';

// ─── COMPONENT ─────────────────────────────────────────────────────────────

export function DissolveLoader({ message, subVariant = 'classic' }: DissolveLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{ t: number; lastTs: number; particles: Particle[]; raf: number }>({ t: 0, lastTs: 0, particles: [], raf: 0 });
  const logoRef = useRef<HTMLDivElement>(null);
  
  // Track previous variant so we can reset arrays cleanly
  const lastVariant = useRef(subVariant);

  useEffect(() => {
    const state = stateRef.current;
    
    // Clear particles if subVariant changed
    if (lastVariant.current !== subVariant) {
        state.particles = [];
        lastVariant.current = subVariant;
        if (logoRef.current) logoRef.current.removeAttribute('style');
    }
    
    if (state.lastTs === 0) {
      state.t = 0; state.lastTs = 0; state.particles = [];
    }

    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const canvas = canvasRef.current; const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      
      const rect = wrap.getBoundingClientRect();
      canvas.width = rect.width * dpr; 
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    }
    resize();
    window.addEventListener('resize', resize);

    function loop(ts: number) {
      if (state.lastTs === 0) state.lastTs = ts;
      const dt = ts - state.lastTs; state.lastTs = ts;
      
      state.t = (state.t + dt / CYCLE) % 1;
      const t = state.t;
      
      const styles = applyLogoState(t, subVariant);
      if (logoRef.current) {
        const el = logoRef.current;
        el.style.opacity = styles.opacity !== undefined ? String(styles.opacity) : '';
        el.style.filter = styles.filter !== undefined ? String(styles.filter) : '';
        el.style.transform = styles.transform !== undefined ? String(styles.transform) : '';
        el.style.mixBlendMode = styles.mixBlendMode !== undefined ? String(styles.mixBlendMode) : '';
      }
      
      const canvas = canvasRef.current;
      if (canvas && wrapRef.current) {
        const ctx = canvas.getContext('2d');
        const rect = wrapRef.current.getBoundingClientRect();
        if (ctx) {
          spawnParticles(t, subVariant, rect.width, rect.height, state.particles);
          // Scale is already set from resize()
          drawParticles(ctx, rect.width, rect.height, state.particles);
        }
      }
      state.raf = window.requestAnimationFrame(loop);
    }
    
    state.raf = window.requestAnimationFrame(loop);
    return () => { window.cancelAnimationFrame(state.raf); window.removeEventListener('resize', resize); };
  }, [subVariant]);

  return (
    <div className="flex flex-col items-center justify-center gap-12 w-full h-full relative" data-testid="dissolve-loader">
      <div className="absolute inset-0 pointer-events-none blur-[2.5rem] animate-pulse opacity-40" 
           style={{ background: 'radial-gradient(ellipse 40% 40% at 50% 50%, rgba(220,119,39,0.3) 0%, transparent 80%)' }} />
      <div ref={wrapRef} className="relative w-[min(12.5rem,80vw)] aspect-[1110/580]">
        <GhostLogo />
        <div ref={logoRef} className="absolute inset-0 w-full h-full">
            <MainLogo />
        </div>
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      </div>
    </div>
  );
}
