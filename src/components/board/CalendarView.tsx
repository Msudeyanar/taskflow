'use client'

import React from 'react'
import { useBoard } from '@/hooks/useBoard'
import { Calendar } from '@/components/ui/calendar'
import { isSameDay, format } from 'date-fns'
import { CheckCircle2Icon } from 'lucide-react'

// Sütun aşama renkleri
const stageColors: Record<string, { bg: string; text: string; border: string }> = {
  yapılacak: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  yapılıyor: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  bitti: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  default: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
}

function getStageStyle(columnTitle: string) {
  const lower = columnTitle.toLowerCase()
  if (lower.includes('bitti') || lower.includes('done')) return stageColors.bitti
  if (lower.includes('yapılıyor') || lower.includes('progress')) return stageColors.yapılıyor
  if (lower.includes('yapılacak') || lower.includes('to do')) return stageColors.yapılacak
  return stageColors.default
}

export function CalendarView() {
  const { filteredBoard } = useBoard()

  // Kartları sütun bilgisiyle birlikte alalım
  const cardsWithDates = filteredBoard.columns
    .flatMap(col => col.cards.map(card => ({
      ...card,
      columnTitle: col.title,
      isDone: col.title.toLowerCase().includes('bitti') || col.title.toLowerCase().includes('done')
    })))
    .filter(card => card.due_date)

  const [date, setDate] = React.useState<Date | undefined>(new Date())

  // Seçili güne ait kartlar
  const selectedCards = date 
    ? cardsWithDates.filter(card => isSameDay(new Date(card.due_date!), date))
    : []

  return (
    <div className="flex-1 p-3 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-8 overflow-y-auto bg-slate-50">
      {/* Sol taraf: Takvim */}
      <div className="w-full sm:w-[350px] shrink-0 bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-fit">
        <h2 className="font-semibold text-slate-800 mb-4 px-2">Teslim Tarihleri Takvimi</h2>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md"
          modifiers={{
            hasTask: cardsWithDates.map(c => new Date(c.due_date!))
          }}
          modifiersStyles={{
            hasTask: { fontWeight: 'bold', backgroundColor: '#EFF6FF', color: '#2563EB', borderRadius: '4px' }
          }}
        />

        {/* Lejant */}
        <div className="mt-4 pt-4 border-t border-slate-100 px-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Aşamalar</p>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
              <span className="text-xs text-slate-600">Yapılacak</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span className="text-xs text-slate-600">Yapılıyor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span className="text-xs text-slate-600 flex items-center gap-1">Bitti <CheckCircle2Icon className="w-3 h-3 text-emerald-500" /></span>
            </div>
          </div>
        </div>
      </div>

      {/* Sağ taraf: O güne ait görevler */}
      <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-6 text-lg">
          {date ? format(date, 'dd MMMM yyyy') + ' Görevleri' : 'Tarih Seçin'}
        </h2>

        {selectedCards.length > 0 ? (
          <div className="flex flex-col gap-3">
            {selectedCards.map(card => {
              const stage = getStageStyle(card.columnTitle)
              return (
                <div 
                  key={card.id} 
                  className={`p-4 border rounded-lg flex flex-col gap-2 transition-colors ${
                    card.isDone 
                      ? 'border-emerald-300 bg-emerald-50/50' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Bitti ise tik ikonu */}
                      {card.isDone && (
                        <CheckCircle2Icon className="w-5 h-5 text-emerald-500 shrink-0" />
                      )}
                      <h3 className={`font-medium ${card.isDone ? 'text-emerald-800 line-through decoration-emerald-400/50' : 'text-slate-800'}`}>
                        {card.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Aşama etiketi */}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${stage.bg} ${stage.text} ${stage.border}`}>
                        {card.columnTitle}
                      </span>
                      {/* Öncelik noktası */}
                      <div 
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: 
                            card.priority === 'high' ? '#EF4444' : 
                            card.priority === 'medium' ? '#F59E0B' : 
                            card.priority === 'low' ? '#10B981' : '#CBD5E1'
                        }}
                      />
                    </div>
                  </div>
                  {card.description && (
                    <p className={`text-sm ${card.isDone ? 'text-emerald-600/70' : 'text-slate-500'}`}>
                      {card.description}
                    </p>
                  )}
                  
                  {card.labels && card.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
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
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <span className="text-4xl mb-2">📅</span>
            <p className="font-medium">Bu güne ait görev bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  )
}
