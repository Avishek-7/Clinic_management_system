// Mock Firebase auth
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-uid', email: 'test@example.com' },
    onAuthStateChanged: jest.fn(),
  },
  db: {},
}))

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}))

import { render, screen, waitFor } from '@testing-library/react'
import useAuthGuard from '../authGuard'

// Mock the hook to test its behavior
const TestComponent = ({ expectedRole }: { expectedRole?: 'doctor' | 'receptionist' }) => {
  const loading = useAuthGuard(expectedRole)
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  return <div>Authenticated</div>
}

describe('AuthGuard Hook', () => {
  const mockOnAuthStateChanged = jest.fn()
  const mockGetDoc = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback({ uid: 'test-uid', email: 'test@example.com' })
      return jest.fn() // unsubscribe function
    })
    
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: 'doctor', email: 'test@example.com' })
    })
    
    // Re-import the mocked modules
    const firebase = require('@/lib/firebase')
    firebase.auth.onAuthStateChanged = mockOnAuthStateChanged
    
    const firestore = require('firebase/firestore')
    firestore.getDoc = mockGetDoc
    firestore.doc = jest.fn()
  })

  it('should show loading state initially', () => {
    render(<TestComponent />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should handle authentication state changes', async () => {
    render(<TestComponent expectedRole="doctor" />)
    
    // Initially should show loading
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    
    // After auth state resolves, should show authenticated
    await waitFor(() => {
      expect(screen.getByText('Authenticated')).toBeInTheDocument()
    }, { timeout: 3000 })
  })
}) 