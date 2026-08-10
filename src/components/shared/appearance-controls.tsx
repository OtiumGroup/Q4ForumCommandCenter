"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Minus, Plus } from "lucide-react";
import { useFontSize } from "./font-size-provider";

const THEMES = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "Auto", Icon: Monitor },
];
const SIZE_LABELS = ["Small", "Medium", "Large", "Extra large"];

export function AppearanceControls() {
  const { theme, setTheme } = useTheme();
  const { scale, setScale, steps } = useFontSize();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- defer theme-dependent UI past hydration
    setMounted(true);
  }, []);

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Theme</p>
        <div className="grid grid-cols-3 gap-1.5">
          {THEMES.map(({ value, label, Icon }) => {
            const active = mounted && theme === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors ${
                  active ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:bg-secondary/60"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Text size</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Smaller text"
            onClick={() => setScale(scale - 1)}
            disabled={scale <= 0}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-secondary/60 disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="flex flex-1 items-center justify-center gap-1">
            {Array.from({ length: steps }).map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i <= scale ? "w-6 bg-accent" : "w-3 bg-border"}`} />
            ))}
          </div>
          <button
            type="button"
            aria-label="Larger text"
            onClick={() => setScale(scale + 1)}
            disabled={scale >= steps - 1}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-secondary/60 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-center text-[11px] text-muted-foreground">{SIZE_LABELS[scale]}</p>
      </div>
    </div>
  );
}
