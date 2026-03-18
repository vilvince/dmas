'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import NotificationBell from '@/components/NotificationBell' // Adjust path if needed

// ── Mock Notifications Data (Added missing metadata for the modal) ──
const mockNotifications = [
  { id: 1, status: 'In Process', documentName: 'Scholarship Grant Certificate', type: 'Financial Document', department: 'Supply Office', correspondingOffice: "Dean's Office", message: 'Your document is now Pending Review.', officeRemarks: 'Document received and is currently being reviewed by the supply officer.', clientAcknowledgement: 'Noted.', date: 'March 5, 2026', time: '10:30 A.M', read: false },
  { id: 2, status: 'Approved', documentName: 'Leave of Absence', type: 'HR Document', department: 'HR Office', correspondingOffice: "Dean's Office", message: 'Your document has been Approved.', officeRemarks: 'Leave request approved for March 22-25.', clientAcknowledgement: '', date: 'March 5, 2026', time: '10:30 A.M', read: true },
  { id: 3, status: 'Released', documentName: 'Procurement Request', type: 'Financial Document', department: 'BAC', correspondingOffice: "Supply Office", message: 'Your document is ready for Release.', officeRemarks: 'Monitors are ready for pickup.', clientAcknowledgement: 'Received the items in good condition.', date: 'March 5, 2026', time: '10:30 A.M', read: true },
  { id: 4, status: 'Denied', documentName: 'Travel Order', type: 'Administrative', department: 'Dean Office', correspondingOffice: "Accounting", message: 'Your document has been Denied.', officeRemarks: 'Missing signatures from the department head.', clientAcknowledgement: '', date: 'March 5, 2026', time: '10:30 A.M', read: true },
]

// Generate more notifications to reach 20 for pagination testing
for (let i = 5; i <= 20; i++) {
  mockNotifications.push({
    id: i,
    status: i % 3 === 0 ? 'In Process' : 'Approved',
    documentName: 'Scholarship Grant Certificate',
    type: 'Financial Document',
    department: 'Supply Office',
    correspondingOffice: "Dean's Office",
    message: i % 3 === 0 ? 'Your document is now Pending Review.' : 'Your document has been Approved.',
    officeRemarks: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    clientAcknowledgement: '',
    date: 'March 5, 2026',
    time: '10:30 A.M',
    read: i % 3 !== 0,
  })
}

// ── Stepper Logic Helper ──
const getProgressSteps = (status) => {
  const steps = ['Submitted', 'Under Review', 'For Recommendation', 'Approved', 'Released']
  let currentIndex = 0

  if (status === 'In Process' || status === 'Under Review') currentIndex = 1
  else if (status === 'For Recommendation') currentIndex = 2
  else if (status === 'Approved') currentIndex = 3
  else if (status === 'Released') currentIndex = 4
  else if (status === 'Denied') currentIndex = 1 // Stops at review if denied

  return steps.map((label, index) => ({
    label,
    completed: index <= currentIndex,
    active: index === currentIndex
  }))
}

