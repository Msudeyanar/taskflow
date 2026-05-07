'use client'

import { KanbanBoard } from '@/components/board/KanbanBoard'
import { CalendarView } from '@/components/board/CalendarView'
import { DashboardHeader } from '@/components/shared/DashboardHeader'
import { BoardProvider, useBoard } from '@/hooks/useBoard'

function BoardContent() {
  const { view } = useBoard()
  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-800">
      <DashboardHeader />
      <main className="flex-1 overflow-hidden flex">
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
          {view === 'kanban' ? <KanbanBoard /> : <CalendarView />}
        </div>
      </main>
    </div>
  )
}

export default function BoardPage() {
  return (
    <BoardProvider>
      <BoardContent />
    </BoardProvider>
  )
}
