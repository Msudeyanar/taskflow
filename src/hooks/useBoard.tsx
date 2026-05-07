'use client'

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { BoardData, ColumnWithCards, CardWithLabels } from '@/types'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateKeyBetween } from 'fractional-indexing'



// Varsayılan board (ilk açılışta kullanılır)
const defaultBoard: BoardData = {
  id: 'board-1',
  title: 'TaskFlow Geliştirme',
  user_id: 'user-1',
  created_at: new Date().toISOString(),
  columns: [
    {
      id: 'col-1', board_id: 'board-1', title: 'Yapılacaklar', position: 'a0', created_at: new Date().toISOString(),
      cards: [
        { id: 'card-1', column_id: 'col-1', title: 'Supabase entegrasyonu', description: 'Veritabanı tablolarını ayarla', position: 'a0', priority: 'high', due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), labels: [{ id: 'l1', board_id: 'board-1', name: 'Backend', color: '#3B82F6' }] },
        { id: 'card-2', column_id: 'col-1', title: 'UI Tasarımı', description: 'Kanban kartları için efektler ekle', position: 'a1', priority: 'medium', due_date: new Date(Date.now() + 172800000).toISOString().split('T')[0], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), labels: [{ id: 'l2', board_id: 'board-1', name: 'UX/UI', color: '#EC4899' }] },
      ]
    },
    {
      id: 'col-2', board_id: 'board-1', title: 'Yapılıyor', position: 'a1', created_at: new Date().toISOString(),
      cards: [
        { id: 'card-3', column_id: 'col-2', title: 'Sürükle-Bırak Altyapısı', description: 'dnd-kit kurulumu', position: 'a0', priority: 'high', due_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), labels: [{ id: 'l3', board_id: 'board-1', name: 'Core', color: '#F59E0B' }] },
      ]
    },
    {
      id: 'col-3', board_id: 'board-1', title: 'Bitti', position: 'a2', created_at: new Date().toISOString(),
      cards: []
    }
  ]
}

const emptyBoard: BoardData = { id: '', title: '', user_id: '', created_at: '', columns: [] }

// Her board için boş şablon oluştur
function createEmptyBoard(boardId: string): BoardData {
  // Board başlığını boards listesinden al
  let title = 'Yeni Board'
  if (typeof window !== 'undefined') {
    try {
      const boards = JSON.parse(localStorage.getItem('taskflow-boards') || '[]')
      const found = boards.find((b: any) => b.id === boardId)
      if (found) title = found.title
    } catch {}
  }

  const ts = new Date().toISOString()
  return {
    id: boardId, title, user_id: 'user-1', created_at: ts,
    columns: [
      { id: `${boardId}-col-1`, board_id: boardId, title: 'Yapılacaklar', position: 'a0', created_at: ts, cards: [] },
      { id: `${boardId}-col-2`, board_id: boardId, title: 'Yapılıyor', position: 'a1', created_at: ts, cards: [] },
      { id: `${boardId}-col-3`, board_id: boardId, title: 'Bitti', position: 'a2', created_at: ts, cards: [] },
    ]
  }
}

// localStorage helpers
function loadBoardLocal(boardId: string): BoardData {
  if (typeof window === 'undefined') return defaultBoard
  try {
    // Bu board'un kendi verisi var mı?
    const saved = localStorage.getItem(`taskflow-board-${boardId}`)
    if (saved) return JSON.parse(saved)
  } catch {}

  // board-1 için varsayılan örnek board
  if (boardId === 'board-1') {
    // Eski taskflow-board verisini de kontrol et (migration)
    try {
      const savedOld = localStorage.getItem('taskflow-board')
      if (savedOld) {
        const parsed = JSON.parse(savedOld)
        // Eski veriyi yeni key'e kaydet
        localStorage.setItem('taskflow-board-board-1', savedOld)
        return parsed
      }
    } catch {}
    return defaultBoard
  }

  // Diğer board'lar için boş şablon oluştur
  const emptyBoard = createEmptyBoard(boardId)
  // Hemen kaydet ki bir daha aynı şablon oluşmasın
  try { localStorage.setItem(`taskflow-board-${boardId}`, JSON.stringify(emptyBoard)) } catch {}
  return emptyBoard
}

function saveBoardLocal(board: BoardData) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`taskflow-board-${board.id}`, JSON.stringify(board))
  } catch {}
}



interface BoardContextType {
  board: BoardData
  filteredBoard: BoardData
  setBoard: React.Dispatch<React.SetStateAction<BoardData>>
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterPriority: string | null
  setFilterPriority: (p: string | null) => void
  filterDate: string | null
  setFilterDate: (d: string | null) => void
  filterLabel: string | null
  setFilterLabel: (l: string | null) => void
  progress: number
  view: 'kanban' | 'calendar'
  setView: React.Dispatch<React.SetStateAction<'kanban' | 'calendar'>>
  addColumn: (title: string) => void
  addCard: (columnId: string, title: string) => void
  updateCard: (cardId: string, updates: Partial<CardWithLabels>) => void
  deleteCard: (cardId: string) => void
  updateColumn: (columnId: string, title: string) => void
  deleteColumn: (columnId: string) => void
  loading: boolean
}