export default function InboxPage() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal State
  const [selectedDoc, setSelectedDoc] = useState(null)

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // User info (mock data)
  const userName = 'Jane Doe'
  const userDepartment = 'Accounting Office'

  const unreadCount = notifications.filter(n => !n.read).length
  const readCount = notifications.filter(n => n.read).length

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = 
      notif.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = 
      activeFilter === 'all' || 
      (activeFilter === 'unread' && !notif.read) ||
      (activeFilter === 'read' && notif.read)
    return matchesSearch && matchesFilter
  })

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeFilter])

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + itemsPerPage)

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)))
  }

  // Status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'In Process': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'Approved':   return 'bg-green-100 text-green-700 border-green-200'
      case 'Released':   return 'bg-cyan-100 text-cyan-700 border-cyan-200'
      case 'Denied':     return 'bg-red-100 text-red-700 border-red-200'
      default:           return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      
      {/* ── HEADER ── */}
      <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shrink-0 z-20">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hi, {userName}!</h1>
          <p className="text-sm text-gray-500">{userDepartment}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 w-64 transition-all"
            />
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex-1 flex flex-col overflow-hidden px-8 py-6 bg-gray-50">
        
        {/* Filter Tabs (Shrink-0 prevents squishing) */}
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className={`flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
              activeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {notifications.length}
            </span>
            All
          </button>

          <button
            onClick={() => setActiveFilter('unread')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeFilter === 'unread' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className={`flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
              activeFilter === 'unread' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {unreadCount}
            </span>
            Unread
          </button>

          <button
            onClick={() => setActiveFilter('read')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeFilter === 'read' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className={`flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
              activeFilter === 'read' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {readCount}
            </span>
            Read
          </button>
        </div>

        {/* ── Table Container (Handles Flex & Overflow) ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden mb-0">
          
          {/* Inner Scrollable Table */}
          <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-200">
            <table className="w-full text-sm text-left">
              <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Document Name</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Message</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedNotifications.length > 0 ? (
                  paginatedNotifications.map((notif) => (
                    <tr
                      key={notif.id}
                      onClick={() => setSelectedDoc(notif)} // Opens the Tracking Modal
                      className={`hover:bg-gray-50 transition-colors cursor-pointer group ${
                        !notif.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider border ${getStatusBadgeColor(notif.status)}`}>
                          {notif.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-800 font-semibold group-hover:text-blue-600 transition-colors">
                        {notif.documentName}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{notif.message}</td>
                      <td className="px-6 py-4 text-gray-500">
                        <div className="font-medium text-gray-700">{notif.date}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{notif.time}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      No Relevant Notifications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer (Locked to bottom) */}
          <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 gap-4 bg-white">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredNotifications.length === 0 ? 0 : startIndex + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(startIndex + itemsPerPage, filteredNotifications.length)}</span> of{' '}
              <span className="font-semibold">{filteredNotifications.length}</span> documents
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={16} className="text-gray-600" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-bold transition cursor-pointer ${
                    currentPage === page
                      ? 'bg-[#1a2e4a] text-white shadow-md'
                      : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL: Document Tracking Details ── */}
      {selectedDoc && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-200"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-gray-800">Document Tracking Details</h2>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition text-gray-400 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Progress Tracker Stepper */}
            {/* Progress Tracker Stepper */}
            <div className="px-8 py-8 border-b border-gray-100">
              <div className="relative flex items-start justify-between px-2 sm:px-8">
                {getProgressSteps(selectedDoc.status).map((step, index, arr) => (
                  <div key={index} className="flex flex-col items-center relative" style={{ flex: 1 }}>
                    
                    {/* 💡 FIX: Changed -z-10 to z-0 so it doesn't hide behind the modal background */}
                    {index < arr.length - 1 && (
                      <div
                        className={`absolute top-3.5 left-1/2 w-full h-[3px] z-0 transition-colors duration-300 ${
                          arr[index + 1].completed ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}

                    {/* Circle Indicator (Stays z-10 to sit on top of the line) */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 relative z-10 transition-colors duration-300 ${
                        step.completed
                          ? 'bg-green-500 border-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.2)]'
                          : 'bg-white border-gray-300'
                      }`}
                    />

                    {/* Step Label */}
                    <p
                      className={`text-[11px] font-bold mt-4 text-center leading-tight uppercase tracking-wider ${
                        step.active ? 'text-gray-900' : (step.completed ? 'text-gray-600' : 'text-gray-400')
                      }`}
                      style={{ maxWidth: '90px' }}
                    >
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Metadata Grid */}
            <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 border-b border-gray-100">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Document Name</p>
                <p className="text-sm font-semibold text-gray-800">{selectedDoc.documentName}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Document Type</p>
                <p className="text-sm font-semibold text-gray-800">{selectedDoc.type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Submitting Office</p>
                <p className="text-sm font-semibold text-gray-800">{selectedDoc.department || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date Submitted</p>
                <p className="text-sm font-semibold text-gray-800">{selectedDoc.date}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Corresponding office</p>
                <p className="text-sm font-semibold text-gray-800">{selectedDoc.correspondingOffice || 'N/A'}</p>
              </div>
            </div>

            {/* Office Remarks Box */}
            <div className="px-8 py-6 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Office Remarks</h3>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedDoc.officeRemarks || 'No remarks provided.'}
                </p>
              </div>
            </div>

            {/* Client Acknowledgement Box */}
            <div className="px-8 py-6 pb-8">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Client Acknowledgement</h3>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 min-h-[60px] flex items-center">
                <p className="text-sm text-gray-700">
                  {selectedDoc.clientAcknowledgement || 'Awaiting acknowledgement...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}