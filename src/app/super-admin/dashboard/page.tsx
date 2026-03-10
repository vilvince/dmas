'use client'

import { useState } from 'react'
import { Search, Bell, FileText } from 'lucide-react'

const mockDocuments = [
  { id: 1, name: 'Scholarship Grant Certificate', type: 'Financial Document', department: 'Accounting Office', date: '03/25/2025', status: 'Received' },
  { id: 2, name: 'Scholarship Grant Certificate', type: 'Financial Document', department: 'Supply Office',     date: '03/25/2025', status: 'Received' },
  { id: 3, name: 'Scholarship Grant Certificate', type: 'Financial Document', department: 'BAC',               date: '03/25/2025', status: 'Received' },
  { id: 4, name: 'Scholarship Grant Certificate', type: 'Financial Document', department: 'Associate Dean',    date: '03/25/2025', status: 'Received' },
  { id: 5, name: 'Scholarship Grant Certificate', type: 'Financial Document', department: 'Associate Dean',    date: '03/25/2025', status: 'Received' },
]

const stats = [
  { label: 'Released',         value: 20, bg: 'bg-teal-50',   iconColor: 'text-teal-400',   border: 'border-teal-100'   },
  { label: 'Approved',         value: 20, bg: 'bg-green-50',  iconColor: 'text-green-500',  border: 'border-green-100'  },
  { label: 'Denied',           value: 20, bg: 'bg-red-50',    iconColor: 'text-red-400',    border: 'border-red-100'    },
  { label: 'For Approval',     value: 20, bg: 'bg-yellow-50', iconColor: 'text-yellow-500', border: 'border-yellow-100' },
  { label: 'Pending Approval', value: 20, bg: 'bg-orange-50', iconColor: 'text-orange-400', border: 'border-orange-100' },
]

export default function SuperAdminDashboardPage() {
  const [search, setSearch] = useState('')

  const filtered = mockDocuments.filter(d =>
    search === '' ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.department.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">Hi Liera!</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 w-56"
            />
          </div>
          <button className="relative p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
            <Bell size={18} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
          </button>
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
                <FileText size={18} className={s.iconColor} />
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
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-800">Recently Received Documents</h2>
          </div>

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
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-3.5 text-gray-700 font-medium">{doc.name}</td>
                  <td className="px-6 py-3.5 text-gray-500">{doc.type}</td>
                  <td className="px-6 py-3.5 text-gray-500">{doc.department}</td>
                  <td className="px-6 py-3.5 text-gray-500">{doc.date}</td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-600">
                      {doc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}