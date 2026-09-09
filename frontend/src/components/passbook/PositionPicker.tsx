import { useAppI18n } from '@/hooks/useAppI18n';

interface PositionPickerProps {
  positions: string[];
  selected?: string;
  labelFor: (code: string) => string;
  onSelect: (code: string) => void;
}

/**
 * Target-position selector, as a pill group matching `MySkillsControls`' tab
 * group rather than a dropdown - a framework declares a handful of positions,
 * and the portal has no dropdown precedent in this style.
 *
 * Only positions that declare at least one requirement are passed in (see
 * `normaliseFrameworkMeta`): a requirement-less position would report 100%
 * readiness for everyone, which on a mis-authored framework is exactly the
 * misleading result to avoid.
 */
export function PositionPicker({ positions, selected, labelFor, onSelect }: PositionPickerProps) {
  const { t } = useAppI18n();
  if (positions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2" data-testid="position-picker">
      <span className="text-xs font-medium text-sunbird-gray-75">{t('passbook.targetPosition')}</span>
      <div className="flex flex-wrap gap-1 rounded-lg bg-sunbird-ivory p-1" role="tablist">
        {positions.map((code) => {
          const isActive = code === selected;
          return (
            <button
              key={code}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(code)}
              data-testid={`position-option-${code}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-sunbird-brick shadow-sunbird-sm'
                  : 'text-sunbird-gray-75 hover:text-foreground'
              }`}
            >
              {labelFor(code)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
