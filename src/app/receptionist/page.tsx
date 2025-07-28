'use client'

import useAuthGuard from '@/utils/authGuard'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp, getDocs, updateDoc, doc, DocumentData } from 'firebase/firestore'
import { customAlphabet } from 'nanoid'


export default function ReceptionistDashboard() {
    const loading = useAuthGuard()
    const [name, setName] = useState('')
    const [age, setAge] = useState('')
    const [gender, setGender] = useState('')
    const [patients, setPatients] = useState<DocumentData[]>([])
    const [charges, setCharges] = useState<{ [id: string]: string }>({})
    const [message, setMessage] = useState('')
    const [selectedPatientId, setSelectedPatientId] = useState('')

    // Create a unique token for each patient
    const generateReadableToken = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8)
    const handleAddPatients = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) return  

        const generateToken = generateReadableToken()
        await addDoc(collection(db, 'patients'), {
            name,
            age, 
            gender, 
            token: generateToken,
            createdAt: serverTimestamp(),
        })

        setName('')
        setAge('')
        setGender('')
        setMessage(`Patient ${name} added successfully! Token: ${generateToken}`)
        fetchPatients()
    }

    const handleChargeChange = (id: string, value: string) => {
        setCharges(prev => ({ ...prev, [id]: value }))
    }

    const handleGenerateBill = async (id: string) => {
        await updateDoc(doc(db, 'patients', id), {
            billing: {
                amount: charges[id],
                generatedAt: new Date(), 
            },
        })

        setMessage('Bill generated successfully.')
        setTimeout(() => setMessage(''), 2000)
        fetchPatients()
    }

    const fetchPatients = async () => {
        const querySnapshot = await getDocs(collection(db, 'patients'))
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setPatients(data)
    }

    useEffect(() => {
        fetchPatients()
    }, [])

    if (loading) return <div>Loading...</div>

    return (
        <div className="min-h-screen bg-black text-white flex items-start justify-center p-6">
            <div className="w-full max-w-2xl">
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

                <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">
                    Add Patient
                </button>
            </form>

            {/* Billing Section  */}
            <h2 className="text-lg font-medium mb-2 mt-8">Billing</h2>
            {/* <label className="block mb-1 text-white font-medium">Select Patient</label> */}
            <select
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="w-full p-2 border rounded bg-white text-black mb-4"
            >
                <option value="">Select a patient</option>
                {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                        {patient.name} ({patient.token})
                    </option>
                ))}
            </select>

            {/* Billing UI for Selected Patient  */}
            {selectedPatientId && (() => {
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
                        >
                            Generate Bill 
                        </button>
                        
                    </div>
                )
            })()}

            {message && <p className="text-green-600 mt-4">{message}</p>}
            </div>
        </div>
    )
}
