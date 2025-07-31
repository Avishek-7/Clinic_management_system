import { db, auth } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

export interface LogEntry {
  uid: string | null
  email: string | null
  action: string
  message: string
  patientId?: string | null
  userRole: 'receptionist' | 'doctor'
  timestamp: unknown
  severity?: 'info' | 'warning' | 'error'
  additionalData?: Record<string, unknown>
}

// Helper function to remove undefined values from objects
const removeUndefinedValues = (obj: Record<string, unknown>): Record<string, unknown> => {
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value
    }
  }
  return cleaned
}

export const logAction = async (
    action: string,
    message: string,
    patientId?: string | null,
    userRole: 'receptionist' | 'doctor' = 'receptionist',
    severity: 'info' | 'warning' | 'error' = 'info',
    additionalData?: Record<string, unknown>
) => {
    try {
        const user = auth.currentUser

        // Clean additionalData to remove undefined values
        const cleanedAdditionalData = additionalData ? removeUndefinedValues(additionalData) : null

        const logEntry: LogEntry = {
            uid: user?.uid || null,
            email: user?.email || null,
            action,
            message,
            patientId: patientId || null,
            userRole,
            timestamp: serverTimestamp(),
            severity,
            ...(cleanedAdditionalData && Object.keys(cleanedAdditionalData).length > 0 && { additionalData: cleanedAdditionalData }),
        }

        await addDoc(collection(db, 'logs'), logEntry)
        
        // Console logging for development
        const logMessage = `[${severity.toUpperCase()}] ${action}: ${message}`
        if (severity === 'error') {
            console.error(logMessage, additionalData)
        } else if (severity === 'warning') {
            console.warn(logMessage, additionalData)
        } else {
            console.log(logMessage, additionalData)
        }
    } catch (error) {
        console.error('Failed to log action:', error)
        // Fallback to console logging if Firebase fails
        console.error(`[LOG ERROR] ${action}: ${message}`, error)
    }
}

// Specific logging functions for common actions
export const logPatientVisit = async (
    patientName: string,
    token: string,
    patientId: string,
    userRole: 'receptionist' | 'doctor' = 'receptionist'
) => {
    await logAction(
        'Patient Visit Created',
        `New visit for patient ${patientName} with token ${token}`,
        patientId,
        userRole,
        'info',
        { patientName, token }
    )
}

export const logPrescriptionUpdate = async (
    patientName: string,
    visitId: string,
    patientId: string,
    userRole: 'receptionist' | 'doctor' = 'doctor'
) => {
    await logAction(
        'Prescription Updated',
        `Prescription updated for patient ${patientName}`,
        patientId,
        userRole,
        'info',
        { patientName, visitId }
    )
}

export const logBillGenerated = async (
    patientName: string,
    amount: string,
    patientId: string,
    userRole: 'receptionist' | 'doctor' = 'receptionist'
) => {
    await logAction(
        'Bill Generated',
        `Bill generated for patient ${patientName} - Amount: ₹${amount}`,
        patientId,
        userRole,
        'info',
        { patientName, amount }
    )
}

export const logError = async (
    action: string,
    error: Error,
    userRole: 'receptionist' | 'doctor' = 'receptionist',
    additionalData?: Record<string, unknown>
) => {
    await logAction(
        action,
        error.message,
        null,
        userRole,
        'error',
        { 
            errorStack: error.stack,
            ...(additionalData || {})
        }
    )
}

export const logUserAction = async (
    action: string,
    message: string,
    userRole: 'receptionist' | 'doctor',
    additionalData?: Record<string, unknown>
) => {
    await logAction(
        action,
        message,
        null,
        userRole,
        'info',
        additionalData
    )
}
