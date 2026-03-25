// app/client/profile/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Bell, User, Pencil, ChevronDown, Mail, Phone, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

export default function ProfilePage() {
  const supabase = createClient()

  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
  })
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [search, setSearch] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Fetch departments (still needed to display department name)
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name')
      if (!error && data) setDepartments(data)
    }
    fetchDepartments()
  }, [])

  // Fetch current user's profile
  const fetchProfile = async () => {
    setLoading(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, email, phone, department_id')
      .eq('id', authUser.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to load profile.')
      setLoading(false)
      return
    }

    // Split full_name into first and last (simple split on first space)
    const nameParts = profile.full_name.split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    setUser({
      id: authUser.id,
      firstName,
      lastName,
      email: profile.email,
      phone: profile.phone || '',
      departmentId: profile.department_id || '',
    })

    setEditForm({
      firstName,
      lastName,
      email: profile.email,
      phone: profile.phone || '',
      departmentId: profile.department_id || '',
    })
    setLoading(false)
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  // Handlers
  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset editForm to current user data
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      departmentId: user.departmentId,
    })
  }

  const handleSaveClick = () => {
    setShowConfirmModal(true)
  }

  const handleConfirmSave = async () => {
    setShowConfirmModal(false)
    setLoading(true)

    const fullName = `${editForm.firstName} ${editForm.lastName}`.trim()
    const updates = {
      full_name: fullName,
      email: editForm.email,
      phone: editForm.phone,
      // department_id is NOT updated here – only super-admin can change it
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      console.error('Update error:', error)
      setError('Failed to update profile.')
      setLoading(false)
      return
    }

    // Refresh local user state
    setUser({
      ...user,
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      email: editForm.email,
      phone: editForm.phone,
      // department stays the same
    })
    setIsEditing(false)
    setShowSuccessModal(true)
    setLoading(false)
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

  const fullName = user ? `${user.firstName} ${user.lastName}` : ''
  const departmentName = departments.find(d => d.id === user?.departmentId)?.name || (user?.departmentId ? 'Unknown' : 'Not assigned')

  // While loading, show a simple spinner (no text)
  if (loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-[#1a2e4a]">Profile</h1>
          <p className="text-sm text-gray-400">Manage your personal information</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 w-56"
            />
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-30 py-10">
        {error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : (
          <div className="max-w-9xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
              {/* Avatar and title section */}
              <div className="p-6 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <User size={39} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{fullName}</h2>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <Briefcase size={14} />
                        {departmentName}
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
                          {/* Department shown as read‑only text */}
                          
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
                              <p className="text-sm font-medium text-gray-800">{user.phone || 'Not provided'}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

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
        )}
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