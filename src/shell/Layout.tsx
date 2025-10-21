import { Outlet, useLocation } from 'react-router-dom'
import Rail from './Rail'
import Topbar from './Topbar'
import CommandPalette from './CommandPalette'
import { AnimatePresence, motion } from 'framer-motion'
import ChatWidget from '@/components/ChatWidget'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-cinematic">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grid" />
      </div>

      <Rail />
      <div className="pl-16 sm:pl-20">
        <Topbar />
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="container py-8"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Global overlays/widgets */}
      <CommandPalette />
      <ChatWidget />
    </div>
  )
}
