'use client'
import { getStatusBadgeColor, formatStatus } from '@/lib/utils/status'
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Filter, Search, ChevronLeft, ChevronRight, ChevronDown, X, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendAllNotifications } from '@/lib/notifications/send-all-notifications'
import type { NotificationAction } from '@/lib/notifications/notification-service'

// ── Types ─────────────────────────────────────────────────────────────────
interface Document {
  id: string
  title: string
  document_type: string | null
  document_type_detail: string | null
  module_type: string
  status: string
  description: string | null
  file_url: string | null
  file_name: string | null
  created_at: string
  updated_at: string
  submitted_by: string | null
  current_office_id: string | null
  departments: { name: string } | null
  profiles: { full_name: string } | null
  current_office: { name: string } | null
}

// ── Custom Select ─────────────────────────────────────────────────────────
function CustomSelect({ options, value, onChange, placeholder, minWidth, error = false }: {
  options: string[] | { label: string; value: string }[]
  value: string
  onChange: (val: string) => void
  placeholder: string
  minWidth: string
  error?: boolean
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
        className={`w-full flex items-center justify-between gap-2 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition cursor-pointer
          ${error ? 'border-red-500' : 'border-gray-200'}
          focus:outline-none focus:ring-2 focus:ring-blue-200`}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
          {normalizedOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => { onChange(option.value); setIsOpen(false) }}
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric'
  })
}

// ── Options ───────────────────────────────────────────────────────────────
const statusOptions = [
  { label: 'Pending',         value: 'pending'              },
  { label: 'Received',        value: 'in_process'           },
  { label: 'Approved',        value: 'approved'             },
  { label: 'Pending Approval',value: 'recommended_approval' },
  { label: 'Denied',          value: 'denied'               },
]

const actionOptions = [
  { label: 'Received',        value: 'in_process'           },
  { label: 'Approved',        value: 'approved'             },
  { label: 'Pending Approval',value: 'recommended_approval' },
  { label: 'Denied',          value: 'denied'               },
  { label: 'Released',        value: 'released'             },
]

