'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)

  const searchParams = useSearchParams()
  const supabase = createClient()

  // Load terms acceptance from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('termsAccepted')
    if (stored === 'true') {
      setTermsAccepted(true)
    }
  }, [])

  // Save terms acceptance to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('termsAccepted', String(termsAccepted))
  }, [termsAccepted])

  useEffect(() => {
    const errorParam = searchParams.get('error')
    const reasonParam = searchParams.get('reason')
    if (errorParam === 'inactive') {
      setError(reasonParam || 'Your account has been deactivated. Please contact support.')
    }
  }, [searchParams])

  const handleGoogleLogin = async () => {
    if (!termsAccepted) {
      setError('You must accept the terms to continue.')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="flex w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Left Panel */}
        <div className="flex w-1/2 bg-gradient-to-br from-blue-500 to-blue-700 items-center justify-center p-12">
          <div className="text-white text-center">
            <div className="mb-6 flex justify-center">
              <img
                src="/bucenglogo.png"
                alt="University Logo"
                className="w-35 h-35 object-contain"
                 onLoad={() => console.log('Logo loaded successfully')}
                 onError={(e) => console.error('Logo failed to load:', e)}
              />
            </div>
            <h1 className="text-5xl font-extrabold leading-tight mt-6 mb-4">
              WELCOME<br />BACK!
            </h1>
            <p className="text-blue-100 text-sm">Continue where you left off.</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-1/2 bg-white p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-1">Login</h2>
          <p className="text-gray-400 text-sm mb-8">
            Welcome back! please login to your account.
          </p>

          {error && (
            <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-lg mb-4 border border-red-200">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="text-sm text-gray-600 mb-1 block">Email Address</label>
            <input
              type="email"
              disabled
              placeholder="Use Google Sign In below"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
            />
          </div>

          <div className="mb-2">
            <label className="text-sm text-gray-600 mb-1 block">Password</label>
            <div className="relative">
              <input
                type="password"
                disabled
                placeholder="Use Google Sign In below"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="text-right mb-6">
            <span className="text-sm text-gray-400">Forgot Password</span>
          </div>

          <button
            disabled
            className="w-full bg-blue-400 text-white py-2 rounded-lg font-semibold mb-4 cursor-not-allowed opacity-60"
          >
            LOG IN
          </button>

          <div className="flex items-center gap-2 mb-4">
            <hr className="flex-1 border-gray-200" />
            <span className="text-gray-400 text-xs">or</span>
            <hr className="flex-1 border-gray-200" />
          </div>

          <div className="flex items-start gap-2 mb-4">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 cursor-pointer"
            />
            <label htmlFor="terms" className="text-xs text-gray-600">
              I accept the{' '}
              <button
                onClick={() => setShowTermsModal(true)}
                className="text-blue-500 hover:underline cursor-pointer"
              >
                terms and conditions
              </button>
            </label>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading || !termsAccepted}
            className={`flex items-center justify-center w-full border border-gray-300 rounded-lg py-2 hover:bg-gray-50 transition mb-6 cursor-pointer ${
              !termsAccepted ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>

          <p className="text-center text-sm text-gray-400">
            Don't have account yet?{' '}
            <a href="/register" className="text-blue-500 font-medium hover:underline">
              Sign Up
            </a>
          </p>
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">Terms and Conditions</h3>
            <div className="flex-1 overflow-y-auto pr-2 text-sm text-gray-600 space-y-4">
              <div>
                <p className="font-semibold text-gray-700">General Usage and Purpose</p>
                <p>The DMAS is an official platform designed solely for the submission, routing, and tracking of university documents. You agree to use this system strictly for official academic and administrative purposes. Any unauthorized, commercial, or personal use is strictly prohibited.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">User Responsibilities and Account Security</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li><span className="font-medium">Accuracy of Information:</span> You confirm that all information provided during registration (Name, Department, Email) is accurate and belongs to you.</li>
                  <li><span className="font-medium">Password Confidentiality:</span> You are responsible for maintaining the confidentiality of your account credentials. Any action taken under your account will be considered your responsibility.</li>
                  <li><span className="font-medium">Account Sharing:</span> Sharing of accounts between personnel or students is not allowed to maintain accurate audit trails and activity logs.</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Data Privacy and Confidentiality</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>In compliance with the Data Privacy Act of 2012, DMAS collects and processes your personal data (name, email, department, contact number) solely for the purpose of document tracking and user identification.</li>
                  <li>By using this system, you consent to your name and department being visible in the "Activity Logs" and "Action Queues" to facilitate transparent document routing.</li>
                  <li>Users handling documents (e.g., Office Heads, Admins) must maintain the strictest confidentiality regarding the contents of the documents they review and process.</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700">System Modifications and Availability</p>
                <p>The developers and system administrators reserve the right to modify, suspend, or discontinue any part of the system at any time for maintenance, updates, or security reasons.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Account Suspension</p>
                <p>The Super Admin reserves the right to suspend or deactivate your account if you are found violating these terms, misusing the system, or no longer affiliated with the university.</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">If you have questions, please contact support.</p>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setTermsAccepted(true)
                  setShowTermsModal(false)
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}