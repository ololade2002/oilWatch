import React from 'react'

const LiveBadge = () => {
  return (
     <div className='flex flex-row gap-6 '>
      <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green" />
      </span>
      <span
        className="text-text2 text-xs font-mono tracking-widest uppercase">
        API CONNECTED
      </span>
    </div>

    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber" />
      </span>
      <span
        className="text-text2 text-xs font-mono tracking-widest uppercase">
        2 ASSETS ACTIVE
      </span>
    </div>
     </div>
  )
}

export default LiveBadge