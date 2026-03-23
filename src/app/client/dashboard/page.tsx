'use client'
//dashboard
import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Bell, FileText, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getStatusBadgeColor, formatStatus } from '@/lib/utils/status'

// ── Types ─────────────────────────────────────────────────────────────────
interface Document {
  id: string
  title: string
  document_type: string | null
  document_type_detail: string | null
  created_at: string
  status: string
  profiles: { full_name: string } | null
}

interface Notification {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  document_id: string | null
}

interface Stats {
  total: number
  pending: number
  approved: number
  denied: number
}

// ── Helpers ───────────────────────────────────────────────────────────────
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric'
  })

const timeAgo = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins} min ago`
  if (hours < 24) return `${hours} hr ago`
  return `${days} day${days > 1 ? 's' : ''} ago`
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ClientDashboardPage() {
  const supabase = createClient()
  const router   = useRouter()

  // ── State ──────────────────────────────────────────────────────────────
  const [documents, setDocuments]           = useState<Document[]>([])
  const [notifications, setNotifications]   = useState<Notification[]>([])
  const [stats, setStats]                   = useState<Stats>({ total: 0, pending: 0, approved: 0, denied: 0 })
  const [currentUser, setCurrentUser]       = useState<{ full_name: string; department_name: string | null } | null>(null)
  const [fetchLoading, setFetchLoading]     = useState(true)
  const [search, setSearch]                 = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  // ── Pagination ────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // ── Fetch Current User ────────────────────────────────────────────────
  const fetchCurrentUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, departments ( name )')
      .eq('id', authUser.id)
      .single()

    if (profile) {
      setCurrentUser({
        full_name: profile.full_name,
        department_name: (profile.departments as any)?.name ?? null,
      })
    }
  }, [])

  // ── Fetch Documents ───────────────────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data, error } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        document_type,
        document_type_detail,
        created_at,
        status,
        profiles!documents_submitted_by_fkey ( full_name )
      `)
      .eq('submitted_by', authUser.id)
      .eq('module_type', 'process_routing')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setDocuments(data as any)

      // Calculate stats
      const all = data as any[]
      setStats({
        total:    all.length,
        pending:  all.filter(d => d.status === 'pending').length,
        approved: all.filter(d => d.status === 'approved').length,
        denied:   all.filter(d => d.status === 'denied').length,
      })
    }

    setFetchLoading(false)
  }, [])

  // ── Fetch Notifications ───────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data } = await supabase
      .from('notifications')
      .select('id, title, message, is_read, created_at, document_id')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) setNotifications(data)
  }, [])

  useEffect(() => {
    fetchCurrentUser()
    fetchDocuments()
    fetchNotifications()
  }, [fetchCurrentUser, fetchDocuments, fetchNotifications])

  useEffect(() => { setCurrentPage(1) }, [search])

  // ── Click outside notification bell ──────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Mark notification as read + go to inbox ───────────────────────────
  const handleNotificationClick = async (notif: Notification) => {
    // Mark as read
    if (!notif.is_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notif.id)
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      )
    }
    // Navigate to inbox
    setShowNotifications(false)
    router.push('/client/inbox')
  }

  // ── Mark all as read ──────────────────────────────────────────────────
  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', authUser.id)
      .eq('is_read', false)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  // ── Filter & Pagination ───────────────────────────────────────────────
  const filtered = documents.filter(d =>
    search === '' ||
    (d.profiles?.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    d.title.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages  = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const startIndex  = (currentPage - 1) * itemsPerPage
  const endIndex    = startIndex + itemsPerPage
  const paginatedDocs = filtered.slice(startIndex, endIndex)

  const unreadCount = notifications.filter(n => !n.is_read).length

  // ── Stat Cards Config ─────────────────────────────────────────────────
  const statCards = [
    { label: 'Total Document', value: stats.total,    bg: 'bg-blue-50',   iconColor: 'text-blue-400',   border: 'border-blue-100',   Icon: FileText    },
    { label: 'Pending',        value: stats.pending,  bg: 'bg-yellow-50', iconColor: 'text-yellow-500', border: 'border-yellow-100', Icon: Clock       },
    { label: 'Approved',       value: stats.approved, bg: 'bg-green-50',  iconColor: 'text-green-500',  border: 'border-green-100',  Icon: CheckCircle },
    { label: 'Denied',         value: stats.denied,   bg: 'bg-red-50',    iconColor: 'text-red-400',    border: 'border-red-100',    Icon: XCircle     },
  ]

  // ── JSX ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden p-8">

      {/* Header */}
      <header className="pb-6 flex items-center justify-between shrink-0 z-30">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Hi {currentUser?.full_name?.split(' ')[0] ?? '...'}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {currentUser?.department_name ?? ''}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-100 outline-none w-64 shadow-sm transition-all"
            />
          </div>

          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2.5 rounded-xl border transition-all relative cursor-pointer
                ${showNotifications
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 shadow-sm'
                }`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                {/* Dropdown Header */}
                <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] text-blue-600 font-semibold hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                    <button
                      onClick={() => { setShowNotifications(false); router.push('/client/inbox') }}
                      className="text-[10px] text-gray-400 hover:text-gray-600 font-semibold hover:underline cursor-pointer"
                    >
                      View all
                    </button>
                  </div>
                </div>

                {/* Notification List */}
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`px-5 py-4 border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer flex gap-3
                          ${!n.is_read ? 'bg-blue-50/40' : ''}`}
                      >
                        {/* Unread dot */}
                        <div className={`mt-1.5 shrink-0 w-2 h-2 rounded-full
                          ${!n.is_read ? 'bg-blue-500' : 'bg-gray-200'}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-relaxed truncate
                            ${!n.is_read ? 'text-gray-800 font-semibold' : 'text-gray-600'}`}>
                            {n.message}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-8 text-center text-gray-400 text-xs">
                      No notifications yet.
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/30">
                  <button
                    onClick={() => { setShowNotifications(false); router.push('/client/inbox') }}
                    className="w-full text-xs text-center text-blue-600 font-semibold hover:underline cursor-pointer"
                  >
                    Go to Inbox →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6 shrink-0">
          {statCards.map((s) => (
            <div key={s.label} className={`bg-white rounded-2xl border ${s.border} shadow-sm px-5 py-4 flex items-center gap-4`}>
              <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>
                <s.Icon size={18} className={s.iconColor} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 leading-none">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1 font-medium tracking-wide">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-center">
              <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-4 font-semibold text-left">Document Owner</th>
                  <th className="px-6 py-4 font-semibold text-left">Document Name</th>
                  <th className="px-6 py-4 font-semibold text-left">Document Type</th>
                  <th className="px-6 py-4 font-semibold text-left">Date Submitted</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fetchLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-3 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paginatedDocs.length > 0 ? (
                  paginatedDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-3.5 text-gray-700 font-medium text-left">
                        {doc.profiles?.full_name ?? '—'}
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 text-left">{doc.title}</td>
                      <td className="px-6 py-3.5 text-gray-500 text-left">
                        {doc.document_type ?? '—'}
                        {doc.document_type_detail ? ` — ${doc.document_type_detail}` : ''}
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 text-left">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider ${getStatusBadgeColor(doc.status)}`}>
                          {formatStatus(doc.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                      {documents.length === 0
                        ? "You haven't submitted any documents yet."
                        : "No documents found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 gap-4 bg-white">
            <p className="text-xs font-medium text-gray-500">
              Showing{' '}
              <span className="font-medium text-gray-800">{filtered.length === 0 ? 0 : startIndex + 1}</span>
              {' '}to{' '}
              <span className="font-medium text-gray-800">{Math.min(endIndex, filtered.length)}</span>
              {' '}of{' '}
              <span className="font-medium text-gray-800">{filtered.length}</span> documents
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft size={16} className="text-gray-600" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer
                    ${currentPage === page
                      ? 'bg-[#1a2e4a] text-white shadow-md'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}