'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboardIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import Link from 'next/link'
import { createClient, isSupabaseAvailable } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Önce Supabase'in ayakta olup olmadığını kontrol et
      const isAvailable = await isSupabaseAvailable()
      
      if (isAvailable) {
        const supabase = createClient()
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        
        if (!authError) {
          router.push('/boards')
          router.refresh()
          return
        }
      }
    } catch (err) {
      console.warn("Supabase bağlantısı kurulamadı, yerel veritabanına geçiliyor...")
    }

    // Supabase başarısız → localStorage fallback
    const users = JSON.parse(localStorage.getItem('taskflow-users') || '[]')
    const user = users.find((u: any) => u.email === email && u.password === password)

    if (user) {
      localStorage.setItem('taskflow-user', JSON.stringify(user))
      router.push('/boards')
    } else {
      setError('E-posta veya şifre hatalı.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDI1MzAiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCA0LTRzNCAxIDQgNC0yIDQtNCA0LTQtMi00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
      
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <LayoutDashboardIcon className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold text-white">TaskFlow</h1>
          </div>
          <p className="text-blue-200/70 text-sm">Projelerinizi kolayca yönetin</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Giriş Yap</h2>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="relative">
              <MailIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-300/60" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta adresiniz" required
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-blue-200/40 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm" />
            </div>

            <div className="relative">
              <LockIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-300/60" />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifreniz" required
                className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-blue-200/40 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-white">
                {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-600/30 disabled:opacity-50 text-sm">
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-blue-200/50 text-sm">
              Hesabınız yok mu?{' '}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium">Kayıt Ol</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
