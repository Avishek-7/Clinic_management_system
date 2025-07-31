'use client'

import useAuthGuard from '@/utils/authGuard'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp, getDocs, DocumentData, where, query } from 'firebase/firestore'
import { customAlphabet } from 'nanoid'
import { useRouter } from 'next/navigation'
import { logAction } from '@/utils/logger'
import UserHeader from '../components/UserHeader'

export default function ReceptionistDashboard() {
    const router = useRouter()
    const loading = useAuthGuard('receptionist')
    const [name, setName] = useState('')
    const [age, setAge] = useState('')
    const [gender, setGender] = useState('')
    const [patients, setPatients] = useState<DocumentData[]>([])
    const [message, setMessage] = useState('')
    const [adding, setAdding] = useState(false)
    const [search, setSearch] = useState('')
    const [showForm, setShowForm] = useState(false)

    // Create a unique token for each patient
    const generateReadableToken = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8)

    const fetchPatients = async () => {
        const querySnapshot = await getDocs(collection(db, 'patients'))
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setPatients(data);
        await logAction('Fetched patients', 'Fetched all patients from Firestore', null, 'receptionist');
    }

    useEffect(() => {
        fetchPatients()
    }, [])

    const handleAddPatients = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !age || !gender) return  
        const token = generateReadableToken()
        
        try {
          const patientsRef = collection(db, 'patients') 
          
          // Check if patient already exists 
          const snapshot = await getDocs(query(patientsRef, where('name', '==', name)))
          const existingPatient = snapshot.docs[0] 
          let patientRef
          

          if (!existingPatient) {
            // New patient entry 
            const newDoc = await addDoc(patientsRef, {
              name,
              age,
              gender,
              createdAt: serverTimestamp(),
            })
            patientRef = newDoc 
          } else {
            patientRef = existingPatient.ref
          } 

          console.log('✅ Adding visit to:', patientRef.path)
          console.log('✅ Token generated:', token)

          // Add new visit 
          await addDoc(collection(patientRef, 'visits'), {
            token,
            createdAt: serverTimestamp(),
          })

          await logAction('Visit Added', `Visit created for ${name}`, patientRef.id)

          setName('')
          setAge('')
          setGender('')
          setMessage(`Visit added for ${name}, Token: ${token}`)
          setAdding(false) 
          setShowForm(false)
          fetchPatients()
        } catch (error) {
          console.log('Error adding patient visit:', error)
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <UserHeader/>
            
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Receptionist Dashboard</h1>
                    <p className="text-gray-600">Manage patient registrations and visits</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                                <p className="text-sm font-medium text-gray-600">Today&apos;s Visits</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {patients.filter(p => {
                                        const today = new Date().toDateString()
                                        return p.createdAt?.toDate?.()?.toDateString() === today
                                    }).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {patients.filter(p => p.visits?.length > 0).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Patient Section */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-800">Add New Patient Visit</h2>
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                {showForm ? 'Cancel' : 'Add Patient'}
                            </button>
                        </div>
                    </div>

                    {showForm && (
                        <div className="p-6">
                            <form onSubmit={handleAddPatients} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name</label>
                                        <input 
                                            type="text"
                                            placeholder="Enter patient name"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            required 
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                                        <input
                                            type="number"
                                            placeholder="Enter age"
                                            value={age}
                                            onChange={e => setAge(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            required 
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                                        <select
                                            value={gender}
                                            onChange={e => setGender(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            required
                                        >
                                            <option value="">Select gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button 
                                        type="submit"
                                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                        disabled={adding}
                                    >
                                        {adding ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                Add Patient Visit
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Search and Patients List */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Patient Directory</h2>
                        
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
                        {filteredPatients.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {search ? 'Try adjusting your search terms.' : 'Get started by adding a new patient visit.'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredPatients.map(patient => (
                                    <div 
                                        key={patient.id} 
                                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                                        onClick={() => router.push(`/billing/${patient.id}`)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{patient.name}</h3>
                                                <div className="space-y-1 text-sm text-gray-600">
                                                    <p className="flex items-center">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        Age: {patient.age} | {patient.gender}
                                                    </p>
                                                    <p className="flex items-center">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        {patient.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
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
