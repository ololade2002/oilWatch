import { useState, useEffect } from 'react';
import { fetchActiveAlerts } from '../../utils/apis.js'; 

export default function Alerts() {
  const [alertsData, setAlertsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 1. ADD FILTER BADGE STATE
  const [activeFilter, setActiveFilter] = useState("ALL"); 

  useEffect(() => {
    let isMounted = true;

    const loadAlerts = async (isInitialLoad = false) => {
      try {
        // Only trigger visible placeholder loading view on mount
        if (isInitialLoad) {
          setLoading(true);
        }
        
        const data = await fetchActiveAlerts();
        
        if (isMounted) {
          const rawList = data || [];
          
          // Sort chronologically ascending so that newer logs are always pushed to the end
          const sortedList = [...rawList].sort((a, b) => {
            return new Date(a.timestamp || 0) - new Date(b.timestamp || 0);
          });
          
          // Slice the last 20 entries (the newest ones) and reverse them so the freshest is at the top
          const recentAlerts = sortedList.slice(-20).reverse();
          
          setAlertsData(recentAlerts);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to fetch current alert stream.");
          console.error("Error pooling active alert stream:", err);
        }
      } finally {
        if (isMounted && isInitialLoad) {
          setLoading(false);
        }
      }
    };

    loadAlerts(true);

    // Dynamic silent background loop polling every 10 seconds to catch active simulator entries
    const intervalId = setInterval(() => loadAlerts(false), 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  if (loading && alertsData.length === 0) {
    return <div className="p-6 text-amber font-mono text-[12px] animate-pulse tracking-widest">FETCHING LIVE STREAM DATA...</div>;
  }

  if (error && alertsData.length === 0) {
    return (
      <div className="p-8 text-center border border-rose-950/40 bg-[#141011] rounded-md text-red-400 font-mono text-xs">
        {error}
      </div>
    );
  }

  // 2. COMPUTE INTERACTIVE TRACKING SUMMARY COUNTS FROM THE RECENT 20 POOL
  const totalCount = alertsData.length;
  const criticalCount = alertsData.filter(a => String(a.severity || '').toLowerCase() === 'critical').length;
  const warningCount = alertsData.filter(a => String(a.severity || '').toLowerCase() === 'warning').length;

  // 3. LIVE FILTER ARRAY VIEW STATE SELECTION BEFORE RENDER LOOP MAP
  const filteredAlerts = alertsData.filter((alert) => {
    if (activeFilter === "CRITICAL") return String(alert.severity || '').toLowerCase() === 'critical';
    if (activeFilter === "WARNING") return String(alert.severity || '').toLowerCase() === 'warning';
    return true; // "ALL"
  });

  return (
    <div className="px-4  pt-24 lg:pt-4 flex flex-col gap-3.5 w-full bg-bgPrimary rounded-lg">

      {/* Interactive Tabs Header Controls */}
      <div className="flex justify-between items-center mb-1 font-mono text-[11px] tracking-wider text-slate-400">
        <div className="uppercase text-text2 font-rajdhani text-[14px] font-semibold tracking-widest ">ACTIVE ALERTS — {filteredAlerts.length} SHOWN</div>
        
        {/* Navigation Badges Switchers */}
        <div className="flex gap-2 select-none">
          <button 
            onClick={() => setActiveFilter("ALL")}
            className={`px-2 py-0.5 rounded border text-[10px] transition-all cursor-pointer font-mono ${
              activeFilter === "ALL" 
                ? "bg-slate-700 text-slate-100 border-slate-500" 
                : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-slate-200"
            }`}
          >
            ALL {totalCount}
          </button>
          
        
          
          <button 
            onClick={() => setActiveFilter("WARNING")}
            className={`px-2 py-0.5 rounded border text-[10px] transition-all cursor-pointer font-mono ${
              activeFilter === "WARNING" 
                ? "bg-amber-950 text-amber-400 border-amber-500" 
                : "bg-amber-950/40 border-amber-900/40 text-amber-400 hover:bg-amber-900/20"
            }`}
          >
            WARNING {warningCount}
          </button>

            <button 
            onClick={() => setActiveFilter("CRITICAL")}
            className={`px-2 py-0.5 rounded border text-[10px] transition-all cursor-pointer font-mono ${
              activeFilter === "CRITICAL" 
                ? "bg-red-950 text-red-400 border-red-500" 
                : "bg-red-950/40 border-red-900/40 text-red-400 hover:bg-red-900/20"
            }`}
          >
            CRITICAL {criticalCount}
          </button>
        </div>
      </div>

      {/* Rows Loop Grid Render */}
      {filteredAlerts.map((alert, idx) => {
        const severityStr = alert.severity || "Warning";
        const isCritical = severityStr.toLowerCase() === 'critical';
        const assetName = alert.asset_id || alert.asset || "UNKNOWN_ASSET";
        
        let rawVal = 0;
        if (alert.observed_value !== undefined && alert.observed_value !== null) {
          rawVal = alert.observed_value;
        } else if (alert.currentVal !== undefined && alert.currentVal !== null) {
          rawVal = alert.currentVal;
        }

        const parsedVal = parseFloat(rawVal);
        const cleanNumericValue = isNaN(parsedVal) ? 0 : parsedVal;
        const ceilingVal = alert.ceiling_value || alert.ceilingVal || null;
        const unitStr = alert.unit || "psi";
        const displayTime = alert.timestamp || "Just now";

        const rowBorderClass = isCritical 
          ? "border-red-500/80 bg-gradient-to-r from-red-950/20 to-transparent" 
          : "border-amber-500/80 bg-gradient-to-r from-amber-950/15 to-transparent";

        const valueTextClass = isCritical ? "text-red-500" : "text-amber-500";

        return (
          <div 
            key={`${alert.alert_id || alert.id || idx}-${cleanNumericValue}-${idx}`} 
            className={`flex justify-between items-start p-4 border rounded-md transition-all duration-150 hover:bg-slate-900/20 ${rowBorderClass}`}>
            <div className="flex flex-col gap-1">
              <h4 className="font-bold font-orbitron tracking-wider  text-sm text-slate-100 uppercase">{assetName}</h4>
              <p className="text-xs text-slate-400">{alert.message}</p>
              <div className={`flex items-baseline gap-1.5 mt-1 font-mono text-xs ${valueTextClass}`}>
                <span className="font-bold">{cleanNumericValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} {unitStr}</span>
                {ceilingVal && <span className="text-slate-600">[ceiling {ceilingVal}]</span>}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-mono pt-0.5">{displayTime}</div>
          </div>
        );
      })}
    </div>
  );
}