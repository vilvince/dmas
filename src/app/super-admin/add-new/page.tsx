"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ChevronRight, Home, ChevronDown, FileText, X } from "lucide-react"
import Link from "next/link"
import { sendAllNotifications } from '@/lib/notifications/send-all-notifications'

import { addWorkingDays } from '@/lib/utils/workingDays'

// ── Custom Select Component ───────────────────────────────────────────────
function CustomSelect({
  options, value, onChange, placeholder, error = false, disabled = false
}: {
  options: { label: string; value: string }[]
  value: string
  onChange: (val: string) => void
  placeholder: string
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

  const selectedLabel = options.find(opt => opt.value === value)?.label || ''

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2 border rounded-lg text-sm transition-colors text-left
          ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-white cursor-pointer hover:bg-gray-50'}
          ${error && !disabled ? 'border-red-500 focus:ring-red-200 bg-red-50/30' : 'border-gray-300 focus:ring-blue-500'}
          focus:outline-none focus:ring-2`}
      >
        <span className={`truncate ${!selectedLabel ? 'text-gray-500' : 'text-gray-800'}`}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''} ${disabled ? 'text-gray-400' : 'text-gray-500'}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
          {options.length > 0 ? (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-blue-50 cursor-pointer
                  ${value === option.value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">No options available</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────
interface Department {
  id: string
  name: string
}

interface UserProfile {
  id: string
  full_name: string
  department_id: string | null
}

// ── Document Type Config ──────────────────────────────────────────────────
const DOCUMENT_TYPE_OPTIONS = [
  { label: "Communication Letters", value: "Communication Letters" },
  { label: "Proposal", value: "Proposal" },
  { label: "Vouchers", value: "Vouchers" },
  { label: "Others (Specify)", value: "others" },
]

const DETAIL_PLACEHOLDERS: Record<string, string> = {
  "Communication Letters": "e.g. Memorandum, Endorsement Letter...",
  "Proposal": "e.g. Budget Proposal, Project Proposal...",
  "Vouchers": "e.g. Disbursement Voucher, Journal Voucher...",
  "others": "Please specify the document type...",
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function AddNewPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<null | "new">(null)

  if (selected === "new") {
    return <NewDocumentForm onBack={() => setSelected(null)} />
  }

  return (
    <div className="flex-1 p-8">
      <nav className="flex items-center space-x-1 text-sm text-gray-600 mb-6">
        <Link href="/super-admin/dashboard" className="flex items-center hover:text-gray-900 transition-colors">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
        <span className="text-gray-900 font-medium">Add New</span>
      </nav>

      <div className="mt-16 flex flex-col items-center gap-6">
        <p className="text-sm text-gray-500">Please select action you want to do:</p>
        <div className="flex gap-8">
          <button
            onClick={() => setSelected("new")}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "4px 4px 4px rgba(0,0,0,0.5)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
            className="flex flex-col items-center justify-center w-36 h-36 rounded-xl bg-[#367588] text-white cursor-pointer transition-all"
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
            <span className="mt-2 text-sm font-medium">New</span>
          </button>

          <button
            onClick={() => router.push("/super-admin/add-new-archive")}
            className="flex flex-col items-center justify-center w-40 h-36 rounded-xl bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-400 transition cursor-pointer"
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5">
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
            <span className="px-4 mt-2 text-sm font-medium text-center">Archive Document</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── New Document Form ─────────────────────────────────────────────────────
function NewDocumentForm({ onBack }: { onBack: () => void }) {
  const supabase = useMemo(() => createClient(), [])

  const [departments, setDepartments] = useState<Department[]>([])
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [validationError, setValidationError] = useState("")
  const [invalidFields, setInvalidFields] = useState<string[]>([])

  const [formData, setFormData] = useState({
    documentName: "",
    documentType: "",
    documentTypeDetail: "",
    submittingDepartment: "",
    customDepartment: "",
    submittedById: "",
    customSubmittedBy: "",
    documentDescription: "",
    correspondingOffice: "",
  })

  // ── Fetch Departments ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name')
      if (!error && data) setDepartments(data)
      else console.error('Error fetching departments:', error?.message)
    }
    fetchDepartments()
  }, [supabase])

  // ── Fetch Users by Department ─────────────────────────────────────────
  const fetchUsersByDepartment = async (departmentId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, department_id')
      .eq('department_id', departmentId)
      .eq('is_active', true)
      .order('full_name')

    if (!error && data) setAvailableUsers(data)
    else { console.error('Error fetching users:', error?.message); setAvailableUsers([]) }
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  const clearFieldError = (fieldName: string) => {
    setInvalidFields(prev => prev.filter(f => f !== fieldName))
    if (validationError) setValidationError("")
  }

  const handleClear = () => {
    setFormData({
      documentName: "", documentType: "", documentTypeDetail: "",
      submittingDepartment: "", customDepartment: "",
      submittedById: "", customSubmittedBy: "",
      documentDescription: "", correspondingOffice: "",
    })
    setFile(null)
    setAvailableUsers([])
    setValidationError("")
    setInvalidFields([])
    setError("")
  }

  // ── Validation ────────────────────────────────────────────────────────
  const handleSave = () => {
    const newInvalidFields: string[] = []

    if (!formData.documentName.trim()) newInvalidFields.push("documentName")
    if (!formData.documentType) newInvalidFields.push("documentType")
    else if (!formData.documentTypeDetail.trim()) newInvalidFields.push("documentTypeDetail")
    if (!formData.documentDescription.trim()) newInvalidFields.push("documentDescription")
    if (!formData.correspondingOffice) newInvalidFields.push("correspondingOffice")

    if (formData.submittingDepartment === "others") {
      if (!formData.customDepartment.trim()) newInvalidFields.push("customDepartment")
      if (!formData.customSubmittedBy.trim()) newInvalidFields.push("customSubmittedBy")
    } else {
      if (!formData.submittingDepartment) newInvalidFields.push("submittingDepartment")
      if (!formData.submittedById) newInvalidFields.push("submittedById")
    }

    if (newInvalidFields.length > 0) {
      setInvalidFields(newInvalidFields)
      setValidationError("Please fill up all the required fields.")
      return
    }

    setInvalidFields([])
    setValidationError("")
    setError("")
    setShowConfirm(true)
  }

  // ── Submit to Supabase ────────────────────────────────────────────────
  const handleConfirmYes = async () => {
    setShowConfirm(false)
    setLoading(true)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setError("Not authenticated. Please log in again.")
        setLoading(false)
        return
      }

      let fileUrl = null
      let fileName = null
      let fileSize = null

      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          setError("File must be under 10MB.")
          setLoading(false)
          return
        }

        const filePath = `${authUser.id}/${Date.now()}_${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file)

        if (uploadError) {
          setError("File upload failed. Please try again.")
          setLoading(false)
          return
        }

        fileUrl = filePath
        fileName = file.name
        fileSize = file.size
      }

      const finalDocumentType = formData.documentType === "others" ? "Others" : formData.documentType
      const finalDocumentTypeDetail = formData.documentTypeDetail.trim()
      const finalDepartmentId = formData.submittingDepartment === "others" ? null : formData.submittingDepartment
      const finalSubmittedById = formData.submittingDepartment === "others" ? authUser.id : formData.submittedById

      // 💡 ARTA TIMER LOGIC ADDED HERE! ──────────────────────────────────
      // 1. Fetch SLA working days for this document type
      const { data: slaData, error: slaError } = await supabase
        .from('document_type_sla')
        .select('working_days')
        .eq('document_type', finalDocumentType)
        .maybeSingle() // use maybeSingle() so no error if row not found

      if (slaError) {
        console.error('[ARTA] SLA lookup failed:', slaError.message, '| document_type:', finalDocumentType)
      }

      const workingDays = slaData?.working_days ?? 7 // fallback to 7 days if not found in db
      console.log(`[ARTA] document_type="${finalDocumentType}", SLA working_days=${workingDays} (from DB: ${slaData?.working_days ?? 'not found, using fallback'})`)

      // 2. Calculate due date (skip weekends) using your custom utility
      const dueDate = addWorkingDays(new Date(), workingDays)
      const dueDateStr = dueDate.toISOString().split('T')[0] // formats as YYYY-MM-DD
      // ──────────────────────────────────────────────────────────────────

      // ── Step 1 & 2: Insert document and get ID immediately ─────────────
      const { data: insertData, error: insertError } = await supabase
        .from("documents")
        .insert([{
          title: formData.documentName,
          document_type: finalDocumentType,
          document_type_detail: finalDocumentTypeDetail,
          description: formData.documentDescription,
          module_type: 'process_routing',
          status: 'in_process',
          submitted_by: finalSubmittedById,
          department_id: finalDepartmentId,
          current_office_id: formData.correspondingOffice,
          initial_office_id: formData.correspondingOffice,
          is_archived: false,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          // 💡 ARTA INSERT FIELD ADDED HERE!
          due_date: dueDateStr, 
        }])
        .select("id")
        .single()

      if (insertError || !insertData) {
        console.error("Insert error:", insertError?.message)
        setError("Failed to save document. Please try again.")
        setLoading(false)
        return
      }

      // ── Step 3: Insert routing, log, and notification ──────────────────
      const { error: routingError } = await supabase.from('document_routing').insert([{
        document_id: insertData.id,
        office_id: formData.correspondingOffice,
        sequence_order: 1,
        status: 'pending',
        received_at: new Date().toISOString(),
      }])
      if (routingError) console.error('Routing insert failed:', routingError.message)

      const { error: logError } = await supabase.from('document_logs').insert([{
        document_id: insertData.id,
        performed_by: authUser.id,
        action: 'Document received',
        previous_status: null,
        new_status: 'in_process',
        office_id: formData.correspondingOffice,
        remarks: 'Document received and entered into the system.',
      }])
      if (logError) console.error('Log insert failed:', logError.message)

      // Send both in-app + Brevo email notification
      await sendAllNotifications({
        documentId: insertData.id,
        documentName: formData.documentName,
        documentType: finalDocumentType,
        action: 'document_submitted',
        clientId: finalSubmittedById,
        sendingOfficeId: authUser.id,
        receivingOfficeId: formData.correspondingOffice,
        remarks: '',
      })

      setShowSuccess(true)

    } catch (err) {
      console.error("Unexpected error:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // ── Select Options ────────────────────────────────────────────────────
  const departmentOptions = [
    ...departments.map(d => ({ label: d.name, value: d.id })),
    { label: "Others (Specify)", value: "others" },
  ]
  const userOptions = availableUsers.map(u => ({ label: u.full_name, value: u.id }))
  const officeOptions = departments.map(d => ({ label: d.name, value: d.id }))

  // ── JSX ───────────────────────────────────────────────────────────────
  return (
    <div className="overflow-y-auto flex-1 p-8">

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-96 relative">
            <button onClick={() => setShowConfirm(false)} className="absolute top-1 right-3 text-gray-400 hover:text-gray-600 text-3xl cursor-pointer">×</button>
            <p className="mt-5 text-gray-800 font-medium text-center mb-5">
              Are you sure you want to save this document for processing?
            </p>
            {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
            <div className="mt-8 flex justify-center gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 cursor-pointer">No</button>
              <button onClick={handleConfirmYes} disabled={loading} className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer disabled:opacity-60">
                {loading ? 'Saving...' : 'Yes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-80 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-gray-800 font-semibold mb-2">Document Saved!</p>
            <p className="text-gray-400 text-xs mb-6">The document has been submitted for processing.</p>
            <button onClick={() => { setShowSuccess(false); handleClear() }} className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer">Ok</button>
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-1 text-sm text-gray-600 mb-6">
        <Link href="/super-admin/dashboard" className="flex items-center hover:text-gray-900 transition-colors">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
        <button onClick={onBack} className="hover:text-gray-900 transition-colors cursor-pointer">Add New</button>
        <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
        <span className="text-gray-900 font-medium">New Document</span>
      </nav>

      {/* Form Card */}
      <div className="mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">

        {/* Document Name */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Document Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            placeholder="Enter the name of the document..."
            value={formData.documentName}
            onChange={(e) => { setFormData({ ...formData, documentName: e.target.value }); clearFieldError("documentName") }}
            className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 transition-colors
              ${invalidFields.includes("documentName") ? 'border-red-500 focus:ring-red-200 bg-red-50/30' : 'border-gray-300 focus:ring-blue-500'}`}
          />
          {invalidFields.includes("documentName") && <p className="text-red-500 text-xs mt-1">Document name is required.</p>}
        </div>

        {/* Document Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Document Type <span className="text-red-500">*</span></label>
          <CustomSelect
            options={DOCUMENT_TYPE_OPTIONS}
            value={formData.documentType}
            onChange={(val) => {
              setFormData(prev => ({ ...prev, documentType: val, documentTypeDetail: '' }))
              clearFieldError("documentType")
              clearFieldError("documentTypeDetail")
            }}
            placeholder="Select the type of the document..."
            error={invalidFields.includes("documentType")}
          />
          {invalidFields.includes("documentType") && <p className="text-red-500 text-xs mt-1">Please select a document type.</p>}
        </div>

        {/* Document Type Detail */}
        {formData.documentType && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specify{formData.documentType !== "others" ? ` ${formData.documentType}` : ""} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder={DETAIL_PLACEHOLDERS[formData.documentType]}
              value={formData.documentTypeDetail}
              onChange={(e) => { setFormData({ ...formData, documentTypeDetail: e.target.value }); clearFieldError("documentTypeDetail") }}
              className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 transition-colors
                ${invalidFields.includes("documentTypeDetail") ? 'border-red-500 focus:ring-red-200 bg-red-50/30' : 'border-blue-300 bg-blue-50/50 focus:ring-blue-500'}`}
            />
            {invalidFields.includes("documentTypeDetail") && <p className="text-red-500 text-xs mt-1">Please specify the document type.</p>}
          </div>
        )}

        {/* Submitting Department */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Submitting Department <span className="text-red-500">*</span></label>
          <div className="flex flex-col gap-2">
            <CustomSelect
              options={departmentOptions}
              value={formData.submittingDepartment}
              onChange={(val) => {
                setFormData(prev => ({ ...prev, submittingDepartment: val, customDepartment: "", submittedById: "", customSubmittedBy: "" }))
                clearFieldError("submittingDepartment")
                if (val && val !== "others") fetchUsersByDepartment(val)
                else setAvailableUsers([])
              }}
              placeholder="Select submitting department..."
              error={invalidFields.includes("submittingDepartment")}
            />
            {formData.submittingDepartment === "others" && (
              <input
                type="text"
                placeholder="Please type the department name..."
                value={formData.customDepartment}
                onChange={(e) => { setFormData({ ...formData, customDepartment: e.target.value }); clearFieldError("customDepartment") }}
                className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 transition-colors
                  ${invalidFields.includes("customDepartment") ? 'border-red-500 focus:ring-red-200 bg-red-50/30' : 'border-blue-300 bg-blue-50/50 focus:ring-blue-500'}`}
              />
            )}
          </div>
          {invalidFields.includes("submittingDepartment") && <p className="text-red-500 text-xs mt-1">Please select a department.</p>}
        </div>

        {/* Submitted By */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Submitted By <span className="text-red-500">*</span></label>
          {formData.submittingDepartment === "others" ? (
            <input
              type="text"
              placeholder="Enter the submitter's full name..."
              value={formData.customSubmittedBy}
              onChange={(e) => { setFormData({ ...formData, customSubmittedBy: e.target.value }); clearFieldError("customSubmittedBy") }}
              className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 transition-colors
                ${invalidFields.includes("customSubmittedBy") ? 'border-red-500 focus:ring-red-200 bg-red-50/30' : 'border-blue-300 bg-blue-50/50 focus:ring-blue-500'}`}
            />
          ) : (
            <CustomSelect
              options={userOptions}
              value={formData.submittedById}
              onChange={(val) => { setFormData({ ...formData, submittedById: val }); clearFieldError("submittedById") }}
              placeholder={
                !formData.submittingDepartment ? "Please select a department first"
                  : availableUsers.length === 0 ? "No users in this department"
                    : "Select a user..."
              }
              disabled={!formData.submittingDepartment || formData.submittingDepartment === "others"}
              error={invalidFields.includes("submittedById")}
            />
          )}
          {invalidFields.includes("submittedById") && <p className="text-red-500 text-xs mt-1">Please select a user.</p>}
          {invalidFields.includes("customSubmittedBy") && <p className="text-red-500 text-xs mt-1">Please enter the submitter's name.</p>}
        </div>

        {/* Corresponding Office */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Corresponding Office <span className="text-red-500">*</span></label>
          <CustomSelect
            options={officeOptions}
            value={formData.correspondingOffice}
            onChange={(val) => { setFormData({ ...formData, correspondingOffice: val }); clearFieldError("correspondingOffice") }}
            placeholder="Select the office to route this document to..."
            error={invalidFields.includes("correspondingOffice")}
          />
          {invalidFields.includes("correspondingOffice") && <p className="text-red-500 text-xs mt-1">Please select a corresponding office.</p>}
        </div>

        {/* Description */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
          <textarea
            rows={3}
            placeholder="Enter a short description or details about the document..."
            value={formData.documentDescription}
            onChange={(e) => { setFormData({ ...formData, documentDescription: e.target.value }); clearFieldError("documentDescription") }}
            className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 transition-colors resize-none
              ${invalidFields.includes("documentDescription") ? 'border-red-500 focus:ring-red-200 bg-red-50/30' : 'border-gray-300 focus:ring-blue-500'}`}
          />
          {invalidFields.includes("documentDescription") && <p className="text-red-500 text-xs mt-1">Description is required.</p>}
        </div>

        {/* File Upload */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-1">Attach File <span className="text-gray-400 font-normal">(optional)</span></label>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const d = e.dataTransfer.files[0]; if (d) setFile(d) }}
            onClick={() => document.getElementById("fileInput")?.click()}
            className={`border-2 border-dashed rounded-lg px-4 py-8 text-center cursor-pointer transition
              ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 bg-white"}`}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setFile(null) }} className="ml-2 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                <p className="font-medium text-gray-500">Drag & Drop Document here</p>
                <p className="text-xs mt-1">or click here to Browse</p>
                <p className="text-xs mt-1 text-gray-300">PDF, DOCX, JPG</p>
              </div>
            )}
          </div>
          <input id="fileInput" type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" className="hidden"
            onChange={(e) => { const s = e.target.files?.[0]; if (s) setFile(s) }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            {validationError && <p className="text-red-500 text-sm font-medium">{validationError}</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={handleClear} className="cursor-pointer px-6 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition">Clear</button>
            <button onClick={handleSave} disabled={loading} className="cursor-pointer px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-md transition disabled:opacity-60">
              Save Document
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}