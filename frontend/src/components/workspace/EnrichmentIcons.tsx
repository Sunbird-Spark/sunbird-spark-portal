import { enrichmentDefinitionsFor } from "@/services/enrichment/registry";
import { useAppI18n } from "@/hooks/useAppI18n";

interface EnrichmentIconsProps {
  /** `Content.enrichmentTypes` of the item. */
  types?: readonly string[];
  className?: string;
}

/** One small badge per enrichment type the content requested (e.g. closed captions for Transcript).
 *  Renders nothing when there are none, so callers can drop it in unconditionally. */
const EnrichmentIcons = ({ types, className = "w-3.5 h-3.5" }: EnrichmentIconsProps) => {
  const { t } = useAppI18n();
  const definitions = enrichmentDefinitionsFor(types);
  if (definitions.length === 0) return null;

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-sunbird-theme-accent">
      {definitions.map(({ type, icon: Icon, labelKey }) => (
        <span key={type} title={t(labelKey)} aria-label={t(labelKey)} role="img" className="inline-flex">
          <Icon className={className} aria-hidden="true" />
        </span>
      ))}
    </span>
  );
};

export default EnrichmentIcons;
