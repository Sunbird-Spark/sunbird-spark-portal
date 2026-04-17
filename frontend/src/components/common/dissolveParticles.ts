import React from 'react';

export type SubVariant = 'classic' | 'ember' | 'shatter' | 'melt' | 'ashes';

export interface DissolveLoaderProps {
  message?: string;
  subVariant?: SubVariant;
}

export const CYCLE = 4000;
const COLORS = ['#dc7727', '#bd4527', '#f5c48a', '#7a2b14', '#e8a055'];

function easeIn(t: number) { return t * t * t; }
function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
function rand(a: number, b: number) { return a + Math.random() * (b - a); }

export type Particle = {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; decay: number; life: number;
  color: string; type: string;
  rot?: number; rotV?: number; w?: number; h?: number;
  glow?: boolean; blur?: number;
};

// ─── PARTICLE SYSTEM LOGIC ───────────────────────────────────────────────────

export function applyLogoState(p: number, sv: SubVariant): React.CSSProperties {
  if (sv === 'classic') {
    let opacity, blur, scale;
    if (p < 0.28) { opacity = 1; blur = 0; scale = 1; }
    else if (p < 0.65) {
      const u = (p - 0.28) / 0.37;
      opacity = 1 - easeIn(u); blur = u * 10; scale = 1 - u * 0.04;
    } else if (p < 0.78) { opacity = 0; blur = 10; scale = 0.96; }
    else {
      const u = (p - 0.78) / 0.22;
      opacity = easeOut(u); blur = (1 - u) * 10; scale = 0.96 + u * 0.04;
    }
    return {
      opacity: Math.max(0, opacity),
      filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : 'none',
      transform: `scale(${scale.toFixed(4)})`,
    };
  }

  if (sv === 'ember') {
    let opacity, hue, bright, scale;
    if (p < 0.2) { opacity = 1; hue = 0; bright = 1; scale = 1; }
    else if (p < 0.6) {
      const u = (p - 0.2) / 0.4;
      opacity = 1 - easeIn(u) * 0.95; hue = u * 40; bright = 1 + u * 0.8; scale = 1 + u * 0.02;
    } else if (p < 0.75) { opacity = 0.05; hue = 40; bright = 2; scale = 1.02; }
    else {
      const u = (p - 0.75) / 0.25;
      opacity = easeOut(u); hue = (1 - u) * 40; bright = 2 - u; scale = 1.02 - u * 0.02;
    }
    return {
      opacity: Math.max(0, opacity),
      filter: `hue-rotate(${hue.toFixed(1)}deg) brightness(${bright.toFixed(2)}) drop-shadow(0 0 ${(bright - 1) * 18}px rgba(220,119,39,${(bright - 1) * 0.6}))`,
      transform: `scale(${scale.toFixed(4)})`,
    };
  }

  if (sv === 'shatter') {
    let opacity, blur, skewX, skewY;
    if (p < 0.22) { opacity = 1; blur = 0; skewX = 0; skewY = 0; }
    else if (p < 0.55) {
      const u = (p - 0.22) / 0.33;
      opacity = 1 - easeIn(u); blur = u * 4;
      skewX = Math.sin(u * Math.PI * 6) * u * 3;
      skewY = Math.cos(u * Math.PI * 4) * u * 1.5;
    } else if (p < 0.72) { opacity = 0; blur = 4; skewX = 0; skewY = 0; }
    else {
      const u = (p - 0.72) / 0.28;
      opacity = easeOut(u); blur = (1 - u) * 4;
      skewX = (1 - u) * Math.sin(u * Math.PI * 3) * 2; skewY = 0;
    }
    return {
      opacity: Math.max(0, opacity),
      filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : 'none',
      transform: `skewX(${skewX.toFixed(2)}deg) skewY(${skewY.toFixed(2)}deg)`,
    };
  }

  if (sv === 'melt') {
    let opacity, scaleY, blur, translateY;
    if (p < 0.25) { opacity = 1; scaleY = 1; blur = 0; translateY = 0; }
    else if (p < 0.62) {
      const u = (p - 0.25) / 0.37;
      opacity = 1 - easeIn(u); scaleY = 1 + easeIn(u) * 0.18; blur = u * 6; translateY = easeIn(u) * 8;
    } else if (p < 0.76) { opacity = 0; scaleY = 1.18; blur = 6; translateY = 8; }
    else {
      const u = (p - 0.76) / 0.24;
      opacity = easeOut(u); scaleY = 1.18 - u * 0.18; blur = (1 - u) * 6; translateY = (1 - u) * 8;
    }
    return {
      opacity: Math.max(0, opacity),
      filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : 'none',
      transform: `scaleY(${scaleY.toFixed(4)}) translateY(${translateY.toFixed(2)}px)`,
      transformOrigin: '50% 100%',
    };
  }

  // ashes
  let opacity, saturate, brightness, blur;
  if (p < 0.2) { opacity = 1; saturate = 1; brightness = 1; blur = 0; }
  else if (p < 0.58) {
    const u = (p - 0.2) / 0.38;
    opacity = 1 - easeIn(u); saturate = 1 - u * 0.85; brightness = 1 + u * 0.3; blur = u * 5;
  } else if (p < 0.74) { opacity = 0; saturate = 0.15; brightness = 1.3; blur = 5; }
  else {
    const u = (p - 0.74) / 0.26;
    opacity = easeOut(u); saturate = 0.15 + u * 0.85; brightness = 1.3 - u * 0.3; blur = (1 - u) * 5;
  }
  return {
    opacity: Math.max(0, opacity),
    filter: `saturate(${saturate.toFixed(3)}) brightness(${brightness.toFixed(3)})${blur > 0.2 ? ` blur(${blur.toFixed(2)}px)` : ''}`,
    transform: 'none',
  };
}

