import { describe, it, expect } from 'vitest';
import en from './en.json';
import fr from './fr.json';
import pt from './pt.json';
import ar from './ar.json';

/** Guards against locale drift for the Learning Path namespace and its contentTypes entries. */
describe('learningPath locale parity', () => {
  const locales: Record<string, Record<string, unknown>> = {
    en: en as Record<string, unknown>,
    fr: fr as Record<string, unknown>,
    pt: pt as Record<string, unknown>,
    ar: ar as Record<string, unknown>,
  };

  const enKeys = Object.keys(en.learningPath).sort();

  it.each(Object.entries(locales))('%s has a learningPath namespace with the same keys as en', (name, locale) => {
    const namespace = locale.learningPath as Record<string, string> | undefined;
    expect(namespace).toBeDefined();
    expect(Object.keys(namespace ?? {}).sort()).toEqual(enKeys);
  });

  it.each(Object.entries(locales))('%s has no empty learningPath translation values', (_name, locale) => {
    const namespace = locale.learningPath as Record<string, string>;
    Object.entries(namespace).forEach(([key, value]) => {
      expect(value, `learningPath.${key}`).toBeTypeOf('string');
      expect(value.trim().length, `learningPath.${key}`).toBeGreaterThan(0);
    });
  });

  it.each(Object.entries(locales))('%s has contentTypes.level and contentTypes.learningpath', (_name, locale) => {
    const contentTypes = locale.contentTypes as Record<string, string> | undefined;
    expect(contentTypes?.level).toBeTruthy();
    expect(contentTypes?.learningpath).toBeTruthy();
  });
});
