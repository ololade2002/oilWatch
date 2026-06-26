

const assetsSnapshot = [
  { id: "WELL-01", name: "ALPHA-1", type: "PSI", value: "1,933.8", status: "NORMAL" },
  { id: "WELL-02", name: "ALPHA-2", type: "%", value: "66.9", status: "NORMAL" },
  { id: "WELL-03", name: "ALPHA-3", type: "PSI", value: "3,864.4", status: "NORMAL" },
  { id: "MN-A",  name: "MANIFOLD", type: "PSI", value: "1,903.9", status: "NORMAL" },
  { id: "SEP-A", name: "SEPARATOR", type: "%", value: "49.0", status: "NORMAL" },
];

const HomePage = ({ engineerName = "Engineer" }) => {
  return (
    <div className=" bg-bgPrimary pt-24 lg:pt-4 text-text1 font-orbitron px-4 md:px-12 py-6 flex flex-col items-center">
      
  
      <div className="w-full max-w-6xl text-left  mb-12 border-l-4 border-amber pl-4">
        <h1 className="text-xl md:text-2xl font-bold tracking-widest text-white uppercase animate-fade-in">
          Welcome back, {engineerName}
        </h1>
        <p className="text-[12px] text-[#8ea2bc] font-raleway mt-1">
          Authorized Terminal Session Active • Base Location: Lagos Hub
        </p>
      </div>

      <div className="text-center mb-16 space-y-2">
        <p className="text-[10px]  font-bold tracking-[0.3em] text-text3 uppercase">
          Digital Oilfield Surveillance System V2.0
        </p>
        <h2 className="text-4xl md:text-5xl font-black tracking-widest text-white">
          FACILITY <span className="text-amber drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">ALPHA</span>
        </h2>
        <p className="text-xs font-medium  tracking-widest text-text2 uppercase pt-2">
          Onshore Production • 5 Active Assets • Real-Time Monitoring
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full max-w-6xl mb-16">
        {assetsSnapshot.map((asset) => (
          <div 
            key={asset.id} 
            className="bg-[#0c1217] border border-amber/40 rounded-xl p-5 flex flex-col items-center justify-between text-center transition-all duration-300 hover:border-amber/50 hover:shadow-[0_0_15px_rgba(52,211,153,0.1)] group" >
            <div>
              <p className="text-[9px] font-bold tracking-widest text-text3 uppercase mb-1">
                {asset.id}
              </p>
              <h3 className="text-sm font-black tracking-wide text-white group-hover:text-amber transition-colors">
                {asset.name}
              </h3>
            </div>

            {/* Glowing Status Node indicator */}
            <div className="my-6 flex flex-col items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber"></span>
              </span>
              <p className="text-[10px] font-bold tracking-widest text-amber uppercase mt-1">
                {asset.status}
              </p>
            </div>

            <div>
              <p className="text-xl font-extrabold text-slate-100 tracking-tight">
                {asset.value}
              </p>
              <p className="text-[12px] font-bold text-text3 uppercase mt-0.5">
                {asset.type}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;