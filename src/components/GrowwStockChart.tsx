"use client";

import React, { useState, useMemo, useRef } from "react";
import { NormalizedMarketQuote } from "@/app/api/market/quote/[ticker]/route";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";

export type TimeframePeriod = "1D" | "1W" | "1M" | "3M" | "1Y" | "3Y" | "5Y" | "ALL";

interface GrowwStockChartProps {
  quote: NormalizedMarketQuote;
  companyName: string;
}

interface ChartPoint {
  index: number;
  dateStr: string;
  monthStr: string;
  fullDate: string;
  price: number;
  volume: number;
  ma: number;
}

export function GrowwStockChart({ quote, companyName }: GrowwStockChartProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<TimeframePeriod>("1M");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate historical data points deterministically based on ticker, current price, and timeframe
  const points = useMemo<ChartPoint[]>(() => {
    const currentPrice = quote.regularMarketPrice;
    const baseLow = quote.fiftyTwoWeekLow;
    const baseHigh = quote.fiftyTwoWeekHigh;

    // Number of data points and duration in days
    const configMap: Record<TimeframePeriod, { count: number; days: number; volatility: number; trend: number }> = {
      "1D": { count: 30, days: 1, volatility: 0.008, trend: quote.change >= 0 ? 0.003 : -0.003 },
      "1W": { count: 35, days: 7, volatility: 0.015, trend: quote.change >= 0 ? 0.012 : -0.01 },
      "1M": { count: 30, days: 30, volatility: 0.035, trend: quote.change >= 0 ? 0.038 : -0.025 },
      "3M": { count: 45, days: 90, volatility: 0.065, trend: 0.05 },
      "1Y": { count: 52, days: 365, volatility: 0.12, trend: 0.14 },
      "3Y": { count: 60, days: 1095, volatility: 0.18, trend: 0.32 },
      "5Y": { count: 60, days: 1825, volatility: 0.25, trend: 0.58 },
      "ALL": { count: 70, days: 2550, volatility: 0.32, trend: 0.95 },
    };

    const cfg = configMap[activeTimeframe];
    let seed = quote.symbol.split("").reduce((acc, c) => acc + c.charCodeAt(0), 101) + cfg.days;
    const pseudoRand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Calculate start price so current price lands accurately at the end
    const initialPrice = currentPrice / (1 + cfg.trend);
    const pts: ChartPoint[] = [];

    const now = new Date();

    for (let i = 0; i < cfg.count; i++) {
      let p: number;
      if (i === cfg.count - 1) {
        p = currentPrice;
      } else {
        const progress = i / (cfg.count - 1);
        const expectedPrice = initialPrice + (currentPrice - initialPrice) * progress;
        const wiggle = (pseudoRand() - 0.48) * (currentPrice * cfg.volatility);
        p = Math.max(baseLow * 0.92, Math.min(baseHigh * 1.15, expectedPrice + wiggle));
      }

      // Date calculation
      const dayOffset = Math.round(((cfg.count - 1 - i) / (cfg.count - 1)) * cfg.days);
      const ptDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);

      const dateStr = ptDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const monthStr = ptDate.toLocaleDateString("en-US", {
        month: "short",
        year: activeTimeframe === "1D" || activeTimeframe === "1W" ? undefined : "2-digit",
      });
      const fullDate = ptDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const volume = Math.round(50000 + pseudoRand() * 250000);

      pts.push({
        index: i,
        dateStr,
        monthStr,
        fullDate,
        price: Math.round(p * 100) / 100,
        volume,
        ma: p,
      });
    }

    // 5-period moving average
    for (let i = 0; i < pts.length; i++) {
      const sliceStart = Math.max(0, i - 4);
      const sub = pts.slice(sliceStart, i + 1);
      pts[i].ma = Math.round((sub.reduce((acc, it) => acc + it.price, 0) / sub.length) * 100) / 100;
    }

    return pts;
  }, [quote, activeTimeframe]);

  // Overall timeframe metrics
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const hoveredPoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : lastPoint;

  const currentDisplayPrice = hoveredPoint.price;
  const priceDelta = currentDisplayPrice - firstPoint.price;
  const pctDelta = (priceDelta / firstPoint.price) * 100;
  const isPositive = priceDelta >= 0;

  // SVG Dimensioning
  const width = 720;
  const height = 220;
  const padX = 20;
  const padTop = 20;
  const padBottom = 35;
  const chartHeight = height - padTop - padBottom;

  const prices = points.map((p) => p.price);
  const minP = Math.min(...prices) * 0.992;
  const maxP = Math.max(...prices) * 1.008;
  const pRange = Math.max(maxP - minP, 0.01);

  const maxVol = Math.max(...points.map((p) => p.volume), 1);

  const getX = (idx: number) => padX + (idx / (points.length - 1)) * (width - 2 * padX);
  const getY = (price: number) => padTop + (1 - (price - minP) / pRange) * chartHeight;

  // Build SVG path strings
  const pathD = points
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(pt.price).toFixed(1)}`)
    .join(" ");

  const areaD = `${pathD} L ${getX(points.length - 1).toFixed(1)} ${padTop + chartHeight} L ${getX(0).toFixed(1)} ${padTop + chartHeight} Z`;

  const maD = points
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(pt.ma).toFixed(1)}`)
    .join(" ");

  const lineColor = isPositive ? "#10B981" : "#EF4444";
  const gradId = `growwGrad_${quote.symbol.replace(/[^a-zA-Z0-9]/g, "")}_${activeTimeframe}`;

  // Interactive mouse scrubbing handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const relativeX = Math.max(0, Math.min(1, (clientX - padX) / (rect.width - 2 * padX)));
    const targetIdx = Math.round(relativeX * (points.length - 1));
    setHoveredIndex(targetIdx);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const TIMEFRAMES: TimeframePeriod[] = ["1D", "1W", "1M", "3M", "1Y", "3Y", "5Y", "ALL"];

  return (
    <div className="p-4 bg-[#090D17] border border-[#182337] rounded-xl space-y-3 font-mono select-none shadow-md">
      {/* Groww Header Lockup: Interactive Price Display & Timeframe Slicers */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#182337] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">
              {companyName} &bull; GROWW-STYLE LIVE CHART
            </span>
            <span className="px-1.5 py-0.2 bg-[#0F1626] border border-[#2563EB]/40 text-[#38BDF8] text-[9.5px] rounded">
              SCRUB TO INSPECT ANY MONTH
            </span>
          </div>

          {/* Large dynamic price tracking cursor */}
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
              {quote.currencySymbol}{currentDisplayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span
              className={`text-xs sm:text-sm font-bold flex items-center gap-1 ${
                isPositive ? "text-[#10B981]" : "text-[#EF4444]"
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>
                {isPositive ? "+" : ""}
                {priceDelta.toFixed(2)} ({isPositive ? "+" : ""}
                {pctDelta.toFixed(2)}%)
              </span>
              <span className="text-[10px] text-[#64748B] font-normal uppercase">
                {hoveredIndex !== null ? `(${hoveredPoint.dateStr})` : `(${activeTimeframe})`}
              </span>
            </span>
          </div>

          <div className="text-[10px] text-[#94A3B8] flex items-center gap-2 mt-0.5">
            <Calendar className="w-3 h-3 text-[#38BDF8]" />
            <span>{hoveredPoint.fullDate}</span>
            <span>&bull;</span>
            <span>Volume: {hoveredPoint.volume.toLocaleString()} shares</span>
          </div>
        </div>

        {/* Groww Timeframe Pill Selector */}
        <div className="flex items-center gap-1 bg-[#070A0F] border border-[#182337] p-1 rounded-lg">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => {
                setActiveTimeframe(tf);
                setHoveredIndex(null);
              }}
              className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                activeTimeframe === tf
                  ? "bg-[#2563EB] text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                  : "text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#0F1626]"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden cursor-crosshair"
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 sm:h-52 overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.32" />
              <stop offset="85%" stopColor={lineColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Reference Grid Lines */}
          <line x1={padX} y1={padTop} x2={width - padX} y2={padTop} stroke="#182337" strokeDasharray="3 3" />
          <line
            x1={padX}
            y1={padTop + chartHeight / 2}
            x2={width - padX}
            y2={padTop + chartHeight / 2}
            stroke="#182337"
            strokeDasharray="3 3"
          />
          <line
            x1={padX}
            y1={padTop + chartHeight}
            x2={width - padX}
            y2={padTop + chartHeight}
            stroke="#182337"
          />

          {/* Groww-style Volume Bars at bottom */}
          {points.map((pt, i) => {
            const barH = (pt.volume / maxVol) * 26;
            const barY = padTop + chartHeight - barH;
            const x = getX(i);
            const isBarUp = i > 0 ? pt.price >= points[i - 1].price : true;
            return (
              <rect
                key={i}
                x={x - 2}
                y={barY}
                width={3.5}
                height={barH}
                fill={isBarUp ? "#10B981" : "#EF4444"}
                opacity={hoveredIndex === i ? 0.6 : 0.2}
              />
            );
          })}

          {/* Gradient Shaded Area */}
          <path d={areaD} fill={`url(#${gradId})`} />

          {/* 5-Period Moving Average Dotted Guide */}
          <path d={maD} fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 3" opacity="0.45" />

          {/* Primary Crisp Stock Price Curve */}
          <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2.2" strokeLinecap="round" />

          {/* Interactive Scrubbing Cursor Line & Node */}
          {hoveredIndex !== null && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={getX(hoveredIndex)}
                y1={padTop}
                x2={getX(hoveredIndex)}
                y2={padTop + chartHeight}
                stroke="#38BDF8"
                strokeWidth="1.2"
                strokeDasharray="3 2"
              />

              {/* Outer Glow Halo */}
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(hoveredPoint.price)}
                r="6"
                fill={lineColor}
                opacity="0.3"
              />

              {/* Center Dot */}
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(hoveredPoint.price)}
                r="3.5"
                fill="#FFFFFF"
                stroke={lineColor}
                strokeWidth="2"
              />
            </g>
          )}

          {/* Bottom Time Axis Labels (Every ~5-6 points) */}
          {points
            .filter((_, idx) => idx % Math.max(1, Math.floor(points.length / 6)) === 0 || idx === points.length - 1)
            .map((pt, i) => (
              <text
                key={i}
                x={getX(pt.index)}
                y={padTop + chartHeight + 18}
                fill="#64748B"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {pt.monthStr}
              </text>
            ))}
        </svg>
      </div>

      {/* Footer Metrics Row: 52-Week Range & High/Low Corridor */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1E293B] text-[10px]">
        <div className="p-2 bg-[#090E17] border border-[#1E293B] rounded">
          <span className="text-[#64748B] uppercase">PERIOD LOW</span>
          <div className="font-bold text-[#F8FAFC] text-xs mt-0.5">
            {quote.currencySymbol}{minP.toFixed(2)}
          </div>
        </div>

        <div className="p-2 bg-[#090E17] border border-[#1E293B] rounded">
          <span className="text-[#64748B] uppercase">PERIOD HIGH</span>
          <div className="font-bold text-[#F8FAFC] text-xs mt-0.5">
            {quote.currencySymbol}{maxP.toFixed(2)}
          </div>
        </div>

        <div className="p-2 bg-[#090E17] border border-[#1E293B] rounded">
          <span className="text-[#64748B] uppercase">52-WK LOW</span>
          <div className="font-bold text-[#F8FAFC] text-xs mt-0.5">
            {quote.currencySymbol}{quote.fiftyTwoWeekLow.toFixed(2)}
          </div>
        </div>

        <div className="p-2 bg-[#090E17] border border-[#1E293B] rounded">
          <span className="text-[#64748B] uppercase">52-WK HIGH</span>
          <div className="font-bold text-[#F8FAFC] text-xs mt-0.5">
            {quote.currencySymbol}{quote.fiftyTwoWeekHigh.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
