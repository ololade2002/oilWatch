import { NavLink } from "react-router-dom";
import { Activity, Bell, TrendingUp, Home } from "lucide-react";


const tabs = [
  { label: "Home",      path: "/home",      icon: <Home className="w-4 h-4 stroke-[1.5]" /> },
  { label: "Dashboard", path: "/dashboard", icon: <Activity className="w-4 h-4 stroke-[1.5]" /> },
  { label: "Alerts",    path: "/alerts",    icon: <Bell className="w-4 h-4 stroke-[1.5]" /> },
  { label: "Forecast",  path: "/forecast",  icon: <TrendingUp className="w-4 h-4 stroke-[1.5]" /> },
];

const Tabs = ({ isMobile = false }) => {

  if (isMobile) {
    return (
      <div className="flex flex-col gap-2 font-orbitron w-full mt-4">
        {tabs.map((tab) => (
          <NavLink 
            key={tab.path} 
            to={tab.path}
            className={({ isActive }) => `flex items-center gap-4 px-4 py-3 text-sm font-semibold tracking-widest uppercase rounded-xl border-l-2 transition-all duration-200 
               ${isActive 
                 ? "border-amber text-amber bg-amber/5"
                 : "border-transparent text-text3 hover:text-text2 hover:bg-slate-900/30" 
               }`}>
            <span className="flex items-center justify-center">{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    );
  }

  
  return (
    <div className="flex flex-row items-center pt-24 justify-around flex-wrap font-orbitron border-border bg-bgSecondary px-4 md:px-6">
      {tabs.map((tab) => (
        <NavLink 
          key={tab.path} 
          to={tab.path}
          className={({ isActive }) => `flex items-center text-center gap-2 px-5 py-3 text-xs font-semibold tracking-widest uppercase border-b-2 transition-all duration-200 
             ${isActive 
               ? "border-amber text-amber bg-linear-to-b from-transparent to-[rgba(245,158,11,0.04)]"
               : "border-transparent text-text3 hover:text-text2" 
             }`}
        >
          <span className="flex items-center justify-center">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default Tabs;