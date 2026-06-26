import { useState, useEffect } from "react";
import { fetchTelemetryHistory } from "../../utils/apis.js"; 
import AssetCard from "../../components/AssetCard.jsx";

const OILFIELD_ASSETS = [
  { id: "ALPHA_1", name: "ALPHA-1", subtitle: "Wellhead — baseline", category: "upstream" },
  { id: "ALPHA_2", name: "ALPHA-2", subtitle: "Wellhead — declining", category: "upstream" },
  { id: "ALPHA_3", name: "ALPHA-3", subtitle: "Wellhead — volatile", category: "upstream" },
  { id: "MANIFOLD_ALPHA", name: "MANIFOLD ALPHA", subtitle: "Facility — gathering", category: "downstream" },
  { id: "SEPARATOR_ALPHA", name: "SEPARATOR ALPHA", subtitle: "Facility — 3-phase", category: "downstream" }
];

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    let lastDatabaseTimestamp = "";
    const syncAllAssetsWithDynamo = async (isInitialSeed = false) => {
      try {
        if (isInitialSeed) setLoading(true);

        // Fetch all 5 assets simultaneously from your API
        const promises = OILFIELD_ASSETS.map(asset => fetchTelemetryHistory(asset.id));
        const responses = await Promise.all(promises);

        const freshStateMap = {};
        let isDbStatic = false;

        responses.forEach((res) => {
          const key = res.asset.toUpperCase();
          
          if (key === "ALPHA_1") {
            if (res.lastSeen === lastDatabaseTimestamp) {
              isDbStatic = true; 
            }
            lastDatabaseTimestamp = res.lastSeen;
          }

          freshStateMap[key] = {
            history: res.history || [0],
            currentValue: res.currentValue || 0,
            lastSeen: res.lastSeen || "No Sync Log",
            rawMetrics: res.rawMetrics || {} 
          };
        });

        // CONTROL SWAP: Determine whether to use Live Reality or Carousel Replay
        if (isDbStatic && !isInitialSeed) {
          // SYSTEM OFFLINE: Cycle the history arrays left-to-right to keep the dashboard moving
          setDashboardData(prevMap => {
            const cycledMap = { ...prevMap };
            
            Object.keys(cycledMap).forEach(assetKey => {
              const currentAsset = cycledMap[assetKey];
              
              if (currentAsset.history && currentAsset.history.length > 1) {
                // Pull the oldest item from the front and push it straight to the back
                const [oldestPoint, ...remainingHistory] = currentAsset.history;
                const cycledHistory = [...remainingHistory, oldestPoint];
                
                cycledMap[assetKey] = {
                  ...currentAsset,
                  history: cycledHistory,
                  currentValue: cycledHistory[cycledHistory.length - 1], // Update main text readout
                  lastSeen: `Offline • Reposting Logs (${lastDatabaseTimestamp})`
                };
              }
            });
            
            return cycledMap;
          });
        } else {
          // SYSTEM LIVE: Feed the pure, unmodified DynamoDB stream data directly to the layout
          setDashboardData(freshStateMap);
        }

      } catch (err) {
        console.error("Dashboard database polling synchronization breakdown:", err);
      } finally {
        if (isInitialSeed) setLoading(false);
      }
    };

    // 1. Fire immediately on page initialization to pull the fallback/seed baseline
    syncAllAssetsWithDynamo(true);

    // 2. Set up the option 1 background heartbeat interval listener loop
    const shortPollInterval = setInterval(() => {
      syncAllAssetsWithDynamo(false); 
    }, 5000); // Ticks every 5 seconds

    // 3. Prevent structural context memory leaks when navigating away
    return () => clearInterval(shortPollInterval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-amber font-mono text-[12px] animate-pulse tracking-widest">
        SYNCHRONIZING DIGITAL TWIN SCADA LAYERS...
      </div>
    );
  }

  return (
    <div className="px-4  pt-24 lg:pt-4 min-h-screen bg-bgPrimary text-[#cbd5e1] font-sans selection:bg-amber-500/30">
      
      {/* UPSTREAM WELLHEAD GRID ROW */}
      <div className="mb-4 text-[14px] font-semibold text-text2 font-rajdhani uppercase tracking-widest  border-b border-slate-900 pb-1">
        Upstream — Wells
      </div>
      <div className="grid grid-cols-1 mdd:grid-cols-3 gap-6 mb-10">
        {OILFIELD_ASSETS.filter(a => a.category === "upstream").map(config => (
          <AssetCard 
            key={config.id} 
            config={config} 
            data={dashboardData[config.id.toUpperCase()]} 
          />
        ))}
      </div>

      {/* DOWNSTREAM GATHERING FACILITY GRID ROW */}
      <div className="mb-4 text-[14px] font-semibold text-text2 font-rajdhani uppercase tracking-widest  border-b border-slate-900 pb-1">
        Downstream — Facility
      </div>
      <div className="grid grid-cols-1 mdd:grid-cols-2 gap-6">
        {OILFIELD_ASSETS.filter(a => a.category === "downstream").map(config => (
          <AssetCard 
            key={config.id} 
            config={config} 
            data={dashboardData[config.id.toUpperCase()]} 
          />
        ))}
      </div>

    </div>
  );
}