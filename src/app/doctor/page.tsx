'use client'

import useAuthGuard from '@/utils/authGuard'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, updateDoc, doc, DocumentData } from 'firebase/firestore'

// type Patient = {
//     id: string;
//     name: string;
//     token: string;
//     prescription?: string;
// };

export default function DoctorDashboard() {
    const loading = useAuthGuard()
    const [patinets, setPatients] = useState<DocumentData[]>([])
    const [prescription, setPrescription] = useState<{ [id: string]: string }>({})
    const [message, setMessage] = useState('')

    useEffect(() => {
        const fetchPatients = async () => {
            const querySnapshot = await getDocs(collection(db, 'patients'))
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setPatients(data)
        }

        fetchPatients()
    }, [message]);

    const handlePrescriptionChange = (id: string, value: string) => {
        setPrescription(prev => ({ ...prev, [id]: value }))
    }

    const handleSave = async (id: string) => {
        try {
            await updateDoc(doc(db, 'patients', id), {
                prescription: prescription[id], 
            })
            setMessage('Prescription saved successfully.')
            setTimeout(() => setMessage(''), 2000)
        } catch (err){
            console.error(err)
        }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-4">Doctor Dashboard</h1>
            
            {patinets.length === 0 ? (
                <p>No patients yet.</p>
            ) : (
                <ul className="space-y-4">
                    {patinets.map(patinet => (
                        <li key={patinet.id} className="p-4 border rounded bg-white shadow-sm flex flex-col gap-2">
                            <p className="text-black"><strong>Name:</strong> {patinet.name}</p>
                            <p className="text-black"><strong>Token:</strong> {patinet.token}</p>
                            {/* <p><strong>Prescription:</strong> {patinet.prescription || 'Not yet added'}</p> */}
                            <textarea
                                placeholder="Enter prescription..."
                                className="text-black p-2 border rounded"
                                value={prescription[patinet.id] ?? patinet.prescription ?? ''}
                                onChange={e => 
                                    handlePrescriptionChange(patinet.id, e.target.value)
                                }
                            />

                            <button
                                onClick={() => handleSave(patinet.id)}
                                className="bg-green-600 text-white px-4 py-1 rounded self-start"
                            >
                                Save Prescription
                            </button>
                            
                        </li>
                    ))}
                </ul>
            )}

            {message && <p className="text-green-600 mt-4">{message}</p>}
        </div>
    )
}