'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Filter, Search, ChevronLeft, ChevronRight, ChevronDown, X, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getStatusBadgeColor, formatStatus } from '@/lib/utils/status'
import { sendAllNotifications } from '@/lib/notifications/send-all-notifications'

// ── Types ─────────────────────────────────────────────────────────────────
interface Document {
  id: string
  title: string
  document_type: string | null
  document_type_detail: string | null
  status: string
  description: string | null
  file_url: string | null
  file_name: string | null
  remarks: string | null
  created_at: string
  updated_at: string
  submitted_by: string | null
  current_office_id: string | null
  departments: { name: string } | null
  profiles: { full_name: string } | null
}

// ── Custom Select ─────────────────────────────────────────────────────────
function CustomSelect({ options, value, onChange, placeholder, minWidth, error = false, disabled = false }: {
  options: string[] | { label: string; value: string }[]
  value: string
  onChange: (val: string) => void
  placeholder: string
  minWidth: string
  error?: boolean
  disabled?: boolean
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
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2 border rounded-lg text-sm text-gray-600 transition cursor-pointer
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50 bg-white'}
          ${error ? 'border-red-500' : 'border-gray-200'}
          focus:outline-none focus:ring-2 focus:ring-blue-200`}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown size={14} className={`transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
          {normalizedOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => { onChange(option.value); setIsOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-blue-50 cursor-pointer ${value === option.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600'
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

// ── Helpers ───────────────────────────────────────────────────────────────
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric'
  })

// ── Options ───────────────────────────────────────────────────────────────
const actionOptions = [
  { label: 'Received', value: 'in_process' },
  { label: 'Approved', value: 'approved' },
  { label: 'Pending Approval', value: 'recommended_approval' },
  { label: 'Released', value: 'released' },
  { label: 'Denied', value: 'denied' },
]

const statusFilterOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Received', value: 'in_process' },
  { label: 'Approved', value: 'approved' },
  { label: 'Pending Approval', value: 'recommended_approval' },
  { label: 'Released', value: 'released' },
  { label: 'Denied', value: 'denied' },
]

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ActionQueuePage() {
  const supabase = createClient()

  // ── Data State ────────────────────────────────────────────────────────
  const [documents, setDocuments] = useState<Document[]>([])
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string; department_id: string | null; full_name: string } | null>(null)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  // ── Filter State ──────────────────────────────────────────────────────
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedDocType, setSelectedDocType] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // ── Pagination ────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // ── Modal State ───────────────────────────────────────────────────────
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [actionTaken, setActionTaken] = useState('')
  const [corrOffice, setCorrOffice] = useState('')
  const [remarks, setRemarks] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [urlLoading, setUrlLoading] = useState(false)

  // ── Fetch Current User ────────────────────────────────────────────────
  const fetchCurrentUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, department_id, full_name')
      .eq('id', authUser.id)
      .single()

    if (profile) setCurrentUser(profile)
  }, [])

  // ── Fetch Documents Routed to This Office ─────────────────────────────
  const fetchDocuments = useCallback(async () => {
    if (!currentUser?.department_id) {
      setFetchLoading(false)
      return
    }
    setFetchLoading(true)
    setFetchError('')

    const { data, error } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        document_type,
        document_type_detail,
        status,
        description,
        file_url,
        file_name,
        remarks,
        created_at,
        updated_at,
        submitted_by,
        current_office_id,
        departments!documents_department_id_fkey ( name ),
        profiles!documents_submitted_by_fkey ( full_name )
      `)
      .eq('module_type', 'process_routing')
      .eq('current_office_id', currentUser.department_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch error:', error.message)
      setFetchError('Failed to load documents. Please refresh.')
    } else {
      setDocuments((data as any) || [])
    }

    setFetchLoading(false)
  }, [currentUser])

  // ── Fetch All Departments ─────────────────────────────────────────────
  const fetchDepartments = useCallback(async () => {
    const { data } = await supabase
      .from('departments')
      .select('id, name')
      .order('name')
    if (data) setDepartments(data)
  }, [])

  useEffect(() => { fetchCurrentUser() }, [fetchCurrentUser])

  useEffect(() => {
    if (currentUser !== null) {
      fetchDocuments()
      fetchDepartments()
    }
  }, [currentUser, fetchDocuments, fetchDepartments])

  // Reset modal fields when document is selected
  useEffect(() => {
    if (selectedDoc) {
      setActionTaken(selectedDoc.status)
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

  // ── Filter Logic ──────────────────────────────────────────────────────
  const uniqueDocTypes = [...new Set(documents.map(d => d.document_type).filter(Boolean))] as string[]
  const uniqueDepts = [...new Set(documents.map(d => d.departments?.name).filter(Boolean))] as string[]

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !selectedDocType || doc.document_type === selectedDocType
    const matchesDept = !selectedDept || doc.departments?.name === selectedDept
    const matchesStatus = !selectedStatus || doc.status === selectedStatus
    return matchesSearch && matchesType && matchesDept && matchesStatus
  })

  // ── Pagination ────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedDocs = filteredDocs.slice(startIndex, startIndex + itemsPerPage)

  const goToPage = (page: number) =>
    setCurrentPage(Math.max(1, Math.min(totalPages, page)))

  const clearFilters = () => {
    setSelectedDocType('')
    setSelectedDept('')
    setSelectedStatus('')
    setSearchQuery('')
    setCurrentPage(1)
  }

  const isFilterActive = selectedDocType || selectedDept || selectedStatus || searchQuery

  // ── Modal Handlers ────────────────────────────────────────────────────
  const handleClear = () => {
    if (selectedDoc) {
      setActionTaken(selectedDoc.status)
      setCorrOffice(selectedDoc.current_office_id ?? '')
      setRemarks('')
      setSubmitError('')
    }
  }

  const handleSubmitClick = () => {
    if (!actionTaken) { setSubmitError('Please select an action.'); return }
    if (!corrOffice) { setSubmitError('Please select a corresponding office.'); return }
    if (!remarks.trim()) { setSubmitError('Please write some remarks.'); return }
    setSubmitError('')
    setShowConfirmModal(true)
  }

  // ── Confirm & Save to Supabase ────────────────────────────────────────
  const handleConfirmSubmit = async () => {
    if (!selectedDoc || !currentUser) return
    setSubmitLoading(true)

    try {
      // 1. Update document status
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          status: actionTaken,
          current_office_id: corrOffice,
          remarks: remarks.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedDoc.id)

      if (updateError) {
        console.error('Update error:', updateError.message)
        setSubmitError('Failed to update document. Please try again.')
        setShowConfirmModal(false)
        setSubmitLoading(false)
        return
      }

      // 2. Insert document log
      await supabase.from('document_logs').insert([{
        document_id: selectedDoc.id,
        performed_by: currentUser.id,
        action: 'Status updated',
        previous_status: selectedDoc.status,
        new_status: actionTaken,
        office_id: corrOffice,
        remarks: remarks.trim(),
      }])

      // 3. If forwarding to a different office — add routing record
      if (corrOffice && corrOffice !== currentUser.department_id) {
        await supabase.from('document_routing').insert([{
          document_id: selectedDoc.id,
          office_id: corrOffice,
          status: 'pending',
          received_at: new Date().toISOString(),
        }])
      }

      // 4. ✅ Send notifications to all parties (client + sender + receiver)
      await sendAllNotifications({
        documentId: selectedDoc.id,
        documentTitle: selectedDoc.title,
        documentType: selectedDoc.document_type || 'Document',
        action: actionTaken as any, // 'in_process', 'approved', 'denied', etc.
        clientId: selectedDoc.submitted_by!,
        sendingOfficeId: currentUser.id,
        receivingOfficeId: corrOffice !== currentUser.department_id ? corrOffice : undefined,
        remarks: remarks.trim(),
      })

      // 5. Refresh documents
      await fetchDocuments()
      setShowConfirmModal(false)
      setShowSuccessModal(true)

    } catch (err) {
      console.error('Unexpected error:', err)
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

  // ── Options ───────────────────────────────────────────────────────────
  const docTypeOptions = uniqueDocTypes.map(t => ({ label: t, value: t }))
  const deptOptions = uniqueDepts.map(d => ({ label: d, value: d }))
  const officeOptions = departments.map(d => ({ label: d.name, value: d.id }))

  // ── JSX ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Action Queue</h1>
          <span className="text-xs text-gray-400 font-medium">Total:</span>
          <span className="text-sm text-gray-700 ml-1">{filteredDocs.length}</span>
        </div>
        <div className="flex items-center gap-3">
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

        {/* No department warning */}
        {!fetchLoading && !currentUser?.department_id && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm px-4 py-3 rounded-xl mb-4">
            ⚠️ You don't have a department assigned yet. Please contact your Super Admin.
          </div>
        )}

        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            {fetchError}
          </div>
        )}

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-1 text-gray-600">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter:</span>
          </div>

          <CustomSelect
            options={docTypeOptions}
            value={selectedDocType}
            onChange={(val) => { setSelectedDocType(val); setCurrentPage(1) }}
            placeholder="Document Type"
            minWidth="min-w-[150px]"
          />

          <CustomSelect
            options={deptOptions}
            value={selectedDept}
            onChange={(val) => { setSelectedDept(val); setCurrentPage(1) }}
            placeholder="Submitting Department"
            minWidth="min-w-[160px]"
          />

          <CustomSelect
            options={statusFilterOptions}
            value={selectedStatus}
            onChange={(val) => { setSelectedStatus(val); setCurrentPage(1) }}
            placeholder="Status"
            minWidth="min-w-[120px]"
          />

          {isFilterActive && (
            <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline ml-1 cursor-pointer">
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-semibold">Document Name</th>
                  <th className="text-left px-6 py-3 font-semibold">Document Type</th>
                  <th className="text-left px-6 py-3 font-semibold">Submitting Department</th>
                  <th className="text-left px-6 py-3 font-semibold">Date Received</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fetchLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-6 py-3.5">
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
                      <td className="px-6 py-3.5 text-gray-700 font-medium">{doc.title}</td>
                      <td className="px-6 py-3.5 text-gray-500">
                        {doc.document_type
                          ? `${doc.document_type}${doc.document_type_detail ? ` — ${doc.document_type_detail}` : ''}`
                          : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-gray-500">{doc.departments?.name ?? '—'}</td>
                      <td className="px-6 py-3.5 text-gray-500">{formatDate(doc.created_at)}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusBadgeColor(doc.status)}`}>
                          {formatStatus(doc.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                      {currentUser?.department_id
                        ? 'No documents in your queue.'
                        : 'No department assigned yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {!fetchLoading && filteredDocs.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-2 gap-4">
            <p className="text-xs font-medium text-gray-500">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredDocs.length)} of {filteredDocs.length} documents
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft size={16} className="text-gray-600" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer
                    ${currentPage === page
                      ? 'bg-[#0f172a] text-white shadow-md'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Document Action Modal ── */}
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
            <div className="flex items-start justify-between px-4 pt-4 pb-1 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-800">{selectedDoc.title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedDoc.document_type}
                  {selectedDoc.document_type_detail ? ` — ${selectedDoc.document_type_detail}` : ''}
                </p>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="p-1 rounded-lg hover:bg-gray-100 transition text-gray-400">
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-4 pt-2 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Left — description + file */}
                <div className="space-y-2">
                  <div className="max-h-40 overflow-y-auto min-h-[200px]">
                    {selectedDoc.description
                      ? <p className="text-xs text-gray-700 leading-relaxed">{selectedDoc.description}</p>
                      : <p className="text-xs text-gray-400 italic">No description provided.</p>
                    }
                  </div>
                  {selectedDoc.file_url && (
                    <button
                      onClick={handleViewFile}
                      disabled={urlLoading}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-200 transition disabled:opacity-60 cursor-pointer"
                    >
                      <Eye size={14} className="text-gray-500" />
                      <span>{urlLoading ? 'Opening...' : (selectedDoc.file_name ?? 'View File')}</span>
                    </button>
                  )}
                </div>

                {/* Right — details + action fields */}
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Submitting Department</span>
                      <span className="text-xs font-medium text-gray-700">{selectedDoc.departments?.name ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Submitted By</span>
                      <span className="text-xs font-medium text-gray-700">{selectedDoc.profiles?.full_name ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Date Received</span>
                      <span className="text-xs font-medium text-gray-700">{formatDate(selectedDoc.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Last Update</span>
                      <span className="text-xs font-medium text-gray-700">{formatDate(selectedDoc.updated_at)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Current Status</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeColor(selectedDoc.status)}`}>
                        {formatStatus(selectedDoc.status)}
                      </span>
                    </div>
                  </div>

                  {/* Action Taken */}
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Action Taken</p>
                    <CustomSelect
                      options={actionOptions}
                      value={actionTaken}
                      onChange={setActionTaken}
                      placeholder="Select action"
                      minWidth="w-full"
                      error={!!submitError && !actionTaken}
                    />
                  </div>

                  {/* Corresponding Office */}
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Corresponding Office</p>
                    <CustomSelect
                      options={officeOptions}
                      value={corrOffice}
                      onChange={setCorrOffice}
                      placeholder="Select office"
                      minWidth="w-full"
                      error={!!submitError && !corrOffice}
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100 my-3" />

              {/* Remarks */}
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Remarks</p>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Please write some remarks..."
                  rows={2}
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none
                    ${submitError && !remarks.trim() ? 'border-red-500 bg-red-50/30' : 'border-gray-200'}`}
                />
              </div>

              {submitError && <p className="text-xs text-red-500 mb-2">{submitError}</p>}

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={handleSubmitClick}
                  disabled={submitLoading}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-60"
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
                className="bg-white rounded-xl shadow-2xl w-full max-w-sm border border-gray-100 p-5"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-base font-semibold text-gray-800 mb-2">Confirm Submission</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Update status to{' '}
                  <strong className="text-gray-800">{formatStatus(actionTaken)}</strong>?
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  The submitter will be notified of this change.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSubmit}
                    disabled={submitLoading}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-60"
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
                  Status changed to{' '}
                  <strong>{formatStatus(actionTaken)}</strong>.
                  The submitter has been notified.
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