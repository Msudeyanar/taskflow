'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      // Önce Supabase session kontrol
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session) { router.push('/boards'); return }
      } catch {}

      // Sonra localStorage kontrol
      const user = localStorage.getItem('taskflow-user')
      router.push(user ? '/boards' : '/login')
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )
}
