'use client'

import React, { useState } from 'react'
import { CardWithLabels } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDistanceToNow, format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, ClockIcon, MessageSquareIcon, TagIcon, TrashIcon, SaveIcon, XIcon } from 'lucide-react'
import { useBoard } from '@/hooks/useBoard'

interface CardDetailModalProps {
  card: CardWithLabels | null
  isOpen: boolean
  onClose: () => void
}

const AVAILABLE_LABELS = [
  { name: 'Bug', color: '#EF4444' },
  { name: 'Feature', color: '#3B82F6' },
  { name: 'İyileştirme', color: '#8B5CF6' },
  { name: 'Acil', color: '#F97316' },
  { name: 'Backend', color: '#3B82F6' },
  { name: 'Frontend', color: '#EC4899' },
  { name: 'UX/UI', color: '#EC4899' },
  { name: 'Core', color: '#F59E0B' },
]

const defaultTeamMembers = [
  { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@kocsistem.com', initials: 'A', color: 'bg-pink-100 text-pink-600', role: 'Frontend Developer' },
  { id: '2', name: 'Kaan Demir', email: 'kaan@kocsistem.com', initials: 'K', color: 'bg-emerald-100 text-emerald-600', role: 'Backend Developer' },
  { id: '3', name: 'Elif Arslan', email: 'elif@kocsistem.com', initials: 'E', color: 'bg-amber-100 text-amber-600', role: 'UI/UX Designer' },
]

export function CardDetailModal({ card, isOpen, onClose }: CardDetailModalProps) {
  const { updateCard, deleteCard } = useBoard()

  const [title, setTitle] = useState(card?.title || '')
  const [description, setDescription] = useState(card?.description || '')
  const [priority, setPriority] = useState(card?.priority || 'none')
  const [dueDate, setDueDate] = useState(card?.due_date || '')
  const [assignee, setAssignee] = useState<any>(card?.assignee || null)
  const [showLabelPicker, setShowLabelPicker] = useState(false)
  const [teamMembers, setTeamMembers] = useState<any[]>(defaultTeamMembers)

  React.useEffect(() => {
    try {
      let members = [...defaultTeamMembers]
      const saved = localStorage.getItem('taskflow-team')
      if (saved) {
        members = JSON.parse(saved)
      }
      
      const userData = localStorage.getItem('taskflow-user')
      if (userData) {
        const parsed = JSON.parse(userData)
        const email = parsed.email || ''
        const fullName = parsed.fullName || email.split('@')[0] || 'Kullanıcı'
        
        // Check if current user is already in members
        if (!members.find(m => m.email === email)) {
          members = [{
            id: parsed.id || `admin-${Date.now()}`,
            name: fullName + ' (Sen)',
            email: email,
            initials: fullName.charAt(0).toUpperCase(),
            color: 'bg-blue-100 text-blue-600',
            role: 'Yönetici'
          }, ...members]
        }
      }
      setTeamMembers(members)
    } catch { }
  }, [])

  const [selectedLabels, setSelectedLabels] = React.useState<{ id: string; board_id: string; name: string; color: string }[]>([])
  const dateInputRef = React.useRef<HTMLInputElement>(null)

  // Card değiştiğinde state'leri güncelle
  React.useEffect(() => {
    if (card) {
      setTitle(card.title)
      setDescription(card.description || '')
      setPriority(card.priority || 'none')
      setDueDate(card.due_date || '')
      setAssignee(card.assignee || null)
      setSelectedLabels(card.labels || [])
    }
  }, [card])

  if (!card) return null

  const handleSave = () => {
    // iOS Safari native takvim 'Sıfırla' butonu bazen onChange tetiklemiyor.
    // Bu yüzden kaydederken doğrudan DOM elementindeki en güncel değeri okuyoruz.
    const finalDate = dateInputRef.current ? dateInputRef.current.value : dueDate;
    
    updateCard(card.id, { 
      title, 
      description, 
      priority, 
      due_date: finalDate || null, 
      assignee,
      labels: selectedLabels 
    })
    onClose()
  }

  const handleDelete = () => {
    deleteCard(card.id)
    onClose()
  }

  const toggleLabel = (label: { name: string; color: string }) => {
    const exists = selectedLabels.find(l => l.name === label.name)
    if (exists) {
      setSelectedLabels(selectedLabels.filter(l => l.name !== label.name))
    } else {
      setSelectedLabels([...selectedLabels, { id: `l-${Date.now()}`, board_id: 'board-1', name: label.name, color: label.color }])
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-2xl bg-white p-0 overflow-y-auto max-h-[90vh] border-0 shadow-2xl rounded-2xl">

        {/* Renkli Öncelik Barı */}
        <div
          className="h-2 w-full"
          style={{
            backgroundColor:
              priority === 'high' ? '#EF4444' :
                priority === 'medium' ? '#F59E0B' :
                  priority === 'low' ? '#10B981' : '#E2E8F0'
          }}
        />

        {/* Header */}
        <div className="px-6 pt-4 pb-3">
          <DialogHeader>
            <DialogTitle className="sr-only">Kart Detayı</DialogTitle>
          </DialogHeader>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-semibold text-slate-800 w-full border-0 outline-none bg-transparent focus:ring-0"
            placeholder="Kart başlığı..."
          />
        </div>
        {/* Body */}
        <div className="px-6 pb-6 flex flex-col gap-6">

          {/* Açıklama (Ortalanmış ve Büyütülmüş) */}
          <div className="w-full flex flex-col items-center">
            <label className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <MessageSquareIcon className="w-5 h-5 text-blue-500" /> Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bu kart hakkında detaylı bilgi yazın..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 text-base text-slate-700 min-h-[200px] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 resize-y transition-all text-center placeholder:text-center shadow-inner"
            />
          </div>

          <div className="border-t border-slate-100 my-2" />

          {/* Meta Bilgiler (Alt Kısım - Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">

            {/* Öncelik */}
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-2 block">Öncelik</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-[40px] bg-white border border-slate-200 rounded-lg px-3 text-sm outline-none focus:border-blue-400 font-medium shadow-sm"
              >
                <option value="none">Yok</option>
                <option value="low">🟢 Düşük</option>
                <option value="medium">🟡 Orta</option>
                <option value="high">🔴 Yüksek</option>
              </select>
            </div>

            {/* Teslim Tarihi */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[11px] text-slate-500 uppercase tracking-wider font-bold block">Teslim Tarihi</label>
                {(card.due_date || (dateInputRef.current && dateInputRef.current.value)) && (
                  <button 
                    onClick={() => {
                      if (dateInputRef.current) dateInputRef.current.value = '';
                      // Force a tiny re-render just to hide the button if needed
                      setDueDate('');
                    }} 
                    className="text-[10px] text-red-500 font-semibold hover:text-red-700 hover:underline px-1"
                    title="Tarihi Sıfırla"
                  >
                    Sıfırla
                  </button>
                )}
              </div>
              <input
                key={`date-${card.id}`}
                ref={dateInputRef}
                type="date"
                defaultValue={card.due_date ? new Date(card.due_date).toISOString().split('T')[0] : ''}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-[40px] bg-white border border-slate-200 rounded-lg px-3 text-sm outline-none focus:border-blue-400 font-medium shadow-sm"
              />
            </div>

            {/* Sorumlu */}
            <div className="relative">
              <label className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-2 block">Sorumlu</label>
              <select
                value={assignee?.id || ''}
                onChange={(e) => {
                  if (!e.target.value) {
                    setAssignee(null)
                  } else {
                    const member = teamMembers.find(m => m.id === e.target.value)
                    setAssignee(member || null)
                  }
                }}
                className="w-full h-[40px] bg-white border border-slate-200 rounded-lg px-3 text-sm outline-none focus:border-blue-400 cursor-pointer font-medium shadow-sm"
              >
                <option value="">Atanmadı</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Etiketler */}
            <div>
              <label className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-2 block">Etiketler</label>
              <div className="relative">
                <button
                  onClick={() => setShowLabelPicker(!showLabelPicker)}
                  className="w-full h-[40px] bg-white border border-slate-200 rounded-lg px-3 text-sm text-left font-medium text-slate-600 hover:border-blue-400 focus:outline-none shadow-sm flex items-center justify-between"
                >
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {selectedLabels.length > 0
                      ? `${selectedLabels.length} Etiket Seçili`
                      : 'Etiket Seç...'}
                  </span>
                  <TagIcon className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showLabelPicker && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-white shadow-xl rounded-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                      <span className="text-xs font-semibold text-slate-700">Etiketler</span>
                      <button onClick={() => setShowLabelPicker(false)} className="text-slate-400 hover:text-slate-600">
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_LABELS.map(label => {
                        const isActive = selectedLabels.some(l => l.name === label.name)
                        return (
                          <button
                            key={label.name}
                            onClick={() => toggleLabel(label)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${isActive
                              ? 'text-white border-transparent shadow-sm'
                              : 'text-slate-600 border-slate-200 hover:border-slate-300 bg-slate-50'
                              }`}
                            style={isActive ? { backgroundColor: label.color } : {}}
                          >
                            {label.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              {/* Seçili Etiketleri Göster */}
              {selectedLabels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedLabels.map(label => (
                    <Badge
                      key={label.id}
                      className="cursor-pointer hover:opacity-80 transition-opacity text-white text-[9px] px-1.5 py-0 shadow-sm"
                      style={{ backgroundColor: label.color }}
                      onClick={() => toggleLabel(label)}
                    >
                      {label.name} ✕
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors shadow-sm"
            >
              <TrashIcon className="w-4 h-4" /> Sil
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              <SaveIcon className="w-4 h-4" /> Kaydet
            </button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
