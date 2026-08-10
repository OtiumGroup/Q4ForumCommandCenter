"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// Build a maps URL for the current device: Apple Maps on Apple platforms
// (opens the native Maps app from the https universal link), Google Maps
// everywhere else. Computed at click time so there's no SSR/hydration skew.
function mapsUrl(address: string) {
  const q = encodeURIComponent(address);
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isApple = /iPhone|iPad|iPod|Macintosh/.test(ua);
  return isApple
    ? `https://maps.apple.com/?q=${q}`
    : `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/**
 * A tappable address. Rendered as a role="link" span (not an <a>) so it is
 * safe to place inside other links — e.g. the Home "Coming up" cards — where a
 * nested anchor would be invalid. preventDefault + stopPropagation keep a click
 * from also triggering any surrounding link.
 */
export function AddressLink({
  address,
  className,
  iconClassName,
  showIcon = true,
}: {
  address: string;
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
}) {
  function open(e: MouseEvent | KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
    window.open(mapsUrl(address), "_blank", "noopener,noreferrer");
  }

  return (
    <span
      role="link"
      tabIndex={0}
      aria-label={`Open ${address} in Maps`}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") open(e);
      }}
      className={cn(
        "inline-flex cursor-pointer items-start gap-1.5 underline-offset-2 hover:underline",
        className
      )}
    >
      {showIcon && <MapPin className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", iconClassName)} />}
      <span>{address}</span>
    </span>
  );
}
