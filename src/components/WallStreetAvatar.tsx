"use client";

import React from "react";

export type AvatarPresetId = "skyline" | "nyse" | "bull" | "crest" | "custom";

export interface AvatarPreset {
  id: AvatarPresetId;
  name: string;
  subtitle: string;
  tag: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "skyline",
    name: "Manhattan Dusk Skyline",
    subtitle: "Midtown Financial District",
    tag: "NYC 10005",
  },
  {
    id: "nyse",
    name: "NYSE Classical Facade",
    subtitle: "11 Wall Street Greek Portico",
    tag: "EST. 1792",
  },
  {
    id: "bull",
    name: "Capital Markets Bull",
    subtitle: "Bowling Green Bronze Hall",
    tag: "ALPHA DESK",
  },
  {
    id: "crest",
    name: "Executive Monogram Crest",
    subtitle: "Sovereign Private Bank Hallmark",
    tag: "ZÜRICH",
  },
];

interface WallStreetAvatarProps {
  avatarId?: AvatarPresetId | string;
  customUrl?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function WallStreetAvatar({
  avatarId = "skyline",
  customUrl,
  size = "md",
  className = "",
}: WallStreetAvatarProps) {
  const sizeMap = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  const containerClass = `relative shrink-0 rounded overflow-hidden border border-[#2A364F] flex items-center justify-center bg-[#0B0F17] ${sizeMap[size]} ${className}`;

  if (avatarId === "custom" && customUrl) {
    return (
      <div className={containerClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={customUrl}
          alt="Analyst Avatar"
          className="w-full h-full object-cover"
          onError={(e) => {
            // fallback to skyline if custom image fails to load
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      </div>
    );
  }

  if (avatarId === "nyse") {
    return (
      <div className={containerClass} title="NYSE Classical Facade">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1"
        >
          <rect width="48" height="48" rx="4" fill="#0A0E17" />
          {/* Triangular Pediment */}
          <polygon points="24,8 6,17 42,17" fill="#38BDF8" fillOpacity="0.2" stroke="#38BDF8" strokeWidth="1.5" />
          <circle cx="24" cy="13.5" r="1.5" fill="#38BDF8" />
          {/* Entablature */}
          <rect x="7" y="17" width="34" height="2.5" fill="#1E2536" stroke="#38BDF8" strokeWidth="1" />
          {/* Classical Columns */}
          <line x1="11" y1="19.5" x2="11" y2="38" stroke="#E2E8F0" strokeWidth="1.8" />
          <line x1="16" y1="19.5" x2="16" y2="38" stroke="#CBD5E1" strokeWidth="1.8" />
          <line x1="21.5" y1="19.5" x2="21.5" y2="38" stroke="#38BDF8" strokeWidth="1.8" />
          <line x1="26.5" y1="19.5" x2="26.5" y2="38" stroke="#38BDF8" strokeWidth="1.8" />
          <line x1="32" y1="19.5" x2="32" y2="38" stroke="#CBD5E1" strokeWidth="1.8" />
          <line x1="37" y1="19.5" x2="37" y2="38" stroke="#E2E8F0" strokeWidth="1.8" />
          {/* Base Plinth Steps */}
          <rect x="7" y="38" width="34" height="3" fill="#1E2536" stroke="#38BDF8" strokeWidth="1" />
          <rect x="5" y="41" width="38" height="2" fill="#080B10" stroke="#2A364F" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  if (avatarId === "bull") {
    return (
      <div className={containerClass} title="Capital Markets Bull">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1"
        >
          <rect width="48" height="48" rx="4" fill="#080B10" />
          {/* Charging Bull Silhouette Vector */}
          {/* Left Horn */}
          <path d="M12 18 C10 13, 14 9, 18 13 C16 16, 14 17, 12 18 Z" fill="#38BDF8" />
          {/* Right Horn */}
          <path d="M36 18 C38 13, 34 9, 30 13 C32 16, 34 17, 36 18 Z" fill="#38BDF8" />
          {/* Muscular Head & Brow */}
          <path
            d="M17 14 L31 14 L34 23 L28 32 L20 32 L14 23 Z"
            fill="#172033"
            stroke="#38BDF8"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Snout & Nostrils */}
          <rect x="20" y="27" width="8" height="4" rx="2" fill="#38BDF8" fillOpacity="0.3" stroke="#38BDF8" strokeWidth="1" />
          <circle cx="22.5" cy="29" r="0.8" fill="#F8FAFC" />
          <circle cx="25.5" cy="29" r="0.8" fill="#F8FAFC" />
          {/* Eyes of Vigilance */}
          <circle cx="19" cy="20" r="1.3" fill="#38BDF8" />
          <circle cx="29" cy="20" r="1.3" fill="#38BDF8" />
          {/* Base Pedestal */}
          <path d="M10 40 L38 40" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 2" />
        </svg>
      </div>
    );
  }

  if (avatarId === "crest") {
    return (
      <div className={containerClass} title="Executive Monogram Crest">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1"
        >
          <rect width="48" height="48" rx="4" fill="#0A0E17" />
          {/* Heraldic Shield */}
          <path
            d="M24 7 L39 12 C39 26, 31 38, 24 41 C17 38, 9 26, 9 12 Z"
            fill="#111622"
            stroke="#38BDF8"
            strokeWidth="1.5"
          />
          {/* Inner Golden Ratio Oval */}
          <ellipse cx="24" cy="22" rx="8" ry="10" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.5" />
          {/* Monogram FX / Alpha Symbol */}
          <text
            x="24"
            y="26"
            textAnchor="middle"
            fill="#F8FAFC"
            fontSize="12"
            fontFamily="monospace"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            FX
          </text>
          {/* Sovereign Star */}
          <polygon points="24,11 25.2,14 28,14.5 26,16.5 26.5,19.5 24,18 21.5,19.5 22,16.5 20,14.5 22.8,14" fill="#38BDF8" />
        </svg>
      </div>
    );
  }

  // Default: Manhattan Dusk Skyline
  return (
    <div className={containerClass} title="Manhattan Dusk Skyline">
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-0.5"
      >
        <rect width="48" height="48" rx="4" fill="#070A10" />
        {/* Dusk Horizon Gradient Sky */}
        <rect x="3" y="3" width="42" height="42" fill="#0C1322" />
        {/* Background Towers */}
        <rect x="8" y="20" width="7" height="24" fill="#162033" />
        <rect x="33" y="18" width="8" height="26" fill="#162033" />
        {/* Central One WTC / Spire Tower */}
        <polygon points="24,5 23,12 25,12" fill="#38BDF8" />
        <rect x="20" y="12" width="8" height="32" fill="#1E2B45" stroke="#38BDF8" strokeWidth="1" />
        {/* Secondary Front Skyscraper */}
        <rect x="11" y="25" width="8" height="19" fill="#253554" stroke="#2A364F" strokeWidth="0.8" />
        <rect x="29" y="22" width="9" height="22" fill="#253554" stroke="#2A364F" strokeWidth="0.8" />
        {/* Illuminated Window Matrix Points */}
        <circle cx="22" cy="18" r="0.7" fill="#38BDF8" />
        <circle cx="26" cy="18" r="0.7" fill="#38BDF8" />
        <circle cx="22" cy="24" r="0.7" fill="#F8FAFC" />
        <circle cx="26" cy="24" r="0.7" fill="#F8FAFC" />
        <circle cx="22" cy="30" r="0.7" fill="#38BDF8" />
        <circle cx="26" cy="30" r="0.7" fill="#38BDF8" />
        <circle cx="14" cy="29" r="0.6" fill="#38BDF8" />
        <circle cx="16" cy="34" r="0.6" fill="#38BDF8" />
        <circle cx="32" cy="27" r="0.6" fill="#38BDF8" />
        <circle cx="35" cy="33" r="0.6" fill="#38BDF8" />
        {/* Water Reflection Line */}
        <line x1="5" y1="44" x2="43" y2="44" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.4" />
      </svg>
    </div>
  );
}
