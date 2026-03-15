'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, X } from 'lucide-react'

// Mock notifications data
const mockNotifications = [
  { id: 1, message: 'Document A has been Approved by A.O', time: '2 min ago' },
  { id: 2, message: 'Document B has been Approved by S.O', time: '2 min ago' },
  { id: 3, message: 'Document C has been Denied by BAC', time: '3 min ago' },
  { id: 4, message: 'Document D has been Approved by A.O', time: '5 min ago' },
  { id: 5, message: 'Document E has been Approved by S.O', time: '8 min ago' },
  { id: 6, message: 'Document F has been Approved by A.O', time: '10 min ago' },
]

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(mockNotifications)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasNotifications = notifications.length > 0

  const clearNotifications = () => {
    setNotifications([])
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-all cursor-pointer"
      >
        <Bell size={20} />
        {/* Red dot indicator - only shows if there are notifications */}
        {hasNotifications && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
        )}
      </button>

      {/* Notification Popup */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Notification</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100 transition text-gray-400"
            >
              <X size={16} />
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="px-4 py-3 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <p className="text-xs text-gray-700 mb-1">{notif.message}</p>
                    <p className="text-[10px] text-gray-400">{notif.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Show all notifications button */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 flex justify-center">
              <button
                onClick={clearNotifications}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}