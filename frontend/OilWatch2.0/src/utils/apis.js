const API_BASE_URL = import.meta.env.VITE_API_URL;

export const fetchTelemetryHistory = async (assetId) => {
  try {
    // If assetId is "MANIFOLD_ALPHA", this hits: API_BASE_URL/telemetry?asset=MANIFOLD_ALPHA
    const response = await fetch(`${API_BASE_URL}/telemetry?asset=${assetId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error pulling dashboard logs for ${assetId}:`, error);
    throw error;
  }
};

/**
 * Fetches the active system anomaly tracking list from the alerts database
 */
export const fetchActiveAlerts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error pulling active alert stream:", error);
    throw error;
  }
};

export async function fetchProductionForecast(assetId = "ALPHA_2") {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/forecast?asset_id=${assetId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch production forecast");
  }

  const data = await response.json();

  return data;
}