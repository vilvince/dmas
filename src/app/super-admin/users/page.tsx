'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Trash2, Edit, X, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Custom Dropdown Component ──
function CustomSelect({ options, value, onChange, placeholder, minWidth, error = false }: {
  options: string[] | { label: string; value: string }[]
  value: string
  onChange: (val: string) => void
  placeholder: string
  minWidth?: string
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
    <div className={`relative ${minWidth || 'w-full'}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition cursor-pointer
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

// ── Types ─────────────────────────────────────────────────────────────────
interface User {
  id: string
  full_name: string
  email: string
  role: string
  phone: string | null
  department_id: string | null
  department_name: string | null
  is_active: boolean
}

interface Department {
  id: string
  name: string
}

// ── Delete reasons ──
const deleteReasons = [
  'Account no longer needed',
  'Duplicate account',
  'User requested deletion',
  'Policy violation',
  'Unauthorized account',
  'Others',
]

const roleOptions = ['super_admin', 'office_head', 'client']

export default function UserManagementPage() {
  const supabase = createClient()

  // ── Data states ──
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ── Filter states ──
  const [search, setSearch] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments')
  const [showDropdown, setShowDropdown] = useState(false)

  // ── Pagination ──
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // ── Delete modal states ──
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [selectedReason, setSelectedReason] = useState('')
  const [otherReason, setOtherReason] = useState('')
  const [deleteError, setDeleteError] = useState('')

  // ── Edit modal states ──
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editDepartmentId, setEditDepartmentId] = useState('')

  // ── Fetch departments ──
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name')
      if (!error && data) setDepartments(data)
    }
    fetchDepartments()
  }, [supabase])

  // ── Fetch users (only active ones) ──
  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        phone,
        department_id,
        is_active,
        department:department_id (name)
      `)
      .eq('is_active', true)   // only active users
      .order('full_name')

    if (error) {
      console.error('Error fetching users:', error)
      setError('Failed to load users.')
      setLoading(false)
      return
    }

    const usersWithDept: User[] = (data || []).map((user: any) => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      department_id: user.department_id,
      department_name: user.department?.name || null,
      is_active: user.is_active,
    }))
    setUsers(usersWithDept)
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // ── Filtering ──
  const filtered = users.filter((u) => {
    const matchSearch =
      search === '' ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())

    const matchDept =
      selectedDepartment === 'All Departments' ||
      (selectedDepartment === 'No Department Assigned' && !u.department_name) ||
      u.department_name === selectedDepartment

    return matchSearch && matchDept
  })

  useEffect(() => { setCurrentPage(1) }, [search, selectedDepartment])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filtered.slice(startIndex, startIndex + itemsPerPage)

  // ── Soft delete handler (set is_active = false) ──
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    if (!selectedReason) {
      setDeleteError('Please select a reason for deletion.')
      return
    }
    if (selectedReason === 'Others' && !otherReason.trim()) {
      setDeleteError('Please specify the reason.')
      return
    }

    const finalReason = selectedReason === 'Others' ? otherReason : selectedReason

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    // Log the deletion reason
    await supabase.from('user_deletion_logs').insert({
      user_id: deleteTarget.id,
      deleted_by: currentUser?.id,
      reason: finalReason,
    })

    // Soft delete: set is_active = false
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', deleteTarget.id)

    if (error) {
      console.error('Delete error:', error)
      setDeleteError(`Delete failed: ${error.message}`)
      return
    }

    await fetchUsers()   // refresh list (active users only)
    setDeleteTarget(null)
    setSelectedReason('')
    setOtherReason('')
    setDeleteError('')
  }

  const handleCloseDeleteModal = () => {
    setDeleteTarget(null)
    setSelectedReason('')
    setOtherReason('')
    setDeleteError('')
  }

  // ── Edit handlers ──
  const handleEditClick = (user: User) => {
    setEditTarget(user)
    setEditRole(user.role)
    setEditDepartmentId(user.department_id || '')
  }

  const handleEditSave = async () => {
    if (!editTarget) return

    const updates: any = {
      role: editRole,
      department_id: editDepartmentId === '' ? null : editDepartmentId,
    }
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', editTarget.id)

    if (error) {
      console.error('Update error:', error)
      alert(`Failed to update user: ${error.message}`)
      return
    }

    await fetchUsers()
    setEditTarget(null)
  }

  const handleEditCancel = () => {
    setEditTarget(null)
  }

  const departmentOptions = [
    { label: 'No Department Assigned', value: '' },
    ...departments.map(d => ({ label: d.name, value: d.id }))
  ]

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-4 shrink-0 flex items-center justify-between z-30">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Users</h1>
          <p className="text-xs text-gray-400 mt-0.5">Total: {users.length}</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search User..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 w-56 transition-all"
          />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col overflow-hidden px-8 py-6 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center px-6 py-4 border-b border-gray-100 gap-4 shrink-0 relative z-20">
            <p className="text-sm font-medium text-gray-500">Filter:</p>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition min-w-[200px] justify-between cursor-pointer"
              >
                <span>{selectedDepartment}</span>
                <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showDropdown && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                    {['All Departments', ...departments.map(d => d.name), 'No Department Assigned'].map((dept) => (
                      <button
                        key={dept}
                        onClick={() => {
                          setSelectedDepartment(dept)
                          setShowDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-blue-50 cursor-pointer ${
                          selectedDepartment === dept ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600'
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Loading users...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-200">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm text-gray-500 text-xs uppercase tracking-wide">
                    <tr className="text-gray-600 text-xs uppercase tracking-wide">
                      <th className="text-left px-6 py-4 font-semibold w-1/5">Full Name</th>
                      <th className="text-left px-6 py-4 font-semibold w-1/5">Email Address</th>
                      <th className="text-left px-6 py-4 font-semibold w-1/6">Role</th>
                      <th className="text-left px-6 py-4 font-semibold w-1/5">Department</th>
                      <th className="text-left px-6 py-4 font-semibold w-1/6">Contact Number</th>
                      <th className="text-left px-7 py-4 font-semibold w-24">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4 text-gray-800 font-medium">{user.full_name}    </td>
                        <td className="px-6 py-4 text-gray-500">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 capitalize">{user.role}</span>
                        </td>
                        <td className="px-6 py-4">
                          {user.department_name ? (
                            <span className="text-gray-600">{user.department_name}</span>
                          ) : (
                            <span className="text-gray-300 italic text-xs">Not assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {user.phone ? (
                            <span className="text-gray-600">{user.phone}</span>
                          ) : (
                            <span className="text-gray-300 italic text-xs">Not provided</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(user)}
                              className="p-2 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              title="Edit user"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(user)}
                              className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Delete user"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-300 text-sm">
                          No users match your filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filtered.length > 0 && (
                <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 gap-4 bg-gray-50/30">
                  <p className="text-xs font-medium text-gray-500">
                    Showing <span className="font-medium text-gray-800">{startIndex + 1}</span> to{' '}
                    <span className="font-medium text-gray-800">
                      {Math.min(startIndex + itemsPerPage, filtered.length)}
                    </span> of{' '}
                    <span className="font-medium text-gray-800">{filtered.length}</span> users
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
                            ? 'bg-[#1a2e4a] text-white shadow-md'
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
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Modal – new style (mirroring archive delete modal) */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={handleCloseDeleteModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-800 mb-2">Delete User</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please select a reason for deleting <span className="font-medium">{deleteTarget.full_name}</span>:
            </p>

            <div className="space-y-3 mb-4">
              {deleteReasons.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition
                    ${selectedReason === reason
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <input
                    type="radio"
                    name="deleteReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => {
                      setSelectedReason(reason)
                      setDeleteError('')
                      if (reason !== 'Others') setOtherReason('')
                    }}
                    className="accent-red-500 cursor-pointer"
                  />
                  <span className={`text-sm ${selectedReason === reason ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                    {reason}
                  </span>
                </label>
              ))}
            </div>

            {selectedReason === 'Others' && (
              <textarea
                placeholder="Please specify your reason..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 resize-none mb-4"
              />
            )}

            {deleteError && (
              <p className="text-xs text-red-500 mb-4">{deleteError}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCloseDeleteModal}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div onClick={handleEditCancel} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-visible">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-800">Edit User</h3>
              </div>
              <button onClick={handleEditCancel} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-6">
              <div className="mb-5 space-y-2 text-sm">
                <p><span className="font-medium text-gray-600">Full Name:</span> {editTarget.full_name}</p>
                <p><span className="font-medium text-gray-600">Email:</span> {editTarget.email}</p>
                <p><span className="font-medium text-gray-600">Contact:</span> {editTarget.phone || 'Not provided'}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <CustomSelect
                  options={roleOptions.map(r => ({ 
                    label: r.replace('_', ' ')
                           .split(' ')
                           .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                           .join(' '), 
                    value: r 
                  }))}
                  value={editRole}
                  onChange={setEditRole}
                  placeholder="Select role"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <CustomSelect
                  options={departmentOptions}
                  value={editDepartmentId}
                  onChange={setEditDepartmentId}
                  placeholder="Select department"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button onClick={handleEditCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-white transition cursor-pointer">
                Cancel
              </button>
              <button onClick={handleEditSave} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition cursor-pointer shadow-sm">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}