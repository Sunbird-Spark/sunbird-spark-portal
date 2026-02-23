import { FiChevronDown, FiAward } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { IssueTo } from "./types";

const labelClass = "block text-sm font-medium text-sunbird-obsidian mb-1 font-['Rubik']";
const inputClass = "w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sunbird-brick/40 focus:border-sunbird-brick bg-white font-['Rubik']";

interface CertificateRulesPanelProps {
  issueTo: IssueTo;
  setIssueTo: (val: IssueTo) => void;
  progressRule: string;
  setProgressRule: (val: string) => void;
  issueToAccepted: boolean;
  setIssueToAccepted: (val: boolean) => void;
  selectedTemplate: any;
}

export function CertificateRulesPanel({
  issueTo,
  setIssueTo,
  progressRule,
  setProgressRule,
  issueToAccepted,
  setIssueToAccepted,
  selectedTemplate,
}: CertificateRulesPanelProps) {
  return (
    <div className="flex-1 border-r border-border p-6 space-y-5 overflow-y-auto">
      <h3 className="text-sm font-semibold text-sunbird-obsidian font-['Rubik'] uppercase tracking-wide">
        Certificate Rules
      </h3>

      <div>
        <label htmlFor="issueTo" className={labelClass}>
          Issue Certificate To
        </label>
        <div className="relative">
          <select
            id="issueTo"
            value={issueTo}
            onChange={(e) => setIssueTo(e.target.value as IssueTo)}
            className={cn(inputClass, "appearance-none pr-8 cursor-pointer")}
          >
            <option value="all">All</option>
            <option value="org">My Organisation Users</option>
          </select>
          <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div>
        <label htmlFor="progressRule" className={labelClass}>
          Progress Rule (%)
        </label>
        <input
          id="progressRule"
          type="number"
          min={1}
          max={100}
          className={inputClass}
          value={progressRule}
          onChange={(e) => setProgressRule(e.target.value)}
        />
      </div>

      <div>
        <label className={cn(labelClass, "flex items-center gap-1")}>
          Condition
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
            <span className="text-xs text-amber-800 font-['Rubik'] leading-relaxed">
              All the elements and attributes are thoroughly verified and I agree to issue
              the certificate as per the rules set above.
            </span>
          </label>
        </div>
      </div>

      <div>
        <label className={labelClass}>Selected Template</label>
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
                    <span className="text-xs font-['Rubik']">No preview</span>
                  </div>
                )}
              </div>
              <div className="px-3 py-2 border-t border-border bg-white">
                <p className="text-xs font-medium font-['Rubik'] text-foreground">
                  {selectedTemplate.name}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
              <FiAward className="w-8 h-8" />
              <p className="text-xs font-['Rubik']">Select a template from the right panel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
