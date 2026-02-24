import { OnboardingFormData, OnboardingField, OnboardingScreen } from '@/types/formTypes';

// Trace the canonical path (screen-level next, then first field with a next)
// to determine total number of steps for the progress indicator
export const computeTotalSteps = (data: OnboardingFormData): number => {
  let current: string | undefined = data.initialScreenId;
  let count = 0;
  const visited = new Set<string>();
  
  while (current && !visited.has(current)) {
    visited.add(current);
    count++;
    const screenData: OnboardingScreen | undefined = data.screens[current];
    if (!screenData) break;
    current = screenData.nextScreenId ?? screenData.fields.find((f: OnboardingField) => f.nextScreenId)?.nextScreenId;
  }
  
  return count;
};
