// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-uid', email: 'test@example.com' },
  },
  db: {},
}))

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}))

import { logAction } from '../logger'

describe('Logger Utility', () => {
  const mockAddDoc = jest.fn()
  const mockCollection = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockAddDoc.mockResolvedValue({ id: 'test-id' })
    mockCollection.mockReturnValue({})
    
    // Re-import the mocked modules
    const firestore = require('firebase/firestore')
    firestore.addDoc = mockAddDoc
    firestore.collection = mockCollection
  })

  it('should log action successfully', async () => {
    await logAction('Test Action', 'Test message', 'patient-123', 'doctor')

    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        uid: 'test-uid',
        email: 'test@example.com',
        action: 'Test Action',
        message: 'Test message',
        patientId: 'patient-123',
        userRole: 'doctor',
      })
    )
  })

  it('should handle logging errors gracefully', async () => {
    mockAddDoc.mockRejectedValue(new Error('Firebase error'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    await logAction('Test Action', 'Test message')

    expect(consoleSpy).toHaveBeenCalledWith('Failed to log action:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('should handle undefined additionalData properly', async () => {
    await logAction('Test Action', 'Test message', 'patient-123', 'doctor', 'info', undefined)

    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        uid: 'test-uid',
        email: 'test@example.com',
        action: 'Test Action',
        message: 'Test message',
        patientId: 'patient-123',
        userRole: 'doctor',
        // Should not include additionalData field when undefined
      })
    )
    
    // Verify additionalData field is not present
    const callArgs = mockAddDoc.mock.calls[0][1]
    expect(callArgs).not.toHaveProperty('additionalData')
  })

  it('should clean undefined values from additionalData', async () => {
    const additionalData = {
      validField: 'value',
      undefinedField: undefined,
      nullField: null,
      emptyField: ''
    }

    await logAction('Test Action', 'Test message', 'patient-123', 'doctor', 'info', additionalData)

    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        additionalData: {
          validField: 'value',
          nullField: null,
          emptyField: ''
          // undefinedField should be removed
        }
      })
    )
  })

  it('should not include additionalData field when all values are undefined', async () => {
    const additionalData = {
      undefinedField1: undefined,
      undefinedField2: undefined,
      undefinedField3: undefined
    }

    await logAction('Test Action', 'Test message', 'patient-123', 'doctor', 'info', additionalData)

    // Verify additionalData field is not present when all values are undefined
    const callArgs = mockAddDoc.mock.calls[0][1]
    expect(callArgs).not.toHaveProperty('additionalData')
  })

  it('should handle the specific Firebase error scenario', async () => {
    // This test simulates the exact error you encountered
    const additionalData = {
      someField: undefined,
      anotherField: 'valid value'
    }

    await logAction('Visit Added', 'Visit created for John Doe', 'patient-123', 'receptionist', 'info', additionalData)

    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        action: 'Visit Added',
        message: 'Visit created for John Doe',
        patientId: 'patient-123',
        userRole: 'receptionist',
        additionalData: {
          anotherField: 'valid value'
          // someField should be removed because it's undefined
        }
      })
    )
  })
}) 