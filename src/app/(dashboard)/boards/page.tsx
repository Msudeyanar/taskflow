'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboardIcon, PlusIcon, CalendarIcon, LogOutIcon, UsersIcon, MoreVerticalIcon, TrashIcon, EditIcon, ArchiveIcon, PaletteIcon, StarIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const BOARD_COLORS = [
  { name: 'Yeşil', gradient: 'from-emerald-500 to-teal-400' },
  { name: 'Mavi', gradient: 'from-blue-500 to-indigo-400' },
  { name: 'Mor', gradient: 'from-purple-500 to-violet-400' },
  { name: 'Turuncu', gradient: 'from-orange-500 to-amber-400' },
  { name: 'Pembe', gradient: 'from-pink-500 to-rose-400' },
  { name: 'Kırmızı', gradient: 'from-red-500 to-rose-400' },
]

// Board'un ilerleme yüzdesini hesapla
function getBoardProgress(boardId: string): number {
  if (typeof window === 'undefined') return 0
  try {
    const saved = localStorage.getItem(`taskflow-board-${boardId}`)
    if (!saved) return 0
    const boardData = JSON.parse(saved)
    const totalCards = boardData.columns?.reduce((acc: number, col: any) => acc + (col.cards?.length || 0), 0) || 0
    if (totalCards === 0) return 0
    const doneCol = boardData.columns?.find((col: any) =>
      col.title?.toLowerCase().includes('bitti') || col.title?.toLowerCase().includes('done') || col.title?.includes('✅')
    )
    if (!doneCol) return 0
    return Math.round(((doneCol.cards?.length || 0) / totalCards) * 100)
  } catch { return 0 }
}

