import { useState } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import OilWatchLogo from './OilWatchLogo'
import LiveClock from './LiveClock'
import { Link } from 'react-router-dom'
import Tabs from './Tabs'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="">
      <header className="absolute inset-x-0 top-0 z-50 bg-bgPrimary">
        <nav aria-label="Global" className="flex items-center justify-between p-4 lg:px-6">
          <Link to="/" className="flex flex-row gap-1.5 items-center">
            <OilWatchLogo />
            <div className="flex flex-col uppercase">
              <h2 className="text-amber text-[23px] font-semibold font-orbitron tracking-widest">
                OilWatch
              </h2>
              <p className="text-xs text-text2 font-rajdhani tracking-widest">
                Field Surveillance System V2
              </p>
            </div>
          </Link>

          {/* Right side status items for Desktop */}
          <div className="hidden lg:flex flex-row gap-6 items-center">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber" />
              </span>
              <span className="text-text2 text-xs font-mono tracking-widest uppercase">
                5 ASSETS ACTIVE
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex flex-row gap-2">
                <h2 className="text-text2 font-mono  text-[13px]">SYNCED</h2>
                <LiveClock />
              </div>
            </div>
          </div>

          {/* Hamburger Icon for Mobile */}
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-text2 hover:text-white transition-colors">
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>
          </div>
        </nav>

        <div className="w-full bg-borderHover h-px" />

        {/* MOBILE SIDEBAR MENU POPUP */}
        <Dialog
          open={mobileMenuOpen}
          onClose={setMobileMenuOpen}
          className="lg:hidden">
          
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          
          <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-bgTertiary p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 border-l border-border">
            <div className="flex items-center justify-between">
              <div className="flex flex-row gap-1.5 items-center">
                <OilWatchLogo />
                <div className="flex flex-col uppercase">
                  <h2 className="text-amber text-[23px] font-semibold font-orbitron tracking-widest">
                    OilWatch
                  </h2>
                  <p className="text-xs text-text2 font-rajdhani tracking-widest">
                    Field Surveillance System V2
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-text2 hover:text-white transition-colors">
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>

           
            <div className="mt-8 flow-root">
              <div className="-my-6">
                {/* Clicking any item inside the sidebar links will dismiss the pop-out window */}
                <div className="py-6" onClick={() => setMobileMenuOpen(false)}>
                  <Tabs isMobile={true} />
                </div>
              </div>
            </div>
          </DialogPanel>
        </Dialog>
      </header>

    
      <div className="hidden lg:block">
        <Tabs isMobile={false} />
      </div>
    </div>
  );
}