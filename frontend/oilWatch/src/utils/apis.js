const API_BASE_URL = import.meta.env.VITE_API_URL;

export const postReadings = async (readings) => {
  const response = await fetch(`${API_BASE_URL}/readings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(readings),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }

  return data;
};


export const fetchAlerts = async () => {
  const response = await fetch(`${API_BASE_URL}/alerts`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    throw new Error("Failed to fetch alerts")
  }
  
  return response.json();
}

