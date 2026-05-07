import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ColumnWithCards, CardWithLabels } from '@/types'
import { KanbanColumn } from './KanbanColumn'

interface SortableColumnProps {
  column: ColumnWithCards
  onCardClick?: (card: CardWithLabels) => void
}

export function SortableColumn({ column, onCardClick }: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  // Sürüklenen sütunun yerinde kalacak izi (placeholder)
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        data-dragging="true"
        className="w-[260px] sm:w-[300px] min-w-[260px] sm:min-w-[300px] bg-slate-200/50 rounded-xl border-2 border-dashed border-slate-300 opacity-40 flex flex-col"
      />
    )
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} data-dragging="false" className="flex h-full touch-manipulation">
      <KanbanColumn column={column} onCardClick={onCardClick} />
    </div>
  )
}
