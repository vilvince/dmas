'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Home, FileText, Inbox, User, LogOut,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',    href: '/client/dashboard',    icon: Home     },
  { label: 'My Documents', href: '/client/my-documents', icon: FileText },
  { label: 'Inbox',        href: '/client/inbox',        icon: Inbox    },
  { label: 'Profile',      href: '/client/profile',      icon: User     },
]

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 bg-[#1a2e4a] flex flex-col py-6 px-3 shrink-0">

        {/* Avatar */}
        <div className="flex flex-col items-center mb-2 px-2">
          <div className="w-full py-4 flex flex-col items-center">
            <img 
              src="/bucenglogo.png" 
              alt="BUCENG Logo" 
              className="w-20 h-20 object-contain mb-2" 
            />
            <span className="text-white font-bold text-xl tracking-tighter">BUCENG</span>
            <p className="text-[10px] text-blue-300 uppercase tracking-widest font-medium">Bicol University</p>
          </div>
          <div className="h-[1px] w-full bg-blue-900/50 " />
        </div>


        {/* Nav Items */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left
                  ${pathname === item.href
                    ? 'bg-[#2d4a6e] text-white'
                    : 'text-blue-200 hover:bg-[#243d5c] hover:text-white'
                  }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-[#243d5c] rounded-lg text-sm font-medium transition-all mt-4"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </aside>

      {/* Page Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
