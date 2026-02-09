"use client";

import * as React from "react";

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (value: boolean) => void;
}

export const Switch = ({
  checked = false,
  onCheckedChange,
}: SwitchProps) => {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange?.(!checked)}
      className={`
        relative inline-flex items-center rounded-full transition-colors duration-200
        h-7 w-12 sm:h-6 sm:w-10
        ${checked ? "bg-green-600" : "bg-gray-600"}
      `}
    >
      <span
        className={`
          inline-block rounded-full bg-white transition-transform duration-200
          h-5 w-5 sm:h-4 sm:w-4
          ${checked ? "translate-x-6 sm:translate-x-5" : "translate-x-1"}
        `}
      />
    </button>
  );
};
