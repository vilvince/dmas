'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, FileText, Calendar, Building2, Tag, X, Eye, ChevronLeft, ChevronRight, ChevronDown, Filter, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getStatusBadgeColor, formatStatus } from '@/lib/utils/status'

// ── Types ─────────────────────────────────────────────────────────────────
interface Document {
  id: string
  title: string
  document_type: string | null
  document_type_detail: string | null
  status: string
  description: string | null
  remarks: string | null
  file_url: string | null
  file_name: string | null
  created_at: string
  initial_office: { name: string } | null
  current_office: { name: string } | null
  client_acknowledged_at: string | null
  client_acknowledgement_note: string | null
}

// ── Custom Select ─────────────────────────────────────────────────────────
function CustomSelect({ options, value, onChange, placeholder, minWidth }: {
  options: { label: string; value: string }[]
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

  const selectedLabel = options.find(opt => opt.value === value)?.label || ''

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
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => { onChange(option.value); setIsOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-blue-50 cursor-pointer
                ${value === option.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric'
  })

// ── Document Details Modal ────────────────────────────────────────────────
function DocumentDetailsModal({
  document, onClose, onViewFile, urlLoading, onAcknowledge
}: {
  document: Document
  onClose: () => void
  onViewFile: () => void
  urlLoading: boolean
  onAcknowledge: (note: string) => Promise<void>
}) {
  const isReleased  = document.status === 'released'
  const isAcked     = !!document.client_acknowledged_at
  const [note, setNote]           = useState('')
  const [acking, setAcking]       = useState(false)
  const [ackError, setAckError]   = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleConfirmReceipt = async () => {
    if (!note.trim()) { setAckError('Please write an acknowledgement note.'); return }
    setAcking(true)
    setAckError('')
    try {
      await onAcknowledge(note.trim())
      setShowSuccess(true)
    } catch {
      setAckError('Failed to submit. Please try again.')
    } finally {
      setAcking(false)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Document Details</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
              <Calendar size={12} />
              Submitted on {formatDate(document.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-6 overflow-y-auto flex-1">

          {/* Status Badge */}
          <div className="flex items-center gap-3 mb-5">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border tracking-wider uppercase ${getStatusBadgeColor(document.status)}`}>
              {formatStatus(document.status)}
            </span>
          </div>

          {/* Document Info Grid */}
          <div className="grid grid-cols-[160px_1fr] gap-y-4 gap-x-4 mb-8">
            <div className="text-sm font-medium text-slate-500 flex items-center gap-2 whitespace-nowrap">
              <FileText size={14} className="text-slate-400 shrink-0" />
              Document Name
            </div>
            <div className="text-sm font-semibold text-slate-800">{document.title}</div>

            <div className="text-sm font-medium text-slate-500 flex items-center gap-2 whitespace-nowrap">
              <Tag size={14} className="text-slate-400 shrink-0" />
              Document Type
            </div>
            <div className="text-sm text-slate-700">
              {document.document_type ?? '—'}
              {document.document_type_detail ? ` — ${document.document_type_detail}` : ''}
            </div>

            <div className="text-sm font-medium text-slate-500 flex items-center gap-2 whitespace-nowrap">
              <Building2 size={14} className="text-slate-400 shrink-0" />
              Submitted To
            </div>
            <div className="text-sm text-slate-700">{document.initial_office?.name ?? '—'}</div>

            <div className="text-sm font-medium text-slate-500 flex items-center gap-2 whitespace-nowrap">
              <Building2 size={14} className="text-slate-400 shrink-0" />
              Current Office
            </div>
            <div className="text-sm text-slate-700">{document.current_office?.name ?? '—'}</div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Description</h3>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-600 leading-relaxed max-h-40 overflow-y-auto">
              {document.description
                ? document.description
                : <span className="italic opacity-60">No description provided.</span>
              }
            </div>
          </div>

          {/* Office Remarks */}
          <div className={isReleased ? 'mb-6' : ''}>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Office Remarks</h3>
            <div className={`rounded-xl p-4 text-sm leading-relaxed max-h-40 overflow-y-auto border
              ${document.status === 'denied'
                ? 'bg-red-50/50 border-red-100 text-red-700'
                : 'bg-slate-50 border-slate-100 text-slate-600'
              }`}
            >
              {document.remarks
                ? <span>{document.remarks}</span>
                : <span className="italic opacity-60">No remarks provided by the office yet.</span>
              }
            </div>
          </div>

          {/* ── Client Acknowledgement (Released only) ─────────────────── */}
          {isReleased && (
            <div className="rounded-xl border border-teal-200 bg-teal-50/60 overflow-hidden">
              {/* Section Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-teal-600 text-white">
                <CheckCircle2 size={15} />
                <span className="text-sm font-semibold tracking-wide">Client Acknowledgement</span>
              </div>

              <div className="px-4 py-4">
                {/* Already acknowledged */}
                {isAcked ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-teal-700">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span className="text-sm font-semibold">Receipt Confirmed</span>
                    </div>
                    <p className="text-xs text-teal-700 bg-teal-100 rounded-lg px-3 py-2 leading-relaxed">
                      {document.client_acknowledgement_note}
                    </p>
                    <p className="text-[10px] text-teal-500">
                      Acknowledged on {formatDate(document.client_acknowledged_at!)}
                    </p>
                  </div>
                ) : showSuccess ? (
                  /* Success state after submitting */
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                      <CheckCircle2 size={22} className="text-teal-600" />
                    </div>
                    <p className="text-sm font-semibold text-teal-700">Receipt Confirmed!</p>
                    <p className="text-xs text-teal-500 text-center">
                      Your acknowledgement has been recorded successfully.
                    </p>
                  </div>
                ) : (
                  /* Acknowledgement form */
                  <div className="space-y-3">
                    <p className="text-xs text-teal-700 leading-relaxed">
                      Your document has been <strong>released</strong>. Please confirm that you have received it by writing an acknowledgement below.
                    </p>
                    <textarea
                      rows={3}
                      value={note}
                      onChange={(e) => { setNote(e.target.value); setAckError('') }}
                      placeholder='e.g. "I have received the document successfully."'
                      className={`w-full text-xs border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal-300 transition bg-white
                        ${ackError ? 'border-red-400' : 'border-teal-200'}`}
                    />
                    {ackError && <p className="text-xs text-red-500">{ackError}</p>}
                    <button
                      onClick={handleConfirmReceipt}
                      disabled={acking}
                      className="w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition disabled:opacity-60 cursor-pointer"
                    >
                      {acking ? 'Submitting...' : '✓ Confirm Receipt'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          {document.file_url ? (
            <button
              onClick={onViewFile}
              disabled={urlLoading}
              className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
            >
              <Eye size={14} />
              {urlLoading ? 'Opening...' : (document.file_name ?? 'View Attachment')}
            </button>
          ) : (
            <span className="text-xs text-slate-400 italic">No attachment</span>
          )}
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

// ── Main Page ─────────────────────────────────────────────────────────────
export default function MyDocumentsPage() {
  const supabase = createClient()

  const [documents, setDocuments]               = useState<Document[]>([])
  const [fetchLoading, setFetchLoading]         = useState(true)
  const [fetchError, setFetchError]             = useState('')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [urlLoading, setUrlLoading]             = useState(false)
  const [search, setSearch]                     = useState('')
  const [filterType, setFilterType]             = useState('All')
  const [filterStatus, setFilterStatus]         = useState('All')
  const [filterDate, setFilterDate]             = useState('All')
  const [currentPage, setCurrentPage]           = useState(1)
  const itemsPerPage = 5

  // ── Fetch Documents ───────────────────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    setFetchLoading(true)
    setFetchError('')

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { setFetchLoading(false); return }

    const { data, error } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        document_type,
        document_type_detail,
        status,
        description,
        remarks,
        file_url,
        file_name,
        created_at,
        client_acknowledged_at,
        client_acknowledgement_note,
        initial_office:departments!documents_initial_office_id_fkey ( name ),
        current_office:departments!documents_current_office_id_fkey ( name )
      `)
      .eq('submitted_by', authUser.id)
      .eq('module_type', 'process_routing')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch error:', error.message)
      setFetchError('Failed to load documents. Please refresh.')
    } else {
      setDocuments((data as any) || [])
    }

    setFetchLoading(false)
  }, [])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])
  useEffect(() => { setCurrentPage(1) }, [search, filterType, filterStatus, filterDate])

  // ── File Preview ──────────────────────────────────────────────────────
  const handleViewFile = async () => {
    if (!selectedDocument?.file_url) return
    setUrlLoading(true)
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(selectedDocument.file_url, 3600)
    if (!error && data) window.open(data.signedUrl, '_blank')
    setUrlLoading(false)
  }

  // ── Acknowledge ───────────────────────────────────────────────────────
  const handleAcknowledge = async (note: string) => {
    if (!selectedDocument) return

    const res = await fetch('/api/acknowledge-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: selectedDocument.id, note }),
    })

    const result = await res.json()
    if (!res.ok) throw new Error(result.error ?? 'Failed to save acknowledgement.')

    // Update local state so UI reflects the change immediately
    const now = result.acknowledgedAt as string
    setDocuments(prev => prev.map(d =>
      d.id === selectedDocument.id
        ? { ...d, client_acknowledged_at: now, client_acknowledgement_note: note }
        : d
    ))
    setSelectedDocument(prev => prev
      ? { ...prev, client_acknowledged_at: now, client_acknowledgement_note: note }
      : null
    )
  }

  // ── Filter & Sort ─────────────────────────────────────────────────────
  let filteredDocs = documents.filter(doc => {
    const matchSearch = search === '' ||
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      (doc.initial_office?.name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchType   = filterType   === 'All' || doc.document_type === filterType
    const matchStatus = filterStatus === 'All' || doc.status === filterStatus
    return matchSearch && matchType && matchStatus
  })

  if (filterDate === 'Newest') {
    filteredDocs = [...filteredDocs].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } else if (filterDate === 'Oldest') {
    filteredDocs = [...filteredDocs].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }

  // ── Pagination ────────────────────────────────────────────────────────
  const totalPages    = Math.max(1, Math.ceil(filteredDocs.length / itemsPerPage))
  const startIndex    = (currentPage - 1) * itemsPerPage
  const endIndex      = startIndex + itemsPerPage
  const paginatedDocs = filteredDocs.slice(startIndex, endIndex)
  const isFilterActive = filterType !== 'All' || filterStatus !== 'All' || filterDate !== 'All' || search !== ''

  const handleClearFilters = () => {
    setFilterType('All')
    setFilterStatus('All')
    setFilterDate('All')
    setSearch('')
  }

  // ── Options ───────────────────────────────────────────────────────────
  const uniqueTypes = [...new Set(documents.map(d => d.document_type).filter(Boolean))] as string[]

  const typeOptions = [
    { label: 'Document Type', value: 'All' },
    ...uniqueTypes.map(t => ({ label: t, value: t }))
  ]

  const statusOptions = [
    { label: 'Status',           value: 'All'                  },
    { label: 'Pending',          value: 'pending'              },
    { label: 'Received',         value: 'in_process'           },
    { label: 'Approved',         value: 'approved'             },
    { label: 'Pending Approval', value: 'recommended_approval' },
    { label: 'Denied',           value: 'denied'               },
    { label: 'Released',         value: 'released'             },
  ]

  const dateOptions = [
    { label: 'Date',         value: 'All'    },
    { label: 'Newest First', value: 'Newest' },
    { label: 'Oldest First', value: 'Oldest' },
  ]

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden p-8">

      {/* Header */}
      <header className="pb-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage all the documents you have submitted.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-100 outline-none w-64 shadow-sm"
          />
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-1 text-gray-600">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        <CustomSelect options={typeOptions}   value={filterType}   onChange={(val) => { setFilterType(val);   setCurrentPage(1) }} placeholder="Document Type" minWidth="min-w-[150px]" />
        <CustomSelect options={statusOptions} value={filterStatus} onChange={(val) => { setFilterStatus(val); setCurrentPage(1) }} placeholder="Status"        minWidth="min-w-[150px]" />
        <CustomSelect options={dateOptions}   value={filterDate}   onChange={(val) => { setFilterDate(val);   setCurrentPage(1) }} placeholder="Date"          minWidth="min-w-[120px]" />
        {isFilterActive && (
          <button onClick={handleClearFilters} className="text-xs text-blue-600 hover:underline cursor-pointer">Clear</button>
        )}
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{fetchError}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-6 py-4 font-semibold">Document Name</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Submitted To</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fetchLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedDocs.length > 0 ? (
                paginatedDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedDocument(doc)}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3.5 text-gray-700 font-medium">{doc.title}</td>
                    <td className="px-6 py-3.5 text-gray-500">
                      {doc.document_type ?? '—'}
                      {doc.document_type_detail ? ` — ${doc.document_type_detail}` : ''}
                    </td>
                    <td className="px-6 py-3.5 text-gray-500">{doc.initial_office?.name ?? '—'}</td>
                    <td className="px-6 py-3.5 text-gray-400">{formatDate(doc.created_at)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider ${getStatusBadgeColor(doc.status)}`}>
                        {formatStatus(doc.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedDocument(doc) }}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition flex items-center justify-center mx-auto"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                    {documents.length === 0
                      ? "You haven't submitted any documents yet."
                      : "No documents match your filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 gap-4 bg-gray-50/30">
          <p className="text-xs font-medium text-gray-500">
            Showing <span className="font-medium text-gray-800">{filteredDocs.length === 0 ? 0 : startIndex + 1}</span> to <span className="font-medium text-gray-800">{Math.min(endIndex, filteredDocs.length)}</span> of <span className="font-medium text-gray-800">{filteredDocs.length}</span> documents
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition disabled:opacity-50 cursor-pointer">
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer
                  ${currentPage === page ? 'bg-[#0f172a] text-white shadow-md' : 'border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
              >
                {page}
              </button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition disabled:opacity-50 cursor-pointer">
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedDocument && (
        <DocumentDetailsModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onViewFile={handleViewFile}
          urlLoading={urlLoading}
          onAcknowledge={handleAcknowledge}
        />
      )}
    </div>
  )
}