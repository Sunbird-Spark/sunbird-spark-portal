import React from "react";
import { cn } from "@/lib/utils";

export const SwitchToggle = ({
  id,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={cn(
      "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sunbird-brick/30 focus:ring-offset-2",
      checked ? "bg-sunbird-brick" : "bg-gray-300",
      disabled && "opacity-50 cursor-not-allowed"
    )}
  >
    <span
      className={cn(
        "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200",
        checked ? "translate-x-6" : "translate-x-1"
      )}
    />
  </button>
);

export interface SwitchRowProps {
  id: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  valueLabel?: string;
  disabled?: boolean;
}

export const SwitchRow = ({ id, checked, onChange, label, valueLabel, disabled }: SwitchRowProps) => (
  <div className={cn("flex items-center justify-between gap-4", disabled && "opacity-50 pointer-events-none")}>
    <label htmlFor={id} className="text-sm font-medium text-foreground font-rubik cursor-pointer">
      {label}
    </label>
    <div className="flex items-center gap-2">
      {valueLabel && (
        <span
          className={cn(
            "text-xs font-medium font-rubik transition-colors",
            checked ? "text-sunbird-brick" : "text-muted-foreground"
          )}
        >
          {valueLabel}
        </span>
      )}
      <SwitchToggle id={id} checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  </div>
);
