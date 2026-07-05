import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import { fetchProductionForecast } from "../../utils/apis.js";

export default function Forecast({ assetId = "ALPHA_2" }) {
  const [forecastData, setForecastData] = useState(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerateForecast = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchProductionForecast(assetId);
      console.log("FORECAST DATA:", data);

      setForecastData(data);
      setHasGenerated(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to run Arps model");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Build chart data ──────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!forecastData) return [];

    const history  = forecastData.history  || [];
    const forecast = forecastData.forecast || [];

    // Sample history to ~20 points max to keep chart readable
    const step = Math.max(1, Math.floor(history.length / 20));
    const historical = history
      .filter((_, i) => i % step === 0)
      .map((item, i) => ({
        time:       `R${i + 1}`,
        historical: Number(item.rate ?? item.rate_bbl ?? 0),
        forecast:   null,
        isForecast: false,
      }));

    const lastVal = historical[historical.length - 1]?.historical ?? 0;

    // Bridge point at "today" — connects both lines
    const bridge = [{
      time:       "today",
      historical: lastVal,
      forecast:   lastVal,
      isForecast: false,
    }];

    // Forecast points
    const future = forecast
      .filter(item => item.day <= 100)
      .map(item => ({
        time:       `Day ${item.day}`,
        historical: null,
        forecast:   Number(item.rate_bbl ?? 0),
        isForecast: true,
      }));

    return [...historical, ...bridge, ...future];
  }, [forecastData]);

  // ── Dynamic Y axis ────────────────────────────────────────────────
  const { yMin, yMax } = useMemo(() => {
    if (chartData.length === 0) return { yMin: 0, yMax: 400 };
    const values = chartData
      .flatMap(d => [d.historical, d.forecast])
      .filter(v => v != null && !isNaN(v) && v > 0);
    if (values.length === 0) return { yMin: 0, yMax: 400 };
    return {
      yMin: Math.floor(Math.min(...values) * 0.88),
      yMax: Math.ceil(Math.max(...values)  * 1.08),
    };
  }, [chartData]);

  // ── Derived stats — safe regardless of Lambda field naming ────────
  const summary      = forecastData?.summary ?? {};
  const historyUsed  = summary.history_points_used ?? forecastData?.history?.length ?? "—";
  const declinePct   = summary.decline_pct
    ?? forecastData?.decline_pct
    ?? null;

  // Calculate decline directly from forecast data if Lambda doesn't return it
  const computedDecline = useMemo(() => {
    if (declinePct != null) return Number(declinePct).toFixed(1);
    const forecast = forecastData?.forecast || [];
    if (forecast.length < 2) return null;
    const first = forecast[0]?.rate_bbl;
    const last  = forecast[forecast.length - 1]?.rate_bbl;
    if (!first || !last) return null;
    return (((first - last) / first) * 100).toFixed(1);
  }, [forecastData, declinePct]);

  const isDecline = computedDecline != null && Number(computedDecline) > 0;

  return (
    <div className="p-2 sm:p-6 bg-bgPrimary pt-24 sm:pt-24 lg:pt-4 text-slate-100 rounded-lg border border-slate-800">

      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-5 justify-between items-start">
        <div>
          <h2 className="text-[22px] font-orbitron font-bold">
            WELL {assetId}
          </h2>
          <p className="text-[13px] md:text-[14px] font-mono text-slate-500 mt-1">
            Production Forecast Analysis ·{" "}
            {historyUsed} readings fitted ·{" "}
            <span className={isDecline ? "text-red-400" : "text-emerald-400"}>
              {computedDecline ?? "—"}% projected decline
            </span>
            {" "}over 100 days · Arps Hyperbolic b=0.5
          </p>
        </div>

        <button
          onClick={handleGenerateForecast}
          disabled={isLoading}
          className={`
            px-3 sm:px-6 py-3 rounded text-[13px] tracking-wider font-bold font-mono uppercase transition
            ${isLoading
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-amber text-black hover:bg-amber/90"
            }
          `}
        >
          {isLoading
            ? "Running Arps Model..."
            : hasGenerated
              ? "Regenerate Forecast"
              : "Generate Forecast"}
        </button>
      </div>

      {/* Legend */}
      <div className="space-x-2.5 pt-8 pb-4 sm:pl-14 text-[13px]">
        <span className="text-slate-500 font-medium font-mono">
          ━━ Historical production
        </span>
        {hasGenerated && (
          <span className="text-amber font-mono font-medium">
            ╌╌ Forecast (Arps Model)
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 border border-red-700 p-3 mb-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Chart */}
      <div className="h-112 w-full">
        {!hasGenerated && !isLoading && (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            Click Generate Forecast to run the Arps model
          </div>
        )}

        {isLoading && (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
            <span className="text-amber font-mono text-sm tracking-wider">
              RUNNING ARPS MODEL...
            </span>
          </div>
        )}

        {hasGenerated && !isLoading && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
            >
              <CartesianGrid vertical={false} horizontal stroke="#1e293b" />

              <XAxis
                dataKey="time"
                hide
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                domain={[yMin, yMax]}
                tick={{ fill: "#64748b", fontSize: 12, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                width={45}
                tickFormatter={v => Math.round(v)}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                  fontFamily: "monospace",
                }}
                labelStyle={{ color: "#94a3b8", fontSize: "12px" }}
                itemStyle={{ fontSize: "13px" }}
                formatter={(val, name) => [
                  `${Number(val).toFixed(1)} bbl/d`,
                  name === "historical" ? "Historical" : "Forecast",
                ]}
              />

              {/* Historical — solid grey */}
              <Line
                type="monotone"
                dataKey="historical"
                stroke="#94a3b8"
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
                isAnimationActive
                animationDuration={800}
              />

              {/* Forecast — dashed amber */}
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="8 6"
                dot={false}
                connectNulls={false}
                isAnimationActive
                animationDuration={1000}
                animationBegin={300}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats row */}
      {hasGenerated && !isLoading && forecastData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
          {[
            { label: "Current Rate",    value: `${summary.current_rate_bbl?.toFixed(1) ?? "—"}`, unit: "bbl/d" },
            { label: "Day 50 Rate",     value: `${forecastData.forecast?.find(f => f.day >= 50)?.rate_bbl?.toFixed(1) ?? "—"}`, unit: "bbl/d" },
            { label: "Projected Decline", value: `${computedDecline ?? "—"}`, unit: "%" },
            { label: "Readings Used",   value: `${historyUsed}`, unit: "pts" },
          ].map(s => (
            <div key={s.label} className="bg-slate-900/60 border border-slate-800 rounded p-3">
              <div className="text-[10px] font-mono text-slate-500 tracking-wider uppercase mb-1">
                {s.label}
              </div>
              <div className="font-mono text-lg font-bold text-slate-100">
                {s.value}
                <span className="text-[11px] text-slate-500 ml-1">{s.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
