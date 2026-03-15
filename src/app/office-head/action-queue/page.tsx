'use client'

import { useState, useRef, useEffect } from 'react'
import { Filter, Search, Bell, ChevronLeft, ChevronRight, ChevronDown, X, Eye } from 'lucide-react'

// Custom dropdown component (unchanged)
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

// Mock data – only "Received" and "Pending Review" statuses
const documents = [
  { id: 1, name: 'Request Stock Items', type: 'Requisition and Issue Slip (RIS)', department: 'Supply Office', dateReceived: '03/25/2025', status: 'Received', description: '...', submittedBy: 'John Doe', lastUpdate: '03/26/2025', imageUrl: '/sample.jpg' },
  { id: 2, name: 'Scholarship Grant Certificate', type: 'Financial Document', department: 'Supply Office', dateReceived: '03/25/2025', status: 'Pending Review', description: 'Sample description', submittedBy: 'Jane Smith', lastUpdate: '03/26/2025' },
  { id: 3, name: 'Scholarship Award Certificate', type: 'Financial Document', department: 'BAC', dateReceived: '03/25/2025', status: 'Received', description: 'Sample description', submittedBy: 'Alice Brown', lastUpdate: '03/26/2025' },
  { id: 4, name: 'Scholarship Grant Certificate', type: 'Financial Document', department: 'Associate Dean', dateReceived: '03/25/2025', status: 'Pending Review', description: 'Sample description', submittedBy: 'Bob Johnson', lastUpdate: '03/26/2025' },
  { id: 5, name: 'Scholarship Grant Certificate', type: 'Historical Document', department: 'Associate Dean', dateReceived: '03/25/2025', status: 'Received', description: 'Sample description', submittedBy: 'Charlie Lee', lastUpdate: '03/26/2025' },
  { id: 6, name: 'Scholarships Grant Certificate', type: 'Historical Document', department: 'Associate Dean', dateReceived: '03/25/2025', status: 'Pending Review', description: 'Sample description', submittedBy: 'Diana Prince', lastUpdate: '03/26/2025' },
  { id: 7, name: 'Scholarships Grant Certificate', type: 'Historical Document', department: 'Associate Dean', dateReceived: '03/25/2025', status: 'Received', description: 'Sample description', submittedBy: 'Ethan Hunt', lastUpdate: '03/26/2025' },
  { id: 8, name: 'Scholarships Grant Certificate', type: 'Historical Document', department: 'Associate Dean', dateReceived: '03/25/2025', status: 'Pending Review', description: 'Sample description', submittedBy: 'Fiona Glen', lastUpdate: '03/26/2025' },
  { id: 9, name: 'Budget Report', type: 'Financial Document', department: 'Accounting', dateReceived: '03/26/2025', status: 'Received', description: 'Sample description', submittedBy: 'George Costanza', lastUpdate: '03/27/2025' },
  { id: 10, name: 'Procurement Request', type: 'Requisition', department: 'Supply Office', dateReceived: '03/26/2025', status: 'Pending Review', description: 'Sample description', submittedBy: 'Hank Hill', lastUpdate: '03/27/2025' },
]

// Generate remaining documents to reach 20 – only Received / Pending Review
for (let i = 11; i <= 20; i++) {
  documents.push({
    id: i,
    name: `Document ${i}`,
    type: i % 2 === 0 ? 'Financial Document' : 'Historical Document',
    department: i % 3 === 0 ? 'Supply Office' : 'Accounting Office',
    dateReceived: '03/25/2025',
    status: i % 2 === 0 ? 'Received' : 'Pending Review',
    description: 'Sample description',
    submittedBy: `User ${i}`,
    lastUpdate: '03/26/2025',
  })
}

// Unique values for dropdowns
const documentTypes = [...new Set(documents.map(d => d.type))]
const departments = [...new Set(documents.map(d => d.department))]

// Status dropdown options – only "Received" and "Pending Review"
const statusOptions = [
  { label: 'Received', value: 'Received' },
  { label: 'Pending Review', value: 'Pending Review' },
]

// Options for Action Taken dropdown – now only the two relevant statuses
const actionOptions = ['Received', 'Pending Review']

// Shorter list for Corresponding Office dropdown
const correspondingOfficeOptions = ['BAC', 'Associate Dean', 'Accounting', 'HR', 'Board']

