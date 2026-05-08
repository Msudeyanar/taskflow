'use client'

import React, { useState } from 'react'
import { ColumnWithCards, CardWithLabels } from '@/types'
import { SortableCard } from './SortableCard'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { MoreHorizontalIcon, PlusIcon, TrashIcon, EditIcon, ClipboardListIcon } from 'lucide-react'
import { useBoard } from '@/hooks/useBoard'

interface KanbanColumnProps {
  column: ColumnWithCards
  onCardClick?: (card: CardWithLabels) => void
}

export function KanbanColumn({ column, onCardClick }: KanbanColumnProps) {
  const { addCard, deleteColumn, updateColumn } = useBoard()
  const [isAdding, setIsAdding] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(column.title)

  const isDoneColumn = column.title.toLowerCase().includes('bitti') || column.title.toLowerCase().includes('done')

  const handleEditSubmit = () => {
    if (editTitle.trim() && editTitle !== column.title) {
      updateColumn(column.id, editTitle.trim())
    }
    setIsEditing(false)
  }

  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { type: 'Column', column },
  })

  const cardsId = column.cards.map((card) => card.id)

  const handleAddCard = () => {
    if (!newCardTitle.trim()) return
    addCard(column.id, newCardTitle.trim())
    setNewCardTitle('')
    setIsAdding(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddCard()
    if (e.key === 'Escape') { setIsAdding(false); setNewCardTitle('') }
  }

  return (
    <div id={`column-${column.id}`} className="flex flex-col bg-slate-100 w-[260px] sm:w-[300px] min-w-[260px] sm:min-w-[300px] rounded-xl max-h-full kanban-column-snap">
      {/* Sütun Başlığı */}
      <div className="p-3 flex items-center justify-between">
        {isEditing ? (
          <input 
            type="text" 
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleEditSubmit(); if (e.key === 'Escape') setIsEditing(false); }}
            autoFocus
            className="font-semibold text-slate-700 text-sm border-b-2 border-blue-500 outline-none bg-transparent w-full mr-2 px-1"
          />
        ) : (
          <h3 
            className="font-semibold text-slate-700 text-sm cursor-pointer hover:text-blue-600 transition-colors px-1"
            onClick={() => { setIsEditing(true); setEditTitle(column.title); }}
            title="İsmi değiştirmek için tıkla"
          >
            {column.title}
          </h3>
        )}

        {!isEditing && (
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
              {column.cards.length}
            </span>
            <div className="relative">
              <button 
                className="p-1 hover:bg-slate-200 rounded text-slate-500"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontalIcon className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute left-0 top-8 bg-white shadow-lg rounded-lg border border-slate-200 py-1 z-50 w-40">
                  <button
                    onClick={() => { setIsEditing(true); setEditTitle(column.title); setShowMenu(false) }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <EditIcon className="w-3.5 h-3.5" /> İsmi Değiştir
                  </button>
                  <button
                    onClick={() => { deleteColumn(column.id); setShowMenu(false) }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <TrashIcon className="w-3.5 h-3.5" /> Sütunu Sil
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sütun İçeriği (Kartlar Listesi) */}
      <div ref={setNodeRef} className="p-2 flex-1 overflow-y-auto flex flex-col gap-2 min-h-[60px]">
        <SortableContext items={cardsId} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => (
            <SortableCard key={card.id} card={card} onClick={() => onCardClick?.(card)} isDone={isDoneColumn} />
          ))}
        </SortableContext>
        
        {/* Empty State */}
        {column.cards.length === 0 && !isAdding && (
          <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
            <div className="bg-white p-2 rounded-full shadow-sm mb-2 text-slate-400">
              <ClipboardListIcon className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium mb-1">Burada henüz iş yok</p>
            <p className="text-[10px] text-slate-400">Yeni bir kart ekleyin</p>
          </div>
        )}

        {/* Yeni Kart Ekleme Formu */}
        {isAdding && (
          <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-300">
            <input
              type="text"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Kart başlığını girin..."
              className="w-full text-sm border-0 outline-none bg-transparent text-slate-700 placeholder:text-slate-400"
              autoFocus
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleAddCard}
                className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Ekle
              </button>
              <button
                onClick={() => { setIsAdding(false); setNewCardTitle('') }}
                className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                İptal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Alt Kısım: Kart Ekle Butonu */}
      {!isAdding && (
        <div className="p-2 pt-0">
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-2 p-2 text-sm font-medium text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Kart Ekle
          </button>
        </div>
      )}
    </div>
  )
}