// ── Main Page ─────────────────────────────────────────────────────────────
export default function DocumentProgressPage() {
  const supabase = useMemo(() => createClient(), [])

  const [documents, setDocuments]       = useState<Document[]>([])
  const [departments, setDepartments]   = useState<{ id: string; name: string }[]>([])
  const [fetchLoading, setFetchLoading] = useState(true)
  const [fetchError, setFetchError]     = useState('')
  const [selectedDept, setSelectedDept]     = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [searchQuery, setSearchQuery]       = useState('')
  const [currentPage, setCurrentPage]       = useState(1)
  const itemsPerPage = 8

  const [selectedDoc, setSelectedDoc]           = useState<Document | null>(null)
  const [actionTaken, setActionTaken]           = useState('')
  const [corrOffice, setCorrOffice]             = useState('')
  const [remarks, setRemarks]                   = useState('')
  const [submitError, setSubmitError]           = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submitLoading, setSubmitLoading]       = useState(false)
  const [urlLoading, setUrlLoading]             = useState(false)

  // ── Fetch — only process_routing ──────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    setFetchLoading(true)
    setFetchError('')

    const { data, error } = await supabase
      .from('documents')
      .select(`
        id, title, document_type, document_type_detail,
        module_type, status, description, file_url, file_name,
        created_at, updated_at, submitted_by, current_office_id,
        departments!documents_department_id_fkey ( name ),
        profiles!documents_submitted_by_fkey ( full_name ),
        current_office:departments!documents_current_office_id_fkey ( name )
      `)
      .eq('module_type', 'process_routing')
      .neq('status', 'released')
      .order('created_at', { ascending: false })

    if (error) {
      setFetchError('Failed to load documents. Please refresh.')
    } else {
      setDocuments((data as any) || [])
    }
    setFetchLoading(false)
  }, [])

  const fetchDepartments = useCallback(async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name')
      .order('name')
    if (!error && data) setDepartments(data)
  }, [])

  useEffect(() => {
    fetchDocuments()
    fetchDepartments()
  }, [fetchDocuments, fetchDepartments])

  useEffect(() => {
    if (selectedDoc) {
      setActionTaken(selectedDoc.status) // ← pre-select current status
      setCorrOffice(selectedDoc.current_office_id ?? '')
      setRemarks('')
      setSubmitError('')
      setShowConfirmModal(false)
      setShowSuccessModal(false)
    }
  }, [selectedDoc])

  // ── File Preview ──────────────────────────────────────────────────────
  const handleViewFile = async () => {
    if (!selectedDoc?.file_url) return
    setUrlLoading(true)
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(selectedDoc.file_url, 3600)
    if (!error && data) window.open(data.signedUrl, '_blank')
    setUrlLoading(false)
  }

  // ── Filter — no module_type filter ───────────────────────────────────
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDept   = !selectedDept   || doc.departments?.name === selectedDept
    const matchesStatus = !selectedStatus || doc.status === selectedStatus
    return matchesSearch && matchesDept && matchesStatus
  })

  const totalPages    = Math.ceil(filteredDocs.length / itemsPerPage)
  const startIndex    = (currentPage - 1) * itemsPerPage
  const paginatedDocs = filteredDocs.slice(startIndex, startIndex + itemsPerPage)

  const clearFilters = () => {
    setSelectedDept('')
    setSelectedStatus('')
    setSearchQuery('')
    setCurrentPage(1)
  }

  const goToPage = (page: number) =>
    setCurrentPage(Math.max(1, Math.min(totalPages, page)))

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmitClick = () => {
    if (!actionTaken)    { setSubmitError('Please select an action.'); return }
    if (!corrOffice)     { setSubmitError('Please select a corresponding office.'); return }
    if (!remarks.trim()) { setSubmitError('Please write some remarks.'); return }
    setSubmitError('')
    setShowConfirmModal(true)
  }

  const handleConfirmSubmit = async () => {
    if (!selectedDoc) return
    setSubmitLoading(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setSubmitError('Not authenticated.'); return }

      const { error: updateError } = await supabase
        .from('documents')
        .update({
          status:            actionTaken,
          current_office_id: corrOffice,
          remarks:           remarks.trim(),
          updated_at:        new Date().toISOString(),
        })
        .eq('id', selectedDoc.id)

      if (updateError) {
        setSubmitError('Failed to update document. Please try again.')
        setShowConfirmModal(false)
        return
      }

      const { error: logError } = await supabase.from('document_logs').insert([{
        document_id:     selectedDoc.id,
        performed_by:    authUser.id,
        action:          'Status updated',
        previous_status: selectedDoc.status,
        new_status:      actionTaken,
        office_id:       corrOffice,
        remarks:         remarks.trim(),
      }])
      if (logError) console.error('Log insert failed:', logError.message)

      if (selectedDoc.submitted_by) {
        const actionMap: Record<string, NotificationAction> = {
          'in_process':           'document_received',
          'approved':             'document_approved',
          'recommended_approval': 'document_approved',
          'denied':               'document_denied',
          'released':             'document_released',
          'forwarded':            'document_forwarded',
        }
        const mappedAction = actionMap[actionTaken]
        if (mappedAction) {
          await sendAllNotifications({
            documentId:        selectedDoc.id,
            documentName:      selectedDoc.title,
            documentType:      selectedDoc.document_type ?? '',
            action:            mappedAction,
            clientId:          selectedDoc.submitted_by,
            sendingOfficeId:   authUser.id,
            receivingOfficeId: corrOffice,
            remarks:           remarks.trim(),
          })
        }
      }

      await fetchDocuments()
      setShowConfirmModal(false)
      setShowSuccessModal(true)
    } catch (err) {
      console.error(err)
      setSubmitError('Something went wrong. Please try again.')
      setShowConfirmModal(false)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleSuccessOk = () => {
    setShowSuccessModal(false)
    setSelectedDoc(null)
  }

  const deptOptions   = departments.map(d => ({ label: d.name, value: d.name }))
  const officeOptions = departments.map(d => ({ label: d.name, value: d.id  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1a2e4a]">Document Progress</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Total: <span className="text-gray-700 font-medium">{filteredDocs.length}</span> documents
            </p>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Document..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 w-56"
            />
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6">

        {/* Filters — Department + Status only */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-1 text-gray-600">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          <CustomSelect
            options={deptOptions}
            value={selectedDept}
            onChange={(val) => { setSelectedDept(val); setCurrentPage(1) }}
            placeholder="Department"
            minWidth="min-w-[180px]"
          />
          <CustomSelect
            options={statusOptions}
            value={selectedStatus}
            onChange={(val) => { setSelectedStatus(val); setCurrentPage(1) }}
            placeholder="Status"
            minWidth="min-w-[140px]"
          />
          {(selectedDept || selectedStatus || searchQuery) && (
            <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline cursor-pointer">
              Clear filters
            </button>
          )}
        </div>

        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            {fetchError}
          </div>
        )}

        {/* Table — no Module column */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-semibold w-[25%]">Document Name</th>
                <th className="text-left px-4 py-3 font-semibold w-[30%]">Document Type</th>
                <th className="text-left px-4 py-3 font-semibold w-[25%]">Department</th>
                <th className="text-left px-4 py-3 font-semibold w-[13%]">Date</th>
                <th className="text-center px-4 py-3 font-semibold w-[25%]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fetchLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedDocs.length > 0 ? (
                paginatedDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3.5 text-gray-800 font-medium truncate">{doc.title}</td>
                    <td className="px-4 py-3.5 text-gray-500 truncate">
                      {doc.document_type
                        ? `${doc.document_type}${doc.document_type_detail ? ` — ${doc.document_type_detail}` : ''}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 truncate">{doc.departments?.name ?? '—'}</td>
                    <td className="px-4 py-3.5 text-gray-500 truncate">{formatDate(doc.created_at)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusBadgeColor(doc.status)}`}>
                        {formatStatus(doc.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">
                    No documents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!fetchLoading && filteredDocs.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredDocs.length)} of {filteredDocs.length} documents
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40"
              >
                <ChevronLeft size={14} className="text-gray-500" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition cursor-pointer
                    ${currentPage === page ? 'bg-[#1a2e4a] text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40"
              >
                <ChevronRight size={14} className="text-gray-500" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Document Detail Modal ── */}
      {selectedDoc && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-800">{selectedDoc.title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedDoc.document_type}
                  {selectedDoc.document_type_detail ? ` — ${selectedDoc.document_type_detail}` : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Left */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                    <div className="max-h-36 overflow-y-auto">
                      {selectedDoc.description
                        ? <p className="text-xs text-gray-700 leading-relaxed">{selectedDoc.description}</p>
                        : <p className="text-xs text-gray-400 italic">No description provided.</p>
                      }
                    </div>
                  </div>

                  {selectedDoc.file_url && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Attached File</p>
                      <button
                        onClick={handleViewFile}
                        disabled={urlLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-200 transition disabled:opacity-60 cursor-pointer"
                      >
                        <Eye size={13} className="text-gray-500" />
                        <span>{urlLoading ? 'Opening...' : (selectedDoc.file_name ?? 'View File')}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Right */}
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Department</span>
                      <span className="text-xs font-medium text-gray-800">{selectedDoc.departments?.name ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Submitted By</span>
                      <span className="text-xs font-medium text-gray-800">{selectedDoc.profiles?.full_name ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Current Office</span>
                      <span className="text-xs font-medium text-gray-800">{selectedDoc.current_office?.name ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Date Submitted</span>
                      <span className="text-xs font-medium text-gray-800">{formatDate(selectedDoc.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Last Updated</span>
                      <span className="text-xs font-medium text-gray-800">{formatDate(selectedDoc.updated_at)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Status</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(selectedDoc.status)}`}>
                        {formatStatus(selectedDoc.status)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Action Taken <span className="text-red-500">*</span></p>
                    <CustomSelect
                      options={actionOptions}
                      value={actionTaken}
                      onChange={setActionTaken}
                      placeholder="Select action..."
                      minWidth="w-full"
                      error={!!submitError && !actionTaken}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Corresponding Office <span className="text-red-500">*</span></p>
                    <CustomSelect
                      options={officeOptions}
                      value={corrOffice}
                      onChange={setCorrOffice}
                      placeholder="Select office..."
                      minWidth="w-full"
                      error={!!submitError && !corrOffice}
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100 my-4" />

              <div className="mb-4">
                <p className="text-xs font-medium text-gray-700 mb-1">Remarks <span className="text-red-500">*</span></p>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Write your remarks here..."
                  rows={2}
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none transition
                    ${submitError && !remarks.trim() ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`}
                />
              </div>

              {submitError && <p className="text-xs text-red-500 mb-3">{submitError}</p>}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setActionTaken(''); setCorrOffice(''); setRemarks(''); setSubmitError('') }}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={handleSubmitClick}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>

          {/* Confirm Modal */}
          {showConfirmModal && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] px-4"
              onClick={() => setShowConfirmModal(false)}
            >
              <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-sm border border-gray-100 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-base font-semibold text-gray-800 mb-2">Confirm Action</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to update this document status to{' '}
                  <strong className="text-gray-800">{formatStatus(actionTaken)}</strong>?
                </p>
                {submitError && <p className="text-xs text-red-500 mb-3">{submitError}</p>}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSubmit}
                    disabled={submitLoading}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-60"
                  >
                    {submitLoading ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Modal */}
          {showSuccessModal && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70] px-4"
              onClick={handleSuccessOk}
            >
              <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-2">Document Updated!</p>
                <p className="text-xs text-gray-400 mb-5">
                  Status changed to <strong>{formatStatus(actionTaken)}</strong> and the submitter has been notified.
                </p>
                <button
                  onClick={handleSuccessOk}
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition cursor-pointer"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}