import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CardWithLabels } from '@/types'
import { KanbanCard } from './KanbanCard'

interface SortableCardProps {
  card: CardWithLabels
  onClick?: () => void
  isDone?: boolean
}

export function SortableCard({ card, onClick, isDone }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'Card',
      card,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1, // Drag sırasında orijinal konumda placeholder (hayalet)
  }

  // Eğer kart sürükleniyorsa orijinal yerinde şeffaf ve sade bir kutu gösteririz.
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[100px] bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 opacity-40"
      />
    )
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative">
      <KanbanCard card={card} onClick={onClick} isDone={isDone} />
    </div>
  )
}
