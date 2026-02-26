import * as Checkbox from "@radix-ui/react-checkbox";
import { FiCheck } from "react-icons/fi";
import { TermsAndConditionsDialog } from "@/components/common/TermsAndConditionsDialog";
import { useSystemSetting } from "@/hooks/useSystemSetting";
import { useGetTncUrl } from "@/hooks/useTnc";

interface TncCheckboxRowProps {
  checked: boolean;
  onCheckedChange: (checked: boolean | "indeterminate") => void;
}

/** T&C checkbox for the Create Batch modal.
 *  Clicking "Terms & Conditions" opens the TermsAndConditionsDialog. */
export const TncCheckboxRow = ({ checked, onCheckedChange }: TncCheckboxRowProps) => {
  const { data: tncConfig, isSuccess } = useSystemSetting("tncConfig");
  const { data: termsUrl } = useGetTncUrl(isSuccess ? tncConfig : null);

  return (
    <label htmlFor="acceptTerms" className="flex items-center gap-3 cursor-pointer select-none">
      <Checkbox.Root
        id="acceptTerms"
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
        I accept the{" "}
        {termsUrl ? (
          <TermsAndConditionsDialog termsUrl={termsUrl} title="Terms &amp; Conditions">
            <button
              type="button"
              aria-label="Terms &amp; Conditions"
              onClick={(e) => e.stopPropagation()}
              className="underline text-sunbird-brick hover:opacity-80 font-medium"
            >
              Terms &amp; Conditions
            </button>
          </TermsAndConditionsDialog>
        ) : (
          <span className="font-medium">Terms &amp; Conditions</span>
        )}{" "}
        for creating this batch.
        <span className="text-red-500 ml-0.5">*</span>
      </span>
    </label>
  );
};
