import React from 'react'
import { alertCardsData } from '@/utils/Data'
import AlertsTable from '../AlertsTable'

const Alerts = () => {
  return (
    <section>
        <div className='px-4 py-6 lg:px-6 bg-bgPrimary'>
            <main className='flex flex-col'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                    {alertCardsData.map((alerts) => (
                        <div key={alerts.id} className="alerts-preview relative p-4 flex flex-col gap-1 font-rajdhani bg-bgTertiary  uppercase ">
                             <div className={`absolute top-0 left-0 ${alerts.color} h-full w-0.75 `}/>
                             <div className='flex flex-col gap-1'>
                                <h2 className={`${alerts.text} font-semibold`}>{alerts.text1}</h2>
                                <h1 className='font-orbitron text-text text-2xl font-bold tracking-wider '>{alerts.value}</h1>
                                <p className='text-text2 text-[13px]'>{alerts.text2}</p>
                             </div>

                        </div>
                    ))}
                </div>

                <div className='text-red-500'>
                    <AlertsTable/>
                </div>

            </main>

        </div>
    </section>
  )
}

export default Alerts