export const BoardContext = createContext<BoardContextType | undefined>(undefined)

export function BoardProvider({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const boardId = (params?.id as string) || 'board-1'

  const [board, setBoard] = useState<BoardData>(emptyBoard)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [filterDate, setFilterDate] = useState<string | null>(null)
  const [filterLabel, setFilterLabel] = useState<string | null>(null)
  const [view, setView] = useState<'kanban' | 'calendar'>('kanban')
  const [loading, setLoading] = useState(true)
  const [useLocal, setUseLocal] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Board verisi yükle
  useEffect(() => {
    if (!boardId) return
    
    let subscription: any = null

    const loadBoard = async () => {
      setLoading(true)

      // Supabase dene
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          const { data: boardData, error } = await supabase.from('boards').select('*').eq('id', boardId).single()
          
          if (error && error.code === 'PGRST116') {
            // RLS engelledi veya pano yok. LocalStorage'a düşmesine izin verme!
            setBoard(emptyBoard)
            setLoading(false)
            setIsLoaded(true)
            return
          }

          if (boardData) {
            const { data: columnsData } = await supabase.from('columns').select('*').eq('board_id', boardId).order('position')
            const colIds = (columnsData || []).map(c => c.id)
            const { data: cardsData } = colIds.length > 0 
              ? await supabase.from('cards').select('*').in('column_id', colIds).order('position')
              : { data: [] }
            const columns: ColumnWithCards[] = (columnsData || []).map(col => {
              const colCards = (cardsData || []).filter(card => card.column_id === col.id).map(card => ({ ...card, labels: [] }))
              colCards.sort((a, b) => a.position < b.position ? -1 : a.position > b.position ? 1 : 0)
              return { ...col, cards: colCards }
            })

            setBoard({ ...boardData, columns })
            setLoading(false)
            setIsLoaded(true)

            // Realtime Abonelik (Over-qualified Feature)
            subscription = supabase
              .channel(`board-${boardId}-changes`)
              .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, (payload) => {
                // Başka sekmedeki veya başka kullanıcının değişikliklerini anında yakala
                if (payload.eventType === 'UPDATE') {
                  const updatedCard = payload.new as CardWithLabels
                  setBoard(prev => ({
                    ...prev,
                    columns: prev.columns.map(col => {
                      // Eğer kart başka bir sütuna geçmişse, eski sütundan çıkar
                      if (col.cards.find(c => c.id === updatedCard.id) && col.id !== updatedCard.column_id) {
                        return { ...col, cards: col.cards.filter(c => c.id !== updatedCard.id) }
                      }
                      // Eğer kart bu sütuna geldiyse veya zaten buradaysa, ekle/güncelle
                      if (col.id === updatedCard.column_id) {
                        const exists = col.cards.find(c => c.id === updatedCard.id)
                        let newCards = exists 
                          ? col.cards.map(c => c.id === updatedCard.id ? { ...c, ...updatedCard } : c)
                          : [...col.cards, { ...updatedCard, labels: [] }]
                        // Sıralamayı (fractional indexing) ASCII bazlı koruyarak diz (localeCompare hataya yol açar)
                        newCards.sort((a, b) => a.position < b.position ? -1 : a.position > b.position ? 1 : 0)
                        return { ...col, cards: newCards }
                      }
                      return col
                    })
                  }))
                }
              })
              .subscribe()

            return
          }
        }
      } catch {}

      // localStorage fallback
      setUseLocal(true)
      const localBoard = loadBoardLocal(boardId)
      setBoard(localBoard)
      setLoading(false)
      setIsLoaded(true)
    }
    
    loadBoard()

    // Cleanup: Bileşen mount'dan kalktığında realtime aboneliğini sil
    return () => {
      if (subscription) {
        const supabase = createClient()
        supabase.removeChannel(subscription)
      }
    }
  }, [boardId])

  // localStorage modunda board değiştiğinde kaydet
  useEffect(() => {
    if (isLoaded && useLocal) {
      saveBoardLocal(board)
    }
  }, [board, isLoaded, useLocal])



  // Arama ve Filtreleme
  const filteredBoard = useMemo(() => {
    return {
      ...board,
      columns: board.columns.map(col => ({
        ...col,
        cards: col.cards.filter(card => {
          // Arama Metni
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            const matchesText = 
              card.title.toLowerCase().includes(query) || 
              (card.description && card.description.toLowerCase().includes(query)) ||
              (card.assignee?.name && card.assignee.name.toLowerCase().includes(query))
            if (!matchesText) return false
          }

          // Öncelik
          if (filterPriority && card.priority !== filterPriority) return false

          // Etiket
          if (filterLabel && !card.labels?.some(l => l.name === filterLabel)) return false

          // Tarih
          if (filterDate) {
            if (!card.due_date) return false
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const due = new Date(card.due_date)
            due.setHours(0, 0, 0, 0)

            if (filterDate === 'overdue') return due < today
            if (filterDate === 'today') return due.getTime() === today.getTime()
            if (filterDate === 'upcoming') {
              const nextWeek = new Date(today)
              nextWeek.setDate(today.getDate() + 7)
              return due > today && due <= nextWeek
            }
            return false
          }

          return true
        })
      }))
    }
  }, [board, searchQuery, filterPriority, filterLabel, filterDate])

  // İlerleme yüzdesi
  const progress = useMemo(() => {
    const totalCards = board.columns.reduce((acc, col) => acc + col.cards.length, 0)
    if (totalCards === 0) return 0
    const doneCol = board.columns.find(col =>
      col.title.toLowerCase().includes('bitti') || col.title.toLowerCase().includes('done') || col.title.includes('✅')
    )
    if (!doneCol) return 0
    return Math.round((doneCol.cards.length / totalCards) * 100)
  }, [board])

  // Sütun Ekle
  const addColumn = useCallback(async (title: string) => {
    const lastColPos = board.columns.length > 0 ? board.columns[board.columns.length - 1].position : null
    const newPos = generateKeyBetween(lastColPos, null)

    const newCol: ColumnWithCards = {
      id: `col-${Date.now()}`, board_id: boardId, title, position: newPos, created_at: new Date().toISOString(), cards: []
    }

    if (!useLocal) {
      try {
        const supabase = createClient()
        const { data } = await supabase.from('columns').insert({ board_id: boardId, title, position: newCol.position }).select().single()
        if (data) { newCol.id = data.id }
      } catch {}
    }

    setBoard(prev => ({ ...prev, columns: [...prev.columns, newCol] }))
  }, [boardId, board.columns.length, useLocal])

  // Kart Ekle
  const addCard = useCallback(async (columnId: string, title: string) => {
    const col = board.columns.find(c => c.id === columnId)
    const lastCardPos = col && col.cards.length > 0 ? col.cards[col.cards.length - 1].position : null
    const newPos = generateKeyBetween(lastCardPos, null)

    const newCard: CardWithLabels = {
      id: `card-${Date.now()}`, column_id: columnId, title, description: '', position: newPos,
      priority: 'none', due_date: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), labels: []
    }

    if (!useLocal) {
      try {
        const supabase = createClient()
        const { data } = await supabase.from('cards').insert({ column_id: columnId, title, position: newCard.position, description: '', priority: 'none' }).select().single()
        if (data) { newCard.id = data.id }
      } catch {}
    }

    setBoard(prev => ({
      ...prev,
      columns: prev.columns.map(c => c.id === columnId ? { ...c, cards: [...c.cards, newCard] } : c)
    }))
  }, [boardId, board, useLocal])

  // Kart Güncelle
  const updateCard = useCallback(async (cardId: string, updates: Partial<CardWithLabels>) => {
    if (!useLocal) {
      try {
        const { labels, assignee, ...dbUpdates } = updates as any
        const supabase = createClient()
        if (Object.keys(dbUpdates).length > 0) {
          await supabase.from('cards').update({ ...dbUpdates, updated_at: new Date().toISOString() }).eq('id', cardId)
        }
      } catch {}
    }

    setBoard(prev => ({
      ...prev,
      columns: prev.columns.map(col => ({
        ...col,
        cards: col.cards.map(card => card.id === cardId ? { ...card, ...updates, updated_at: new Date().toISOString() } : card)
      }))
    }))
  }, [useLocal])

  // Kart Sil
  const deleteCard = useCallback(async (cardId: string) => {
    if (!useLocal) {
      try { const supabase = createClient(); await supabase.from('cards').delete().eq('id', cardId) } catch {}
    }
    setBoard(prev => ({
      ...prev,
      columns: prev.columns.map(col => ({ ...col, cards: col.cards.filter(card => card.id !== cardId) }))
    }))
  }, [useLocal])

  // Sütun Sil
  const deleteColumn = useCallback(async (columnId: string) => {
    if (!useLocal) {
      try { const supabase = createClient(); await supabase.from('columns').delete().eq('id', columnId) } catch {}
    }
    setBoard(prev => ({ ...prev, columns: prev.columns.filter(col => col.id !== columnId) }))
  }, [useLocal])

  // Sütun Güncelle
  const updateColumn = useCallback(async (columnId: string, title: string) => {
    if (!useLocal) {
      try { const supabase = createClient(); await supabase.from('columns').update({ title }).eq('id', columnId) } catch {}
    }
    setBoard(prev => ({
      ...prev,
      columns: prev.columns.map(col => col.id === columnId ? { ...col, title } : col)
    }))
  }, [useLocal])



  return (
    <BoardContext.Provider value={{
      board, filteredBoard, setBoard, searchQuery, setSearchQuery,
      filterPriority, setFilterPriority, filterDate, setFilterDate, filterLabel, setFilterLabel,
      progress, view, setView,
      addColumn, addCard, updateCard, deleteCard, updateColumn, deleteColumn,
      loading
    }}>
      {children}
    </BoardContext.Provider>
  )
}

export function useBoard() {
  const context = useContext(BoardContext)
  if (!context) throw new Error('useBoard must be used within BoardProvider')
  return context
}
