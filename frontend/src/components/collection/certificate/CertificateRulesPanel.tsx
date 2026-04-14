import { FiChevronDown, FiAward } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { IssueTo } from "./types";
import { useAppI18n } from "@/hooks/useAppI18n";

const labelClass = "block text-sm font-medium text-sunbird-obsidian mb-1 font-rubik";
const inputClass = "w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sunbird-brick/40 focus:border-sunbird-brick bg-white font-rubik";

interface CertificateRulesPanelProps {
  issueTo: IssueTo;
  setIssueTo: (val: IssueTo) => void;
  issueToAccepted: boolean;
  setIssueToAccepted: (val: boolean) => void;
  selectedTemplate: any;
  showScoreRuleComponent: boolean;
  enableScoreRule: boolean;
  setEnableScoreRule: (val: boolean) => void;
  scoreRuleValue: string;
  setScoreRuleValue: (val: string) => void;
}

export function CertificateRulesPanel({
  issueTo,
  setIssueTo,
  issueToAccepted,
  setIssueToAccepted,
  selectedTemplate,
  showScoreRuleComponent,
  enableScoreRule,
  setEnableScoreRule,
  scoreRuleValue,
  setScoreRuleValue,
}: CertificateRulesPanelProps) {
  const { t } = useAppI18n();

  return (
    <div className="flex-1 border-r border-border p-6 space-y-5 overflow-y-auto">
      <h3 className="text-sm font-semibold text-sunbird-obsidian font-rubik uppercase tracking-wide">
        {t('certificate.rules')}
      </h3>

      <div>
        <label htmlFor="issueTo" className={labelClass}>
          {t('certificate.issueTo')}
        </label>
        <div className="relative">
          <select
            id="issueTo"
            value={issueTo}
            onChange={(e) => setIssueTo(e.target.value as IssueTo)}
            className={cn(inputClass, "appearance-none pr-8 cursor-pointer")}
          >
            <option value="all">{t('certificate.issueToAll')}</option>
            <option value="org">{t('certificate.issueToOrg')}</option>
          </select>
          <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div>
        <label htmlFor="progressRule" className={labelClass}>
          {t('certificate.progressRule')}
        </label>
        <input
          id="progressRule"
          type="number"
          min={1}
          max={100}
          className={`${inputClass} bg-gray-100 cursor-not-allowed text-muted-foreground`}
          value="100"
          disabled
          aria-readonly="true"
        />
      </div>

      {showScoreRuleComponent && !enableScoreRule && (
        <div>
          <button
            type="button"
            onClick={() => setEnableScoreRule(true)}
            className="flex items-center gap-1 text-sm font-medium text-sunbird-brick hover:underline font-rubik"
          >
            {t('certificate.addScoreRule')}
          </button>
        </div>
      )}

      {enableScoreRule && (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-gray-50 flex justify-between items-center">
            <span className="text-xs font-semibold text-sunbird-obsidian font-rubik uppercase tracking-wide">
              {t('certificate.scoreRule')}
            </span>
            <button
              type="button"
              onClick={() => {
                setEnableScoreRule(false);
                setScoreRuleValue("90");
              }}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors"
              aria-label={t('certificate.removeScoreRule')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div className="px-4 py-4 flex items-center gap-3">
            <label htmlFor="scoreRuleValue" className="text-sm font-medium text-sunbird-obsidian font-rubik whitespace-nowrap">
              {t('certificate.bestAttemptedScore')}
            </label>
            <span className="text-lg font-medium text-sunbird-obsidian font-rubik">{">="}</span>
            <div className="relative w-32">
              <input
                id="scoreRuleValue"
                type="number"
                min={1}
                max={100}
                className={cn(inputClass, "pr-8 text-right")}
                value={scoreRuleValue}
                onChange={(e) => setScoreRuleValue(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-rubik pointer-events-none">
                %
              </span>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className={cn(labelClass, "flex items-center gap-1")}>
          {t('certificate.condition')}
          <span className="text-red-500">*</span>
        </label>
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={issueToAccepted}
              onChange={(e) => setIssueToAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-amber-400 accent-sunbird-brick cursor-pointer"
            />
            <span className="text-xs text-amber-800 font-rubik leading-relaxed">
              {t('certificate.rulesConsent')}
            </span>
          </label>
        </div>
      </div>

      <div>
        <label className={labelClass}>{t('certificate.selectedTemplate')}</label>
        <div
          className={cn(
            "rounded-xl border-2 border-dashed overflow-hidden transition-all",
            selectedTemplate ? "border-sunbird-brick/40 bg-white" : "border-border bg-gray-50"
          )}
        >
          {selectedTemplate ? (
            <div>
              <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                {selectedTemplate.previewUrl ? (
                  <img
                    src={selectedTemplate.previewUrl}
                    alt={selectedTemplate.name}
                    className="object-contain w-full h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FiAward className="w-8 h-8" />
                    <span className="text-xs font-rubik">{t('certificate.noPreview')}</span>
                  </div>
                )}
              </div>
              <div className="px-3 py-2 border-t border-border bg-white">
                <p className="text-xs font-medium font-rubik text-foreground">
                  {selectedTemplate.name}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
              <FiAward className="w-8 h-8" />
              <p className="text-xs font-rubik">{t('certificate.selectFromPanel')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
