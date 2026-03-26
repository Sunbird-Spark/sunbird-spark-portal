import placeholder1 from '@/assets/placeholders/placeholder-1.webp';
import placeholder2 from '@/assets/placeholders/placeholder-2.webp';
import placeholder3 from '@/assets/placeholders/placeholder-3.webp';
import placeholder4 from '@/assets/placeholders/placeholder-4.webp';
import placeholder5 from '@/assets/placeholders/placeholder-5.webp';

const PLACEHOLDER_IMAGES = [placeholder1, placeholder2, placeholder3, placeholder4, placeholder5];

/**
 * Returns a deterministic placeholder image based on a seed string
 * (e.g. content identifier), so the same item always shows the same image.
 */
export const getPlaceholderImage = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return PLACEHOLDER_IMAGES[Math.abs(hash) % PLACEHOLDER_IMAGES.length] || placeholder1;
};
