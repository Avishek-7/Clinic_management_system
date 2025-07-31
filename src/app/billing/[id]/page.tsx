'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import {
  doc,
  getDoc,
  getDocs,
  collection,
  updateDoc
} from 'firebase/firestore'

type Visit = {
  id: string
  token: string
  prescription?: string
  billing?: {
    amount: string
    generatedAt: Date
  }
}

type Patient = {
  id: string
  name: string
  age?: string
  gender?: string
}

export default function BillingPage() {
  const { id } = useParams() as { id: string }
  const [patient, setPatient] = useState<Patient | null>(null)
  const [visit, setVisit] = useState<Visit | null>(null)
  const [charges, setCharges] = useState('')
  const [billing, setBilling] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
  if (!id) return

  const fetchPatientAndVisits = async () => {
    const patientRef = doc(db, 'patients', id)
    const patientSnap = await getDoc(patientRef)
    if (!patientSnap.exists()) {
      console.warn('Patient not found')
      return
    }

    setPatient({ id: patientSnap.id, ...patientSnap.data() } as Patient)

    const visitsRef = collection(db, 'patients', id, 'visits')
    const visitSnap = await getDocs(visitsRef)

    console.log('🔍 Visit Snap docs:', visitSnap.docs.length)

    const visitData = visitSnap.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Visit, 'id'>),
    }))

    console.log('🔍 Visit Data:', visitData)

    if (visitData.length > 0) {
      setVisit(visitData[0])
    } else {
      console.warn('No visit data found.')
      setVisit(null)
    }
  }

  fetchPatientAndVisits()
}, [id])


  const handleGenerateBill = async () => {
    if (!id || !visit) return

    setBilling(true)

    await updateDoc(doc(db, 'patients', id, 'visits', visit.id), {
      billing: {
        amount: charges,
        generatedAt: new Date(),
      },
    })

    setMessage('Bill generated successfully.')
    setBilling(false)
  }

  if (!patient) return <div className="p-6">Loading patient...</div>
  if (!visit) return <div className="p-6">No visit data found.</div>

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white text-black p-6 rounded shadow">
        <h1 className="text-xl font-semibold mb-2">Billing for {patient.name}</h1>
        <p>Age: {patient.age || 'N/A'}, Gender: {patient.gender || 'N/A'}</p>
        <hr className="my-3" />

        <p><strong>Token:</strong> {visit.token}</p>
        <p><strong>Prescription:</strong> {visit.prescription || 'N/A'}</p>
        <p><strong>Bill:</strong> ₹{visit.billing?.amount || 'Not yet generated'}</p>

        <input
          type="number"
          placeholder="Enter charges"
          className="w-full p-2 border rounded mt-3 text-black"
          value={charges}
          onChange={e => setCharges(e.target.value)}
        />

        <button
          onClick={handleGenerateBill}
          className="bg-green-600 text-white px-4 py-1 rounded mt-3 w-full"
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
