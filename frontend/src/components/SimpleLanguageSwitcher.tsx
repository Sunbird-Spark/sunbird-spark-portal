import { useAppI18n } from '../hooks/useAppI18n';

export default function SimpleLanguageSwitcher() {
  const { languages, currentCode, changeLanguage } = useAppI18n();

  return (
    <label>
      <span className="sr-only">Language</span>
      <select
        value={currentCode}
        onChange={(e) => void changeLanguage(e.target.value as any)}
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
