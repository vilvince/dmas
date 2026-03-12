'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Bell, FileText, CheckCircle, XCircle, Clock, ArrowRight, MoreVertical, Send, FileCheck, ClipboardList } from 'lucide-react'
import Link from 'next/link'

const initialNotifications = [
  { id: 1, msg: 'Document A has been Approved by A.O', time: '2 min ago', type: 'approve' },
  { id: 2, msg: 'Document B has been Approved by S.O', time: '5 min ago', type: 'approve' },
  { id: 3, msg: 'Document C has been Denied by BAC', time: '12 min ago', type: 'deny' },
  { id: 4, msg: 'New Document submitted by Jane Doe', time: '1 hr ago', type: 'info' },
]

const mockDocuments = [
  { id: 1, name: 'Scholarship Grant Certificate', type: 'Financial Document', department: 'Accounting Office', date: '03/25/2025', status: 'Received' },
  { id: 2, name: 'Payroll Summary', type: 'Administrative', department: 'Supply Office', date: '03/25/2025', status: 'Received' },
  { id: 3, name: 'Procurement Request', type: 'Financial Document', department: 'BAC', date: '03/24/2025', status: 'Received' },
  { id: 4, name: 'Leave of Absence Form', type: 'HR Document', department: 'Associate Dean', date: '03/24/2025', status: 'Received' },
  { id: 5, name: 'Scholarship Grant Certificate', type: 'Financial Document', department: 'Associate Dean',    date: '03/25/2025', status: 'Received' },
]

// Added unique 'Icon' properties to each stat
const stats = [
  { label: 'Released',         value: 20, bg: 'bg-teal-50',   iconColor: 'text-teal-400',   border: 'border-teal-100',   Icon: Send },
  { label: 'Approved',         value: 20, bg: 'bg-green-50',  iconColor: 'text-green-500',  border: 'border-green-100',  Icon: FileCheck },
  { label: 'Denied',           value: 20, bg: 'bg-red-50',    iconColor: 'text-red-400',    border: 'border-red-100',    Icon: XCircle },
  { label: 'For Approval',     value: 20, bg: 'bg-yellow-50', iconColor: 'text-yellow-500', border: 'border-yellow-100', Icon: ClipboardList },
  { label: 'Pending Approval', value: 20, bg: 'bg-orange-50', iconColor: 'text-orange-400', border: 'border-orange-100', Icon: Clock },
]

export default function SuperAdminDashboardPage() {
  const [search, setSearch] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState(initialNotifications)
  const notificationRef = useRef<HTMLDivElement>(null)

  const filtered = mockDocuments.filter(d =>
    search === '' ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.department.toLowerCase().includes(search.toLowerCase())
  )

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
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden">
      
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shrink-0 z-30">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hi Liera!</h1>
          <p className="text-sm text-gray-400">Welcome back to DMAS Dashboard</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-100 outline-none w-64 transition-all"
            />
          </div>

          {/* Notification Bell & Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2.5 rounded-xl border transition-all relative ${
                showNotifications ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
            </button>

            {/* Notification Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <span className="font-bold text-gray-800 text-sm">Notifications</span>
                  <button className="text-[10px] text-blue-600 font-semibold hover:underline">Mark all as read</button>
                </div>
                
                {/* Scrollable Area */}
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

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50">

        {/* Stats Row */}
        <div className="flex gap-3 mb-8">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`flex-1 bg-white rounded-2xl border ${s.border} shadow-sm px-4 py-4 flex items-center gap-3`}
            >
              <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>
                {/* Dynamically render the unique icon here */}
                <s.Icon size={18} className={s.iconColor} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 leading-none">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1 leading-tight">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recently Added Documents */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              Recently Received Documents
            </h2>
            <Link href="/super-admin/document-progress" 
            className="text-xs text-blue-600 font-semibold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"> View All </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">Document Name</th>
                  <th className="text-left px-6 py-3 font-semibold">Type</th>
                  <th className="text-left px-6 py-3 font-semibold">Submitting Department</th>
                  <th className="text-left px-6 py-3 font-semibold">Date Received</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="text-left px-6 py-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-3.5 text-gray-700 font-medium">{doc.name}</td>
                    <td className="px-6 py-3.5 text-gray-500">{doc.type}</td>
                    <td className="px-6 py-3.5 text-gray-500">{doc.department}</td>
                    <td className="px-6 py-3.5 text-gray-500">{doc.date}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                        <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}