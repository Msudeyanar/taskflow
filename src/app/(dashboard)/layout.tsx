import React from 'react'
import { MobileBottomNav } from '@/components/shared/MobileBottomNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen pb-16 md:pb-0">
      {children}
      <MobileBottomNav />
    </div>
  )
}
