"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"

export default function AddNewArchivePage() {
  return <ArchiveDocumentForm />
}

// ── Archive Document Form Component ────────────────────────────────────────
function ArchiveDocumentForm() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState("")
  
  // New state for form validation
  const [validationError, setValidationError] = useState("") 
  const [invalidFields, setInvalidFields] = useState<string[]>([])

  // For File Drops  
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  // Form data without submitting department and submitted by
  const [formData, setFormData] = useState({
    documentName: "",
    documentType: "",
    documentDescription: ""
  })

  // Helper to dynamically apply red border if a field is invalid
  const getInputClass = (fieldName: string) => {
    const baseClass = "w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 transition-colors cursor-pointer"
    if (invalidFields.includes(fieldName)) {
      return `${baseClass} border-red-500 focus:ring-red-200 bg-red-50/30`
    }
    return `${baseClass} border-gray-300 focus:ring-blue-500`
  }

  // Clear specific field error when user starts typing
  const clearFieldError = (fieldName: string) => {
    if (invalidFields.includes(fieldName)) {
      setInvalidFields(prev => prev.filter(f => f !== fieldName))
    }
    if (validationError) setValidationError("")
  }

  const handleClear = () => {
    setFormData({ 
      documentName: "", 
      documentType: "", 
      documentDescription: "" 
    })
    setFile(null)
    setValidationError("")
    setInvalidFields([])
  }

  const handleSave = () => {
    const newInvalidFields: string[] = []

    // Check which fields are empty
    if (!formData.documentName) newInvalidFields.push("documentName")
    if (!formData.documentType) newInvalidFields.push("documentType")
    if (!formData.documentDescription) newInvalidFields.push("documentDescription")

    if (newInvalidFields.length > 0) {
      setInvalidFields(newInvalidFields)
      setValidationError("Please fill up all the required fields.")
      return
    }

    // Clear errors if everything is valid
    setInvalidFields([])
    setValidationError("")
    setError("")
    setShowConfirm(true)
  }

  const handleConfirmYes = async () => {
    setShowConfirm(false)
    const supabase = createClient()

    const { error } = await supabase
      .from("documents")
      .insert([
        {
          title: formData.documentName,
          type: formData.documentType,
          description: formData.documentDescription,
          status: "archived",                            
          is_archived: true,                            
        }
      ])

    if (error) {
      console.error("Error saving:", error.message)
      setError("Failed to archive document. Please try again.")
      return
    }

    setShowSuccess(true)
  } 

  const handleSuccessOk = () => {
    setShowSuccess(false)
    handleClear()
  }

  return (
    <div className="overflow-y-auto flex-1 p-8">

      {/* ── Modals ── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-96 relative">
            <button
              onClick={() => setShowConfirm(false)}
              className="absolute top-1 right-3 text-gray-400 hover:text-gray-600 text-3xl cursor-pointer"
            >
              ×
            </button>
            <p className="mt-5 text-gray-800 font-medium text-center mb-5">
              Are you sure you want to archive this document?
            </p>
            {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
            <div className="mt-8 flex justify-center gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="ml-auto px-5 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 cursor-pointer">
                No
              </button>
              <button
                onClick={handleConfirmYes}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer">
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    
      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-80 text-center">
            <p className="text-gray-800 font-medium mb-8">
              Document archived successfully.
            </p>
            <button
              onClick={handleSuccessOk}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer"
            >
              Ok
            </button>
          </div>
        </div>
      )}

      {/* ── Breadcrumbs ── */}
      <nav className="flex items-center space-x-1 text-sm text-gray-600 mb-6">
        <Link
          href="/super-admin/dashboard"
          className="flex items-center hover:text-gray-900 transition-colors"
        >
          <Home className="h-4 w-4" />
        </Link>

        <div className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
          <Link
            href="/super-admin/add-new"
            className="hover:text-gray-900 transition-colors"
          >
            Add New
          </Link>
        </div>

        <div className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
          <span className="text-gray-900 font-medium">Archive Document</span>
        </div>
      </nav>

      <div className="mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter the name of the document..."
            value={formData.documentName}
            onChange={(e) => {
              setFormData({ ...formData, documentName: e.target.value })
              clearFieldError("documentName")
            }}
            className={getInputClass("documentName")}
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.documentType}
            onChange={(e) => {
              setFormData({ ...formData, documentType: e.target.value })
              clearFieldError("documentType")
            }}
            className={getInputClass("documentType")}
          >
            <option value="">Select the type of the document...</option> 
            <option value="Financial Document">Financial Document</option>
            <option value="Legal Document">Legal Document</option>
            <option value="HR Document">HR Document</option>
            <option value="Supply Document">Supply Document</option>
            <option value="Academic Document">Academic Document</option>
          </select>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter a short description or details about the document..."
            value={formData.documentDescription}
            onChange={(e) => {
              setFormData({ ...formData, documentDescription: e.target.value })
              clearFieldError("documentDescription")
            }}
            className={getInputClass("documentDescription")}
          />
        </div>

        {/* ── File Drag & Drop ── */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attach File (optional)
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              const dropped = e.dataTransfer.files[0]
              if (dropped) setFile(dropped)
            }}
            onClick={() => document.getElementById("fileInput")?.click()}
            className={`border-2 border-dashed rounded-lg px-4 py-8 text-center cursor-pointer transition
            ${isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 bg-white"
            }`}
          >
            {file ? (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <span>📄</span>
                <span className="font-semibold">{file.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="ml-2 text-red-400 hover:text-red-600 text-xs cursor-pointer bg-red-50 px-2 py-1 rounded"
                >
                  ✕ Remove
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
          <input
            id="fileInput"
            type="file"
            accept=".pdf,.docx,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0]
              if (selected) setFile(selected)
            }}
          />
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            {/* The error message appears here on the left side */}
            {validationError && (
              <p className="text-red-500 text-sm font-medium animate-in fade-in slide-in-from-left-2">
                {validationError}
              </p>
            )}
          </div>
          
          <div className="flex gap-3">
            <button onClick={handleClear}
              className="cursor-pointer px-6 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
            >
              Clear
            </button>
            <button
              onClick={handleSave}
              className="cursor-pointer px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-md transition"
            >
              Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}