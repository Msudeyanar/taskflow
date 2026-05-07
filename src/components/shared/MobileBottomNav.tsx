'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboardIcon, CalendarIcon, LogOutIcon, BarChart3Icon } from 'lucide-react'
import { BoardContext } from '@/hooks/useBoard'
import { createClient } from '@/lib/supabase/client'

export function MobileBottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const boardContext = React.useContext(BoardContext)
  
  const view = boardContext?.view
  const setView = boardContext?.setView

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {}
    localStorage.removeItem('taskflow-user')
    router.push('/login')
  }

  // Sadece board sayfasındaysak takvim/kanban switcher'ı göster
  const isBoardPage = pathname.includes('/board/')

  return (
    <nav className="bottom-nav-glass">
      <button 
        onClick={() => router.push('/boards')}
        className={`flex flex-col items-center gap-1 ${pathname === '/boards' ? 'text-blue-600' : 'text-slate-500'}`}
      >
        <LayoutDashboardIcon className="w-5 h-5" />
        <span className="text-[10px] font-medium">Panolarım</span>
      </button>

      {isBoardPage && boardContext && (
        <>
          <button 
            onClick={() => setView?.('kanban')}
            className={`flex flex-col items-center gap-1 ${view === 'kanban' ? 'text-blue-600' : 'text-slate-500'}`}
          >
            <BarChart3Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">Kanban</span>
          </button>
          <button 
            onClick={() => setView?.('calendar')}
            className={`flex flex-col items-center gap-1 ${view === 'calendar' ? 'text-blue-600' : 'text-slate-500'}`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium">Takvim</span>
          </button>
        </>
      )}

      <button 
        onClick={handleLogout}
        className="flex flex-col items-center gap-1 text-slate-500 hover:text-red-500"
      >
        <LogOutIcon className="w-5 h-5" />
        <span className="text-[10px] font-medium">Çıkış</span>
      </button>
    </nav>
  )
}
