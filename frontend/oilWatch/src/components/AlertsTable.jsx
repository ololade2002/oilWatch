import { RefreshCcw } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { fetchAlerts } from '@/utils/apis'

const AlertsTable = () => {

    const [alerts, setAlerts]   = useState([])
    const [loading, setLoading] = useState(false)
    const [filter, setFilter]   = useState("ALL")

    useEffect(() => {
        async function getAlerts() {
            setLoading(true)
            const data = await fetchAlerts()
            setAlerts(data.alerts || [])
            setLoading(false)
        }
        getAlerts()
    }, [])

    async function handleRefresh() {
        setLoading(true)
        const data = await fetchAlerts()
        setAlerts(data.alerts || [])
        setLoading(false)
    }

    const filteredAlerts = alerts.filter((alert) => {
        if (filter === "ALL") return true
        return alert.severity?.toUpperCase() === filter
    })

    function severityBorder(severity) {
        switch (severity?.toUpperCase()) {
            case "CRITICAL": return "bg-red"
            case "WARNING":  return "bg-amber"
            default:         return "bg-blue-400"
        }
    }

    function severityBadge(severity) {
        switch (severity?.toUpperCase()) {
            case "CRITICAL": return "bg-red text-white"
            case "WARNING":  return "bg-amber text-bgTertiary"
            default:         return "bg-blue-400 text-white"
        }
    }

    function formatTime(ts) {
        if (!ts) return "—"
        return new Date(ts).toLocaleString()
    }

    return (
        <section className=' mt-6 bg-bgPrimary border border-borderHover'>
            <div className='w-full mx-auto  bg-bgTertiary shadow-md'>

                {/* Header */}
                <div className="flex flex-row justify-between border-b border-borderHover">
                    <h2 className="text-[18px] flex flex-row items-center justify-center font-rajdhani text-white font-medium uppercase py-4 px-4">
                        Alert Feed
                    </h2>
                    <button
                        onClick={handleRefresh}
                        className='flex flex-row items-center text-[12px] gap-1.5 px-2 py-2 text-gray-400 hover:text-white text-sm uppercase tracking-wide border border-gray-600 hover:border-gray-400 transition-colors my-3 mr-4'>
                        <RefreshCcw className='w-3 h-3'/> Refresh
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className='flex flex-row justify-between items-center border-b border-borderHover'>
                    <div className='flex flex-wrap flex-row gap-4 text-[14px] font-rajdhani px-4 py-3 '>
                     {["ALL", "CRITICAL", "WARNING"].map((f) => (
                        <p key={f} onClick={() => setFilter(f)} className={`border px-3 cursor-pointer transition-colors
                                ${filter === f ? "border-blue text-blue" : "border-text3 text-text3 hover:border-white hover:text-white" }`}>
                            {f}
                        </p> ))}
                    </div>

                    <p className='text-gray-500 text-xs font-rajdhani px-4 pt-3'>
                         {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? "s" : ""}
                    </p>
                </div>
               

                {/* Loading */}
                {loading && (
                    <p className="text-gray-400 text-sm px-4 py-6 font-rajdhani uppercase">
                        Loading alerts...
                    </p>
                )}

                {/* Empty state */}
                {!loading && filteredAlerts.length === 0 && (
                    <p className="text-gray-500 text-sm px-4 py-6 font-rajdhani uppercase">
                        No alerts found.
                    </p>
                )}

                {/* Alerts List */}
                <div className='mt-2'>
                    {!loading && filteredAlerts.map((alert) => (
                        <div key={alert.alertId} className="relative flex flex-col gap-4 lg:flex-row justify-between items-start lg:items-center border-b border-borderHover px-2 py-4 lg:p-4" >
                            <div className={`hidden lg:absolute w-1 h-32 lg:h-16 top-5 bottom-0 left-2 ${severityBorder(alert.severity)}`} />
                            <div className='pl-1 lg:pl-2 font-rajdhani flex-1'>
                                <div className='flex flex-row items-center gap-3 mb-1'>
                                    <h2 className='uppercase font-mono text-white text-[15px]'>
                                        {alert.assetId} — {alert.problem}
                                    </h2>
                                    <span className={`text-xs px-2 py-0.5 font-semibold uppercase ${severityBadge(alert.severity)}`}>
                                        {alert.severity}
                                    </span>
                                </div>
                                <p className='text-gray-500 text-sm font-medium'>
                                    {alert.message}
                                </p>
                                <div className='flex flex-row gap-2 mt-2 flex-wrap'>
                                    <span className='text-xs border border-borderHover text-text3 px-2 py-0.5 uppercase'>
                                        {alert.assetType}
                                    </span>
                                    <span className='text-xs border border-borderHover text-text3 px-2 py-0.5 uppercase'>
                                        {alert.assetId}
                                    </span>
                                    <span className='text-xs border border-borderHover text-text3 px-2 py-0.5 uppercase'>
                                        {alert.problem}
                                    </span>
                                </div>
                            </div>

                            {/* Time and Buttons */}
                            <div className='pl-1 lg:pl-0 flex flex-row items-center gap-3 font-rajdhani'>
                                <p className='text-gray-500 text-xs mr-2 hidden lg:block'>
                                    {formatTime(alert.alertTime)}
                                </p>
                                <button className='text-bgTertiary text-[13px] font-medium uppercase bg-amber-500 px-2 py-1'>
                                    Resolve
                                </button>
                                <button className='border uppercase text-[13px] font-medium border-borderHover text-text3 px-2 py-1'>
                                    Details
                                </button>
                            </div>

                        </div>
                    ))}
                </div>

            </div>
        </section>
    )
}

export default AlertsTable
