"use client";
import React, { useEffect, useRef } from "react";
import { MapPin, Coffee } from "lucide-react";

interface Zone {
  id: string;
  name: string;
  section?: string;
  density?: number;
  waitTime?: number;
  status: string;
  type: "GATE" | "FOOD";
}

interface Props {
  gates: any[];
  concessions: any[];
}

/**
 * Maps each gate/concession to a (cx, cy) position on a 600×380 canvas
 * representing a top-down stadium oval.
 */
function getZonePositions(zones: Zone[]): { zone: Zone; cx: number; cy: number }[] {
  // Stadium oval center and radii (in canvas units: 600×380)
  const ox = 300, oy = 190, rx = 250, ry = 155;

  // Spread gates evenly around the oval perimeter; food stands go inside
  const gates  = zones.filter(z => z.type === "GATE");
  const food   = zones.filter(z => z.type === "FOOD");

  const placed: { zone: Zone; cx: number; cy: number }[] = [];

  gates.forEach((z, i) => {
    const angle = (2 * Math.PI * i) / gates.length - Math.PI / 2;
    placed.push({ zone: z, cx: ox + rx * Math.cos(angle), cy: oy + ry * Math.sin(angle) });
  });

  // Place food stands in a smaller inner oval
  food.forEach((z, i) => {
    const angle = (2 * Math.PI * i) / food.length - Math.PI / 2;
    placed.push({ zone: z, cx: ox + rx * 0.55 * Math.cos(angle), cy: oy + ry * 0.55 * Math.sin(angle) });
  });

  return placed;
}

function statusToRgb(status: string): [number, number, number] {
  if (status === "CLEAR")     return [34, 197, 94];   // green
  if (status === "FILLING")   return [234, 179, 8];   // yellow
  return [239, 68, 68];                               // red
}

function drawHeatmap(
  canvas: HTMLCanvasElement,
  placedZones: { zone: Zone; cx: number; cy: number }[],
  dark: boolean
) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = dark ? "#141414" : "#f1f5f9";
  ctx.fillRect(0, 0, W, H);

  // Stadium pitch (grass)
  const ox = W / 2, oy = H / 2;
  const pitchGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, 90);
  pitchGrad.addColorStop(0, dark ? "#1a3a1a" : "#bbf7d0");
  pitchGrad.addColorStop(1, dark ? "#0f2a0f" : "#86efac");
  ctx.beginPath();
  ctx.ellipse(ox, oy, 130, 80, 0, 0, 2 * Math.PI);
  ctx.fillStyle = pitchGrad;
  ctx.fill();

  // Pitch markings
  ctx.strokeStyle = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(ox, oy, 130, 80, 0, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ox, oy, 22, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox, oy - 80);
  ctx.lineTo(ox, oy + 80);
  ctx.stroke();

  // Stadium seating ring (ellipse outline)
  ctx.strokeStyle = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  ctx.lineWidth = 28;
  ctx.beginPath();
  ctx.ellipse(ox, oy, 250, 155, 0, 0, 2 * Math.PI);
  ctx.stroke();

  // Heat blobs per zone
  placedZones.forEach(({ zone, cx, cy }) => {
    const intensity = zone.type === "GATE"
      ? (zone.density ?? 50) / 100
      : Math.min((zone.waitTime ?? 10) / 45, 1);
    const radius = 60 + intensity * 40;
    const [r, g, b] = statusToRgb(zone.status);

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, `rgba(${r},${g},${b},${0.55 + intensity * 0.3})`);
    grad.addColorStop(0.5, `rgba(${r},${g},${b},${0.2 + intensity * 0.15})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();
  });

  // Zone pins
  placedZones.forEach(({ zone, cx, cy }) => {
    const [r, g, b] = statusToRgb(zone.status);
    const color = `rgb(${r},${g},${b})`;

    // Outer glow
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(${r},${g},${b},0.25)`;
    ctx.fill();

    // Pin circle
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = dark ? "#fff" : "#000";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    const value = zone.type === "GATE"
      ? `${zone.density ?? 0}%`
      : `${zone.waitTime ?? 0}m`;

    ctx.font = "bold 9px Inter, ui-sans-serif, sans-serif";
    ctx.textAlign = "center";

    // Label bg pill
    const labelY = cy + 22;
    const tw = ctx.measureText(zone.name).width;
    ctx.fillStyle = dark ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.roundRect(cx - tw / 2 - 4, labelY - 9, tw + 8, 12, 4);
    ctx.fill();

    ctx.fillStyle = dark ? "#ffffff" : "#0f172a";
    ctx.fillText(zone.name, cx, labelY);

    ctx.font = "bold 8px Inter, ui-sans-serif, sans-serif";
    ctx.fillStyle = color;
    ctx.fillText(value, cx, labelY + 11);
  });
}

export const ArenaMap = ({ gates, concessions }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const zones: Zone[] = [
    ...gates.map(g => ({ ...g, type: "GATE" as const })),
    ...concessions.map(c => ({ ...c, type: "FOOD" as const })),
  ];
  const placed = getZonePositions(zones);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dark = document.documentElement.classList.contains("dark");
    drawHeatmap(canvas, placed, dark);
  });

  const legend = [
    { label: "Clear",     color: "bg-green-500" },
    { label: "Filling",   color: "bg-yellow-400" },
    { label: "Congested", color: "bg-red-500" },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Canvas heatmap */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 dark:border-white/10 shadow-2xl bg-[var(--bg-card)]">
        {zones.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <p className="text-[var(--text-muted)] font-bold animate-pulse">Connecting to live data...</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={600}
          height={380}
          className="w-full h-auto block"
          style={{ maxHeight: 400 }}
        />
        {/* Live badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md bg-black/40 text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          LIVE HEATMAP
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 px-1">
        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Density:</span>
        {legend.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-xs font-semibold text-[var(--text-secondary)]">{label}</span>
          </div>
        ))}
        <span className="ml-auto text-xs text-[var(--text-muted)]">
          <MapPin className="inline h-3 w-3 mr-1" />Gates &nbsp;
          <Coffee className="inline h-3 w-3 mr-1" />Food
        </span>
      </div>

      {/* Zone summary grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {zones.map((zone) => {
          const [r, g, b] = statusToRgb(zone.status);
          const intensity = zone.type === "GATE"
            ? (zone.density ?? 0) / 100
            : Math.min((zone.waitTime ?? 0) / 45, 1);
          return (
            <div
              key={zone.id}
              className="glass-card p-3 flex flex-col gap-1.5"
              style={{ borderLeft: `3px solid rgb(${r},${g},${b})` }}
            >
              <div className="flex items-center gap-1.5">
                {zone.type === "GATE"
                  ? <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: `rgb(${r},${g},${b})` }} />
                  : <Coffee className="h-3.5 w-3.5 flex-shrink-0" style={{ color: `rgb(${r},${g},${b})` }} />}
                <span className="text-xs font-bold text-[var(--text-primary)] truncate">{zone.name}</span>
              </div>
              {/* Mini bar */}
              <div className="w-full h-1.5 rounded-full bg-white/10 dark:bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${intensity * 100}%`, background: `rgb(${r},${g},${b})` }}
                />
              </div>
              <span className="text-xs font-black" style={{ color: `rgb(${r},${g},${b})` }}>
                {zone.type === "GATE" ? `${zone.density}% density` : `${zone.waitTime}m wait`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
