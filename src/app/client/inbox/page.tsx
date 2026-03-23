'use client'
//inbox
import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, X, CheckCheck, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getStatusBadgeColor, formatStatus, getStepperCircleColor } from '@/lib/utils/status'

// ── Types ─────────────────────────────────────────────────────────────────
interface Notification {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  document_id: string | null
  documents: {
    title: string
    status: string
    description: string | null
    remarks: string | null
    document_type: string | null
    document_type_detail: string | null
    initial_office: { name: string } | null
    current_office: { name: string } | null
    document_logs: {
      id: string
      action: string
      new_status: string | null
      previous_status: string | null
      created_at: string
      departments: { name: string } | null
      profiles: { full_name: string } | null
    }[]
  } | null
}

// ── Helpers ───────────────────────────────────────────────────────────────
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  })

const formatTime = (dateString: string) =>
  new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  })

// ── Main Page ─────────────────────────────────────────────────────────────
export default function InboxPage() {
  const supabase = createClient()

  // ── State ──────────────────────────────────────────────────────────────
  const [notifications, setNotifications]   = useState<Notification[]>([])
  const [currentUser, setCurrentUser]       = useState<{ full_name: string; department_name: string | null } | null>(null)
  const [fetchLoading, setFetchLoading]     = useState(true)
  const [fetchError, setFetchError]         = useState('')
  const [activeFilter, setActiveFilter]     = useState('all')
  const [searchQuery, setSearchQuery]       = useState('')
  const [selectedDoc, setSelectedDoc]       = useState<Notification | null>(null)
  const [currentPage, setCurrentPage]       = useState(1)
  const itemsPerPage = 10

  // ── Fetch Current User ────────────────────────────────────────────────
  const fetchCurrentUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        full_name,
        departments ( name )
      `)
      .eq('id', authUser.id)
      .single()

    if (profile) {
      setCurrentUser({
        full_name: profile.full_name,
        department_name: (profile.departments as any)?.name ?? null,
      })
    }
  }, [])

  // ── Fetch Notifications ───────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setFetchLoading(true)
    setFetchError('')

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { setFetchLoading(false); return }

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        title,
        message,
        is_read,
        created_at,
        document_id,
        documents (
          title,
          status,
          description,
          remarks,
          document_type,
          document_type_detail,
          initial_office:departments!documents_initial_office_id_fkey ( name ),
          current_office:departments!documents_current_office_id_fkey ( name ),
          document_logs (
            id,
            action,
            new_status,
            previous_status,
            created_at,
            departments!document_logs_office_id_fkey ( name ),
            profiles!document_logs_performed_by_fkey ( full_name )
          )
        )
      `)
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch error:', error.message)
      setFetchError('Failed to load notifications. Please refresh.')
    } else {
      // Sort document_logs inside each notification ascending
      const sorted = (data as any[]).map(n => ({
        ...n,
        documents: n.documents ? {
          ...n.documents,
          document_logs: (n.documents.document_logs || []).sort(
            (a: any, b: any) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        } : null
      }))
      setNotifications(sorted)
    }

    setFetchLoading(false)
  }, [])

  useEffect(() => {
    fetchCurrentUser()
    fetchNotifications()
  }, [fetchCurrentUser, fetchNotifications])

  useEffect(() => { setCurrentPage(1) }, [searchQuery, activeFilter])

  // ── Mark as Read ──────────────────────────────────────────────────────
  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
  }

  // ── Mark All as Read ──────────────────────────────────────────────────
  const handleMarkAllAsRead = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', authUser.id)
      .eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  // ── Delete Notification ───────────────────────────────────────────────
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (selectedDoc?.id === id) setSelectedDoc(null)
  }

  // ── Open Notification (mark as read automatically) ────────────────────
  const handleOpenNotification = async (notif: Notification) => {
    setSelectedDoc(notif)
    if (!notif.is_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notif.id)
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      )
    }
  }

  // ── Filter ────────────────────────────────────────────────────────────
  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch =
      (notif.documents?.title ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'unread' && !notif.is_read) ||
      (activeFilter === 'read'   && notif.is_read)
    return matchesSearch && matchesFilter
  })

  const unreadCount = notifications.filter(n => !n.is_read).length
  const readCount   = notifications.filter(n => n.is_read).length

  // ── Pagination ────────────────────────────────────────────────────────
  const totalPages    = Math.max(1, Math.ceil(filteredNotifications.length / itemsPerPage))
  const startIndex    = (currentPage - 1) * itemsPerPage
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + itemsPerPage)
  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(totalPages, page)))

  // ── JSX ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shrink-0 z-20">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Hi, {currentUser?.full_name ?? '...'}!
          </h1>
          <p className="text-sm text-gray-500">
            {currentUser?.department_name ?? ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
            >
              <CheckCheck size={14} />
              Mark all as read
            </button>
          )}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 w-64"
            />
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col overflow-hidden px-8 py-6 bg-gray-50">

        {/* Filter Tabs */}
        <div className="flex items-center gap-3 mb-6 shrink-0">
          {[
            { key: 'all',    label: 'All',    count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount          },
            { key: 'read',   label: 'Read',   count: readCount            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer
                ${activeFilter === tab.key
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              <span className={`flex items-center justify-center w-6 h-6 rounded text-xs font-bold
                ${activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {tab.count}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            {fetchError}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Document Name</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Message</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
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
                ) : paginatedNotifications.length > 0 ? (
                  paginatedNotifications.map((notif) => (
                    <tr
                      key={notif.id}
                      onClick={() => handleOpenNotification(notif)}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer group
                        ${!notif.is_read ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          )}
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border
                            ${getStatusBadgeColor(notif.documents?.status ?? '')}`}>
                            {formatStatus(notif.documents?.status ?? '')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-800 font-semibold group-hover:text-blue-600 transition-colors">
                        {notif.documents?.title ?? notif.title}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{notif.message}</td>
                      <td className="px-6 py-4 text-gray-500">
                        <div className="font-medium text-gray-700">{formatDate(notif.created_at)}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{formatTime(notif.created_at)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {!notif.is_read && (
                            <button
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              title="Mark as read"
                              className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            >
                              <CheckCheck size={15} />
                            </button>
                          )}
                      
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      {notifications.length === 0
                        ? 'No notifications yet.'
                        : 'No notifications match your filter.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 gap-4 bg-white">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredNotifications.length === 0 ? 0 : startIndex + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(startIndex + itemsPerPage, filteredNotifications.length)}</span> of{' '}
              <span className="font-semibold">{filteredNotifications.length}</span> notifications
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition disabled:opacity-50 cursor-pointer">
                <ChevronLeft size={16} className="text-gray-600" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => goToPage(page)}
                  className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-bold transition cursor-pointer
                    ${currentPage === page ? 'bg-[#1a2e4a] text-white shadow-md' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                  {page}
                </button>
              ))}
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition disabled:opacity-50 cursor-pointer">
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal: Document Tracking Details ── */}
      {selectedDoc && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-gray-800">Document Tracking Details</h2>
              <button onClick={() => setSelectedDoc(null)} className="p-1.5 rounded-lg hover:bg-gray-200 transition text-gray-400 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Dynamic Stepper from document_logs */}
            <div className="px-6 py-6 border-b border-gray-100 overflow-x-auto">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Document Journey</p>
              <div className="relative flex items-start gap-0 min-w-max">
                {(() => {
                  const logs = selectedDoc.documents?.document_logs ?? []
                  const steps = [
                    {
                      label: 'Submitted',
                      sublabel: selectedDoc.documents?.initial_office?.name ?? '',
                      status: 'submitted',
                    },
                    ...logs.map((log) => ({
                      label: log.departments?.name ?? log.action,
                      sublabel: formatStatus(log.new_status ?? ''),
                      status: log.new_status ?? '',
                    }))
                  ]

                  return steps.map((step, index) => (
                    <div key={index} className="flex items-start relative" style={{ minWidth: '90px', flex: 1 }}>
                      {index < steps.length - 1 && (
                        <div className="absolute top-3.5 left-1/2 w-full h-[3px] bg-blue-200 z-0" />
                      )}
                      <div className="flex flex-col items-center w-full relative z-10">
                        <div className={`w-7 h-7 rounded-full border-2 shrink-0 ${getStepperCircleColor(step.status)}`} />
                        <p className="text-[10px] font-bold mt-2 text-center uppercase tracking-wide text-gray-700 leading-tight px-1" style={{ maxWidth: '85px' }}>
                          {step.label}
                        </p>
                        {step.sublabel && step.status !== 'submitted' && (
                          <span className={`mt-1 inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${getStatusBadgeColor(step.status)}`}>
                            {step.sublabel}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </div>

            {/* Document Metadata */}
            <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 border-b border-gray-100">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Document Name</p>
                <p className="text-sm font-semibold text-gray-800">{selectedDoc.documents?.title ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Document Type</p>
                <p className="text-sm font-semibold text-gray-800">
                  {selectedDoc.documents?.document_type ?? '—'}
                  {selectedDoc.documents?.document_type_detail ? ` — ${selectedDoc.documents.document_type_detail}` : ''}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Submitted To</p>
                <p className="text-sm font-semibold text-gray-800">
                  {selectedDoc.documents?.initial_office?.name ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current Office</p>
                <p className="text-sm font-semibold text-gray-800">
                  {selectedDoc.documents?.current_office?.name ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date Submitted</p>
                <p className="text-sm font-semibold text-gray-800">{formatDate(selectedDoc.created_at)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current Status</p>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(selectedDoc.documents?.status ?? '')}`}>
                  {formatStatus(selectedDoc.documents?.status ?? '')}
                </span>
              </div>
            </div>

            {/* Office Remarks */}
            <div className="px-8 py-6 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Office Remarks</h3>
              <div className={`rounded-xl p-4 border text-sm leading-relaxed
                ${selectedDoc.documents?.status === 'denied'
                  ? 'bg-red-50 border-red-100 text-red-700'
                  : 'bg-gray-50 border-gray-100 text-gray-700'
                }`}>
                {selectedDoc.documents?.remarks
                  ? selectedDoc.documents.remarks
                  : <span className="italic text-gray-400">No remarks provided yet.</span>
                }
              </div>
            </div>

            {/* Notification Message */}
            <div className="px-8 py-6 pb-8">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Notification</h3>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 min-h-[60px]">
                <p className="text-sm text-blue-700">{selectedDoc.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}