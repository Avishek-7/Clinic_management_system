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
  const loading = useAuthGuard()
  const [patients, setPatients] = useState<DocumentData[]>([])
  const [message, setMessage] = useState('')
  const [latestVisitMap, setLatestVisitMap] = useState<{ [patientId: string]: any }>({})
  const [visitHistories, setVisitHistories] = useState<{ [patientId: string]: any[] }>({})
  const [prescriptionByVisitId, setPrescriptionByVisitId] = useState<{ [visitId: string]: string }>({})

  useEffect(() => {
    const fetchPatients = async () => {
      const querySnapshot = await getDocs(collection(db, 'patients'))
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setPatients(data)

      const visitMap: { [patientId: string]: any } = {}
      const historyMap: { [patientId: string]: any[] } = {}
      const prescriptionMap: { [visitId: string]: string } = {}

      for (const patient of data) {
        const visitsRef = collection(db, 'patients', patient.id, 'visits')
        const snap = await getDocs(visitsRef)

        const visits = snap.docs.map(doc => {
          const visitData = doc.data() as any
          const id = doc.id
          prescriptionMap[id] = visitData.prescription ?? ''
          return {
            id,
            ...visitData,
          }
        }).sort((a, b) =>
          (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
        )

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

      setMessage('Prescription updated.')
      setTimeout(() => setMessage(''), 2000)
    } catch (err) {
      console.error('Failed to update prescription:', err)
      setMessage('Failed to update prescription.')
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-6">
      <UserHeader />
      <h1 className="text-2xl font-semibold mb-4">Doctor Dashboard</h1>

      {patients.length === 0 ? (
        <p>No patients yet.</p>
      ) : (
        <ul className="space-y-4">
          {patients.map(patient => (
            <li
              key={patient.id}
              className="p-4 border rounded bg-white shadow-sm flex flex-col gap-4"
            >
              <div className="text-black">
                <p><strong>Name:</strong> {patient.name}</p>
                <p><strong>Latest Token:</strong> {latestVisitMap[patient.id]?.token ?? 'N/A'}</p>
              </div>

              {/* Visit History */}
              {visitHistories[patient.id]?.length > 0 && (
                <div className="border-t pt-2">
                  <p className="font-semibold text-black mb-2">Visit History:</p>
                  <ul className="space-y-4">
                    {visitHistories[patient.id].map(visit => (
                      <li
                        key={visit.id}
                        className="bg-gray-100 p-3 rounded text-black space-y-1"
                      >
                        <p><strong>Token:</strong> {visit.token}</p>
                        <p><strong>Date:</strong> {visit.createdAt?.toDate().toLocaleString() ?? 'N/A'}</p>

                        <textarea
                          className="w-full border p-2 rounded"
                          placeholder="Enter prescription..."
                          value={prescriptionByVisitId[visit.id] ?? ''}
                          onChange={(e) =>
                            handleVisitPrescriptionChange(visit.id, e.target.value)
                          }
                        />

                        <button
                          onClick={() =>
                            handleVisitPrescriptionSave(patient.id, visit.id)
                          }
                          className="mt-2 bg-green-600 text-white px-3 py-1 rounded"
                        >
                          Save Prescription
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {message && (
        <p className="text-green-600 mt-4 font-medium transition-opacity duration-300">
          {message}
        </p>
      )}
    </div>
  )
}
