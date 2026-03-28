import { NavLink } from "react-router-dom";

const tabs = [
  { label: "Data Entry",  path: "/",  icon: "⊕" },
  { label: "Alerts",      path: "/alerts",      icon: "⚠" },
  { label: "Forecast",    path: "/forecast",    icon: "↗" },
];

const Tabs = () => {
  return (
    <div className="flex flex-row items-center justify-around flex-wrap font-orbitron border-border bg-bgSecondary px-4 md:px-6">
      {tabs.map((tab) => (
        <NavLink key={tab.path} to={tab.path}
          className={({ isActive }) => `flex items-center text-center gap-2 px-5 py-3 text-xs font-semibold tracking-widest uppercase border-b-2 transition-all duration-200 
             ${isActive ? "border-amber text-amber bg-linear-to-b from-transparent to-[rgba(245,158,11,0.04)]"
               : "border-transparent text-text3 hover:text-text2" }`}>
          <span className="">{tab.icon}</span>
          <span className="">{tab.label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default Tabs;