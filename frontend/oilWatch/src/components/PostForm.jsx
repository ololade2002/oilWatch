import { useState } from "react";
import { postReadings } from "../utils/apis";
import { toast } from "sonner";

const wells = [
  { id: "WELL-001", name: "Well Alpha" },
  { id: "WELL-002", name: "Well Ruby" },
];

const pipelines = [
  { id: "PL-001", name: "Pipeline North" },
  { id: "PL-002", name: "Pipeline South" },
];

export default function PostForm() {
  const [assetType, setAssetType] = useState("well");
  const [selectedAsset, setSelectedAsset] = useState(wells[0].id);

  const [formData, setFormData] = useState({
    operatorName: "",
    pressure: "",
    flowRate: "",
    temperature: "",
    inletPressure: "",
    outletPressure: "",
  });

  const assetOptions = assetType === "well" ? wells : pipelines;

  const handleAssetTypeChange = (e) => {
    const newType = e.target.value;
    setAssetType(newType);

    if (newType === "well") {
      setSelectedAsset(wells[0].id);
    } else {
      setSelectedAsset(pipelines[0].id);
    }

    setFormData((prev) => ({
      operatorName: prev.operatorName,
      pressure: "",
      flowRate: "",
      temperature: "",
      inletPressure: "",
      outletPressure: "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  let payload;

  if (assetType === "well") {
    payload = {
      assetType: "well",
      assetId: selectedAsset,
      operatorName: formData.operatorName.trim(),
      pressure: Number(formData.pressure),
      flowRate: Number(formData.flowRate),
      temperature: Number(formData.temperature),
    };
  } else {
    payload = {
      assetType: "pipeline",
      assetId: selectedAsset,
      operatorName: formData.operatorName.trim(),
      inletPressure: Number(formData.inletPressure),
      outletPressure: Number(formData.outletPressure),
      flowRate: Number(formData.flowRate),
      temperature: Number(formData.temperature),
    };
  }

  try {
    console.log("Submitting payload:", payload);

    const result = await postReadings(payload);
    console.log("API response:", result);

    toast.success("Reading submitted successfully");

    setFormData((prev) => ({
      operatorName: prev.operatorName,
      pressure: "",
      flowRate: "",
      temperature: "",
      inletPressure: "",
      outletPressure: "",
    }));
  } catch (error) {
    console.error("Submit error:", error);
    toast.error(error.message || "Failed to submit reading");
  }
};
  

  return (
    <section className="py-6 bg-bgPrimary">
      <div className="w-full mx-auto pb-8 bg-bgTertiary rounded-lg shadow-md ">
        <div className="flex flex-row border-b border-gray-700">
          <h2 className="text-[20px] font-rajdhani text-amber font-medium uppercase py-4 px-4">
            Field Data Entry
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col font-rajdhani gap-4 py-4 px-4">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-text2 mb-2 uppercase">
              Asset Type
            </label>
            <select
              value={assetType}
              onChange={handleAssetTypeChange}
              className="w-full p-3 bg-bgPrimary  border border-borderColor text-text rounded-lg outline-none" >
              <option value="well">WELL</option>
              <option value="pipeline">PIPELINE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-text2 mb-2 uppercase">
              Select
            </label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full p-3 bg-bgPrimary border uppercase border-borderColor text-text rounded-lg outline-none" >
              {assetOptions.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} 
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-text2 mb-2 uppercase">
              Operator Name
            </label>
            <input
              type="text"
              name="operatorName"
              value={formData.operatorName}
              onChange={handleChange}
              className="w-full p-3 bg-bgPrimary border border-borderColor text-text rounded-lg outline-none"
              placeholder="Enter operator name"
              required
            />
          </div>

          {assetType === "well" ? (
            <>
              <div>
                <label className="block text-sm text-text2 mb-2 uppercase">
                  Pressure (psi)
                </label>
                <input
                  type="number"
                  name="pressure"
                  value={formData.pressure}
                  onChange={handleChange}
                  className="w-full p-3 bg-bgPrimary border border-borderColor text-text rounded-lg outline-none"
                  placeholder="Enter well pressure"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-text2 mb-2 uppercase">
                  Flow Rate (m3/s)
                </label>
                <input
                  type="number"
                  name="flowRate"
                  value={formData.flowRate}
                  onChange={handleChange}
                  className="w-full p-3 bg-bgPrimary border border-borderColor text-text rounded-lg outline-none"
                  placeholder="Enter flow rate"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-text2 mb-2 uppercase">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  className="w-full p-3 bg-bgPrimary border border-borderColor text-text rounded-lg outline-none"
                  placeholder="Enter temperature"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm text-text2 mb-2 uppercase">
                  Inlet Pressure (psi)
                </label>
                <input
                  type="number"
                  name="inletPressure"
                  value={formData.inletPressure}
                  onChange={handleChange}
                  className="w-full p-3 bg-bgPrimary border border-borderColor text-text rounded-lg outline-none"
                  placeholder="Enter inlet pressure"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-text2 mb-2 uppercase">
                  Outlet Pressure (psi)
                </label>
                <input
                  type="number"
                  name="outletPressure"
                  value={formData.outletPressure}
                  onChange={handleChange}
                  className="w-full p-3 bg-bgPrimary border border-borderColor text-text rounded-lg outline-none"
                  placeholder="Enter outlet pressure"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-text2 mb-2 uppercase">
                  Flow Rate (m3/s)
                </label>
                <input
                  type="number"
                  name="flowRate"
                  value={formData.flowRate}
                  onChange={handleChange}
                  className="w-full p-3 bg-bgPrimary border border-borderColor text-text rounded-lg outline-none"
                  placeholder="Enter flow rate"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-text2 mb-2 uppercase">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  className="w-full p-3 bg-bgPrimary border border-borderColor text-text rounded-lg outline-none"
                  placeholder="Enter temperature"
                  required
                />
              </div>
            </>
          )}
         </div> 

        <button type="submit" className=" mx-auto text-center flex items-center gap-2 px-6 py-3 text-sm font-semibold tracking-widest uppercase border-2 border-amber text-amber rounded-lg hover:bg-amber hover:text-black font-orbitron transition-colors duration-200">
          Submit Reading
        </button>

        </form>

      

      </div>
    </section>
  );
}