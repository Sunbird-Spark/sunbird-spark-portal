import React from "react";
import * as Checkbox from "@radix-ui/react-checkbox";
import { FiCheck } from "react-icons/fi";

export interface CheckboxRowProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean | "indeterminate") => void;
  label: string;
  required?: boolean;
}

export const CheckboxRow = ({ id, checked, onCheckedChange, label, required }: CheckboxRowProps) => (
  <label htmlFor={id} className="flex items-center gap-3 cursor-pointer select-none">
    <Checkbox.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      required={required}
      className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-sunbird-brick data-[state=checked]:bg-sunbird-brick data-[state=checked]:text-white focus:outline-none focus:ring-2 focus:ring-sunbird-brick/40"
    >
      <Checkbox.Indicator>
        <FiCheck className="w-3 h-3" />
      </Checkbox.Indicator>
    </Checkbox.Root>
    <span className="text-sm text-foreground font-rubik">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
  </label>
);
