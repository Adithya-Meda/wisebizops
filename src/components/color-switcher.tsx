"use client";
import * as React from "react";
import { Palette } from "lucide-react";
import { useEffect, useState } from "react";

const colors = [
  { name: "Emerald", value: "emerald", hex: "#10b981" },
  { name: "Lavender", value: "lavender", hex: "#8b5cf6" },
  { name: "Blue", value: "blue", hex: "#3b82f6" },
  { name: "Yellow", value: "yellow", hex: "#facc15" }
];

export function ColorSwitcher() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState("emerald");
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedColor = localStorage.getItem("color-theme") || "emerald";
    setCurrentColor(savedColor);
    document.documentElement.setAttribute("data-color", savedColor);

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeColor = (color: string) => {
    setCurrentColor(color);
    localStorage.setItem("color-theme", color);
    document.documentElement.setAttribute("data-color", color);
    setIsOpen(false);
  };

  if (!mounted) return <div className="w-8 h-8 rounded-md" />; // placeholder

  return (
    <div className="relative z-50" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.3),inset_-1.5px_-1.5px_3px_rgba(var(--primary-rgb),0.8),2px_2px_5px_rgba(0,0,0,0.15)] hover:shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(var(--primary-rgb),0.9),3px_3px_8px_rgba(0,0,0,0.2)] active:shadow-[inset_0.5px_0.5px_1px_rgba(255,255,255,0.2),inset_-0.5px_-0.5px_1px_rgba(var(--primary-rgb),0.5),1px_1px_2px_rgba(0,0,0,0.05)] active:scale-95 transition-all duration-200"
        title="Change Theme Color"
        style={{ backgroundColor: `var(--color-primary-600)` }}
      >
        <Palette className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 w-auto min-w-[140px] rounded-2xl bg-white dark:bg-[#0a0a0a] backdrop-blur-3xl border border-emerald-400/50 dark:border-emerald-500/40 shadow-[0_10px_40px_rgba(0,0,0,0.15),inset_1px_1px_3px_rgba(255,255,255,0.6)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.6),inset_1px_1px_2px_rgba(255,255,255,0.1)] animate-in fade-in zoom-in-95 slide-in-from-right-2 duration-200 p-2 overflow-hidden"
             style={{ borderColor: `rgba(var(--primary-rgb), 0.5)` }}>
          <div className="flex flex-row items-center justify-center gap-3">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => changeColor(color.value)}
                title={color.name}
                className={`flex items-center justify-center p-1 rounded-full transition-all ${
                  currentColor === color.value
                    ? "scale-110 shadow-sm"
                    : "hover:scale-110 hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100"
                }`}
                style={currentColor === color.value ? {
                   backgroundColor: `rgba(var(--primary-rgb), 0.15)`,
                } : {}}
              >
                <span
                  className="w-5 h-5 rounded-full flex-shrink-0 border border-black/10 dark:border-white/10 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4)]"
                  style={{ backgroundColor: color.hex }}
                ></span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
