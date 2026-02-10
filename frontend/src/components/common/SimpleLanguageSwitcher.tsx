import React from 'react';
import { useAppI18n, type LanguageCode } from '../../hooks/useAppI18n';

export default function SimpleLanguageSwitcher() {
  const { languages, currentCode, changeLanguage } = useAppI18n();

  return (
    <label>
      <span className="sr-only">Language</span>
      <select
        value={currentCode}
        onChange={(e) => void changeLanguage(e.target.value as LanguageCode)}
        aria-label="Change language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </label>
  );
}
