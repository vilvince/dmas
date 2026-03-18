'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Bell, FileText, Calendar, Building2, Tag, X, Download, Eye, ChevronLeft, ChevronRight, ChevronDown, Filter } from 'lucide-react'

interface Document {
  id: number
  name: string
  type: string
  department: string
  date: string
  status: string
  description: string
}

// Custom dropdown component – identical to DocumentProgress
function CustomSelect({ options, value, onChange, placeholder, minWidth }: {
  options: string[] | { label: string; value: string }[]
  value: string
  onChange: (val: string) => void
  placeholder: string
  minWidth: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const normalizedOptions = options.map(opt =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  )
  const selectedLabel = normalizedOptions.find(opt => opt.value === value)?.label || ''

  return (
    <div className={`relative ${minWidth}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-60 overflow-y-auto">
          {normalizedOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-blue-50 cursor-pointer ${
                value === option.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Mock Data for the Logged-in User ───────────────────────────────────────
const myDocuments = [
  { id: 1, name: 'Scholarship Grant Certificate', type: 'Financial Document', department: 'Accounting Office', date: '03/25/2026', status: 'Pending Review', description: 'Attached are the requirements for the CHED Scholarship.' },
  { id: 2, name: 'Leave of Absence Form', type: 'HR Document', department: 'Associate Dean', date: '03/20/2026', status: 'Approved', description: 'Leave request for medical reasons from March 22 to March 25.' },
  { id: 3, name: 'Procurement Request', type: 'Financial Document', department: 'BAC', date: '03/15/2026', status: 'Denied', description: 'Requesting new monitors for the IT lab.' },
  { id: 4, name: 'Clearance Form', type: 'Academic Document', department: "Dean's Office", date: '03/10/2026', status: 'Received', description: 'End of semester clearance.' },
  { id: 5, name: 'Travel Order', type: 'Administrative', department: 'Supply Office', date: '03/05/2026', status: 'Approved', description: 'Travel order for the upcoming seminar in Manila.' },
  { id: 6, name: 'Budget Proposal', type: 'Financial Document', department: 'Accounting Office', date: '03/01/2026', status: 'Pending Review', description: 'Proposed budget for the IT department equipment.' },
]

// ── Helper Function: Status Colors ─────────────────────────────────────────
const getStatusColor = (status:string) => {
  switch (status) {
    case 'Approved':  return 'bg-green-100 text-green-700 border-green-200'
    case 'Denied':    return 'bg-red-100 text-red-700 border-red-200'
    case 'Pending Review': return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'Received':  return 'bg-blue-100 text-blue-700 border-blue-200'
    default:          return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

const initialNotifications = [
  { id: 1, msg: 'Document A has been Approved by A.O', time: '2 min ago', type: 'approve' },
  { id: 2, msg: 'Document B has been Approved by S.O', time: '5 min ago', type: 'approve' },
  { id: 3, msg: 'Document C has been Denied by BAC', time: '12 min ago', type: 'deny' },
  { id: 4, msg: 'New Document submitted by Jane Doe', time: '1 hr ago', type: 'info' },
]

// ── 1. The Revamped Modal Component ────────────────────────────────────────
function DocumentDetailsModal({ document, onClose }: { document: Document; onClose: () => void }) {
  if (!document) return null

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-bold text-slate-800">Document Details</h2>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Calendar size={12} />
              Submitted on {document.date}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-center gap-3 mb-5">  
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border gap-y-4 tracking-wider uppercase ${getStatusColor(document.status)}`}>
                {document.status}
              </span>
          </div>
          <div className="grid grid-cols-[160px_1fr] gap-y-4 gap-x-4 mb-8">
            <div className="text-sm font-medium text-slate-500 flex items-center gap-2 whitespace-nowrap">
              <FileText size={14} className="text-slate-400 shrink-0" />
              Document Name
            </div>
            <div className="text-sm font-semibold text-slate-800">{document.name}</div>

            <div className="text-sm font-medium text-slate-500 flex items-center gap-2 whitespace-nowrap">
              <Tag size={14} className="text-slate-400 shrink-0" />
              Document Type
            </div>
            <div className="text-sm text-slate-700">{document.type}</div>

            <div className="text-sm font-medium text-slate-500 flex items-center gap-2 whitespace-nowrap">
              <Building2 size={14} className="text-slate-400 shrink-0" />
              Target Office
            </div>
            <div className="text-sm text-slate-700">{document.department}</div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Description</h3>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-600 leading-relaxed max-h-40 overflow-y-auto">
              {document.description || "No description provided."}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors cursor-pointer">
            <Download size={14} />
            View Attachment
          </button>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 2. The Main Page Component ─────────────────────────────────────────────
export default function MyDocumentsPage() {
  const [search, setSearch] = useState('')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState(initialNotifications)
  const notificationRef = useRef<HTMLDivElement>(null)

  // ── Filter States ──
  const [filterType, setFilterType] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterDate, setFilterDate] = useState('All')

  // ── Pagination States ──
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // ── Filter Logic ──
  let filteredDocs = myDocuments.filter(d => {
    const matchSearch = search === '' || 
      d.name.toLowerCase().includes(search.toLowerCase()) || 
      d.department.toLowerCase().includes(search.toLowerCase())
    
    const matchType = filterType === 'All' || d.type === filterType
    const matchStatus = filterStatus === 'All' || d.status === filterStatus

    return matchSearch && matchType && matchStatus
  })

  // ── Date Sorting Logic ──
  if (filterDate === 'Newest') {
    filteredDocs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } else if (filterDate === 'Oldest') {
    filteredDocs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // ── Reset Pagination on Filter Change ──
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterType, filterStatus, filterDate])

  // ── Pagination Math ──
  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDocs = filteredDocs.slice(startIndex, endIndex)

  // Check if any filter is active
  const isFilterActive = filterType !== 'All' || filterStatus !== 'All' || filterDate !== 'All' || search !== ''

  // Reset Filters Function
  const handleClearFilters = () => {
    setFilterType('All')
    setFilterStatus('All')
    setFilterDate('All')
    setSearch('')
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [notificationRef])

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden p-8">
      
      {/* ── Header ── */}
      <header className="bg-[#F8FAFC] pb-6 flex items-center justify-between shrink-0 z-30">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage all the documents you have submitted.</p>
        </div>

        <div className="flex items-center gap-4">
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

          <div className="relative" ref={notificationRef}>
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <span className="font-bold text-gray-800 text-sm">Notifications</span>
                  <button className="text-[10px] text-blue-600 font-semibold hover:underline">Mark all as read</button>
                </div>
                
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="px-5 py-4 border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer flex gap-3">
                      <div className={`mt-1 shrink-0 w-2 h-2 rounded-full ${n.type === 'deny' ? 'bg-red-400' : 'bg-green-400'}`} />
                      <div>
                        <p className="text-xs text-gray-600 leading-relaxed">{n.msg}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Filter Toolbar (modernized) ── */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-1 text-gray-600">
          <Filter className="w-4 h-10" />
          <span className="text-sm font-medium">Filter:</span>
        </div>

        <CustomSelect
          options={[
            { label: 'Document Type', value: 'All' },
            { label: 'Financial Document', value: 'Financial Document' },
            { label: 'Administrative', value: 'Administrative' },
            { label: 'HR Document', value: 'HR Document' },
            { label: 'Academic Document', value: 'Academic Document' },
          ]}
          value={filterType}
          onChange={(val) => {
            setFilterType(val)
            setCurrentPage(1)
          }}
          placeholder="Document Type"
          minWidth="min-w-[150px]"
        />

        <CustomSelect
          options={[
            { label: 'Status', value: 'All' },
            { label: 'Received', value: 'Received' },
            { label: 'Pending Review', value: 'Pending Review' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Denied', value: 'Denied' },
          ]}
          value={filterStatus}
          onChange={(val) => {
            setFilterStatus(val)
            setCurrentPage(1)
          }}
          placeholder="Status"
          minWidth="min-w-[120px]"
        />

        <CustomSelect
          options={[
            { label: 'Date', value: 'All' },
            { label: 'Newest First', value: 'Newest' },
            { label: 'Oldest First', value: 'Oldest' },
          ]}
          value={filterDate}
          onChange={(val) => {
            setFilterDate(val)
            setCurrentPage(1)
          }}
          placeholder="Date"
          minWidth="min-w-[100px]"
        />

        {isFilterActive && (
          <button onClick={handleClearFilters} className="text-xs text-blue-600 hover:underline ml-1 cursor-pointer">
            Clear
          </button>
        )}
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-center px-6 py-4 font-semibold">Document Name</th>
                <th className="text-center px-6 py-4 font-semibold">Type</th>
                <th className="text-center px-6 py-4 font-semibold">Submitted To</th>
                <th className="text-center px-6 py-4 font-semibold">Date</th>
                <th className="text-center px-6 py-4 font-semibold">Status</th>
                <th className="text-center px-6 py-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedDocs.length > 0 ? (
                paginatedDocs.map((doc) => (
                  <tr 
                    key={doc.id} 
                    onClick={() => setSelectedDocument(doc)} 
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-3.5 text-gray-700 font-medium">{doc.name}</td>
                    <td className="px-6 py-3.5 text-gray-500">{doc.type}</td>
                    <td className="px-6 py-3.5 text-gray-500">{doc.department}</td>
                    <td className="px-6 py-3.5 text-gray-400">{doc.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center w-35 h-7 px-2 rounded-full text-[10px] font-medium whitespace-nowrap leading-5 tracking-wider  ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation() 
                          setSelectedDocument(doc)
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition flex items-center justify-center mx-auto gap-2 text-xs font-semibold"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No documents match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 gap-4 bg-gray-50/30">
          <p className="text-xs font-medium text-gray-500">
            Showing <span className="font-medium text-gray-800">{filteredDocs.length === 0 ? 0 : startIndex + 1}</span> to <span className="font-medium text-gray-800">{Math.min(endIndex, filteredDocs.length)}</span> of <span className="font-medium text-gray-800">{filteredDocs.length}</span> documents
          </p>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer
                  ${currentPage === page
                    ? 'bg-[#0f172a] text-white shadow-md shadow-slate-300'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

      </div>

      {/* Render the Modal if a document is selected */}
      {selectedDocument && (
        <DocumentDetailsModal 
          document={selectedDocument} 
          onClose={() => setSelectedDocument(null)} 
        />
      )}

    </div>
  )
}