export function spawnParticles(p: number, sv: SubVariant, W: number, H: number, particles: Particle[]) {
  if (particles.length > 200) return; // safety limit

  const logoX = (vbX: number) => ((vbX - 100) / 1110) * W;
  const logoY = (vbY: number) => ((vbY - 220) / 580) * H;
  const px = logoX(rand(150, 1160));
  const py = logoY(rand(230, 780));

  if (sv === 'classic') {
    if (p > 0.28 && p < 0.72) {
      const intensity = Math.sin((p - 0.28) / 0.44 * Math.PI);
      if (Math.random() < intensity * 0.35) {
        particles.push({
          x: px, y: py, vx: rand(-0.4, 0.4), vy: rand(-1.2, -0.3),
          size: rand(2, 5), alpha: rand(0.4, 0.8), decay: rand(0.008, 0.018),
          color: (COLORS[Math.floor(Math.random() * COLORS.length)] || COLORS[0]) as string, type: 'circle',
          blur: rand(0, 2), life: 1,
        });
      }
    }
  } else if (sv === 'ember') {
    if (p > 0.18 && p < 0.68) {
      const intensity = Math.sin((p - 0.18) / 0.5 * Math.PI);
      if (Math.random() < intensity * 0.5) {
        particles.push({
          x: px, y: py, vx: rand(-1.2, 1.2), vy: rand(-2.5, -0.8),
          size: rand(2, 4), alpha: 1, decay: rand(0.015, 0.03),
          color: (COLORS[Math.floor(Math.random() * 3)] || COLORS[0]) as string, type: 'circle',
          glow: true, life: 1,
        });
      }
    }
  } else if (sv === 'shatter') {
    if (p > 0.2 && p < 0.6) {
      const intensity = Math.sin((p - 0.2) / 0.4 * Math.PI);
      if (Math.random() < intensity * 0.4) {
        const angle = rand(0, Math.PI * 2); const speed = rand(1, 4);
        particles.push({
          x: px, y: py, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1,
          rot: rand(0, Math.PI * 2), rotV: rand(-0.15, 0.15), w: rand(4, 12), h: rand(2, 5), size: rand(2, 5),
          alpha: rand(0.5, 0.9), decay: rand(0.018, 0.032), color: (COLORS[Math.floor(Math.random() * COLORS.length)] || COLORS[0]) as string,
          type: 'rect', life: 1,
        });
      }
    }
  } else if (sv === 'melt') {
    if (p > 0.22 && p < 0.66) {
      const intensity = Math.sin((p - 0.22) / 0.44 * Math.PI);
      if (Math.random() < intensity * 0.28) {
        particles.push({
          x: rand(logoX(200), logoX(1100)), y: logoY(rand(500, 760)),
          vx: rand(-0.1, 0.1), vy: rand(0.8, 2.5), size: rand(3, 7),
          alpha: rand(0.5, 0.85), decay: rand(0.012, 0.022), color: (COLORS[Math.floor(Math.random() * 3)] || COLORS[0]) as string,
          type: 'teardrop', life: 1,
        });
      }
    }
  } else if (sv === 'ashes') {
    if (p > 0.18 && p < 0.65) {
      const intensity = Math.sin((p - 0.18) / 0.47 * Math.PI);
      if (Math.random() < intensity * 0.45) {
        particles.push({
          x: px, y: py, vx: rand(-0.6, 0.6), vy: rand(-0.5, -0.1),
          size: rand(1.5, 4), alpha: rand(0.3, 0.7), decay: rand(0.006, 0.015),
          color: `rgba(${rand(180, 220)},${rand(80, 120)},${rand(30, 60)},1)`, type: 'square',
          rot: rand(0, Math.PI), rotV: rand(-0.05, 0.05), life: 1,
        });
      }
    }
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, W: number, H: number, particles: Particle[]) {
  ctx.clearRect(0, 0, W, H);
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    if (!pt) continue;

    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.vy += 0.04; // gravity
    pt.life -= pt.decay;

    if (pt.life <= 0) { particles.splice(i, 1); continue; }

    pt.alpha = Math.max(0, pt.life * (pt.alpha / (pt.life + pt.decay)));
    if (pt.rot !== undefined && pt.rotV !== undefined) pt.rot += pt.rotV;

    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.life);
    if (pt.glow) { ctx.shadowBlur = 8; ctx.shadowColor = pt.color; }

    if (pt.type === 'circle') {
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, Math.PI * 2);
      ctx.fillStyle = pt.color; ctx.fill();
    } else if (pt.type === 'rect') {
      ctx.translate(pt.x, pt.y); ctx.rotate(pt.rot ?? 0);
      ctx.fillStyle = pt.color; ctx.fillRect(-(pt.w! / 2), -(pt.h! / 2), pt.w! * pt.life, pt.h!);
    } else if (pt.type === 'square') {
      ctx.translate(pt.x, pt.y); ctx.rotate(pt.rot ?? 0);
      const s = pt.size * pt.life;
      ctx.fillStyle = pt.color; ctx.fillRect(-s / 2, -s / 2, s, s);
    } else if (pt.type === 'teardrop') {
      ctx.translate(pt.x, pt.y);
      const r = pt.size * pt.life;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = pt.color; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-r * 0.4, 0); ctx.quadraticCurveTo(0, -r * 2, r * 0.4, 0);
      ctx.fillStyle = pt.color; ctx.fill();
    }

    ctx.restore();
  }
}
