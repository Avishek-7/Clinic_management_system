'use client'

import useAuthGuard from '@/utils/authGuard'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  DocumentData
} from 'firebase/firestore'
import UserHeader from '../components/UserHeader'

export default function DoctorDashboard() {
  const loading = useAuthGuard('doctor')
  const [patients, setPatients] = useState<DocumentData[]>([])
  const [message, setMessage] = useState('')
  const [latestVisitMap, setLatestVisitMap] = useState<{ [patientId: string]: DocumentData }>({})
  const [visitHistories, setVisitHistories] = useState<{ [patientId: string]: DocumentData[] }>({})
  const [prescriptionByVisitId, setPrescriptionByVisitId] = useState<{ [visitId: string]: string }>({})
  const [search, setSearch] = useState('')
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null)

  useEffect(() => {
    const fetchPatients = async () => {
      const querySnapshot = await getDocs(collection(db, 'patients'))
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setPatients(data)

      const visitMap: { [patientId: string]: DocumentData } = {}
      const historyMap: { [patientId: string]: DocumentData[] } = {}
      const prescriptionMap: { [visitId: string]: string } = {}

      for (const patient of data) {
        const visitsRef = collection(db, 'patients', patient.id, 'visits')
        const snap = await getDocs(visitsRef)

        const visits = snap.docs.map(doc => {
          const visitData = doc.data() as DocumentData
          const id = doc.id
          prescriptionMap[id] = (visitData as { prescription?: string }).prescription ?? ''
          return {
            id,
            ...visitData,
          } as DocumentData & { id: string }
        }).sort((a, b) => {
          const aCreatedAt = (a as { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.() ?? 0
          const bCreatedAt = (b as { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.() ?? 0
          return bCreatedAt - aCreatedAt
        })

        if (visits.length > 0) {
          visitMap[patient.id] = visits[0] // latest
          historyMap[patient.id] = visits  // full history
        }
      }

      setLatestVisitMap(visitMap)
      setVisitHistories(historyMap)
      setPrescriptionByVisitId(prescriptionMap)
    }

    fetchPatients()
  }, [message])

  const handleVisitPrescriptionChange = (visitId: string, value: string) => {
    setPrescriptionByVisitId(prev => ({
      ...prev,
      [visitId]: value,
    }))
  }

  const handleVisitPrescriptionSave = async (patientId: string, visitId: string) => {
    try {
      await updateDoc(doc(db, 'patients', patientId, 'visits', visitId), {
        prescription: prescriptionByVisitId[visitId],
      })

      setMessage('Prescription updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Failed to update prescription:', err)
      setMessage('Failed to update prescription.')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(search.toLowerCase())
  )

  const patientsWithVisits = filteredPatients.filter(patient => 
    visitHistories[patient.id]?.length > 0
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <UserHeader />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Doctor Dashboard</h1>
          <p className="text-gray-600">Manage patient prescriptions and visit history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Patients</p>
                <p className="text-2xl font-bold text-gray-900">{patientsWithVisits.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Visits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(visitHistories).reduce((total, visits) => total + visits.length, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Rx</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(prescriptionByVisitId).filter(rx => !rx).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Patients List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Patient Management</h2>
            
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search patients by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Patients List */}
          <div className="p-6">
            {patientsWithVisits.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No patients with visits found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search ? 'Try adjusting your search terms.' : 'Patients will appear here once they have visits.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {patientsWithVisits.map(patient => (
                  <div key={patient.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    {/* Patient Header */}
                    <div 
                      className="p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => setExpandedPatient(expandedPatient === patient.id ? null : patient.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                            <p className="text-sm text-gray-600">Age: {patient.age} | {patient.gender}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              Latest Token: {latestVisitMap[patient.id]?.token || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {visitHistories[patient.id]?.length || 0} visits
                            </p>
                          </div>
                          <svg 
                            className={`w-5 h-5 text-gray-400 transition-transform ${expandedPatient === patient.id ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Visit History */}
                    {expandedPatient === patient.id && visitHistories[patient.id]?.length > 0 && (
                      <div className="border-t border-gray-200 bg-white">
                        <div className="p-4">
                          <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Visit History
                          </h4>
                          <div className="space-y-4">
                            {visitHistories[patient.id].map((visit, index) => (
                              <div key={visit.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                                      Token: {visit.token}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      {visit.createdAt?.toDate().toLocaleString() ?? 'N/A'}
                                    </span>
                                  </div>
                                  {index === 0 && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                      Latest
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Prescription
                                    </label>
                                    <textarea
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                      rows={4}
                                      placeholder="Enter prescription details..."
                                      value={prescriptionByVisitId[visit.id] ?? ''}
                                      onChange={(e) => handleVisitPrescriptionChange(visit.id, e.target.value)}
                                    />
                                  </div>

                                  <div className="flex justify-end">
                                    <button
                                      onClick={() => handleVisitPrescriptionSave(patient.id, visit.id)}
                                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                                    >
                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Save Prescription
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Message Toast */}
      {message && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg transition-all duration-300 z-50 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{message}</span>
          <button 
            className="ml-4 text-white hover:text-gray-200 transition-colors"
            onClick={() => setMessage('')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
