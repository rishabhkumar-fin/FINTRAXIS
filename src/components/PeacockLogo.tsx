"use client";

import React from "react";

interface PeacockLogoProps {
  size?: "sm" | "md" | "lg";
  showLockup?: boolean;
  className?: string;
}

export function PeacockLogo({
  size = "md",
  showLockup = true,
  className = "",
}: PeacockLogoProps) {
  const iconDimensions = {
    sm: { w: 22, h: 22 },
    md: { w: 28, h: 28 },
    lg: { w: 36, h: 36 },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none shrink-0 ${className}`}>
      {/* Minimalist Monoline Vector Peacock Insignia */}
      <svg
        width={iconDimensions.w}
        height={iconDimensions.h}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105 duration-200"
      >
        {/* Central Spine */}
        <line
          x1="20"
          y1="8"
          x2="20"
          y2="34"
          stroke="#38BDF8"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Upper Outer Feather Curves */}
        <path
          d="M20 10 C13 13, 8 20, 20 28"
          stroke="#38BDF8"
          strokeWidth="1"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
        <path
          d="M20 10 C27 13, 32 20, 20 28"
          stroke="#38BDF8"
          strokeWidth="1"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />

        {/* Mid Contour Curves */}
        <path
          d="M20 14 C15 17, 12 22, 20 28"
          stroke="#38BDF8"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
        <path
          d="M20 14 C25 17, 28 22, 20 28"
          stroke="#38BDF8"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />

        {/* Central Eye of Vigilance */}
        <ellipse
          cx="20"
          cy="20"
          rx="4.5"
          ry="3"
          stroke="#38BDF8"
          strokeWidth="1"
          fill="#0B111E"
        />
        <circle cx="20" cy="20" r="1.5" fill="#38BDF8" />
      </svg>

      {/* Single-Line Pure Typography Lockup */}
      {showLockup && (
        <span className="whitespace-nowrap shrink-0 tracking-[0.25em] font-medium text-slate-100 text-xs uppercase font-mono">
          FINTRAXIS
        </span>
      )}
    </div>
  );
}