export default function ActionQueuePage() {
  // Filter states
  const [selectedType, setSelectedType] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Modal states
  const [selectedDoc, setSelectedDoc] = useState<typeof documents[0] | null>(null)
  const [actionTaken, setActionTaken] = useState('')
  const [corrOffice, setCorrOffice] = useState('')
  const [remarks, setRemarks] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Reset modal fields when a new document is opened – pre‑select actionTaken with document's status,
  // and pre‑select Corresponding Office to first option (e.g., "BAC") for demonstration.
  useEffect(() => {
    if (selectedDoc) {
      setActionTaken(selectedDoc.status) // This will be either "Received" or "Pending Review"
      setCorrOffice(correspondingOfficeOptions[0]) // Preselect first option (change as needed)
      setRemarks('')
      setSubmitError('')
      setShowConfirmModal(false)
      setShowSuccessModal(false)
    }
  }, [selectedDoc])

  // Filtering logic
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !selectedType || doc.type === selectedType
    const matchesDept = !selectedDept || doc.department === selectedDept
    const matchesStatus = !selectedStatus || doc.status === selectedStatus
    return matchesSearch && matchesType && matchesDept && matchesStatus
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedDocs = filteredDocs.slice(startIndex, startIndex + itemsPerPage)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)))
  }

  const clearFilters = () => {
    setSelectedType('')
    setSelectedDept('')
    setSelectedStatus('')
    setSearchQuery('')
    setCurrentPage(1)
  }

  const isFilterActive = selectedType || selectedDept || selectedStatus || searchQuery

  // Helper to get badge color based on status – matches dashboard
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Received':
        return 'bg-blue-50 text-blue-600 border-blue-200'
      case 'Pending Review':
        return 'bg-orange-50 text-orange-600 border-orange-200'
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  // Modal handlers
  const handleClear = () => {
    if (selectedDoc) {
      setActionTaken(selectedDoc.status) // reset to original status
      setCorrOffice(correspondingOfficeOptions[0]) // reset to first option
      setRemarks('')
      setSubmitError('')
    }
  }

  const handleSubmitClick = () => {
    if (!actionTaken) {
      setSubmitError('Please select an action.')
      return
    }
    if (!corrOffice) {
      setSubmitError('Please select a corresponding office.')
      return
    }
    if (!remarks.trim()) {
      setSubmitError('Please write some remarks.')
      return
    }
    setShowConfirmModal(true)
  }

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false)
    setShowSuccessModal(true)
  }

  const handleCancelConfirm = () => {
    setShowConfirmModal(false)
  }

  const handleSuccessOk = () => {
    setShowSuccessModal(false)
    setSelectedDoc(null)
  }

  // Mock department name
  const departmentName = 'Supply Office'

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">
      {/* HEADER – matches dashboard */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Action Queue</h1>
          <p className="text-sm text-gray-400">{departmentName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Document..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 w-56 transition-all"
            />
          </div>
          <button className="relative p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-all cursor-pointer">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Total */}
        <div className="mb-4">
          <span className="text-xs text-gray-400 font-medium">Total:</span>
          <span className="text-sm text-gray-700 ml-1">{documents.length}</span>
        </div>

        {/* FILTER ROW */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-1 text-gray-600">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter:</span>
          </div>

          <CustomSelect
            options={documentTypes}
            value={selectedType}
            onChange={(val) => {
              setSelectedType(val)
              setCurrentPage(1)
            }}
            placeholder="Document Type"
            minWidth="min-w-[150px]"
          />

          <CustomSelect
            options={departments}
            value={selectedDept}
            onChange={(val) => {
              setSelectedDept(val)
              setCurrentPage(1)
            }}
            placeholder="Submitting Department"
            minWidth="min-w-[160px]"
          />

          <CustomSelect
            options={statusOptions}
            value={selectedStatus}
            onChange={(val) => {
              setSelectedStatus(val)
              setCurrentPage(1)
            }}
            placeholder="Status"
            minWidth="min-w-[120px]"
          />

          {isFilterActive && (
            <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline ml-1 cursor-pointer">
              Clear
            </button>
          )}
        </div>

        {/* TABLE – with uniform status badges, only Received & Pending Review */}
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
                {paginatedDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3.5 text-gray-700 font-medium">{doc.name}</td>
                    <td className="px-6 py-3.5 text-gray-500">{doc.type}</td>
                    <td className="px-6 py-3.5 text-gray-500">{doc.department}</td>
                    <td className="px-6 py-3.5 text-gray-500">{doc.dateReceived}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center justify-center w-24 px-2.5 py-1 rounded-full text-[10px] font-medium border ${getStatusBadgeColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {paginatedDocs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                      No documents match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION – matches dashboard pagination style */}
        {filteredDocs.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 gap-4 bg-gray-50/30">
            <p className="text-xs font-medium text-gray-500">
              Showing <span className="font-regular">{startIndex + 1}</span> to <span className="font-regular">{Math.min(startIndex + itemsPerPage, filteredDocs.length)}</span> of <span className="font-regular">{filteredDocs.length}</span> documents
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={16} className="text-gray-600" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
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
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL – Document Details */}
      {selectedDoc && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={() => setSelectedDoc(null)}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between px-4 pt-4 pb-1 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-800">{selectedDoc.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{selectedDoc.type}</p>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="p-1 rounded-lg hover:bg-gray-100 transition text-gray-400">
                <X size={16} />
              </button>
            </div>
            <div className="px-4 pt-2 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* left column */}
                <div className="space-y-2">
                  <div className="max-h-40 overflow-y-auto min-h-[250px]">
                    <p className="text-xs text-gray-700 leading-relaxed">{selectedDoc.description}</p>
                  </div>
                  {selectedDoc.imageUrl && (
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-200 transition" onClick={() => alert('Preview image')}>
                      <Eye size={16} className="text-gray-500" />
                      <span>Preview Image</span>
                    </button>
                  )}
                </div>
                {/* right column */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div><span className="text-xs font-medium text-gray-600">Submitting Department:</span> <span className="text-xs text-gray-800">{selectedDoc.department}</span></div>
                    <div><span className="text-xs font-medium text-gray-600">Submitted By:</span> <span className="text-xs text-gray-800">{selectedDoc.submittedBy}</span></div>
                    <div><span className="text-xs font-medium text-gray-600">Date Received:</span> <span className="text-xs text-gray-800">{selectedDoc.dateReceived}</span></div>
                    <div><span className="text-xs font-medium text-gray-600">Last Update:</span> <span className="text-xs text-gray-800">{selectedDoc.lastUpdate}</span></div>
                  </div>

                  {/* Action Taken dropdown – pre‑selected with document status */}
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Action Taken</p>
                    <CustomSelect
                      options={actionOptions}
                      value={actionTaken}
                      onChange={setActionTaken}
                      placeholder="Select action"
                      minWidth="w-full"
                      error={submitError && !actionTaken || undefined}
                    />
                  </div>

                  {/* Corresponding Office dropdown – now preselected to first option (e.g., "BAC") */}
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Corresponding Office</p>
                    <CustomSelect
                      options={correspondingOfficeOptions}
                      value={corrOffice}
                      onChange={setCorrOffice}
                      placeholder="Select office"
                      minWidth="w-full"
                      error={submitError && !corrOffice || undefined}
                    />
                  </div>
                </div>
              </div>
              <hr className="border-gray-100 my-3" />
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Remarks</p>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Please write some remarks...."
                  rows={2}
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none ${
                    submitError && !remarks.trim() ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
              </div>
              {submitError && <p className="text-xs text-red-500 mb-2">{submitError}</p>}
              <div className="flex justify-end gap-2">
                <button onClick={handleClear} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">Clear</button>
                <button onClick={handleSubmitClick} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition">Submit</button>
              </div>
            </div>
          </div>

          {/* Confirm modal */}
          {showConfirmModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] px-4" onClick={handleCancelConfirm}>
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border border-gray-100 p-5" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-base font-semibold text-gray-800 mb-2">Confirm Submission</h3>
                <p className="text-sm text-gray-600 mb-4">Are you sure you want to submit these remarks and actions?</p>
                <div className="flex justify-end gap-2">
                  <button onClick={handleCancelConfirm} className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                  <button onClick={handleConfirmSubmit} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition">Confirm</button>
                </div>
              </div>
            </div>
          )}

          {/* Success modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70] px-4" onClick={handleSuccessOk}>
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
                <p className="text-sm text-gray-800 mb-4">Document has been submitted successfully.</p>
                <button onClick={handleSuccessOk} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition">OK</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}