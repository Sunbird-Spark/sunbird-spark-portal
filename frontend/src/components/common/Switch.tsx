import React from "react";
import { cn } from "@/lib/utils";

export const SwitchToggle = ({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={cn(
      "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sunbird-brick/30 focus:ring-offset-2",
      checked ? "bg-sunbird-brick" : "bg-gray-300"
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
}

export const SwitchRow = ({ id, checked, onChange, label, valueLabel }: SwitchRowProps) => (
  <div className="flex items-center justify-between gap-4">
    <label htmlFor={id} className="text-sm font-medium text-foreground font-['Rubik'] cursor-pointer">
      {label}
    </label>
    <div className="flex items-center gap-2">
      {valueLabel && (
        <span
          className={cn(
            "text-xs font-medium font-['Rubik'] transition-colors",
            checked ? "text-sunbird-brick" : "text-muted-foreground"
          )}
        >
          {valueLabel}
        </span>
      )}
      <SwitchToggle id={id} checked={checked} onChange={onChange} />
    </div>
  </div>
);
