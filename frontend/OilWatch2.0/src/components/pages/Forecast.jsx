import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { fetchProductionForecast } from "../../utils/apis.js";

export default function Forecast({ assetId = "ALPHA_2" }) {
  const [forecastData, setForecastData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
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

  const prepareChartData = () => {
    if (!forecastData) return [];

    const history = forecastData.history || [];

    const step = Math.floor(history.length / 10) || 1;

    const historical = history
      .filter((_, index) => index % step === 0)
      .map((item, index) => ({
        time: ` ${index + 1}`,
        historical: Number(item.rate),
        forecast: null,
      }));

    const lastHistorical = historical[historical.length - 1];

    const future = [
      {
        time: "today",
        historical: lastHistorical?.historical,
        forecast: lastHistorical?.historical,
      },

      ...(forecastData.forecast || [])
        .filter((item) => item.day <= 50)
        .map((item) => ({
          time: `Day ${item.day}`,
          historical: null,
          forecast: Number(item.rate_bbl),
        })),
    ];

    return [...historical.slice(0, -1), ...future];
  };

  const chartData = prepareChartData();

  return (
    <div className="p-2 sm:p-6 bg-bgPrimary pt-24 sm:pt-24 lg:pt-4 text-slate-100 rounded-lg border border-slate-800">
      <div className="flex flex-col lg:flex-row gap-5 justify-between items-start ">
        <div>
          <h2 className="text-[22px] font-orbitron font-bold">
            WELL {assetId}
          </h2>

          <p className="text-[13px] md:text-[14px] font-mono text-slate-500 mt-1">
            Production Forecast Analysis ·{" "}
            {forecastData?.summary?.history_points_used ?? "—"} readings fitted
            ·
            <span
              className={
                forecastData?.trend_direction === "declining"
                  ? "text-red-400"
                  : "text-emerald-400"
              }
            >
              {" "}
              {forecastData?.summary?.decline_pct ?? "—"}% projected decline
            </span>{" "}
            over 50 days · Arps Hyperbolic b=0.5
          </p>
        </div>

        <button
          onClick={handleGenerateForecast}
          disabled={isLoading}
          className={`
            px-3 sm:px-6 py-3 rounded text-[13px] tracking-wider font-bold font-mono uppercase transition
            ${
              isLoading
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

      <div className=" space-x-2.5  pt-8 pb-4 sm:pl-14 text-[13px]">
        <span className="text-slate-500 font-medium font-mono">
          ━━ Historical production
        </span>

        {hasGenerated && (
          <span className="text-amber font-mono font-medium">
            ╌╌ Forecast (Arps Model)
          </span>
        )}
      </div>

      {error && (
        <div className=" bg-red-900/40 border border-red-700 p-3 mb-4 text-red-400 text-sm ">
          {error}
        </div>
      )}

      <div className="h-112.5 w-full">
        {!hasGenerated && (
          <div className="  h-full flex items-center justify-center text-slate-500 text-sm">
            Click generate forecast to run Arps model
          </div>
        )}

        {hasGenerated && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 20,
                left: 0,
                bottom: 20,
              }}
            >
              <CartesianGrid vertical={false} horizontal={true} />

              <XAxis
                dataKey="time"
                hide={true}
                tick={{
                  fill: "#fff",
                  fontSize: 12,
                }}
                axisLine={{
                  stroke: "#fff",
                }}
                tickLine={false}
              />

              <YAxis
                domain={[100, 350]}
                ticks={[100, 150, 200, 250, 300, 350]}
                tick={{
                  fill: "#fff",
                  fontSize: 12,
                }}
                axisLine={{
                  stroke: "#fff",
                }}
                tickLine={false}
                width={45}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                }}
                labelStyle={{
                  color: "#94a3b8",
                  fontSize: "12px",
                }}
                itemStyle={{
                  color: "#14b8a6",
                  fontSize: "13px",
                }}
              />

              <Line
                type="monotone"
                dataKey="historical"
                stroke="#94a3b8"
                strokeWidth={3}
                dot={false}
              />

              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#f59e0b"
                strokeWidth={3}
                strokeDasharray="8 8"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
