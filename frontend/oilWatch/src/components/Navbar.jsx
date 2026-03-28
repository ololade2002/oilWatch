
import { useState } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import OilWatchLogo from './OilWatchLogo'
import FIeldDropdown from './FIeldDropdown'
import LiveBadge from './LiveBadge'
import LiveClock from './LiveClock'


export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav aria-label="Global" className="flex items-center justify-between p-4 lg:px-6 ">
          <div className="flex flex-row gap-1.5 items-center">
            <OilWatchLogo/>
            <div className='flex flex-col uppercase '>
                <h2 className='text-amber text-[23px] font-semibold font-orbitron tracking-widest'>OilWatch</h2>
                <p className='text-xs text-text2 font-rajdhani tracking-widest'>Field Surveillance System V2</p>
            </div>
          </div>

          <div className="flex lg:hidden">
            <button type="button" onClick={() => setMobileMenuOpen(true)} className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700" > <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>
          </div>
         
          <div className="hidden lg:flex lg:flex-1 lg:items-center lg:gap-7 lg:justify-end">
            <LiveBadge/>
            <LiveClock/>
            <FIeldDropdown/>
          </div>

        </nav>

        <div className='w-full bg-borderHover h-px'/>


        <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
          <div className="fixed inset-0 z-50" />
          <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-bgTertiary p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
                <div className="flex flex-row gap-1.5 items-center">
                  <OilWatchLogo/>
                <div className='flex flex-col uppercase '>
                    <h2 className='text-amber text-[23px] font-semibold font-orbitron tracking-widest'>OilWatch</h2>
                    <p className='text-xs text-text2 font-rajdhani tracking-widest'>Field Surveillance System V2</p>
                </div>
          </div>

              <button type="button" onClick={() => setMobileMenuOpen(false)} className="-m-2.5 rounded-md p-2.5 text-gray-700">
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
               
                <div className="py-6 flex flex-col gap-5 ">
                 <LiveBadge/>
                 <LiveClock/>
                 <FIeldDropdown/>
                </div>
              </div>
            </div>
          </DialogPanel>
        </Dialog>
      </header>

    </div>
  )
}
