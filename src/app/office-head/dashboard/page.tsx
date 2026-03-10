'use client'

import { useState } from 'react'
import { Search, Bell, FileText, ChevronLeft, ChevronRight } from 'lucide-react'

const mockDocuments = [
  { id: 1, name: 'Scholarship Grant Certificate', type: 'Financial Document', department: 'Accounting Office', date: '03/25/2025', status: 'Received' },
  { id: 2, name: 'Scholarship Grant Certificate', type: 'Financial Document', department: 'Supply Office',     date: '03/25/2025', status: 'Received' },
  { id: 3, name: 'Scholarship Grant Certificate', type: 'Financial Document', department: 'BAC',               date: '03/25/2025', status: 'Received' },
  { id: 4, name: 'Scholarship Grant Certificate', type: 'Financial Document', department: 'Associate Dean',    date: '03/25/2025', status: 'Received' },
  { id: 5, name: 'Scholarship Grant Certificate', type: 'Financial Document', department: 'Associate Dean',    date: '03/25/2025', status: 'Received' },
]

const stats = [
  { label: 'Pending Review',  value: 20, bg: 'bg-orange-50', icon: 'text-orange-400', border: 'border-orange-100' },
  { label: 'Approved Today',  value: 20, bg: 'bg-green-50',  icon: 'text-green-500',  border: 'border-green-100'  },
  { label: 'Denied Today',    value: 20, bg: 'bg-red-50',    icon: 'text-red-400',    border: 'border-red-100'    },
]

export default function OfficeHeadDashboardPage() {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 3

  const filtered = mockDocuments.filter(d =>
    search === '' ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.department.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold text-[#1a2e4a]">Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 w-56"
            />
          </div>
          <button className="relative p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
            <Bell size={18} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {stats.map((s) => (
            <div key={s.label} className={`bg-white rounded-2xl border ${s.border} shadow-sm px-5 py-4 flex items-center gap-4`}>
              <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>
                <FileText size={18} className={s.icon} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 leading-none">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Documents Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-800">Recent Received Document</h2>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
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
                  <td className="px-6 py-4 text-gray-700 font-medium">{doc.name}</td>
                  <td className="px-6 py-4 text-gray-500">{doc.type}</td>
                  <td className="px-6 py-4 text-gray-500">{doc.department}</td>
                  <td className="px-6 py-4 text-gray-500">{doc.date}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-600">
                      {doc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">Showing 1 of 20 active documents</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              >
                <ChevronLeft size={14} className="text-gray-500" />
              </button>
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition
                    ${currentPage === page
                      ? 'bg-[#1a2e4a] text-white'
                      : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              >
                <ChevronRight size={14} className="text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}