export default function BoardsPage() {
  const router = useRouter()
  const [boards, setBoards] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [useLocalStorage, setUseLocalStorage] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [colorPickerId, setColorPickerId] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const [archived, setArchived] = useState<string[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Dış tıklama ile menüyü kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
        setColorPickerId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Favoriler ve arşivleri yükle
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem('taskflow-favorites')
      if (savedFavs) setFavorites(JSON.parse(savedFavs))
      const savedArchived = localStorage.getItem('taskflow-archived')
      if (savedArchived) setArchived(JSON.parse(savedArchived))
    } catch {}
  }, [])

  useEffect(() => {
    const loadBoards = async () => {
      // Supabase auth kontrolü
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          const { data, error } = await supabase
            .from('boards')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (!error && data) {
            setBoards(data)
            setLoading(false)
            return
          }
        }
      } catch {}

      // localStorage fallback
      setUseLocalStorage(true)
      const user = localStorage.getItem('taskflow-user')
      if (!user) { router.push('/login'); return }

      const saved = JSON.parse(localStorage.getItem('taskflow-boards') || '[]')
      if (saved.length === 0) {
        const defaultBoards = [{ id: 'board-1', title: 'TaskFlow Geliştirme', created_at: new Date().toISOString(), team_id: 'dummy-team' }]
        localStorage.setItem('taskflow-boards', JSON.stringify(defaultBoards))
        setBoards(defaultBoards)
      } else {
        setBoards(saved)
      }
      setLoading(false)
    }
    loadBoards()
  }, [router])

  const saveBoards = (updated: any[]) => {
    setBoards(updated)
    if (useLocalStorage) localStorage.setItem('taskflow-boards', JSON.stringify(updated))
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return

    if (!useLocalStorage) {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          let targetTeamId = null

          const { data: existingMembers } = await supabase.from('team_members').select('team_id').eq('user_id', session.user.id).limit(1)
          if (existingMembers && existingMembers.length > 0) {
            targetTeamId = existingMembers[0].team_id
          } else {
            const { data: newTeam } = await supabase.from('teams').insert({ name: 'A Takımı' }).select().single()
            if (newTeam) {
              targetTeamId = newTeam.id
              await supabase.from('team_members').insert({ team_id: newTeam.id, user_id: session.user.id, role: 'admin' })
            }
          }

          const { data } = await supabase
            .from('boards')
            .insert({ title: newTitle.trim(), user_id: session.user.id, team_id: targetTeamId })
            .select()
            .single()
          
          if (data) {
            await supabase.from('columns').insert([
              { board_id: data.id, title: '📋 Yapılacaklar', position: 'a0' },
              { board_id: data.id, title: '⚙️ Yapılıyor', position: 'a1' },
              { board_id: data.id, title: '✅ Bitti', position: 'a2' },
            ])
            setBoards(prev => [data, ...prev])
            setNewTitle(''); setIsCreating(false)
            router.push(`/board/${data.id}`)
            return
          }
        }
      } catch {}
    }

    // localStorage fallback
    const newBoard = { 
      id: `board-${Date.now()}`, 
      title: newTitle.trim(), 
      created_at: new Date().toISOString(),
      team_id: 'dummy-team'
    }
    const updated = [...boards, newBoard]
    saveBoards(updated)
    setNewTitle(''); setIsCreating(false);
    router.push(`/board/${newBoard.id}`)
  }

  const handleDelete = async (id: string) => {
    if (!useLocalStorage) {
      try {
        const supabase = createClient()
        await supabase.from('boards').delete().eq('id', id)
      } catch {}
    }
    
    const updated = boards.filter(b => b.id !== id)
    saveBoards(updated)
    // localStorage'daki board verisini de temizle
    try { localStorage.removeItem(`taskflow-board-${id}`) } catch {}
    setOpenMenuId(null)
  }

  const handleRename = (id: string) => {
    if (!renameTitle.trim()) return
    const updated = boards.map(b => b.id === id ? { ...b, title: renameTitle.trim() } : b)
    saveBoards(updated)
    setRenamingId(null)
    setRenameTitle('')
    setOpenMenuId(null)
  }

  const handleSetColor = (id: string, gradient: string) => {
    const updated = boards.map(b => b.id === id ? { ...b, color: gradient } : b)
    saveBoards(updated)
    setColorPickerId(null)
    setOpenMenuId(null)
  }

  const toggleFavorite = (id: string) => {
    const newFavs = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id]
    setFavorites(newFavs)
    localStorage.setItem('taskflow-favorites', JSON.stringify(newFavs))
    setOpenMenuId(null)
  }

  const toggleArchive = (id: string) => {
    const newArchived = archived.includes(id) ? archived.filter(a => a !== id) : [...archived, id]
    setArchived(newArchived)
    localStorage.setItem('taskflow-archived', JSON.stringify(newArchived))
    setOpenMenuId(null)
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {}
    localStorage.removeItem('taskflow-user')
    router.push('/login')
  }

  // Board'ları sırala: Favoriler önce, sonra normal
  const activeBoards = boards.filter(b => !archived.includes(b.id))
  const archivedBoards = boards.filter(b => archived.includes(b.id))
  const favoriteBoards = activeBoards.filter(b => favorites.includes(b.id))
  const normalBoards = activeBoards.filter(b => !favorites.includes(b.id))

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const renderBoardCard = (board: any) => {
    const progress = getBoardProgress(board.id)
    const isFav = favorites.includes(board.id)
    const isArchived = archived.includes(board.id)
    const boardGradient = board.color || 'from-emerald-500 to-teal-400'

    return (
      <div key={board.id}
        className={`group bg-white rounded-xl border p-5 hover:shadow-lg transition-all cursor-pointer relative ${
          isFav ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200 hover:border-blue-300'
        } ${isArchived ? 'opacity-60' : ''}`}
        onClick={() => !renamingId && router.push(`/board/${board.id}`)}
      >
        {/* Üst Renkli Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${boardGradient} rounded-t-xl`} />

        {/* Favori Yıldızı */}
        {isFav && (
          <div className="absolute top-3 right-12 text-amber-400">
            <StarIcon className="w-4 h-4 fill-amber-400" />
          </div>
        )}

        {/* Başlık ve Menü */}
        <div className="flex items-start justify-between mt-1">
          <div className="flex-1 min-w-0 mr-2">
            {renamingId === board.id ? (
              <input
                type="text"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(board.id)
                  if (e.key === 'Escape') { setRenamingId(null); setRenameTitle('') }
                }}
                onBlur={() => handleRename(board.id)}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-slate-800 w-full border-b-2 border-blue-500 outline-none bg-transparent text-sm"
                autoFocus
              />
            ) : (
              <h3 className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                {board.title}
              </h3>
            )}
          </div>

          {/* ⋮ Menü Butonu */}
          <div className="relative" ref={openMenuId === board.id ? menuRef : null}>
            <button
              onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === board.id ? null : board.id); setColorPickerId(null) }}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVerticalIcon className="w-4 h-4" />
            </button>

            {openMenuId === board.id && (
              <div className="absolute right-0 top-8 bg-white shadow-xl rounded-xl border border-slate-200 py-1.5 z-50 w-48 animate-in fade-in zoom-in-95">
                {/* İsim Değiştir */}
                <button
                  onClick={(e) => { e.stopPropagation(); setRenamingId(board.id); setRenameTitle(board.title); setOpenMenuId(null) }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <EditIcon className="w-3.5 h-3.5 text-slate-500" /> İsim Değiştir
                </button>

                {/* Renk Belirle */}
                <button
                  onClick={(e) => { e.stopPropagation(); setColorPickerId(colorPickerId === board.id ? null : board.id) }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <PaletteIcon className="w-3.5 h-3.5 text-slate-500" /> Renk Belirle
                </button>

                {/* Renk Seçici */}
                {colorPickerId === board.id && (
                  <div className="mx-3 my-1.5 flex gap-1.5 flex-wrap p-2 bg-slate-50 rounded-lg border border-slate-100">
                    {BOARD_COLORS.map(c => (
                      <button
                        key={c.name}
                        onClick={(e) => { e.stopPropagation(); handleSetColor(board.id, c.gradient) }}
                        className={`w-6 h-6 rounded-full bg-gradient-to-r ${c.gradient} border-2 ${
                          boardGradient === c.gradient ? 'border-slate-800 scale-110' : 'border-white'
                        } shadow-sm hover:scale-110 transition-transform`}
                        title={c.name}
                      />
                    ))}
                  </div>
                )}

                {/* Favorilere Ekle/Çıkar */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(board.id) }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <StarIcon className={`w-3.5 h-3.5 ${isFav ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                  {isFav ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                </button>

                {/* Arşivle */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleArchive(board.id) }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <ArchiveIcon className="w-3.5 h-3.5 text-slate-500" />
                  {isArchived ? 'Arşivden Çıkar' : 'Arşivle'}
                </button>

                <div className="border-t border-slate-100 my-1" />

                {/* Sil */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(board.id) }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5"
                >
                  <TrashIcon className="w-3.5 h-3.5" /> Sil
                </button>
              </div>
            )}
          </div>
        </div>

        {/* İlerleme Çubuğu */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">İlerleme</span>
            <span className={`text-xs font-bold ${progress === 100 ? 'text-emerald-600' : 'text-slate-600'}`}>
              %{progress}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                progress === 100 ? 'from-emerald-500 to-green-400' :
                progress >= 50 ? 'from-blue-500 to-cyan-400' :
                'from-amber-500 to-orange-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-sm">
            <LayoutDashboardIcon className="w-5 h-5" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800">TaskFlow</h1>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition-colors">
          <LogOutIcon className="w-4 h-4" /> <span className="hidden sm:inline">Çıkış Yap</span>
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Board&apos;larım</h2>
            <p className="text-sm text-slate-500 mt-1">Projelerinizi yönetmek için bir board seçin veya yeni oluşturun.</p>
          </div>
          <button onClick={() => setIsCreating(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm w-full sm:w-auto">
            <PlusIcon className="w-4 h-4" /> Yeni Board
          </button>
        </div>

        {isCreating && (
          <div className="mb-6 bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-3">Yeni Takım Panosu Oluştur</h3>
            <div className="flex gap-3">
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setIsCreating(false); setNewTitle('') } }}
                placeholder="Board başlığı (ör: Sprint 1, Marketing)..."
                className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" autoFocus />
              <button onClick={handleCreate} className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Oluştur</button>
              <button onClick={() => { setIsCreating(false); setNewTitle('') }} className="px-4 py-2.5 text-slate-500 text-sm">İptal</button>
            </div>
          </div>
        )}

        {/* Favori Board'lar */}
        {favoriteBoards.length > 0 && (
          <div className="mb-8">
            <h3 className="flex items-center gap-2 font-semibold text-slate-700 mb-4 border-b border-slate-200 pb-2">
              <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" /> Favoriler
            </h3>
            <div className="board-grid-premium">
              {favoriteBoards.map(renderBoardCard)}
            </div>
          </div>
        )}

        {/* Normal Board'lar */}
        <div className="mb-8">
          <h3 className="flex items-center gap-2 font-semibold text-slate-700 mb-4 border-b border-slate-200 pb-2">
            <UsersIcon className="w-5 h-5 text-emerald-500" /> Takım Panolarım
          </h3>
          <div className="board-grid-premium">
            {normalBoards.map(renderBoardCard)}
            {normalBoards.length === 0 && favoriteBoards.length === 0 && (
              <p className="text-sm text-slate-400 italic col-span-full">Henüz takım panosu bulunmuyor. Yeni bir tane oluşturun!</p>
            )}
          </div>
        </div>

        {/* Arşivlenmiş Board'lar */}
        {archivedBoards.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 font-semibold text-slate-500 mb-4 border-b border-slate-200 pb-2 hover:text-slate-700 transition-colors w-full text-left"
            >
              <ArchiveIcon className="w-5 h-5 text-slate-400" /> Arşiv ({archivedBoards.length})
              <span className="text-xs ml-auto">{showArchived ? '▲ Gizle' : '▼ Göster'}</span>
            </button>
            {showArchived && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {archivedBoards.map(renderBoardCard)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
