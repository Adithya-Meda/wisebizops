"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  className?: string; // Trigger styling
  menuClassName?: string; // Popup menu styling
}

export function CustomSelect({ options, value, onChange, className, menuClassName }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label || value;

  return (
    <div className="relative min-w-max" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full ${className}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="w-4 h-4 ml-2 opacity-70 flex-shrink-0" />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 z-50 min-w-full mt-2 rounded-2xl bg-white dark:bg-[#0a0a0a] backdrop-blur-3xl border border-primary-400/50 dark:border-primary-500/40 shadow-[0_10px_40px_rgba(0,0,0,0.15),inset_1px_1px_3px_rgba(255,255,255,0.6)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.6),inset_1px_1px_2px_rgba(255,255,255,0.1)] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 p-1.5 ${
            menuClassName || ""
          }`}
        >
          <div className="max-h-60 overflow-y-auto pr-1.5 mr-0.5 custom-scrollbar">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 text-sm cursor-pointer rounded-xl transition-colors whitespace-nowrap ${
                  value === opt.value
                    ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
