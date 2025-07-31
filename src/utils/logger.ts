import { db, auth } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

export const logAction = async (
    action: string,
    message: string,
    patientId?: string | null,
    userRole: 'receptionist' | 'doctor' = 'receptionist'
) => {
    try {
        const user = auth.currentUser

        await addDoc(collection(db, 'logs'), {
            uid: user?.uid || null,
            email: user?.email || null,
            action,
            message,
            patientId: patientId || null,
            userRole,
            timestamp: serverTimestamp(),
        })
        console.log(`[LOG] ${action}: ${message}`)
    } catch (error) {
        console.error('Failed to log action:', error)
    }
}
