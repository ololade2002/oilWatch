import { Sparklines, SparklinesLine } from "react-sparklines";

export default function AssetCard({ config, data }) {
  if (!data) return null;

  const { currentValue, history, lastSeen, rawMetrics } = data;
  const metrics = rawMetrics || {};

  // 1. CHOOSE DEFAULT VALUES
  let displayValue = currentValue;
  let mainUnit = "psi";
  let basePrefix = "PTH";
  let severity = "NORMAL"; 

  // 2. TARGETED THRESHOLD ENGINE (ONLY APPLIES TO ALPHA 1, 2, AND 3)
  if (config.id === "ALPHA_1" || config.id === "ALPHA_3") {
    displayValue = currentValue;
    mainUnit = "psi";
    basePrefix = "PTH";

    if (currentValue > 1500.0) {
      severity = "CRITICAL";
    } else if (currentValue > 1450.0) {
      severity = "WARNING";
    }

  } else if (config.id === "ALPHA_2") {
    displayValue = currentValue;
    mainUnit = "%";
    basePrefix = "WCUT";

    if (currentValue >= 85.0) {
      severity = "CRITICAL";
    } else if (currentValue >= 75.0) {
      severity = "WARNING";
    }

  // 3. UNTOUCHED STABLE LOGIC FOR MANIFOLD AND SEPARATOR (NO ALERTS)
  } else if (config.id === "SEPARATOR_ALPHA") {
    displayValue = metrics?.oil_level_percentage || 50.1;
    mainUnit = "%";
    basePrefix = "LEVEL";
    severity = "NORMAL"; 

  } else if (config.id === "MANIFOLD_ALPHA") {
    displayValue = currentValue;
    mainUnit = "psi";
    basePrefix = "INLET P";
    severity = "NORMAL";
  }

  // Construct status badge text string
  const statusBadge = severity === "NORMAL" ? `${basePrefix} • NORMAL` : `${basePrefix} • ${severity} WARNING`;

  // 4. MAP THEME CLASSES DYNAMICALLY
  let cardBorderClass = "border-[#1e293b]/40 bg-[#10171e]";
  let accentLineClass = "bg-teal-500 shadow-[0_1px_8px_rgba(20,184,166,0.4)]";
  let badgeColorClass = "text-teal-500";
  let pingDotClass = "bg-teal-500 animate-pulse";
  let sparklineColor = "#14b8a6";

  if (severity === "CRITICAL") {
    cardBorderClass = "border-red-500 bg-[#1a1416]"; 
    accentLineClass = "bg-red-500 shadow-[0_1px_10px_rgba(244,63,94,0.6)]";
    badgeColorClass = "text-red-400 animate-pulse font-extrabold";
    pingDotClass = "bg-red-500 animate-ping";
    sparklineColor = "#f43f5e"; 
  } else if (severity === "WARNING") {
    cardBorderClass = "border-amber-500 bg-[#161a1e]"; 
    accentLineClass = "bg-amber-500 shadow-[0_1px_8px_rgba(245,158,11,0.4)]";
    badgeColorClass = "text-amber-400 animate-pulse font-bold";
    pingDotClass = "bg-amber-400 animate-pulse";
    sparklineColor = "#fbbf24"; 
  }

  // 5. GENERATE METRIC FOOTER MATRIX
  const footerMetrics = [];
  if (config.category === "upstream") {
    if (config.id === "ALPHA_2") {
      footerMetrics.push({
        label: "PTH",
        value: `${(metrics?.wellhead_pressure_psi || 1183.6).toFixed(1)} psi`,
      });
      footerMetrics.push({
        label: "FLOW",
        value: `${(metrics?.flow_rate_bbl_day || 212.7).toFixed(1)} bbl/d`,
      });
      footerMetrics.push({ label: "GOR", value: "1,124.3 scf/bbl" });
    } else if (config.id === "ALPHA_3") {
      footerMetrics.push({ label: "VIB", value: "1.6 mm/s" });
      footerMetrics.push({
        label: "FLOW",
        value: `${(metrics?.flow_rate_bbl_day || 542.1).toFixed(1)} bbl/d`,
      });
      footerMetrics.push({ label: "GOR", value: "2,759.9 scf/bbl" });
    } else {
      footerMetrics.push({
        label: "TEMP",
        value: `${(metrics?.temperature_c || 70.2).toFixed(1)} °C`,
      });
      footerMetrics.push({
        label: "FLOW",
        value: `${(metrics?.flow_rate_bbl_day || 305.2).toFixed(1)} bbl/d`,
      });
      footerMetrics.push({
        label: "WCUT",
        value: `${(metrics?.water_cut_percentage || 10).toFixed(0)} %`,
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
        value: `${(metrics?.vessel_pressure_psi || 142.8).toFixed(1)} psi`,
      });
      footerMetrics.push({ label: "OIL OUT", value: "591.5 bbl/d" });
      footerMetrics.push({ label: "WATER OUT", value: "417.6 bbl/d" });
    }
  }

  const cleanNumericValue = typeof displayValue === "number" ? displayValue : parseFloat(displayValue) || 0;

  return (
    <div className={`p-5 rounded-md border transition-all duration-300 relative ${cardBorderClass}`}>
      <div className={`absolute top-0 left-0 right-0 h-px rounded-b-md transition-colors duration-300 ${accentLineClass}`} />

      <div className=" flex flex-col mdd:flex-row justify-between items-start">
        <div>
          <h3 className="font-bold font-orbitron text-[18px] text-text tracking-wide uppercase">
            {config.name}
          </h3>
          <p className="pt-0.5 text-[11px] font-medium text-text2 font-raleway capitalize tracking-wider">
            {config.subtitle}
          </p>
        </div>
        <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
          <span className={`w-1.5 h-1.5 rounded-full ${pingDotClass}`} />
          {lastSeen}
        </span>
      </div>

      <div className="mt-4 mb-1 flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight font-mono text-slate-100">
          {cleanNumericValue.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
        </span>
        <span className="text-xs font-semibold font-raleway text-slate-500 lowercase">
          {mainUnit}
        </span>
      </div>

      <div className={`text-[9px] tracking-wider font-mono uppercase mb-1 ${badgeColorClass}`}>
        {statusBadge}
      </div>

      <div className="w-full mb-6">
        <Sparklines data={history} max={Math.max(...history, 10) * 1.05}>
          <defs>
            <linearGradient id={`gradient-${config.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={sparklineColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <SparklinesLine
            color={sparklineColor}
            style={{
              strokeWidth: 1.5,
              fill: `url(#gradient-${config.id})`,
              fillOpacity: 1,
            }}
          />
        </Sparklines>
      </div>

      <div className="grid grid-cols-3 gap-1 mt-2 pt-3 border-t border-slate-800/60 font-mono">
        {footerMetrics.map((metric, idx) => (
          <div key={idx} className="text-left">
            <div className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              {metric.label}
            </div>
            <div className="text-[14px] text-slate-300 mt-0.5 font-semibold">
              {metric.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}