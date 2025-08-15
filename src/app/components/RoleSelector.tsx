'use client'

import { useState } from 'react'

interface RoleSelectorProps {
  isOpen: boolean
  onClose: () => void
  onRoleSelect: (role: 'doctor' | 'receptionist') => void
  loading?: boolean
}

export function RoleSelector({ isOpen, onClose, onRoleSelect, loading = false }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<'doctor' | 'receptionist'>('doctor')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onRoleSelect(selectedRole)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select Your Role
          </h3>
          <p className="text-sm text-gray-500">
            Please choose your role in the clinic management system
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3 mb-6">
            <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="role"
                value="doctor"
                checked={selectedRole === 'doctor'}
                onChange={(e) => setSelectedRole(e.target.value as 'doctor' | 'receptionist')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                disabled={loading}
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">👨‍⚕️</span>
                  <div>
                    <div className="font-medium text-gray-900">Doctor</div>
                    <div className="text-sm text-gray-500">
                      Manage patient consultations and prescriptions
                    </div>
                  </div>
                </div>
              </div>
            </label>

            <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="role"
                value="receptionist"
                checked={selectedRole === 'receptionist'}
                onChange={(e) => setSelectedRole(e.target.value as 'doctor' | 'receptionist')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                disabled={loading}
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🧑‍💼</span>
                  <div>
                    <div className="font-medium text-gray-900">Receptionist</div>
                    <div className="text-sm text-gray-500">
                      Handle patient registration and billing
                    </div>
                  </div>
                </div>
              </div>
            </label>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Setting up...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
