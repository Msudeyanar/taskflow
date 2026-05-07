'use client'

import React, { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'

import { useBoard } from '@/hooks/useBoard'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { SortableColumn } from './SortableColumn'
import { CardDetailModal } from './CardDetailModal'
import { CardWithLabels, ColumnWithCards } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { PlusIcon, SearchXIcon } from 'lucide-react'
import { generateKeyBetween } from 'fractional-indexing'

export function KanbanBoard() {
  const { board, filteredBoard, setBoard, addColumn, loading, searchQuery, filterPriority, filterDate, filterLabel } = useBoard()
  const supabase = createClient()
  const [activeColumn, setActiveColumn] = useState<ColumnWithCards | null>(null)
  const [activeCard, setActiveCard] = useState<CardWithLabels | null>(null)
  const [selectedCard, setSelectedCard] = useState<CardWithLabels | null>(null)
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColTitle, setNewColTitle] = useState('')

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300, // Mobil için uzun basma (long press)
        tolerance: 8, // Parmak kaydırmayı sürükle-bıraktan ayırt eder
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const columnsId = filteredBoard.columns.map((col) => col.id)

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event
    if (active.data.current?.type === 'Column') {
      setActiveColumn(active.data.current.column)
      return
    }
    if (active.data.current?.type === 'Card') {
      setActiveCard(active.data.current.card)
      return
    }
  }

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveCard = active.data.current?.type === 'Card'
    const isOverCard = over.data.current?.type === 'Card'
    const isOverColumn = over.data.current?.type === 'Column'

    if (!isActiveCard) return

    if (isActiveCard && isOverCard) {
      setBoard((prev) => {
        const activeCardId = activeId as string
        const overCardId = overId as string
        const activeColId = active.data.current?.card.column_id
        const overColId = over.data.current?.card.column_id

        const activeColIndex = prev.columns.findIndex((c) => c.id === activeColId)
        const overColIndex = prev.columns.findIndex((c) => c.id === overColId)

        if (activeColIndex === -1 || overColIndex === -1) return prev

        const activeCardIndex = prev.columns[activeColIndex].cards.findIndex((c) => c.id === activeCardId)
        const overCardIndex = prev.columns[overColIndex].cards.findIndex((c) => c.id === overCardId)

        const newColumns = prev.columns.map(col => ({ ...col, cards: [...col.cards] }))

        if (activeColIndex === overColIndex) {
          newColumns[activeColIndex].cards = arrayMove(
            newColumns[activeColIndex].cards,
            activeCardIndex,
            overCardIndex
          )
        } else {
          const [movedCard] = newColumns[activeColIndex].cards.splice(activeCardIndex, 1)
          movedCard.column_id = newColumns[overColIndex].id
          newColumns[overColIndex].cards.splice(overCardIndex, 0, movedCard)
        }

        return { ...prev, columns: newColumns }
      })
    }

    if (isActiveCard && isOverColumn) {
      setBoard((prev) => {
        const activeCardId = activeId as string
        const overColId = overId as string
        const activeColId = active.data.current?.card.column_id

        if (activeColId === overColId) return prev

        const activeColIndex = prev.columns.findIndex((c) => c.id === activeColId)
        const overColIndex = prev.columns.findIndex((c) => c.id === overColId)

        if (activeColIndex === -1 || overColIndex === -1) return prev

        const activeCardIndex = prev.columns[activeColIndex].cards.findIndex((c) => c.id === activeCardId)

        const newColumns = prev.columns.map(col => ({ ...col, cards: [...col.cards] }))
        const [movedCard] = newColumns[activeColIndex].cards.splice(activeCardIndex, 1)
        movedCard.column_id = newColumns[overColIndex].id
        newColumns[overColIndex].cards.push(movedCard)

        return { ...prev, columns: newColumns }
      })
    }
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    // Aktivite logu ve DB güncelleme: Kart taşındığında
    if (active.data.current?.type === 'Card' && over) {
      const card = active.data.current.card as CardWithLabels
      const fromColId = card.column_id
      
      setBoard(prev => {
        // Kartın düştüğü son sütunu ve indexini bul
        let toCol: ColumnWithCards | undefined
        prev.columns.forEach(col => {
          if (col.cards.find(c => c.id === card.id)) toCol = col
        })

        if (toCol) {
          const newIndex = toCol.cards.findIndex(c => c.id === card.id)
          const prevPos = toCol.cards[newIndex - 1]?.position || null
          const nextPos = toCol.cards[newIndex + 1]?.position || null
          
          try {
            if (prevPos && nextPos && prevPos >= nextPos) throw new Error("Invalid bounds");
            const newPos = generateKeyBetween(prevPos, nextPos)
            toCol.cards[newIndex].position = newPos

            // Optimistic UI - sadece değişen kartı DB'ye gönder
            supabase.from('cards').update({ 
              column_id: toCol.id, 
              position: newPos 
            }).eq('id', card.id)
          } catch (error) {
            console.error("Position generation error, self-healing column:", error)
            // Eğer fractional indexing hata verirse (örneğin a0 >= a0), tüm sütunu yeniden diz
            try {
              const newKeys = generateNKeysBetween(null, null, toCol.cards.length)
              toCol.cards.forEach((c, i) => {
                c.position = newKeys[i]
                supabase.from('cards').update({ position: newKeys[i] }).eq('id', c.id)
              })
            } catch(e) {}
          }
        }
        return prev
      })
    }

    setActiveColumn(null)
    setActiveCard(null)

    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveColumn = active.data.current?.type === 'Column'
    if (isActiveColumn) {
      setBoard((prev) => {
        const activeColIndex = prev.columns.findIndex((c) => c.id === activeId)
        const overColIndex = prev.columns.findIndex((c) => c.id === overId)
        if (activeColIndex === overColIndex || overColIndex === -1) return prev

        const newColumns = arrayMove(prev.columns, activeColIndex, overColIndex)
        
        // Sadece taşınan sütunun pozisyonunu yeniden hesapla
        try {
          const prevPos = newColumns[overColIndex - 1]?.position || null
          const nextPos = newColumns[overColIndex + 1]?.position || null
          
          if (prevPos && nextPos && prevPos >= nextPos) throw new Error("Invalid bounds");
          newColumns[overColIndex].position = generateKeyBetween(prevPos, nextPos)
          
          supabase.from('columns').update({ position: newColumns[overColIndex].position }).eq('id', newColumns[overColIndex].id)
        } catch (error) {
          console.error("Column position error, self-healing all columns:", error)
          // Hata durumunda tüm sütunları yeniden diz
          try {
            const newKeys = generateNKeysBetween(null, null, newColumns.length)
            newColumns.forEach((col, i) => {
              col.position = newKeys[i]
              supabase.from('columns').update({ position: newKeys[i] }).eq('id', col.id)
            })
          } catch(e) {}
        }
        
        return { ...prev, columns: newColumns }
      })
    }
  }

  const handleAddColumn = () => {
    if (!newColTitle.trim()) return
    addColumn(newColTitle.trim())
    setNewColTitle('')
    setIsAddingColumn(false)
  }

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '1' } } }),
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : (
      <div className="flex flex-1 gap-4 sm:gap-6 p-3 sm:p-6 overflow-x-auto board-container">
        <SortableContext items={columnsId} strategy={horizontalListSortingStrategy}>
          {filteredBoard.columns.map((col) => (
            <SortableColumn key={col.id} column={col} onCardClick={setSelectedCard} />
          ))}
        </SortableContext>

        {/* Arama/Filtreleme sonuçsuz kaldığında Empty State */}
        {(searchQuery.trim() || filterPriority || filterDate || filterLabel) && 
          filteredBoard.columns.every(col => col.cards.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl px-8 py-6 shadow-lg flex flex-col items-center gap-3 pointer-events-auto">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                <SearchXIcon className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Kart bulunamadı</p>
              <p className="text-xs text-slate-500 text-center max-w-[220px]">Aradığınız kriterlere uygun kart bulunmuyor. Filtreleri temizlemeyi deneyin.</p>
            </div>
          </div>
        )}
        
        {/* Sütun Ekleme */}
        <div className="min-w-[300px]">
          {isAddingColumn ? (
            <div className="bg-slate-100 rounded-xl p-3">
              <input
                type="text"
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddColumn()
                  if (e.key === 'Escape') { setIsAddingColumn(false); setNewColTitle('') }
                }}
                placeholder="Sütun başlığı..."
                className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-400 bg-white"
                autoFocus
              />
              <div className="flex items-center gap-2 mt-2">
                <button onClick={handleAddColumn} className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Sütun Ekle
                </button>
                <button onClick={() => { setIsAddingColumn(false); setNewColTitle('') }} className="px-3 py-1.5 text-xs font-medium text-slate-500">
                  İptal
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingColumn(true)}
              className="w-full flex items-center justify-center gap-2 p-4 text-sm font-medium text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors border-2 border-dashed border-slate-300"
            >
              <PlusIcon className="w-4 h-4" /> Sütun Ekle
            </button>
          )}
        </div>
      </div>
      )}

      <DragOverlay dropAnimation={dropAnimation}>
        {activeColumn && <KanbanColumn column={activeColumn} />}
        {activeCard && (
          <div className="transform rotate-3 scale-105 shadow-2xl cursor-grabbing">
            <KanbanCard card={activeCard} />
          </div>
        )}
      </DragOverlay>

      <CardDetailModal 
        card={selectedCard} 
        isOpen={!!selectedCard} 
        onClose={() => setSelectedCard(null)} 
      />
    </DndContext>
  )
}
