import { describe, it, expect, vi } from 'vitest';
import {
  applyLogoState,
  spawnParticles,
  drawParticles,
  type Particle,
  type SubVariant,
} from './dissolveParticles';

// Progress value in the middle of each variant's active spawn window.
const MID_P: Record<SubVariant, number> = {
  classic: 0.5,
  ember: 0.43,
  shatter: 0.4,
  melt: 0.44,
  ashes: 0.4,
};

// spawnParticles emits probabilistically (via randomFloat); at mid-window the
// spawn chance is ~0.3-0.5 per call, so a few hundred attempts make a spawn
// a statistical certainty while exercising both branches of the random check.
const spawnUntilOne = (sv: SubVariant): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < 1000 && particles.length === 0; i++) {
    spawnParticles(MID_P[sv], sv, 200, 100, particles);
  }
  return particles;
};

const makeParticle = (overrides: Partial<Particle> = {}): Particle => ({
  x: 10,
  y: 10,
  vx: 0.1,
  vy: -0.5,
  size: 3,
  alpha: 0.8,
  decay: 0.01,
  life: 1,
  color: '#dc7727',
  type: 'circle',
  ...overrides,
});

const makeCtx = () => ({
  clearRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  fillRect: vi.fn(),
  moveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  globalAlpha: 1,
  shadowBlur: 0,
  shadowColor: '',
  fillStyle: '',
});

describe('spawnParticles', () => {
  it.each([
    ['classic', 'circle'],
    ['ember', 'circle'],
    ['shatter', 'rect'],
    ['melt', 'teardrop'],
    ['ashes', 'square'],
  ] as [SubVariant, string][])(
    'spawns a %s particle of type %s inside the active window',
    (sv, type) => {
      const particles = spawnUntilOne(sv);
      expect(particles.length).toBeGreaterThan(0);
      const pt = particles[0]!;
      expect(pt.type).toBe(type);
      expect(pt.life).toBe(1);
      expect(typeof pt.color).toBe('string');
      expect(pt.color.length).toBeGreaterThan(0);
      expect(Number.isFinite(pt.x)).toBe(true);
      expect(Number.isFinite(pt.y)).toBe(true);
      expect(Number.isFinite(pt.vx)).toBe(true);
      expect(Number.isFinite(pt.vy)).toBe(true);
      expect(Number.isFinite(pt.size)).toBe(true);
      expect(pt.decay).toBeGreaterThan(0);
    }
  );

  it('does not spawn outside the progress window', () => {
    const particles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      spawnParticles(0.05, 'classic', 200, 100, particles);
      spawnParticles(0.95, 'ember', 200, 100, particles);
    }
    expect(particles).toHaveLength(0);
  });

  it('stops spawning above the 200-particle safety limit', () => {
    const particles: Particle[] = Array.from({ length: 201 }, () => makeParticle());
    for (let i = 0; i < 50; i++) {
      spawnParticles(MID_P.classic, 'classic', 200, 100, particles);
    }
    expect(particles).toHaveLength(201);
  });
});

describe('drawParticles', () => {
  it('draws every particle type and updates physics', () => {
    const ctx = makeCtx();
    const particles = [
      makeParticle({ type: 'circle', glow: true }),
      makeParticle({ type: 'rect', rot: 0, rotV: 0.1, w: 8, h: 4 }),
      makeParticle({ type: 'square', rot: 0.2 }),
      makeParticle({ type: 'teardrop' }),
    ];
    drawParticles(ctx as unknown as CanvasRenderingContext2D, 200, 100, particles);

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 200, 100);
    expect(ctx.arc).toHaveBeenCalled(); // circle + teardrop
    expect(ctx.fillRect).toHaveBeenCalledTimes(2); // rect + square
    expect(ctx.quadraticCurveTo).toHaveBeenCalledTimes(1); // teardrop
    expect(ctx.save).toHaveBeenCalledTimes(4);
    expect(ctx.restore).toHaveBeenCalledTimes(4);

    // Physics: position advanced by velocity, gravity applied, life decayed,
    // rotation advanced by rotV.
    const circle = particles.find((p) => p.type === 'circle')!;
    expect(circle.x).toBeCloseTo(10.1);
    expect(circle.vy).toBeCloseTo(-0.46);
    expect(circle.life).toBeCloseTo(0.99);
    const rect = particles.find((p) => p.type === 'rect')!;
    expect(rect.rot).toBeCloseTo(0.1);
  });

  it('removes particles whose life runs out', () => {
    const ctx = makeCtx();
    const particles = [makeParticle({ life: 0.005, decay: 0.01 })];
    drawParticles(ctx as unknown as CanvasRenderingContext2D, 200, 100, particles);
    expect(particles).toHaveLength(0);
    // Dead particles are removed before any drawing happens for them.
    expect(ctx.arc).not.toHaveBeenCalled();
  });
});

describe('applyLogoState', () => {
  it.each(['classic', 'ember', 'shatter', 'melt', 'ashes'] as SubVariant[])(
    'returns valid styles across the %s cycle',
    (sv) => {
      for (const p of [0.1, 0.45, 0.7, 0.9]) {
        const style = applyLogoState(p, sv);
        expect(Number(style.opacity)).toBeGreaterThanOrEqual(0);
        expect(Number(style.opacity)).toBeLessThanOrEqual(1);
        expect(typeof style.filter).toBe('string');
        expect(typeof style.transform).toBe('string');
      }
    }
  );
});
