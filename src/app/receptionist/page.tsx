'use client'

import useAuthGuard from '@/utils/authGuard'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp, getDocs, DocumentData, where, query } from 'firebase/firestore'
import { customAlphabet } from 'nanoid'
import { useRouter } from 'next/navigation'
import { logAction } from '@/utils/logger'
import UserHeader from '../components/UserHeader'

// const logAction = (action: string, details?: string) => {
//     console.log(`[LOG] ${action}`, details || '')
// }


export default function ReceptionistDashboard() {
    const router = useRouter()
    const loading = useAuthGuard()
    const [name, setName] = useState('')
    const [age, setAge] = useState('')
    const [gender, setGender] = useState('')
    const [patients, setPatients] = useState<DocumentData[]>([])
    // const [charges, setCharges] = useState<{ [id: string]: string }>({})
    const [message, setMessage] = useState('')
    // const [selectedPatientId, setSelectedPatientId] = useState('')
    const [adding, setAdding] = useState(false)
    // const [billing, setBilling] = useState(false)
    const [search, setSearch] = useState('')

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
        if (!name || !age || ! gender) return  
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
          fetchPatients()
        } catch (error) {
          console.log('Error adding patient visit:', error)
        }
       
    }

    // const handleChargeChange = (id: string, value: string) => {
    //     setCharges(prev => ({ ...prev, [id]: value }))
    // }

    // const handleGenerateBill = async (id: string) => {
    //     setBilling(true)
    //     await updateDoc(doc(db, 'patients', id), {
    //         billing: {
    //             amount: charges[id],
    //             generatedAt: new Date(), 
    //         },
    //     })
    //     logAction('Bill Generated', JSON.stringify({ patientId: id, amount: charges[id] }))
    //     setMessage('Bill generated successfully.')
    //     setTimeout(() => setMessage(''), 2000)
    //     // setBilling(false)
    //     fetchPatients()
    // }


    if (loading) return <div>Loading...</div>

    return (
        <div className="min-h-screen bg-black text-white flex items-start justify-center p-6">
            <div className="w-full max-w-2xl">
            <UserHeader/>
            <h1 className="text-2xl font-semibold mb-4 text-center">Receptionist Dashboard</h1>

            {/* Add Patients Form  */}
            <form onSubmit={handleAddPatients} className="space-y-3 bg-grey-900 p-4 rounded shadow mb-6">
                <input 
                    type="text"
                    placeholder="Patient Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-2 border rounded"
                    required 
                />

                <input
                    type="number"
                    placeholder="Age"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="w-full p-2 border rounded"
                    required 
                />

                <input 
                    type="text"
                    placeholder="Gender"
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                />

                <button className="bg-blue-600 text-white px-4 py-2 rounded w-full disabled:opacity-50" disabled={adding}>
                    {adding ? 'Adding...' : 'Add Patient'}
                </button>
            </form>

;            {/* Patient Search  */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search Patients"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full p-2 border rounded text-white"
                />
            </div>

            {/* Patients List  */}
            <ul className="mb-6">
                {patients.filter(patient => patient.name.toLowerCase().includes(search.toLowerCase())).map(patient => (
                    <li key={patient.id} className="p-2 border-b border-grey-700 flex justify-between items-center" onClick={() => router.push(`/billing/${patient.id}`)}>
                        <span>
                            <strong>{patient.name}</strong> - Age: {patient.age}, Gender: {patient.gender}
                        </span>
                    </li>
                ))}
                {patients.filter(patient => patient.name.toLowerCase().includes(search.toLocaleLowerCase())).length === 0 && (
                    <li className="p-2 text-grey-400">No patients found.</li>
                )}
            </ul>

            {/* Billing Section 
            <h2 className="text-lg font-medium mb-2 mt-8">Billing</h2>
            <select
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="w-full p-2 border rounded bg-white text-black mb-4"
            >
                <option value="">Select a patient</option>
                {patients.filter(patient => patient.name.toLowerCase().includes(search.toLocaleLowerCase())).map(patient => (
                    <option key={patient.id} value={patient.id}>
                        {patient.name} ({patient.token})
                    </option>
                ))}
            </select> */}

            {/* Billing UI for Selected Patient  */}
            {/* {selectedPatientId && (() => {
                const patient = patients.find(p => p.id === selectedPatientId)
                if (!patient) return null

                return (
                    <div className="p-4 bg-white text-black border rounded shadow-sm space-y-2">
                        <p><strong>Name:</strong> {patient.name}</p>
                        <p><strong>Token:</strong> {patient.token}</p>
                        <p><strong>Prescription:</strong> {patient.prescription || 'Not yet added'}</p>
                        <p><strong>Bill:</strong> {patient.billing?.amount || 'Not yet generated'}</p>

                        <input
                            type="number"
                            placeholder="Enter charges"
                            className="w-full p-2 border rounded mt-2 text-black "
                            value={charges[patient.id] || ''}
                            onChange={e => handleChargeChange(patient.id, e.target.value)}
                        />

                        <button
                            onClick={() => handleGenerateBill(patient.id)}
                            className="bg-green-600 text-white px-4 py-1 rounded mt-2 w-full"
                            disabled={billing}
                        >
                            {billing ? 'Generating...' : 'Generate Bill'}
                        </button>
                    </div>
                )
            })()} */}

            {message && (
                <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded shadow-lg transition-opacity duration-300 z-50">
                    {message}
                    <button className="ml-4 text-white" onClick={() => setMessage('')}>x</button>
                </div>
            )}
            </div>
        </div>
    )
}
