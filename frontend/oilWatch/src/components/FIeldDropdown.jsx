import React from 'react'
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FIeldDropdown = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("BONNY ISLAND EAST");

   const fields = [
    "BONNY ISLAND EAST",
    "FORCADOS BLOCK 4",
    "ESCRAVOS NORTH",
  ];
  return (
     <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center font-mono  gap-2 px-3 py-2 text-xs tracking-widest uppercase border border-borderHover bg-bgTertiary text-text hover:border-amber transition-colors">
        <span>{selected}</span>
        <ChevronDown
          size={14}
          className={`text-text3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}/>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-full min-w-50 border border-borderHover bg-bgTertiary z-50">
          {fields.map((field) => (
            <button
              key={field}
              onClick={() => { setSelected(field); setOpen(false); }}
              className={`w-full font-mono text-left px-3 py-2 text-xs tracking-widest uppercase transition-colors hover:bg-bgTertiary hover:text-amber
                ${selected === field ? "text-amber bg-bgTertiary" : "text-text2"}`} >
              {field}
            </button>
          ))}
        </div>
      )}
    </div>
    
  )
}

export default FIeldDropdown