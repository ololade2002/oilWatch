import { Sparklines, SparklinesLine } from "react-sparklines";

export default function AssetCard({ config, data }) {
  if (!data) return null;

  const { currentValue, history, lastSeen, rawMetrics } = data;

  // 1. CHOOSE DEFAULT VALUES
  let displayValue = currentValue;
  let mainUnit = "psi";
  let statusBadge = "PTH • NORMAL";

  // 2. DYNAMICALLY DETECT THE ALPHA-3 WARNING STATE
  // If it's ALPHA_3 and pressure crosses 1500, trigger warning flags
  const isAlpha3Warning = config.id === "ALPHA_3" && currentValue >= 1500;

  if (isAlpha3Warning) {
    statusBadge = "PTH • CRITICAL WARNING";
  } else if (config.id === "ALPHA_2") {
    displayValue = rawMetrics.water_cut_percentage || currentValue;
    mainUnit = "%";
    statusBadge = "WCUT • NORMAL";
  } else if (config.id === "SEPARATOR_ALPHA") {
    displayValue = rawMetrics.oil_level_percentage || 50.1;
    mainUnit = "%";
    statusBadge = "LEVEL • NORMAL";
  } else if (config.id === "MANIFOLD_ALPHA") {
    statusBadge = "INLET P • NORMAL";
  }

  // 3. SET UP TAILWIND STYLES FOR NORMAL VS YELLOW STATE
  const cardBorderClass = isAlpha3Warning
    ? "border-amber-500 bg-[#161a1e]" // Yellow border and slightly altered background highlight
    : "border-[#1e293b]/40 bg-[#10171e]";

  const badgeColorClass = isAlpha3Warning
    ? "text-amber-400 animate-pulse font-bold"
    : "text-teal-500";

  const sparklineColor = isAlpha3Warning ? "#fbbf24" : "#14b8a6"; // Yellow vs Teal

  // 4. GENERATE METRIC FOOTER MATRIX
  const footerMetrics = [];
  if (config.category === "upstream") {
    if (config.id === "ALPHA_2") {
      footerMetrics.push({
        label: "PTH",
        value: `${(rawMetrics.wellhead_pressure_psi || 1183.6).toFixed(1)} psi`,
      });
      footerMetrics.push({
        label: "FLOW",
        value: `${(rawMetrics.flow_rate_bbl_day || 212.7).toFixed(1)} bbl/d`,
      });
      footerMetrics.push({ label: "GOR", value: "1,124.3 scf/bbl" });
    } else if (config.id === "ALPHA_3") {
      footerMetrics.push({ label: "VIB", value: "1.6 mm/s" });
      footerMetrics.push({
        label: "FLOW",
        value: `${(rawMetrics.flow_rate_bbl_day || 542.1).toFixed(1)} bbl/d`,
      });
      footerMetrics.push({ label: "GOR", value: "2,759.9 scf/bbl" });
    } else {
      footerMetrics.push({
        label: "TEMP",
        value: `${(rawMetrics.temperature_c || 70.2).toFixed(1)} °C`,
      });
      footerMetrics.push({
        label: "FLOW",
        value: `${(rawMetrics.flow_rate_bbl_day || 305.2).toFixed(1)} bbl/d`,
      });
      footerMetrics.push({
        label: "WCUT",
        value: `${(rawMetrics.water_cut_percentage || 10).toFixed(0)} %`,
      });
    }
  } else {
    if (config.id === "MANIFOLD_ALPHA") {
      footerMetrics.push({ label: "ΔP", value: "35.9 psi" });
      footerMetrics.push({ label: "FLOW", value: "1,058.9 bbl/d" });
      footerMetrics.push({ label: "TEMP", value: "171.7 °F" });
    } else {
      footerMetrics.push({
        label: "VESSEL P",
        value: `${(rawMetrics.vessel_pressure_psi || 142.8).toFixed(1)} psi`,
      });
      footerMetrics.push({ label: "OIL OUT", value: "591.5 bbl/d" });
      footerMetrics.push({ label: "WATER OUT", value: "417.6 bbl/d" });
    }
  }

  return (
    <div
      className={`p-5 rounded-md border transition-all duration-300 relative ${cardBorderClass}`}
    >
      {/* THE TOP GREEN/YELLOW ACCENT LINE ACCORDING TO SCREENSHOTS */}
      <div
        className={`absolute top-0 left-0 right-0 h-px rounded-b-md transition-colors duration-300 ${
          isAlpha3Warning
            ? "bg-amber-500 shadow-[0_1px_8px_rgba(245,158,11,0.4)]"
            : "bg-teal-500 shadow-[0_1px_8px_rgba(20,184,166,0.4)]"
        }`}
      />

      {/* Top Title Line Row */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold font-orbitron text-[17px] text-text tracking-wide  uppercase">
            {config.name}
          </h3>
          <p className=" pt-0.5 text-[11px] font-medium text-text2 font-mono capitalize tracking-wider ">
            {config.subtitle}
          </p>
        </div>
        <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
          <span
            className={`w-1.5 h-1.5 rounded-full ${isAlpha3Warning ? "bg-amber-400 animate-ping" : "bg-teal-500 animate-ping"}`}
          />
          {lastSeen}
        </span>
      </div>

      {/* Primary Measurement Callout */}
      <div className="mt-4 mb-1 flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight font-mono text-slate-100">
          {displayValue.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
        </span>
        <span className="text-xs font-semibold font-raleway text-slate-500 lowercase">
          {mainUnit}
        </span>
      </div>

      {/* Dynamic Status Sub-Badge */}
      <div className={`text-[9px] tracking-wider uppercase ${badgeColorClass}`}>
        {statusBadge}
      </div>

      {/* Sparkline Canvas Vector */}
      <div className="w-full  mb-6">
        <Sparklines data={history} max={Math.max(...history, 10) * 1.05}>
          {/* 1. Define a native SVG linear gradient that fades to transparent */}
          <defs>
            <linearGradient
              id={`gradient-${config.id}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.25} />
              <stop
                offset="100%"
                stopColor={sparklineColor}
                stopOpacity={0.0}
              />
            </linearGradient>
          </defs>

          {/* 2. Link the fill style property straight to your new gradient ID */}
          <SparklinesLine
            color={sparklineColor}
            style={{
              strokeWidth: 1.5,
              fill: `url(#gradient-${config.id})`, // Injects the fading background glow
              fillOpacity: 1,
            }}
          />
         
        </Sparklines>
      </div>

      {/* Bottom Triple Row Configuration Parameter Matrix */}
      <div className="grid grid-cols-3 gap-1 mt-2 pt-3 border-t border-slate-800/60 font-mono">
        {footerMetrics.map((metric, idx) => (
          <div key={idx} className="text-left">
            <div className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              {metric.label}
            </div>
            <div className="text-[14px] text-slate-300  mt-0.5 font-semibold">
              {metric.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
