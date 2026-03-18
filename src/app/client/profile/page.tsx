// app/client/profile/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Bell, User, Pencil, ChevronDown, Mail, Phone, Briefcase } from 'lucide-react'

// Custom dropdown component – with higher z-index and no clipping
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
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        // Scroll height reduced from max-h-32 to max-h-20 (80px) – adjust as needed
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-20 overflow-y-auto">
          {normalizedOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full text-left px-3 py-2 text-sm transition hover:bg-blue-50 cursor-pointer ${
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

// Department options
const departmentOptions = [
  'Accounting Office',
  'Supply Office',
  'Associate Dean Office',
  'Dean\'s Office',
  'BAC',
  'HR',
  'IT Department',
  'Training',
]

export default function ProfilePage() {
  const initialUser = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jdl2025-44556-58569@gmail.com',
    department: 'Accounting Office',
    phone: '09101053321',
  }

  const [user, setUser] = useState(initialUser)
  const [editForm, setEditForm] = useState(initialUser)
  const [isEditing, setIsEditing] = useState(false)
  const [search, setSearch] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleEdit = () => {
    setEditForm(user)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSaveClick = () => {
    setShowConfirmModal(true)
  }

  const handleConfirmSave = () => {
    setUser(editForm)
    setIsEditing(false)
    setShowConfirmModal(false)
    setShowSuccessModal(true)
  }

  const handleCancelConfirm = () => {
    setShowConfirmModal(false)
  }

  const handleSuccessOk = () => {
    setShowSuccessModal(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  const handleDepartmentChange = (val: string) => {
    setEditForm({ ...editForm, department: val })
  }

  const fullName = `${user.firstName} ${user.lastName}`

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-[#1a2e4a]">Profile</h1>
          <p className="text-sm text-gray-400">Manage your personal information</p>
        </div>
        <div className="flex items-center gap-3">
          
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-30 py-10">
        <div className="max-w-9xl mx-auto">
          {/* Profile Card – overflow-visible allows dropdown to extend outside */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
            {/* Avatar and title section */}
            <div className="p-6 pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar – adjust w-20 h-20 and User size={48} */}
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <User size={39} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{fullName}</h2>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <Briefcase size={14} />
                      {user.department}
                    </p>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 hover:underline transition cursor-pointer"
                  >
                    <Pencil size={14} />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Information Cards */}
            <div className="p-8 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Info Card */}
                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/30">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Personal Information</h3>
                  <div className="space-y-3">
                    {isEditing ? (
                      // Edit mode fields
                      <>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">First Name</label>
                          <input
                            type="text"
                            name="firstName"
                            value={editForm.firstName}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Last Name</label>
                          <input
                            type="text"
                            name="lastName"
                            value={editForm.lastName}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <User size={16} className="text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Full Name</p>
                            <p className="text-sm font-medium text-gray-800">{fullName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Briefcase size={16} className="text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Department</p>
                            <p className="text-sm font-medium text-gray-800">{user.department}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Contact Info Card */}
                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/30">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    {isEditing ? (
                      <>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={editForm.email}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Phone</label>
                          <input
                            type="tel"
                            name="phone"
                            value={editForm.phone}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <Mail size={16} className="text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="text-sm font-medium text-gray-800 break-all">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone size={16} className="text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="text-sm font-medium text-gray-800">{user.phone}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Department Edit (if editing) – separate card to avoid clipping */}
              {isEditing && (
                <div className="mt-2 border border-gray-100 rounded-xl p-4 bg-gray-50/30 overflow-visible">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Department</h3>
                  <CustomSelect
                    options={departmentOptions}
                    value={editForm.department}
                    onChange={handleDepartmentChange}
                    placeholder="Select department"
                    minWidth="w-full md:w-95"
                  />
                </div>
              )}

              {/* Edit mode buttons */}
              {isEditing && (
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveClick}
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={handleCancelConfirm}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-800 mb-2">Confirm Changes</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to save these changes?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelConfirm}
                className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={handleSuccessOk}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-gray-800 mb-4">Profile updated successfully.</p>
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
  )
}