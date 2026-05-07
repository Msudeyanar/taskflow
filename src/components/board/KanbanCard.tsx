import React from 'react'
import { CardWithLabels } from '@/types'
import { CalendarIcon, MessageSquareIcon, PaperclipIcon } from 'lucide-react'
import { format } from 'date-fns'

interface KanbanCardProps {
  card: CardWithLabels
  onClick?: () => void
  isDone?: boolean
}

export function KanbanCard({ card, onClick, isDone }: KanbanCardProps) {
  // Sürüklerken gölge ve tilt efekti dnd-kit DragOverlay üzerinden eklenir
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-3 shadow-sm border hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative ${isDone
        ? 'border-emerald-400 ring-2 ring-emerald-400/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
        : 'border-slate-200'
        }`}
    >
      {/* Etiketler (Labels) */}
      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map((label) => (
            <span
              key={label.id}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${label.color}20`, color: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Başlık */}
      <h4 className="text-sm font-medium text-slate-700 leading-tight mb-2">
        {card.title}
      </h4>

      {/* Öncelik Çizgisi (Priority Stripe) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg opacity-80"
        style={{
          backgroundColor:
            card.priority === 'high' ? '#EF4444' :
              card.priority === 'medium' ? '#F59E0B' :
                card.priority === 'low' ? '#10B981' : 'transparent'
        }}
      />

      {/* Alt Bilgiler: Son Tarih ve İkonlar */}
      <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
        {card.due_date ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded text-slate-500 font-medium">
              <CalendarIcon className="w-3 h-3" />
              {format(new Date(card.due_date), 'dd MMM')}
            </div>
            {(() => {
              if (isDone) return null
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const dueDate = new Date(card.due_date)
              dueDate.setHours(0, 0, 0, 0)
              const diffTime = dueDate.getTime() - today.getTime()
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

              if (diffDays >= 0 && diffDays <= 3) {
                return (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 uppercase tracking-tighter">
                    {diffDays === 0 ? 'son bugün' : `son ${diffDays} gün`}
                  </span>
                )
              }
              return null
            })()}
          </div>
        ) : (
          <div /> // Boşluk koruyucu
        )}

        <div className="flex items-center gap-2">
          {card.description && <MessageSquareIcon className="w-3.5 h-3.5" />}
          {card.assignee && (
            <div
              className={`w-6 h-6 rounded-full ${card.assignee.color} flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm ml-1`}
              title={`Sorumlu: ${card.assignee.name}`}
            >
              {card.assignee.initials}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
