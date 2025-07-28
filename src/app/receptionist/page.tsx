'use client'

import useAuthGuard from '@/utils/authGuard'
import { useState } from 'react'
import { db } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'


export default function ReceptionistDashboard() {
    const loading = useAuthGuard()
    const [name, setName] = useState('')
    const [token, setToken] = useState('')
    const [message, setMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (name && token) {
            await addDoc(collection(db, 'patients'), {
                name, 
                token,
                createdAt: serverTimestamp(),
            })

            setMessage('Patient added successfully!')
            setName('')
            setToken('')   
        }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-4">Receptionist Dashboard</h1>

            <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
                <input 
                    type="text"
                    placeholder="Patient Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-2 border rounded"
                    required 
                />

                <input
                    type="text"
                    placeholder="Token No."
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    className="w-full p-2 border rounded"
                    required 
                />

                <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">
                    Add Patient
                </button>
            </form>

            {message && <p className="text-green-600 mt-4">{message}</p>}
        </div>
    )
}
