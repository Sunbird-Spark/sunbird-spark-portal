import { useId } from "react";
import * as Checkbox from "@radix-ui/react-checkbox";
import { FiCheck } from "react-icons/fi";
import { TermsAndConditionsDialog } from "@/components/common/TermsAndConditionsDialog";
import { useSystemSetting } from "@/hooks/useSystemSetting";
import { useGetTncUrl } from "@/hooks/useTnc";

interface TncCheckboxRowProps {
  checked: boolean;
  onCheckedChange: (checked: boolean | "indeterminate") => void;
  /** System setting key to fetch TnC config from. Defaults to 'tncConfig'. */
  settingKey?: string;
  /** Trailing label text after "I accept the Terms & Conditions". */
  label?: string;
  /** When provided, clicking "Terms & Conditions" calls this instead of opening its own dialog. */
  onTermsClick?: () => void;
}

/** T&C checkbox row. Clicking "Terms & Conditions" opens the TermsAndConditionsDialog.
 *  Use `settingKey` to target a specific TnC config (e.g. 'orgAdminTnc', 'reportViewerTnc').
 *  Use `onTermsClick` to handle the dialog externally (avoids nested dialog issues). */
export const TncCheckboxRow = ({
  checked,
  onCheckedChange,
  settingKey = "tncConfig",
  label = "for creating this batch.",
  onTermsClick,
}: TncCheckboxRowProps) => {
  const id = useId();
  const { data: tncRes } = useSystemSetting(settingKey);
  const { data: globalTncRes } = useSystemSetting("tncConfig");

  // Pass the full ApiResponse to useGetTncUrl so parseTncConfig can traverse
  // apiResponse.data.response.value (AxiosAdapter already unwraps the result layer)
  const rawConfig = tncRes ?? globalTncRes ?? null;
  const { data: termsUrl } = useGetTncUrl(rawConfig);

  return (
    // Outer div (not a label) so the T&C button is never inside a <label>.
    // Label activation (htmlFor → checkbox) is confined to the plain-text spans only.
    <div className="flex items-center gap-3 select-none">
      <Checkbox.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        required
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-sunbird-brick data-[state=checked]:bg-sunbird-brick data-[state=checked]:text-white focus:outline-none focus:ring-2 focus:ring-sunbird-brick/40"
      >
        <Checkbox.Indicator>
          <FiCheck className="w-3 h-3" />
        </Checkbox.Indicator>
      </Checkbox.Root>

      <span className="text-sm text-foreground font-['Rubik']">
        {/* Clicking "I accept the" text toggles the checkbox */}
        <label htmlFor={id} className="cursor-pointer">I accept the{" "}</label>
        {termsUrl ? (
          onTermsClick ? (
            // Plain button — NOT inside a <label>, so it cannot accidentally
            // re-dispatch to the checkbox via browser label-activation.
            <button
              type="button"
              aria-label="Terms &amp; Conditions"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onTermsClick(); }}
              className="underline text-sunbird-brick hover:opacity-80 font-medium"
            >
              Terms &amp; Conditions
            </button>
          ) : (
            <TermsAndConditionsDialog termsUrl={termsUrl} title="Terms &amp; Conditions">
              <button
                type="button"
                aria-label="Terms &amp; Conditions"
                className="underline text-sunbird-brick hover:opacity-80 font-medium"
              >
                Terms &amp; Conditions
              </button>
            </TermsAndConditionsDialog>
          )
        ) : (
          <span className="font-medium">Terms &amp; Conditions</span>
        )}
        {/* Clicking the trailing label text also toggles the checkbox */}
        {" "}
        <label htmlFor={id} className="cursor-pointer">
          {label}
          <span className="text-red-500 ml-0.5">*</span>
        </label>
      </span>
    </div>
  );
};
