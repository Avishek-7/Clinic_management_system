'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

type Patient = {
  id: string
  name: string
  token: string
  prescription?: string
  billing?: {
    amount: string
    generatedAt: Date
  }
}

export default function BillingPage() {
    const params = useParams() as Record<string, string>
    const id = typeof params === 'object' && params !== null ? params.id : undefined

    const [patient, setPatient] = useState<Patient | null>(null)
    const [charges, setCharges] = useState('')
    const [billing, setBilling] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (!id) return
        const fetchPatient = async () => {
            const docRef = doc(db, 'patients', id)
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
                setPatient({ id: docSnap.id, ...docSnap.data() } as Patient)
            }
        }
        fetchPatient()
    }, [id])

    const handleGenerateBill = async () => {
        if (!id) return
        setBilling(true)
        await updateDoc(doc(db, 'patients', id), {
            billing: {
                amount: charges,
                generatedAt: new Date(),
            },
        })
        setMessage('Bill generated successfully.')
        setBilling(false)
    }

    if (!id) return <div>No patient ID found.</div>
    if (!patient) return <div>Loading...</div>

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white text-black p-6 rounded shadow">
                <h1 className="text-xl font-semibold mb-4">Billing for {patient.name}</h1>
                <p><strong>Token:</strong> {patient.token}</p>
                <p><strong>Prescription:</strong> {patient.prescription || 'Not yet added'}</p>
                <p><strong>Bill:</strong> {patient.billing?.amount || 'Not yet generated'}</p>
                <input
                    type="number"
                    placeholder="Enter charges"
                    className="w-full p-2 border rounded mt-2 text-black"
                    value={charges}
                    onChange={e => setCharges(e.target.value)}
                />
                <button
                    onClick={handleGenerateBill}
                    className="bg-green-600 text-white px-4 py-1 rounded mt-2 w-full"
                    disabled={billing}
                >
                    {billing ? 'Generating...' : 'Generate Bill'}
                </button>
                {message && (
                    <div className="mt-4 bg-green-600 text-white px-4 py-2 rounded">
                        {message}
                    </div>
                )}
            </div>
        </div>
    )
}