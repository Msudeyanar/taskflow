'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboardIcon, SearchIcon, CalendarIcon, LogOutIcon, UserIcon, UsersIcon, CrownIcon, FilterIcon, MoreHorizontalIcon, TrashIcon, BarChart3Icon, CheckCircle2Icon, PencilLineIcon, ClipboardListIcon, ClockIcon, XIcon } from 'lucide-react'
import { useBoard } from '@/hooks/useBoard'
import { createClient, isSupabaseAvailable } from '@/lib/supabase/client'

import { UserPlusIcon } from 'lucide-react'

const defaultTeamMembers = [
  { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@kocsistem.com', initials: 'A', color: 'bg-pink-100 text-pink-600', role: 'Frontend Developer' },
  { id: '2', name: 'Kaan Demir', email: 'kaan@kocsistem.com', initials: 'K', color: 'bg-emerald-100 text-emerald-600', role: 'Backend Developer' },
  { id: '3', name: 'Elif Arslan', email: 'elif@kocsistem.com', initials: 'E', color: 'bg-amber-100 text-amber-600', role: 'UI/UX Designer' },
]

const colors = [
  'bg-pink-100 text-pink-600',
  'bg-emerald-100 text-emerald-600',
  'bg-amber-100 text-amber-600',
  'bg-purple-100 text-purple-600',
  'bg-cyan-100 text-cyan-600',
  'bg-rose-100 text-rose-600'
]

export function DashboardHeader() {
  const {
    searchQuery, setSearchQuery,
    filterPriority, setFilterPriority,
    filterDate, setFilterDate,
    filterLabel, setFilterLabel,
    progress, view, setView, board
  } = useBoard()
  const router = useRouter()
  const [showTeamPanel, setShowTeamPanel] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const filterCount = (filterPriority ? 1 : 0) + (filterDate ? 1 : 0) + (filterLabel ? 1 : 0)

  // Özet istatistikleri hesapla
  const summaryStats = React.useMemo(() => {
    const allCards = board.columns.flatMap(col => col.cards)
    const totalCards = allCards.length

    const doneCol = board.columns.find(col =>
      col.title.toLowerCase().includes('bitti') || col.title.toLowerCase().includes('done')
    )
    const todoCol = board.columns.find(col =>
      col.title.toLowerCase().includes('yapılacak') || col.title.toLowerCase().includes('to do')
    )
    const inProgressCol = board.columns.find(col =>
      col.title.toLowerCase().includes('yapılıyor') || col.title.toLowerCase().includes('progress')
    )

    const doneCount = doneCol?.cards.length || 0
    const todoCount = todoCol?.cards.length || 0
    const inProgressCount = inProgressCol?.cards.length || 0
    const otherCount = totalCards - doneCount - todoCount - inProgressCount

    // Yaklaşan tarihi olan kartlar (3 gün içinde)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const threeDaysLater = new Date(today)
    threeDaysLater.setDate(today.getDate() + 3)

    const upcomingCount = allCards.filter(card => {
      if (!card.due_date) return false
      const due = new Date(card.due_date)
      due.setHours(0, 0, 0, 0)
      return due >= today && due <= threeDaysLater
    }).length

    return { totalCards, doneCount, todoCount, inProgressCount, otherCount, upcomingCount }
  }, [board])
  const [currentUser, setCurrentUser] = useState<{ fullName: string; email: string } | null>(null)
  const [members, setMembers] = useState(defaultTeamMembers)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [memberError, setMemberError] = useState('')
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Kullanıcı bilgisini al
    try {
      const userData = localStorage.getItem('taskflow-user')
      if (userData) {
        const parsed = JSON.parse(userData)
        setCurrentUser({ fullName: parsed.fullName || parsed.email?.split('@')[0] || 'Kullanıcı', email: parsed.email || '' })
      }

      const savedMembers = localStorage.getItem('taskflow-team')
      if (savedMembers) {
        setMembers(JSON.parse(savedMembers))
      }
    } catch { }
  }, [])

  // Dış tıklamada kapat
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowTeamPanel(false)
      }
    }
    if (showTeamPanel) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showTeamPanel])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch { }
    localStorage.removeItem('taskflow-user')
    router.push('/login')
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setMemberError('')
    const targetEmail = newMemberEmail.trim().toLowerCase()
    if (!targetEmail) return

    let verifiedUser = null

    // 1. Supabase kontrolü
    try {
      const isAvailable = await isSupabaseAvailable()
      if (isAvailable) {
        const supabase = createClient()
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('email', targetEmail)
          .single()

        if (profile && !error) {
          verifiedUser = {
            id: profile.id,
            name: profile.full_name || targetEmail.split('@')[0],
            email: profile.email
          }
        }
      }
    } catch (err) {
      console.error("Supabase user search error:", err)
    }

    // 2. localStorage kontrolü (Fallback)
    if (!verifiedUser) {
      try {
        const users = JSON.parse(localStorage.getItem('taskflow-users') || '[]')
        const found = users.find((u: any) => u.email === targetEmail)
        if (found) {
          verifiedUser = {
            id: found.id,
            name: found.fullName || targetEmail.split('@')[0],
            email: found.email
          }
        }
      } catch {}
    }

    // 3. Kullanıcı bulunamadıysa hata ver
    if (!verifiedUser) {
      setMemberError('Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.')
      return
    }

    // 4. Zaten takımda mı?
    if (members.some(m => m.email === targetEmail)) {
      setMemberError('Bu kullanıcı zaten takımda.')
      return
    }

    const newMember = {
      id: verifiedUser.id,
      name: verifiedUser.name,
      email: verifiedUser.email,
      initials: verifiedUser.name.charAt(0).toUpperCase(),
      color: colors[members.length % colors.length],
      role: 'Takım Üyesi'
    }

    // 5. Supabase'e davet gönder (veritabanına ekle)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session && (board as any).team_id) {
        await supabase.from('team_members').insert({
          team_id: (board as any).team_id,
          user_id: verifiedUser.id,
          role: 'member'
        })
      }
    } catch { }

    // 6. UI ve localStorage güncelle
    const updatedMembers = [...members, newMember]
    setMembers(updatedMembers)
    try {
      localStorage.setItem('taskflow-team', JSON.stringify(updatedMembers))
    } catch { }

    setNewMemberEmail('')
    setIsAddingMember(false)
  }

  const handleRemoveMember = async (id: string) => {
    // Supabase'den de sil (varsa)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await supabase.from('team_members').delete().eq('id', id)
      }
    } catch { }

    // localStorage fallback
    const updatedMembers = members.filter(m => m.id !== id)
    setMembers(updatedMembers)
    try {
      localStorage.setItem('taskflow-team', JSON.stringify(updatedMembers))
    } catch { }
    setActiveMenuId(null)
  }

  const userInitial = currentUser?.fullName?.charAt(0).toUpperCase() || 'U'

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        <Link href="/boards" className="flex items-center gap-2 font-bold text-lg text-slate-800 hover:opacity-80 transition-opacity shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
            <LayoutDashboardIcon className="w-5 h-5" />
          </div>
          <span className="hidden sm:inline">TaskFlow</span>
        </Link>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Board Title & Progress */}
        <div className="flex flex-col min-w-0 hidden sm:flex">
          <h1 className="font-semibold text-slate-700 leading-tight truncate hidden md:block">{board.title}</h1>
          <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
            <div className="h-1.5 w-16 sm:w-32 bg-slate-100 rounded-full overflow-hidden shrink-0">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-blue-600">%{progress}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end min-w-0 ml-4 sm:ml-6">
        {/* Search & Filters */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 max-w-[160px] sm:max-w-[400px] min-w-0 justify-end relative">
          <div className="relative flex-1 max-w-[300px] min-w-[100px]">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ara..."
              className="pl-9 pr-4 py-1.5 bg-slate-100 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full text-sm w-full transition-all outline-none"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-full border transition-colors shrink-0 flex items-center justify-center relative ${filterCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200'}`}
            title="Filtreler"
          >
            <FilterIcon className="w-4 h-4" />
            {filterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </button>

          {showFilters && (
            <div className="fixed sm:absolute top-16 sm:top-12 left-4 right-4 sm:left-auto sm:-right-2 sm:w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] p-4 animate-in fade-in slide-in-from-top-2 origin-top sm:origin-top-right">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-sm text-slate-800">Gelişmiş Filtreler</h3>
                {filterCount > 0 && (
                  <button onClick={() => { setFilterPriority(null); setFilterDate(null); setFilterLabel(null) }} className="text-xs text-blue-600 hover:underline">
                    Temizle
                  </button>
                )}
              </div>

              {/* Öncelik */}
              <div className="mb-3">
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Öncelik</label>
                <select value={filterPriority || ''} onChange={e => setFilterPriority(e.target.value || null)} className="w-full text-sm border-slate-200 rounded-md bg-slate-50 outline-none p-1.5 border focus:border-blue-400">
                  <option value="">Tümü</option>
                  <option value="high">🔴 Yüksek</option>
                  <option value="medium">🟡 Orta</option>
                  <option value="low">🟢 Düşük</option>
                </select>
              </div>

              {/* Tarih */}
              <div className="mb-3">
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Teslim Tarihi</label>
                <select value={filterDate || ''} onChange={e => setFilterDate(e.target.value || null)} className="w-full text-sm border-slate-200 rounded-md bg-slate-50 outline-none p-1.5 border focus:border-blue-400">
                  <option value="">Tümü</option>
                  <option value="overdue">Gecikmiş</option>
                  <option value="today">Bugün</option>
                  <option value="upcoming">Yaklaşan (7 Gün)</option>
                </select>
              </div>

              {/* Etiket */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Etiket</label>
                <select value={filterLabel || ''} onChange={e => setFilterLabel(e.target.value || null)} className="w-full text-sm border-slate-200 rounded-md bg-slate-50 outline-none p-1.5 border focus:border-blue-400">
                  <option value="">Tümü</option>
                  <option value="Bug">Bug</option>
                  <option value="Feature">Feature</option>
                  <option value="İyileştirme">İyileştirme</option>
                  <option value="Acil">Acil</option>
                  <option value="Backend">Backend</option>
                  <option value="Frontend">Frontend</option>
                  <option value="UX/UI">UX/UI</option>
                  <option value="Core">Core</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setShowSummary(true)}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg border border-slate-200 transition-colors shrink-0"
            title="Board Özeti"
          >
            <BarChart3Icon className="w-4 h-4" /> 
            <span className="hidden sm:inline">Özet</span>
          </button>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
            <button
              onClick={() => setView('kanban')}
              className={`px-2 sm:px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${view === 'kanban' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutDashboardIcon className="w-4 h-4" />
              <span className="hidden md:inline">Kanban</span>
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-2 sm:px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 transition-colors ${view === 'calendar' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden md:inline">Takvim</span>
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-0.5 sm:mx-1 shrink-0" />

          {/* Avatars - Tıklanınca panel açılır */}
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setShowTeamPanel(!showTeamPanel)}
              className="flex items-center -space-x-2 hover:opacity-90 transition-opacity cursor-pointer shrink-0"
            >
              <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-xs font-bold text-white z-30 shadow-sm ring-2 ring-blue-200">
                {userInitial}
              </div>
              <div className="hidden sm:flex -space-x-2">
                {members.slice(0, 2).map((m, i) => (
                  <div key={m.id} className={`w-8 h-8 rounded-full border-2 border-white ${m.color} flex items-center justify-center text-xs font-bold shadow-sm`} style={{ zIndex: 20 - i * 10 }}>
                    {m.initials}
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 z-0 shadow-sm">
                  +{members.length > 2 ? members.length - 2 : 0}
                </div>
              </div>
            </button>

            {/* Takım Paneli */}
            {showTeamPanel && (
              <div className="fixed sm:absolute top-16 sm:top-12 left-4 right-4 sm:left-auto sm:-right-2 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top sm:origin-top-right">
                {/* Giriş yapan kullanıcı */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-blue-200">
                      {userInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-slate-800 text-sm truncate">{currentUser?.fullName || 'Kullanıcı'}</p>
                        <CrownIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      </div>
                      <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Çevrimiçi
                      </span>
                    </div>
                  </div>
                </div>

              {/* Takım arkadaşları */}
              <div className="p-3 max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between px-1 mb-2">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Takım Arkadaşları</span>
                  </div>
                  <button
                    onClick={() => setIsAddingMember(!isAddingMember)}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                  >
                    <UserPlusIcon className="w-3 h-3" />
                    Ekle
                  </button>
                </div>

                {isAddingMember && (
                  <form onSubmit={handleAddMember} className="mb-3 p-2 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-1 duration-200">
                    <input
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => { setNewMemberEmail(e.target.value); if (memberError) setMemberError('') }}
                      placeholder="Üye e-posta adresi..."
                      className={`w-full text-xs px-3 py-2 rounded-lg border outline-none transition-all mb-2 ${memberError ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'}`}
                      autoFocus
                      required
                    />
                    {memberError && (
                      <p className="text-[10px] text-red-500 font-medium mb-2 px-1">
                        {memberError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm active:scale-95 transition-transform">Davet Et</button>
                      <button type="button" onClick={() => { setIsAddingMember(false); setMemberError('') }} className="flex-1 bg-white text-slate-600 border border-slate-200 text-xs py-1.5 rounded-lg hover:bg-slate-50 transition-colors font-medium">İptal</button>
                    </div>
                  </form>
                )}

                <div className="space-y-1">
                  {members.map((member) => (
                    <div key={member.id} className="relative flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className={`w-9 h-9 rounded-full ${member.color} flex items-center justify-center text-sm font-bold shrink-0`}>
                        {member.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{member.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{member.role}</p>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === member.id ? null : member.id); }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Seçenekler"
                      >
                        <MoreHorizontalIcon className="w-4 h-4" />
                      </button>

                      {activeMenuId === member.id && (
                        <div className="absolute right-8 top-8 w-32 bg-white shadow-lg border border-slate-200 rounded-lg py-1 z-50 animate-in fade-in zoom-in-95">
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="w-full text-left px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            Kişiyi Çıkar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Alt kısım */}
              <div className="border-t border-slate-100 p-3">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
                >
                  <LogOutIcon className="w-4 h-4" />
                  Çıkış Yap
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons grubunun kapanışı */}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
        title="Çıkış Yap"
      >
        <LogOutIcon className="w-4 h-4" />
      </button>
    </div>

      {/* Özet Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4" onClick={() => setShowSummary(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3Icon className="w-5 h-5 text-blue-500" /> Board Özeti
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{board.title} &mdash; anlık durum</p>
              </div>
              <button onClick={() => setShowSummary(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2Icon className="w-5 h-5 text-emerald-500" />
                  <span className="text-[11px] text-emerald-600 font-semibold uppercase tracking-wider">Tamamlanan</span>
                </div>
                <p className="text-2xl font-bold text-emerald-700">{summaryStats.doneCount}</p>
                <p className="text-[11px] text-emerald-500 mt-0.5">öğe tamamlandı</p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardListIcon className="w-5 h-5 text-blue-500" />
                  <span className="text-[11px] text-blue-600 font-semibold uppercase tracking-wider">Toplam</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">{summaryStats.totalCards}</p>
                <p className="text-[11px] text-blue-500 mt-0.5">öğe oluşturuldu</p>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PencilLineIcon className="w-5 h-5 text-amber-500" />
                  <span className="text-[11px] text-amber-600 font-semibold uppercase tracking-wider">Devam Eden</span>
                </div>
                <p className="text-2xl font-bold text-amber-700">{summaryStats.inProgressCount}</p>
                <p className="text-[11px] text-amber-500 mt-0.5">öğe yapılıyor</p>
              </div>

              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="w-5 h-5 text-rose-500" />
                  <span className="text-[11px] text-rose-600 font-semibold uppercase tracking-wider">Yaklaşan</span>
                </div>
                <p className="text-2xl font-bold text-rose-700">{summaryStats.upcomingCount}</p>
                <p className="text-[11px] text-rose-500 mt-0.5">bitiş tarihi yakın</p>
              </div>
            </div>

            {/* Durum Genel Bakışı - Donut Chart */}
            <div className="px-6 pb-6">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-6">
                <h3 className="font-semibold text-slate-800 mb-1">Durum genel bakışı</h3>
                <p className="text-xs text-slate-500 mb-5">Kartlarınızın durumunu anlık olarak görün.</p>

                <div className="flex items-center justify-center gap-12">
                  {/* SVG Donut Chart */}
                  <div className="relative w-44 h-44">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      {(() => {
                        const total = summaryStats.totalCards || 1
                        const done = (summaryStats.doneCount / total) * 100
                        const todo = (summaryStats.todoCount / total) * 100
                        const inProg = (summaryStats.inProgressCount / total) * 100
                        const other = (summaryStats.otherCount / total) * 100
                        let offset = 0
                        const segments = []

                        if (done > 0) {
                          segments.push(<circle key="done" cx="18" cy="18" r="15.915" fill="none" stroke="#3B82F6" strokeWidth="3.5" strokeDasharray={`${done} ${100 - done}`} strokeDashoffset={`-${offset}`} strokeLinecap="round" />)
                          offset += done
                        }
                        if (todo > 0) {
                          segments.push(<circle key="todo" cx="18" cy="18" r="15.915" fill="none" stroke="#A855F7" strokeWidth="3.5" strokeDasharray={`${todo} ${100 - todo}`} strokeDashoffset={`-${offset}`} strokeLinecap="round" />)
                          offset += todo
                        }
                        if (inProg > 0) {
                          segments.push(<circle key="inprog" cx="18" cy="18" r="15.915" fill="none" stroke="#22C55E" strokeWidth="3.5" strokeDasharray={`${inProg} ${100 - inProg}`} strokeDashoffset={`-${offset}`} strokeLinecap="round" />)
                          offset += inProg
                        }
                        if (other > 0) {
                          segments.push(<circle key="other" cx="18" cy="18" r="15.915" fill="none" stroke="#94A3B8" strokeWidth="3.5" strokeDasharray={`${other} ${100 - other}`} strokeDashoffset={`-${offset}`} strokeLinecap="round" />)
                        }
                        if (summaryStats.totalCards === 0) {
                          segments.push(<circle key="empty" cx="18" cy="18" r="15.915" fill="none" stroke="#E2E8F0" strokeWidth="3.5" strokeDasharray="100 0" />)
                        }
                        return segments
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-slate-800">{summaryStats.totalCards}</span>
                      <span className="text-xs text-slate-500 font-medium">Toplam Kart</span>
                    </div>
                  </div>

                  {/* Lejant */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#3B82F6' }} />
                      <span className="text-sm text-slate-700 font-medium">Bitti: <strong>{summaryStats.doneCount}</strong></span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#A855F7' }} />
                      <span className="text-sm text-slate-700 font-medium">Yapılacak: <strong>{summaryStats.todoCount}</strong></span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#22C55E' }} />
                      <span className="text-sm text-slate-700 font-medium">Yapılıyor: <strong>{summaryStats.inProgressCount}</strong></span>
                    </div>
                    {summaryStats.otherCount > 0 && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#94A3B8' }} />
                        <span className="text-sm text-slate-700 font-medium">Diğer: <strong>{summaryStats.otherCount}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
