import React from 'react'
import { useState, useEffect } from "react";

const LiveClock = () => {
    const [time, setTime] = useState("");
    useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setTime(`${h}:${m}:${s} UTC`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval); 
  }, []);

  return (
      <span className="text-amber font-mono text-[15px]" >
      {time}
    </span>
  )
}

export default LiveClock