import { TrendingUp } from 'lucide-react'
import React from 'react'

const Forecast = () => {
  return (
    <section className='flex flex-col items-center justify-center py-24 px-4'>

      <div className='flex flex-col items-center gap-4 text-center'>

        {/* Icon */}
        <div className='border border-borderHover p-4 mb-2'>
          <TrendingUp className='w-10 h-10 text-amber' />
        </div>

        {/* Title */}
        <h2 className='font-rajdhani text-white text-[28px] font-semibold uppercase tracking-widest'>
          Forecast
        </h2>

        {/* Coming soon badge */}
        <span className='text-xs font-rajdhani uppercase tracking-widest border border-amber text-amber px-3 py-1'>
          Coming Soon
        </span>

        {/* Description */}
        <p className='text-gray-500 text-sm font-rajdhani max-w-md mt-2'>
          Decline Curve Analysis (DCA) will be available here. 
          Generate production forecasts, view decline trends, 
          and download CSV reports for your wells.
        </p>

      </div>

    </section>
  )
}

export default Forecast